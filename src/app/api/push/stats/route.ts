import { NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { countTopicSubscriptions, pushStoreConfigured } from '@/lib/push/store'
import { pushSendConfigured } from '@/lib/push/send'
import { PUSH_TOPICS } from '@/lib/push/topics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * How many devices are subscribed to each push topic (P3-6). Admin-only, on the
 * same writer session as /api/push/send.
 *
 * WHY THIS EXISTS. There was no way to see subscriber numbers anywhere — not in
 * the admin dashboard, not in the app at all. Publishing an Audit-tier article
 * notifies the "New Audit-tier Deep Dives" topic, and the operator was being
 * asked to judge whether push was worth maintaining with no visibility into
 * whether anyone was listening. The only way to find out was to open the Upstash
 * console, and the Redis credentials are marked Sensitive in Vercel, so they
 * cannot be read back even by someone entitled to them.
 *
 * It returns counts, never subscriptions: the records hold push endpoints and
 * encryption keys, and a number is the whole requirement.
 *
 * `configured` distinguishes the two zeroes that look identical from the
 * outside — "nobody has subscribed" from "there is no store to ask". A reader
 * who cannot tell those apart cannot act on either.
 */
export async function GET() {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const configured = pushStoreConfigured()
  const counts = await countTopicSubscriptions()

  return NextResponse.json({
    /** False means the counts below are structural zeroes, not measurements. */
    configured,
    /** Whether a send could actually go out; VAPID keys are separate from the store. */
    canSend: pushSendConfigured(),
    topics: PUSH_TOPICS.map((topic) => ({
      id: topic.id,
      label: topic.label,
      subscribers: counts[topic.id] ?? 0,
    })),
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
  })
}
