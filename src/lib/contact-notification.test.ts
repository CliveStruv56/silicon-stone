import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Every enquiry that passes validation must reach the owner, whether or not
 * Standfirst stored it. When Standfirst fails, the email is the only surviving
 * record, so it has to say so. An enquiry must also never subscribe anyone.
 * This exercises the route itself, rather than the notification builder.
 */

const notifyEnquiry = vi.fn(async () => 'sent' as const)

vi.mock('server-only', () => ({}))

vi.mock('@/lib/email', () => ({
  notifyEnquiry,
  emailConfigured: () => true,
}))

vi.mock('@/lib/rate-limit', () => ({
  getClientIp: () => '203.0.113.7',
}))

vi.mock('@/lib/durable-rate-limit', () => ({
  checkDurableRateLimit: async () => ({ allowed: true, retryAfter: 0 }),
}))

const ENQUIRY = {
  name: 'Jordan Blake',
  email: 'jordan@example-corp.com',
  company: 'Example Corp',
  interest: 'Exposure Diagnostic',
  message: 'We deploy an Annex III system and need to know where we stand.',
}

function request(body: unknown = ENQUIRY) {
  return new NextRequest('https://siliconandstone.com/api/contact', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

/** Import the route fresh so its module-scope env reads are re-evaluated. */
async function loadRoute() {
  vi.resetModules()
  return await import('@/app/api/contact/route')
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  notifyEnquiry.mockClear()
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

const fetchMock = vi.fn()

beforeEach(() => {
  process.env.STANDFIRST_API_URL = 'https://standfirst.test'
  process.env.STANDFIRST_API_KEY = 'sf_test'
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, status: 'recorded' })))
  vi.stubGlobal('fetch', fetchMock)
})

describe('storing an enquiry in Standfirst', () => {
  it('records the person without subscribing them, then notifies', async () => {
    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(sent).toMatchObject({
      email: ENQUIRY.email,
      firstName: ENQUIRY.name,
      subscribe: false,
      tags: ['interest-enquiry'],
      source: 'services-contact-form',
      fields: { company: 'Example Corp', interest: 'Exposure Diagnostic', message: ENQUIRY.message },
      consent: { basis: 'legitimate_interest' },
    })
    expect(sent).not.toHaveProperty('formSlug')
    expect(notifyEnquiry).toHaveBeenCalledWith(
      expect.objectContaining({ email: ENQUIRY.email, company: 'Example Corp' }),
      'stored',
    )
  })

  it('notifies with "failed" when Standfirst refuses, so the enquiry is not lost', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))
    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(502)
    expect(notifyEnquiry).toHaveBeenCalledWith(expect.anything(), 'failed')
  })

  it('notifies with "failed" when Standfirst is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(502)
    expect(notifyEnquiry).toHaveBeenCalledWith(expect.anything(), 'failed')
  })

  it('notifies with "failed" when Standfirst is not configured', async () => {
    delete process.env.STANDFIRST_API_KEY
    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(503)
    expect(notifyEnquiry).toHaveBeenCalledWith(expect.anything(), 'failed')
  })

  it('still answers the visitor normally when the notification itself fails', async () => {
    notifyEnquiry.mockResolvedValueOnce('failed' as never)
    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it('does not notify for an invalid enquiry', async () => {
    const { POST } = await loadRoute()
    const response = await POST(request({ ...ENQUIRY, email: 'nope' }))

    expect(response.status).toBe(400)
    expect(notifyEnquiry).not.toHaveBeenCalled()
  })
})
