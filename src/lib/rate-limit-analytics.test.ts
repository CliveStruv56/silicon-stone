import fs from 'node:fs'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

/** Every config any limiter was built with, and a switchable answer. */
const built: Array<Record<string, unknown>> = []
let nextSuccess = true

vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    static slidingWindow(limit: number, window: string) {
      return { kind: 'slidingWindow', limit, window }
    }
    constructor(config: Record<string, unknown>) {
      built.push(config)
    }
    async limit() {
      return { success: nextSuccess, reset: Date.now() + 60_000 }
    }
  }
  return { Ratelimit }
})
vi.mock('@upstash/redis', () => {
  class Redis {
    static fromEnv() {
      return new Redis()
    }
  }
  return { Redis }
})

let mod: typeof import('./durable-rate-limit')
beforeAll(async () => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.test')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
  mod = await import('./durable-rate-limit')
})

/**
 * Upstash rate-limit analytics writes each identifier (an IP address, for most
 * limiters) into hourly buckets that are never expired. The owner switched it
 * off for every limiter on 7 November 2026, and the privacy page now says the
 * IP-keyed counters are short-lived. This file is what keeps that true.
 */
describe('durable rate limits record no analytics', () => {
  it('builds every limiter with analytics off', async () => {
    for (const key of mod.DURABLE_RATE_LIMIT_KEYS) await mod.checkDurableRateLimit(key, '203.0.113.9')
    expect(built.length).toBe(mod.DURABLE_RATE_LIMIT_KEYS.length)
    for (const config of built) expect(config.analytics, String(config.prefix)).toBe(false)
  })

  it('offers no way to switch it back on per limiter', () => {
    const source = fs.readFileSync('src/lib/durable-rate-limit.ts', 'utf8')
    expect(source).not.toMatch(/analytics:\s*true/)
    expect(source).not.toMatch(/analytics\?:/)
    expect(source.match(/analytics:/g)?.length).toBe(1)
  })

  it('still limits exactly as before', async () => {
    nextSuccess = true
    expect(await mod.checkDurableRateLimit('contact', '203.0.113.9')).toEqual({ allowed: true, retryAfter: 0 })
    nextSuccess = false
    const denied = await mod.checkDurableRateLimit('contact', '203.0.113.9')
    expect(denied.allowed).toBe(false)
    expect(denied.retryAfter).toBeGreaterThan(0)
    // Window and ceiling are unchanged, and the limiter is still a sliding window.
    const contact = built.find((c) => c.prefix === 'sas:contact')!
    expect(contact.limiter).toEqual({ kind: 'slidingWindow', limit: 5, window: '15 m' })
  })
})
