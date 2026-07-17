import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { saveSubscription, pushStoreConfigured } from '@/lib/push/store'
import { isPushTopic, type PushTopicId } from '@/lib/push/topics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4_000

/**
 * Store or update a Web Push subscription and its per-topic preferences
 * (P3-6). No accounts — the subscription is keyed to its push endpoint. Sending
 * an empty `topics` array is a valid unsubscribe-from-all (kept as a record
 * with no topic membership); prefer the DELETE-style unsubscribe route to drop
 * the record entirely.
 */
export async function POST(request: NextRequest) {
  if (!pushStoreConfigured()) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
  }

  const ip = getClientIp(request)
  try {
    const rateLimit = await checkDurableRateLimit('subscribe', ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      )
    }
  } catch {
    // Rate-limit store down: allow through rather than block opt-in.
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let body: {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    topics?: unknown
  }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sub = body.subscription
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const topics: PushTopicId[] = Array.isArray(body.topics)
    ? (body.topics.filter((t): t is PushTopicId => typeof t === 'string' && isPushTopic(t)))
    : []

  try {
    await saveSubscription(
      { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
      topics,
    )
  } catch (error) {
    console.error('Push subscribe failed:', error)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }

  return NextResponse.json({ success: true, topics })
}
