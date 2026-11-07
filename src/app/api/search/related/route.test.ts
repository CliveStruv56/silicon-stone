import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const checkDurableRateLimit = vi.fn()
const searchByMeaning = vi.fn()
vi.mock('@/lib/durable-rate-limit', () => ({
  checkDurableRateLimit: (...args: unknown[]) => checkDurableRateLimit(...args),
}))
vi.mock('@/lib/search/semantic', () => ({
  searchByMeaning: (...args: unknown[]) => searchByMeaning(...args),
}))
vi.mock('@/lib/redis', () => ({ getRedis: () => null }))

const { GET } = await import('./route')

const call = (q: string) =>
  GET(new NextRequest(`https://example.test/api/search/related?q=${encodeURIComponent(q)}`, {
    headers: { 'x-real-ip': '203.0.113.9' },
  }))

beforeEach(() => {
  checkDurableRateLimit.mockReset()
  checkDurableRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 })
  searchByMeaning.mockReset()
  searchByMeaning.mockResolvedValue([
    { path: '/pricing', title: 'Pricing', description: 'd', kind: 'page', score: 0.41567 },
  ])
  vi.unstubAllEnvs()
})

describe('GET /api/search/related', () => {
  it('returns results and lets the CDN cache a success', async () => {
    const res = await call('What does it COST')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      results: [{ path: '/pricing', title: 'Pricing', description: 'd', kind: 'page', score: 0.416 }],
    })
    expect(res.headers.get('cache-control')).toContain('s-maxage=86400')
    expect(searchByMeaning).toHaveBeenCalledWith('what does it cost')
  })

  it('checks the per-reader limit, then the global daily ceiling', async () => {
    await call('pricing')
    expect(checkDurableRateLimit.mock.calls).toEqual([
      ['publicSearch', '203.0.113.9'],
      ['publicSearchDaily', 'all'],
    ])
  })

  it('answers 429 over the per-reader limit, without spending anything', async () => {
    checkDurableRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 42 })
    const res = await call('pricing')
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('42')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(searchByMeaning).not.toHaveBeenCalled()
  })

  it('declines once the daily ceiling is spent', async () => {
    checkDurableRateLimit
      .mockResolvedValueOnce({ allowed: true, retryAfter: 0 })
      .mockResolvedValueOnce({ allowed: false, retryAfter: 600 })
    const res = await call('pricing')
    expect(res.status).toBe(503)
    expect(searchByMeaning).not.toHaveBeenCalled()
  })

  it('declines on Vercel when the ceiling could only be counted per instance', async () => {
    vi.stubEnv('VERCEL', '1')
    checkDurableRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0, degraded: true })
    const res = await call('pricing')
    expect(res.status).toBe(503)
    expect(searchByMeaning).not.toHaveBeenCalled()
  })

  it('turns an OpenAI or Pinecone failure into an empty, uncached answer', async () => {
    searchByMeaning.mockRejectedValue(new Error('PineconeConnectionError'))
    const res = await call('pricing')
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ results: [], reason: 'unavailable' })
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('never sends a personal-looking query upstream', async () => {
    for (const q of ['jane@example.com', 'call 07700 900123']) {
      const res = await call(q)
      expect((await res.json()).results).toEqual([])
    }
    expect(searchByMeaning).not.toHaveBeenCalled()
    expect(checkDurableRateLimit).not.toHaveBeenCalled()
  })

  it('ignores queries too short to mean anything, and caps long ones', async () => {
    expect((await (await call('ai')).json()).results).toEqual([])
    await call('x'.repeat(5_000))
    expect((searchByMeaning.mock.calls[0][0] as string).length).toBe(100)
  })
})
