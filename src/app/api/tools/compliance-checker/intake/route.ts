import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { MAX_DESCRIPTION_CHARS, extractProposals, intakeConfigured } from '@/lib/intake/extract'

/**
 * Agentic intake for the Compliance Checker.
 *
 * Node runtime, not Edge: the Anthropic SDK wants Node APIs, and Edge buys
 * nothing here. `maxDuration` covers a slow extraction without the platform
 * cutting the request short.
 */
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_BODY_BYTES = 8_000

export async function POST(request: NextRequest) {
  if (!intakeConfigured()) {
    // No key configured — the click path is always available, so say so plainly
    // rather than failing in a way the UI has to interpret.
    return NextResponse.json({ error: 'Intake is not configured', unavailable: true }, { status: 503 })
  }

  const rateLimit = await checkDurableRateLimit('checkerIntake', getClientIp(request))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const description = (parsed as { description?: unknown })?.description
  if (typeof description !== 'string' || description.trim().length < 20) {
    return NextResponse.json(
      { error: 'Describe the system in a sentence or two so there is something to work from.' },
      { status: 400 },
    )
  }

  try {
    const result = await extractProposals(description.slice(0, MAX_DESCRIPTION_CHARS))
    return NextResponse.json({
      proposals: result.proposals,
      // Counts only — the discarded values are exactly what should not be shown.
      discarded: result.discards.length,
    })
  } catch (error) {
    console.error('Compliance checker intake failed:', error)
    return NextResponse.json(
      { error: 'The intake service could not read that. Use the questions instead.' },
      { status: 502 },
    )
  }
}
