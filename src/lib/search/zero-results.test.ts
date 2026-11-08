import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const getRedis = vi.fn()
const checkDurableRateLimit = vi.fn()
vi.mock('@/lib/redis', () => ({ getRedis: () => getRedis() }))
vi.mock('@/lib/durable-rate-limit', () => ({
  checkDurableRateLimit: (...args: unknown[]) => checkDurableRateLimit(...args),
}))

const { loggableQuery, recordZeroResult, listZeroResults, MAX_ENTRIES } = await import('./zero-results')

/** A fake Upstash client that records every command and its arguments. */
function fakeRedis(opts: { size?: number; fail?: boolean } = {}) {
  const calls: Array<[string, unknown[]]> = []
  const multi = () => {
    const chain = {
      zincrby: (...a: unknown[]) => (calls.push(['zincrby', a]), chain),
      zadd: (...a: unknown[]) => (calls.push(['zadd', a]), chain),
      zcard: (...a: unknown[]) => (calls.push(['zcard', a]), chain),
      zrem: (...a: unknown[]) => (calls.push(['zrem', a]), chain),
      exec: async () => {
        if (opts.fail) throw new Error('upstash down')
        return [1, 1, opts.size ?? 1]
      },
    }
    return chain
  }
  return {
    calls,
    multi,
    zrange: vi.fn(async () => ['old-query']),
  }
}

beforeEach(() => {
  getRedis.mockReset()
  checkDurableRateLimit.mockReset()
  checkDurableRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 })
})

describe('loggableQuery', () => {
  it('normalises what it keeps', () => {
    expect(loggableQuery('  Quantum   SOVEREIGNTY ')).toBe('quantum sovereignty')
  })

  it('refuses anything that looks like personal data', () => {
    expect(loggableQuery('jane@example.com')).toBeNull()
    expect(loggableQuery('call 07700 900123')).toBeNull()
    expect(loggableQuery('order 1234567')).toBeNull()
    expect(loggableQuery('x')).toBeNull()
  })

  it('keeps ordinary queries with short numbers', () => {
    expect(loggableQuery('iso 42001')).toBe('iso 42001')
    expect(loggableQuery('article 50')).toBe('article 50')
  })
})

describe('recordZeroResult', () => {
  it('stores the query text and nothing else', async () => {
    const redis = fakeRedis()
    getRedis.mockReturnValue(redis)
    expect(await recordZeroResult('Quantum Sovereignty')).toBe('recorded')

    // The global ceiling is keyed on a constant, never on the reader.
    expect(checkDurableRateLimit).toHaveBeenCalledWith('searchZeroLog', 'all')

    const written = JSON.stringify(redis.calls)
    expect(written).toContain('quantum sovereignty')
    const members = redis.calls
      .filter(([cmd]) => cmd === 'zincrby' || cmd === 'zadd')
      .map(([cmd, args]) => (cmd === 'zincrby' ? args[2] : (args[1] as { member: string }).member))
    expect(members).toEqual(['quantum sovereignty', 'quantum sovereignty'])
  })

  it('skips personal-looking queries without touching the store', async () => {
    const redis = fakeRedis()
    getRedis.mockReturnValue(redis)
    expect(await recordZeroResult('me@example.com')).toBe('skipped')
    expect(redis.calls).toEqual([])
    expect(checkDurableRateLimit).not.toHaveBeenCalled()
  })

  it('stops writing once the daily ceiling is reached', async () => {
    const redis = fakeRedis()
    getRedis.mockReturnValue(redis)
    checkDurableRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 })
    expect(await recordZeroResult('anything')).toBe('skipped')
    expect(redis.calls).toEqual([])
  })

  it('trims the least recently searched once the log is full', async () => {
    const redis = fakeRedis({ size: MAX_ENTRIES + 1 })
    getRedis.mockReturnValue(redis)
    await recordZeroResult('newest')
    expect(redis.zrange).toHaveBeenCalledWith('search:zero:seen', 0, 0)
    expect(redis.calls.filter(([cmd]) => cmd === 'zrem')).toHaveLength(2)
  })

  it('never throws, with or without a store', async () => {
    getRedis.mockReturnValue(null)
    expect(await recordZeroResult('anything')).toBe('unavailable')
    getRedis.mockReturnValue(fakeRedis({ fail: true }))
    expect(await recordZeroResult('anything')).toBe('unavailable')
  })
})

describe('listZeroResults', () => {
  it('tells "no store" apart from "nothing logged"', async () => {
    getRedis.mockReturnValue(null)
    expect(await listZeroResults()).toBeNull()
    getRedis.mockReturnValue({ zrange: async () => [] })
    expect(await listZeroResults()).toEqual([])
  })

  it('pairs counts with last-searched dates', async () => {
    getRedis.mockReturnValue({
      zrange: async () => ['quantum', 3, 'tariffs', 1],
      zmscore: async () => [Date.UTC(2026, 10, 7), Date.UTC(2026, 10, 6)],
    })
    expect(await listZeroResults()).toEqual([
      { query: 'quantum', count: 3, lastSeen: '2026-11-07T00:00:00.000Z' },
      { query: 'tariffs', count: 1, lastSeen: '2026-11-06T00:00:00.000Z' },
    ])
  })
})
