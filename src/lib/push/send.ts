import 'server-only'

import webpush from 'web-push'
import { listTopicSubscriptions, removeSubscription } from './store'
import type { PushTopicId } from './topics'

/**
 * Web Push sender (P3-6). Configures VAPID from server env and broadcasts a
 * notification to every device subscribed to a topic, pruning endpoints the
 * push service reports as gone (404/410).
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@siliconandstone.com'

let configured = false
export function pushSendConfigured(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY)
}

function ensureConfigured() {
  if (configured) return
  if (!pushSendConfigured()) throw new Error('VAPID keys not configured')
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY)
  configured = true
}

export interface PushPayload {
  title: string
  body: string
  /** Path the notification click deep-links to. */
  url: string
  topic: PushTopicId
}

export interface PushSendResult {
  sent: number
  failed: number
  pruned: number
}

export async function sendToTopic(payload: PushPayload): Promise<PushSendResult> {
  ensureConfigured()

  const subs = await listTopicSubscriptions(payload.topic)
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    topic: payload.topic,
  })

  let sent = 0
  let failed = 0
  let pruned = 0

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body,
          // Collapse repeated alerts for the same topic on the device.
          { topic: payload.topic, TTL: 24 * 60 * 60 },
        )
        sent++
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await removeSubscription(sub.endpoint)
          pruned++
        } else {
          failed++
        }
      }
    }),
  )

  return { sent, failed, pruned }
}
