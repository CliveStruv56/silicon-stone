import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { checkRateLimit } from './rate-limit'
import { UPSTASH_TIMEOUT_MS, withTimeout } from './timeouts'

export type DurableRateLimitResult = {
  allowed: boolean
  retryAfter: number
  /**
   * True when this answer came from the per-instance in-memory fallback rather
   * than the shared store — either Upstash is unconfigured or it failed at
   * request time.
   *
   * Existing callers ignore it and are unaffected. It exists because the
   * fallback is the right behaviour for login and the public forms (failing
   * closed would brick the site) and the wrong behaviour for a public,
   * token-authenticated write endpoint, which needs to be able to tell that its
   * ceiling is now per-lambda and refuse rather than accept.
   */
  degraded?: boolean
}

type RateLimitConfig = {
  limit: number
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
  prefix: string
}

const configs = {
  login: { limit: 5, window: '15 m', prefix: 'sas:login' },
  // Exchanging a Sanity admin token for an admin session. Higher than login
  // because it is not a guessing surface — the caller must already hold a valid
  // Sanity user token, and the client retries it silently on a 401 — but capped
  // because every call costs an upstream request to Sanity.
  studioSession: { limit: 20, window: '15 m', prefix: 'sas:studio-session' },
  // Editorial verdicts from the Studio actions. Generous — clearing an inbox is
  // a burst of legitimate clicks — but bounded, because each one is a write.
  knowledgeReview: { limit: 60, window: '15 m', prefix: 'sas:knowledge-review' },
  subscribe: { limit: 10, window: '15 m', prefix: 'sas:subscribe' },
  contact: { limit: 5, window: '15 m', prefix: 'sas:contact' },
  vectorize: { limit: 120, window: '1 m', prefix: 'sas:vectorize' },
  deepResearch: { limit: 3, window: '1 h', prefix: 'sas:deep-research' },
  // Generating a draft is five sequential metered model calls, and the admin
  // gate in front of it is one shared password. Well above a working day of
  // real drafting — each run takes minutes — and far below a loop.
  draftGeneration: { limit: 20, window: '1 h', prefix: 'sas:draft-generation' },
  factCheck: { limit: 10, window: '1 h', prefix: 'sas:fact-check' },
  imagePrompts: { limit: 30, window: '1 h', prefix: 'sas:image-prompts' },
  // Autosave for the compliance checker: one write per answer, so the ceiling
  // has to clear a fast full run of the form without inviting a write flood.
  checkerSession: { limit: 120, window: '15 m', prefix: 'sas:checker-session' },
  // Agentic intake is the only metered model call on a free, ungated tool, so
  // the ceiling is the cost control — generous enough to retry a description a
  // few times, tight enough that the free path cannot be farmed.
  checkerIntake: { limit: 10, window: '1 h', prefix: 'sas:checker-intake' },
  // The report is the only frontier-model call on the free path, and each one
  // is several thousand tokens of statute in and a few thousand out. Tighter
  // than intake by an order of magnitude, deliberately: nobody legitimately
  // needs three reports an hour, and the ceiling is the cost control.
  checkerReport: { limit: 3, window: '1 h', prefix: 'sas:checker-report' },
  // External knowledge capture, keyed on IP and checked BEFORE the bearer token
  // is verified. Comfortably above a person pasting conversation extracts all
  // day, far below a loop — and it is the only thing standing between a leaked
  // token and unbounded Sanity writes.
  // The two admin-gated vector searches (/api/search/semantic and
  // /api/knowledge/evidence). Each spends one OpenAI embedding plus one
  // Pinecone query per keystroke-driven request, and the gate in front of them
  // is one shared password. High enough for a person typing into a search box.
  adminSearch: { limit: 120, window: '15 m', prefix: 'sas:admin-search' },
  // Anything keyed on a Web Push endpoint: dropping a subscription, and reading
  // back which topics it holds. One bucket for both, because they are one
  // attack — a push endpoint leaked through a log, a referrer or a shared
  // device, then either confirmed or wiped. Comfortably above the opt-in UI,
  // which reads the topics once per page load.
  pushEndpoint: { limit: 30, window: '15 m', prefix: 'sas:push-endpoint' },
  knowledgeCapture: { limit: 60, window: '15 m', prefix: 'sas:knowledge-capture' },
  // MCP tool invocations, keyed on the authenticated caller rather than the IP.
  // Higher than the capture ceiling because one conversation legitimately makes
  // several read calls per capture, and because the MCP spec's rate-limiting
  // requirement is per tool invocation, not per HTTP request.
  knowledgeMcp: { limit: 120, window: '15 m', prefix: 'sas:knowledge-mcp' },
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
  const result = checkRateLimit(`${config.prefix}:${identifier || 'unknown'}`, {
    limit: config.limit,
    windowMs: windowToMs(config.window),
  })
  return { ...result, degraded: true }
}

/**
 * Never throws. That is the contract, and it is what lets callers write a bare
 * `await checkDurableRateLimit(...)` with no try/catch — a `catch` around this
 * cannot protect anything the function does not already handle (an unreachable
 * Upstash degrades to the in-memory limiter below), so all it could ever do is
 * turn an unexpected failure into *no rate limit at all*. `getLimiter` is inside
 * the try for the same reason: building the Redis client can throw on malformed
 * credentials, and that was the one path out of here that was not covered.
 */
export async function checkDurableRateLimit(
  key: DurableRateLimitKey,
  identifier: string,
): Promise<DurableRateLimitResult> {
  let limiter: ReturnType<typeof getLimiter>
  try {
    limiter = getLimiter(key)
  } catch (error) {
    console.error('Durable rate limiter could not be built; falling back to in-memory:', error)
    return inMemoryFallback(key, identifier)
  }
  if (!limiter) {
    // Upstash not configured — degrade gracefully rather than failing closed
    // (which would brick login and the public forms).
    return inMemoryFallback(key, identifier)
  }

  try {
    // Bounded, because this sits on the hot path of nearly every route and the
    // fallback below is *already* the answer when the shared store is
    // unavailable. Waiting on a slow Upstash to learn what a local map could
    // have said instantly would add that delay to every request on the site —
    // a slow limiter is worse than a fast failure, uniquely here.
    const result = await withTimeout(
      limiter.limit(identifier || 'unknown'),
      UPSTASH_TIMEOUT_MS,
      'Upstash rate limit',
    )
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
