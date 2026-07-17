import { NextRequest, NextResponse } from 'next/server'
import { removeSubscription, pushStoreConfigured } from '@/lib/push/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4_000

/** Drop a Web Push subscription entirely (P3-6 unsubscribe). */
export async function POST(request: NextRequest) {
  if (!pushStoreConfigured()) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
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
