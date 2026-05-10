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
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now()
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

