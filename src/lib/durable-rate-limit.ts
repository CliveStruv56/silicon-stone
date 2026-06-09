import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type DurableRateLimitResult = {
  allowed: boolean
  retryAfter: number
}

type RateLimitConfig = {
  limit: number
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
  prefix: string
}

const configs = {
  login: { limit: 5, window: '15 m', prefix: 'sas:login' },
  subscribe: { limit: 10, window: '15 m', prefix: 'sas:subscribe' },
  contact: { limit: 5, window: '15 m', prefix: 'sas:contact' },
  vectorize: { limit: 120, window: '1 m', prefix: 'sas:vectorize' },
  deepResearch: { limit: 3, window: '1 h', prefix: 'sas:deep-research' },
} satisfies Record<string, RateLimitConfig>

export type DurableRateLimitKey = keyof typeof configs

const limiters = new Map<DurableRateLimitKey, Ratelimit>()

function isConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function getLimiter(key: DurableRateLimitKey) {
  if (!isConfigured()) return null

  const existing = limiters.get(key)
  if (existing) return existing

  const config = configs[key]
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    analytics: true,
    prefix: config.prefix,
  })
  limiters.set(key, limiter)
  return limiter
}

export async function checkDurableRateLimit(
  key: DurableRateLimitKey,
  identifier: string,
): Promise<DurableRateLimitResult> {
  const limiter = getLimiter(key)
  if (!limiter) {
    throw new Error('Durable rate limiting is not configured.')
  }

  const result = await limiter.limit(identifier || 'unknown')
  const retryAfter = result.success
    ? 0
    : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))

  return { allowed: result.success, retryAfter }
}

export function durableRateLimitConfigured() {
  return isConfigured()
}
