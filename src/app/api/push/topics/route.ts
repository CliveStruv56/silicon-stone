import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionTopics, pushStoreConfigured } from '@/lib/push/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Return the topics a given push endpoint is subscribed to (P3-6), so the
 * opt-in UI can restore per-topic toggle state on load. Keyed on the endpoint
 * (a long, unguessable URL) since there are no accounts.
 */
export async function GET(request: NextRequest) {
  if (!pushStoreConfigured()) {
    return NextResponse.json({ topics: [] })
  }
  const endpoint = request.nextUrl.searchParams.get('endpoint')
  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint required' }, { status: 400 })
  }
  const topics = await getSubscriptionTopics(endpoint)
  return NextResponse.json({ topics })
}
