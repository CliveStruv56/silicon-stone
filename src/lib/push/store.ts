import 'server-only'

import { createHash } from 'node:crypto'
import { getRedis } from '@/lib/redis'
import { PUSH_TOPIC_IDS, type PushTopicId } from './topics'

/**
 * Device-keyed Web Push subscription store (P3-6), backed by Upstash. No user
 * accounts — a subscription is keyed to its push endpoint. Each subscription
 * records which of the two topics it wants; topic sets index subscriptions for
 * efficient broadcast.
 */

export interface PushSubscriptionRecord {
  endpoint: string
  keys: { p256dh: string; auth: string }
  topics: PushTopicId[]
  createdAt: number
}

const SUB_PREFIX = 'push:sub:'
const TOPIC_PREFIX = 'push:topic:'

/** Stable, opaque id for an endpoint (endpoints are long URLs). */
function subId(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('base64url')
}

export function pushStoreConfigured(): boolean {
  return getRedis() !== null
}

/**
 * Create or update a subscription and reconcile its topic-set membership to
 * exactly the requested topics. Idempotent — safe to call on every opt-in or
 * preference change.
 */
export async function saveSubscription(
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  topics: PushTopicId[],
): Promise<void> {
  const redis = getRedis()
  if (!redis) throw new Error('Push store not configured')

  const id = subId(sub.endpoint)
  const wanted = new Set(topics)

  const record: PushSubscriptionRecord = {
    endpoint: sub.endpoint,
    keys: sub.keys,
    topics: PUSH_TOPIC_IDS.filter((t) => wanted.has(t)),
    createdAt: Date.now(),
  }

  const pipeline = redis.multi()
  pipeline.set(`${SUB_PREFIX}${id}`, JSON.stringify(record))
  for (const topic of PUSH_TOPIC_IDS) {
    if (wanted.has(topic)) {
      pipeline.sadd(`${TOPIC_PREFIX}${topic}`, id)
    } else {
      pipeline.srem(`${TOPIC_PREFIX}${topic}`, id)
    }
  }
  await pipeline.exec()
}

/** Remove a subscription entirely (unsubscribe / stale-endpoint prune). */
export async function removeSubscription(endpoint: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  const id = subId(endpoint)
  const pipeline = redis.multi()
  pipeline.del(`${SUB_PREFIX}${id}`)
  for (const topic of PUSH_TOPIC_IDS) {
    pipeline.srem(`${TOPIC_PREFIX}${topic}`, id)
  }
  await pipeline.exec()
}

/** The topics a given endpoint is currently subscribed to (empty if unknown). */
export async function getSubscriptionTopics(endpoint: string): Promise<PushTopicId[]> {
  const redis = getRedis()
  if (!redis) return []
  const record = await redis.get<PushSubscriptionRecord>(`${SUB_PREFIX}${subId(endpoint)}`)
  return record?.topics ?? []
}

/** All subscription records opted into a topic. */
export async function listTopicSubscriptions(
  topic: PushTopicId,
): Promise<PushSubscriptionRecord[]> {
  const redis = getRedis()
  if (!redis) return []
  const ids = await redis.smembers(`${TOPIC_PREFIX}${topic}`)
  if (!ids.length) return []
  const keys = ids.map((id) => `${SUB_PREFIX}${id}`)
  const records = await redis.mget<PushSubscriptionRecord[]>(...keys)
  return records.filter((r): r is PushSubscriptionRecord => Boolean(r))
}
