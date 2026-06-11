import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { checkRateLimit } from './rate-limit'

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
  factCheck: { limit: 10, window: '1 h', prefix: 'sas:fact-check' },
} satisfies Record<string, RateLimitConfig>

export type DurableRateLimitKey = keyof typeof configs

const limiters = new Map<DurableRateLimitKey, Ratelimit>()

/**
 * Resolve the Upstash REST credentials from either the standard Upstash env
 * names or the KV_* names that Vercel's Upstash/KV integration injects (both
 * point at the same Upstash instance).
 */
function redisCreds(): { url?: string; token?: string } {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  }
}

function isConfigured() {
  const { url, token } = redisCreds()
  return Boolean(url && token)
}

function makeRedis(): Redis {
  // Redis.fromEnv() reads the standard UPSTASH_REDIS_REST_URL / _TOKEN names;
  // otherwise build the client from Vercel's KV_* integration variables.
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv()
  }
  const { url, token } = redisCreds()
  return new Redis({ url: url as string, token: token as string })
}

function getLimiter(key: DurableRateLimitKey) {
  if (!isConfigured()) return null

  const existing = limiters.get(key)
  if (existing) return existing

  const config = configs[key]
  const limiter = new Ratelimit({
    redis: makeRedis(),
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    analytics: true,
    prefix: config.prefix,
  })
  limiters.set(key, limiter)
  return limiter
}

/** Convert a sliding-window string (e.g. '15 m') to milliseconds. */
function windowToMs(window: RateLimitConfig['window']): number {
  const [value, unit] = window.split(' ') as [string, 's' | 'm' | 'h' | 'd']
  const mult = unit === 's' ? 1_000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000
  return Number(value) * mult
}

/**
 * Per-instance, in-memory fallback used when Upstash is not configured or is
 * unreachable. It is weaker than the shared store (limits are per-lambda and
 * reset on cold start), but it keeps brute-force protection in place WITHOUT
 * locking users out of login/forms when Redis is unavailable.
 */
function inMemoryFallback(key: DurableRateLimitKey, identifier: string): DurableRateLimitResult {
  const config = configs[key]
  return checkRateLimit(`${config.prefix}:${identifier || 'unknown'}`, {
    limit: config.limit,
    windowMs: windowToMs(config.window),
  })
}

export async function checkDurableRateLimit(
  key: DurableRateLimitKey,
  identifier: string,
): Promise<DurableRateLimitResult> {
  const limiter = getLimiter(key)
  if (!limiter) {
    // Upstash not configured — degrade gracefully rather than failing closed
    // (which would brick login and the public forms).
    return inMemoryFallback(key, identifier)
  }

  try {
    const result = await limiter.limit(identifier || 'unknown')
    const retryAfter = result.success
      ? 0
      : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))

    return { allowed: result.success, retryAfter }
  } catch (error) {
    // Upstash unreachable at request time (network/credentials) — degrade to the
    // in-memory limiter instead of locking everyone out.
    console.error('Durable rate limit unavailable; falling back to in-memory:', error)
    return inMemoryFallback(key, identifier)
  }
}

export function durableRateLimitConfigured() {
  return isConfigured()
}
