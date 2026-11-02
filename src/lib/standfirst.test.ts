import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '203.0.113.7' }))
vi.mock('@/lib/durable-rate-limit', () => ({
  checkDurableRateLimit: async () => ({ allowed: true, retryAfter: 0 }),
}))
vi.mock('@/lib/redis', () => ({ getRedis: () => null }))

const ORIGINAL_ENV = { ...process.env }
const fetchMock = vi.fn()

function subscribeRequest(body: unknown) {
  return new NextRequest('https://siliconandstone.com/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'user-agent': 'test-agent' },
  })
}

function sent(): Record<string, unknown> {
  return JSON.parse(fetchMock.mock.calls[0][1].body as string)
}

beforeEach(() => {
  process.env.STANDFIRST_API_URL = 'https://standfirst.test/'
  process.env.STANDFIRST_API_KEY = 'sf_test'
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, status: 'pending_confirmation' })))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

describe('POST /api/subscribe', () => {
  async function post(body: unknown) {
    const { POST } = await import('@/app/api/subscribe/route')
    return POST(subscribeRequest(body))
  }

  it('goes through the form with the list tag and the consent details', async () => {
    const res = await post({ email: ' Reader@Example.com ', signup: 'newsletter', tags: ['source-home', 'buyer-toolkit-pro'] })
    expect(res.status).toBe(200)
    expect(fetchMock.mock.calls[0][0]).toBe('https://standfirst.test/v1/contacts')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer sf_test')
    expect(sent()).toMatchObject({
      email: 'reader@example.com',
      formSlug: 'newsletter',
      tags: ['list-newsletter', 'source-home'],
      consent: { basis: 'consent', ip: '203.0.113.7', userAgent: 'test-agent' },
    })
  })

  it('tells the visitor when Standfirst refuses, rather than claiming success', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'rejected', message: 'form briefing not found' }), { status: 400 }))
    expect((await post({ email: 'a@b.co' })).status).toBe(502)
  })

  it('tells the visitor when Standfirst is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    expect((await post({ email: 'a@b.co' })).status).toBe(502)
  })

  it('answers 503 when the keys are missing', async () => {
    delete process.env.STANDFIRST_API_KEY
    expect((await post({ email: 'a@b.co' })).status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a bad address without calling Standfirst', async () => {
    expect((await post({ email: 'nope' })).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('onEmailCaptured', () => {
  const record = {
    email: 'a@b.co',
    reportId: 'r1',
    consentTimestamp: '2026-11-02T12:00:00Z',
    consentTextVersion: 'v1',
    source: 'compliance-checker' as const,
    ipCountry: null,
  }

  it('sends nobody who did not opt in', async () => {
    const { onEmailCaptured } = await import('@/lib/report/capture')
    await onEmailCaptured({ ...record, marketingOptIn: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends an opt-in through the briefing form with only the address and source', async () => {
    const { onEmailCaptured } = await import('@/lib/report/capture')
    await onEmailCaptured({ ...record, marketingOptIn: true })
    expect(sent()).toEqual({
      email: 'a@b.co',
      formSlug: 'briefing',
      tags: ['list-briefing', 'source-tool-compliance-checker'],
    })
  })

  it('throws on failure so captureEmail can log it', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))
    const { onEmailCaptured } = await import('@/lib/report/capture')
    await expect(onEmailCaptured({ ...record, marketingOptIn: true })).rejects.toThrow('unavailable')
  })
})
