import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { capabilitySigningConfigured } from '@/lib/capability-token'
import { buildSavedResult, SAVED_RESULT_RETENTION_DAYS } from '@/lib/saved-result/record'
import { signSavedResultId, writeSavedResult } from '@/lib/saved-result/store'

/**
 * Save a Compliance Checker result and return its private link.
 *
 * The reader asks for this; nothing is kept beyond the 24-hour autosave unless
 * they do. The answers go up, the result does not: it is recomputed here from
 * the sanitised answers, as the report route does, so a browser cannot store a
 * verdict the engine never gave. No email address is asked for or accepted.
 */

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 20_000
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(request: NextRequest) {
  const rateLimit = await checkDurableRateLimit('checkerSavedResult', getClientIp(request))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many saves. Try again later.' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  if (!capabilitySigningConfigured()) {
    return NextResponse.json({ error: 'Saving is not available right now.' }, { status: 503, headers: NO_STORE })
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: NO_STORE })
  }

  let body: { answers?: unknown; includeFreeText?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: NO_STORE })
  }

  const record = buildSavedResult({
    id: globalThis.crypto.randomUUID(),
    answers: body.answers,
    // Only an explicit `true` keeps the free text; anything else leaves it out.
    includeFreeText: body.includeFreeText === true,
  })
  if (record.answerLines.length === 0) {
    return NextResponse.json({ error: 'There is no assessment to save.' }, { status: 400, headers: NO_STORE })
  }

  if (!(await writeSavedResult(record))) {
    return NextResponse.json({ error: 'The result could not be saved.' }, { status: 502, headers: NO_STORE })
  }

  const token = await signSavedResultId(record.id)
  return NextResponse.json(
    {
      id: record.id,
      token,
      path: `/tools/compliance-checker/result/${record.id}?token=${encodeURIComponent(token)}`,
      expiresAt: record.expiresAt,
      retentionDays: SAVED_RESULT_RETENTION_DAYS,
    },
    { headers: NO_STORE },
  )
}
