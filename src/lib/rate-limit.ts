import { NextRequest } from 'next/server'

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

function sweepExpired(now: number) {
  // Bound memory growth from key churn; only sweep once the map is sizeable.
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
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

