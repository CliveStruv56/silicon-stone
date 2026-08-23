import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { getSubscriptionTopics, pushStoreConfigured } from '@/lib/push/store'

/** A push endpoint is a URL; nothing legitimate here is longer than this. */
const MAX_ENDPOINT_CHARS = 2_000

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Return the topics a given push endpoint is subscribed to (P3-6), so the
 * opt-in UI can restore per-topic toggle state on load. Keyed on the endpoint
 * (a long, unguessable URL) since there are no accounts.
 *
 * This is the read half of the same surface /push/unsubscribe writes: given an
 * endpoint it confirms the subscription exists and lists what it holds. It
 * therefore shares that route's bucket, because probing a leaked endpoint and
 * wiping it are one attack with two steps.
 */
export async function GET(request: NextRequest) {
  if (!pushStoreConfigured()) {
    return NextResponse.json({ topics: [] })
  }

  const rateLimit = await checkDurableRateLimit('pushEndpoint', getClientIp(request))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const endpoint = request.nextUrl.searchParams.get('endpoint')
  if (!endpoint || endpoint.length > MAX_ENDPOINT_CHARS) {
    return NextResponse.json({ error: 'endpoint required' }, { status: 400 })
  }

  try {
    const topics = await getSubscriptionTopics(endpoint)
    return NextResponse.json({ topics })
  } catch (error) {
    // The store being unreachable is not the caller's error, and it must not
    // surface as a bare 500 with a stack behind it.
    console.error('Push topics lookup failed:', error)
    return NextResponse.json({ error: 'Topics unavailable' }, { status: 503 })
  }
}
