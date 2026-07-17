import 'server-only'

import { Redis } from '@upstash/redis'

/**
 * Resolve Upstash REST credentials from either the standard Upstash env names
 * or the KV_* names that Vercel's Upstash/KV integration injects (both point at
 * the same instance). Shared by the rate limiter and the webhook idempotency
 * store so there is a single source of truth for the connection.
 */
export function redisCreds(): { url?: string; token?: string } {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  }
}

export function redisConfigured(): boolean {
  const { url, token } = redisCreds()
  return Boolean(url && token)
}

let client: Redis | null = null

/** A shared Upstash client, or null when Upstash is not configured. */
export function getRedis(): Redis | null {
  if (!redisConfigured()) return null
  if (client) return client
  const { url, token } = redisCreds()
  client = new Redis({ url: url as string, token: token as string })
  return client
}
