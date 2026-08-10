import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import {
  CHECKER_SESSION_COOKIE,
  CHECKER_SESSION_TTL_SECONDS,
  sanitiseSession,
} from '@/lib/checker-session-schema'
import {
  clearCheckerSession,
  readCheckerSession,
  writeCheckerSession,
} from '@/lib/checker-session'

/**
 * Autosave for the Compliance Checker's fourteen answers.
 *
 * The session id lives in an httpOnly cookie so the client never handles it and
 * cannot read another run by guessing one. Answers are not identifying, but
 * they do describe someone's AI systems, so the store is short-lived (24h) and
 * the tool stays fully usable — just without restore — when Upstash is absent.
 */

const MAX_BODY_BYTES = 20_000

function newSessionId(): string {
  return globalThis.crypto.randomUUID()
}

function withSessionCookie(response: NextResponse, sessionId: string): NextResponse {
  response.cookies.set(CHECKER_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CHECKER_SESSION_TTL_SECONDS,
  })
  return response
}

/** Restore an in-progress run, issuing a session id if this is a first visit. */
export async function GET(request: NextRequest) {
  const existing = request.cookies.get(CHECKER_SESSION_COOKIE)?.value

  if (!existing) {
    return withSessionCookie(NextResponse.json({ session: null }), newSessionId())
  }

  const session = await readCheckerSession(existing)
  return withSessionCookie(NextResponse.json({ session }), existing)
}

/** Save the current answers. Fire-and-forget from the client's perspective. */
export async function PUT(request: NextRequest) {
  const rateLimit = await checkDurableRateLimit('checkerSession', getClientIp(request))
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

  const sessionId = request.cookies.get(CHECKER_SESSION_COOKIE)?.value || newSessionId()
  const saved = await writeCheckerSession(sessionId, sanitiseSession(parsed))

  return withSessionCookie(NextResponse.json({ saved }), sessionId)
}

/** Discard the run behind "Assess another system". */
export async function DELETE(request: NextRequest) {
  const sessionId = request.cookies.get(CHECKER_SESSION_COOKIE)?.value
  if (sessionId) await clearCheckerSession(sessionId)
  return NextResponse.json({ cleared: true })
}
