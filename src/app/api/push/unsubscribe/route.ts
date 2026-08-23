import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { removeSubscription, pushStoreConfigured } from '@/lib/push/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4_000

/**
 * Drop a Web Push subscription entirely (P3-6 unsubscribe).
 *
 * There is no proof of possession here and there cannot be one — there are no
 * accounts, and the endpoint *is* the identity. What stands in for it is that a
 * push endpoint is a long, high-entropy FCM or Mozilla URL, so it cannot be
 * guessed; the exposure is an endpoint that leaked through a log, a referrer or
 * a shared device. The rate limit is what stops that one leak becoming a sweep,
 * and this route had none at all.
 */
export async function POST(request: NextRequest) {
  if (!pushStoreConfigured()) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
  }

  // No try/catch: checkDurableRateLimit never throws and degrades to the
  // in-memory limiter by itself, so catching here could only ever turn a
  // failure into no limit at all.
  const rateLimit = await checkDurableRateLimit('pushEndpoint', getClientIp(request))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let body: { endpoint?: string }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: 'endpoint required' }, { status: 400 })
  }

  try {
    await removeSubscription(body.endpoint)
  } catch (error) {
    console.error('Push unsubscribe failed:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
