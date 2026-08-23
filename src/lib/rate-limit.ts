import { NextRequest } from 'next/server'
import { headers } from 'next/headers'

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export type RateLimitResult = {
  allowed: boolean
  retryAfter: number
}

export function getClientIp(request: NextRequest): string {
  // On Vercel, x-real-ip is set by the platform to the true connecting IP and
  // cannot be overridden by the client, so prefer it. The leftmost
  // x-forwarded-for entry is attacker-controlled and must not be trusted first.
  // NOTE: this limiter is still per-instance/in-memory — a shared store
  // (e.g. Upstash) is required for robust cross-lambda limiting.
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return 'unknown'
}

export async function getServerActionClientIp(): Promise<string> {
  const headerStore = await headers()
  const realIp = headerStore.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwardedFor = headerStore.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  return 'unknown'
}

/** Sweep threshold: below this the map is small enough not to care. */
const SWEEP_AT = 5_000
/** Hard ceiling. Above it, unexpired entries are evicted too. */
const MAX_BUCKETS = 20_000

function sweepExpired(now: number) {
  // Bound memory growth from key churn; only sweep once the map is sizeable.
  if (buckets.size < SWEEP_AT) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }

  // The sweep above frees nothing when every entry is still inside its window,
  // and the windows here are up to fifteen minutes. So with enough distinct
  // keys the map grew without limit and every request paid an O(n) scan — and
  // this map is what the whole app degrades to whenever Upstash is unreachable,
  // which is exactly when you least want it to be the slow path.
  //
  // Above the ceiling, evict oldest-first. A Map iterates in insertion order,
  // so the front of it is the least recently *created* bucket — which is the
  // closest thing to least-recently-used available without tracking access, and
  // the cost of being wrong is one caller getting a fresh allowance rather than
  // a lockout.
  if (buckets.size <= MAX_BUCKETS) return
  const excess = buckets.size - MAX_BUCKETS
  let evicted = 0
  for (const key of buckets.keys()) {
    buckets.delete(key)
    if (++evicted >= excess) break
  }
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now()
  sweepExpired(now)
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    }
  }

  current.count += 1
  return { allowed: true, retryAfter: 0 }
}
