import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { sendToTopic, pushSendConfigured } from '@/lib/push/send'
import { isPushTopic, type PushTopicId } from '@/lib/push/topics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4_000

/**
 * Broadcast a notification to one of the two topics (P3-6). Admin-only: the
 * two topics are editorial broadcasts (AI Act deadline, new Audit deep dive),
 * so sending is gated behind the writer session, not exposed publicly.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pushSendConfigured()) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 503 })
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let body: { topic?: string; title?: string; message?: string; url?: string }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { topic, title, message } = body
  if (!topic || !isPushTopic(topic)) {
    return NextResponse.json({ error: 'Valid topic required' }, { status: 400 })
  }
  if (!title || !message) {
    return NextResponse.json({ error: 'title and message required' }, { status: 400 })
  }

  // Deep-link target: default to the site root, but only allow same-site paths.
  const url = typeof body.url === 'string' && body.url.startsWith('/') ? body.url : '/'

  try {
    const result = await sendToTopic({
      topic: topic as PushTopicId,
      title: title.slice(0, 120),
      body: message.slice(0, 300),
      url,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Push send failed:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
