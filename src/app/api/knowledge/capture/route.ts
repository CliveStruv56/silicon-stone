import { NextRequest, NextResponse } from 'next/server'

import { checkDurableRateLimit, durableRateLimitConfigured } from '@/lib/durable-rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { ingestCapture } from '@/lib/knowledge/ingest'
import { guardKnowledgeRequest } from '@/lib/knowledge/ingest-guard'
import {
  SAFE_WRITE_FAILURE_MESSAGE,
  statusForIngestError,
  statusForKnowledgeSuccess,
} from '@/lib/knowledge/ingest-status'
import { knowledgeClient } from '@/lib/knowledge/sanity-client'

/**
 * Universal knowledge ingestion — master spec §8.
 *
 * The plain-HTTP way in. Anything that can send a header can use it: curl, a
 * shortcut, an automation tool, a future adapter.
 *
 * The MCP server does **not** come through here. It calls the same
 * `ingestCapture` in-process, because a loopback HTTP call to our own domain
 * would meet Vercel's deployment protection on any protected deployment, would
 * need a second credential authorising the server to itself, and would flatten
 * the domain's typed result into a status code the MCP layer then has to
 * reverse-engineer.
 *
 * Everything captured here lands in `inbox`. There is no parameter that
 * changes that, and the payload is refused if it tries.
 */

export const runtime = 'nodejs'
export const maxDuration = 30

/** One capture: a title, some prose, a few references. The domain's own
 * `KNOWLEDGE_LIMITS` are far larger; this is the transport ceiling those limits
 * explicitly say they are not a substitute for. */
const MAX_BODY_BYTES = 200_000

export async function POST(request: NextRequest) {
  const guard = await guardKnowledgeRequest({
    authorization: request.headers.get('authorization'),
    identifier: getClientIp(request),
    rateLimit: (id) => checkDurableRateLimit('knowledgeCapture', id),
    rateLimiterConfigured: durableRateLimitConfigured,
    isProduction: process.env.NODE_ENV === 'production',
  })
  if (!guard.ok) {
    if (guard.logMessage) console.error('Knowledge capture refused:', guard.logMessage)
    return NextResponse.json(
      { error: guard.error, ...(guard.unavailable ? { unavailable: true } : {}) },
      { status: guard.status, ...(guard.headers ? { headers: guard.headers } : {}) },
    )
  }

  // Checked on the header before the body is read, then again on what actually
  // arrived — content-length is a claim, not a measurement.
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let envelope: unknown
  try {
    envelope = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = await ingestCapture(
    { client: knowledgeClient() },
    envelope,
    // Provenance from the transport, never the payload. `api` is the honest
    // answer: a shared token cannot tell curl from an automation tool.
    { sourceSystem: 'api', capturedBy: 'external-api' },
  )

  if (!result.ok) {
    const { code, message, errors, duplicate } = result.failure
    if (code === 'write_failed') {
      // `message` is the Sanity client's error and can name the project, the
      // dataset and the missing permission. Logged, never returned.
      console.error('Knowledge capture write failed:', message)
      return NextResponse.json(
        { error: SAFE_WRITE_FAILURE_MESSAGE, code },
        { status: statusForIngestError(code) },
      )
    }
    return NextResponse.json(
      {
        error: message,
        code,
        ...(errors ? { errors } : {}),
        ...(duplicate ? { duplicate } : {}),
      },
      { status: statusForIngestError(code) },
    )
  }

  return NextResponse.json(result.record, {
    status: statusForKnowledgeSuccess(result.record.created),
  })
}

/** This endpoint accepts captures and nothing else. */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
