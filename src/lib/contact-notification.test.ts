import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * The enquiry notification must fire on **both** storage paths.
 *
 * `/api/contact` has two: it writes Kit directly by default, and proxies to the
 * Railway backend when `CONTACT_VIA_BACKEND=true`, returning immediately.
 *
 * Until 2026-08-24 the proxy was unconditional whenever `BACKEND_API_URL` was
 * set — which production does — so a notification wired into the Kit half alone
 * would have passed every unit test, looked correct on a local run with no
 * backend configured, and never sent a single email in the only environment
 * anybody cares about. The flag now makes the direct path the default, but the
 * proxy path still exists and still has to notify, so both are covered here.
 *
 * That is the exact shape of a defect this project has hit before: "a frontend
 * fix can be live and still wrong" because `backend/` duplicates the same work.
 * So this exercises the route itself, with the proxy path active, rather than
 * testing the notification builder twice.
 */

const notifyEnquiry = vi.fn(async () => 'sent' as const)

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
})

describe('the Railway proxy path — opt-in via CONTACT_VIA_BACKEND', () => {
  beforeEach(() => {
    process.env.BACKEND_API_URL = 'https://backend.test'
    process.env.BACKEND_API_KEY = 'shared-key'
    process.env.CONTACT_VIA_BACKEND = 'true'
  })

  it('notifies even though the route returns before the Kit code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ),
    )

    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(notifyEnquiry).toHaveBeenCalledTimes(1)
    expect(notifyEnquiry).toHaveBeenCalledWith(
      expect.objectContaining({ email: ENQUIRY.email, company: 'Example Corp' }),
      'stored',
    )
  })

  it('reports "failed" when the backend rejected the enquiry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: 'nope' }), { status: 503 }),
      ),
    )

    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(503)
    expect(notifyEnquiry).toHaveBeenCalledWith(expect.anything(), 'failed')
  })

  it('still answers the visitor normally when the notification itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ),
    )
    notifyEnquiry.mockResolvedValueOnce('failed' as never)

    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })
})

describe('the direct-to-Kit path', () => {
  beforeEach(() => {
    delete process.env.BACKEND_API_URL
    delete process.env.NEXT_PUBLIC_API_URL
    process.env.CONVERTKIT_API_KEY = 'kit_test_key'
    process.env.CONVERTKIT_FORM_ID = '9270944'
  })

  it('notifies after a successful Kit write', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ subscriber: { id: 42 } }), { status: 200 }),
      ),
    )

    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(notifyEnquiry).toHaveBeenCalledWith(expect.anything(), 'stored')
  })

  it('notifies with "failed" when Kit rejects the subscriber, so the enquiry is not lost', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('bad key', { status: 401 })),
    )

    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(502)
    expect(notifyEnquiry).toHaveBeenCalledWith(expect.anything(), 'failed')
  })
})

/**
 * The regression that cost every advisory enquiry submitted before 2026-08-24.
 *
 * `BACKEND_API_URL` is set in production and must stay set — briefings, usage
 * tracking and deep research all use it. What must NOT follow from that is
 * contact proxying to a `/v1/contact` whose Kit credentials are empty, which is
 * what returned 503 on every enquiry while newsletter signups worked fine.
 */
describe('the default path — direct to Kit even with a backend configured', () => {
  beforeEach(() => {
    process.env.BACKEND_API_URL = 'https://backend.test'
    process.env.BACKEND_API_KEY = 'shared-key'
    delete process.env.CONTACT_VIA_BACKEND
    process.env.CONVERTKIT_API_KEY = 'kit_test_key'
    process.env.CONVERTKIT_FORM_ID = '9270944'
  })

  it('never calls the backend unless the flag is exactly "true"', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ subscriber: { id: 42 } }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await loadRoute()
    const response = await POST(request())

    expect(response.status).toBe(200)
    const called = fetchMock.mock.calls.map((c) => String((c as unknown[])[0]))
    expect(called.some((u) => u.includes('backend.test'))).toBe(false)
    expect(called.some((u) => u.includes('api.kit.com'))).toBe(true)
  })

  it('treats any other flag value as off', async () => {
    for (const value of ['1', 'yes', 'TRUE', '']) {
      process.env.CONTACT_VIA_BACKEND = value
      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ subscriber: { id: 42 } }), { status: 200 }),
      )
      vi.stubGlobal('fetch', fetchMock)

      const { POST } = await loadRoute()
      await POST(request())

      const called = fetchMock.mock.calls.map((c) => String((c as unknown[])[0]))
      expect(called.some((u) => u.includes('backend.test'))).toBe(false)
    }
  })

  it('still notifies on the direct path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ subscriber: { id: 42 } }), { status: 200 }),
      ),
    )

    const { POST } = await loadRoute()
    await POST(request())

    expect(notifyEnquiry).toHaveBeenCalledWith(expect.anything(), 'stored')
  })
})

describe('what is not an enquiry', () => {
  beforeEach(() => {
    process.env.BACKEND_API_URL = 'https://backend.test'
    process.env.BACKEND_API_KEY = 'shared-key'
    process.env.CONTACT_VIA_BACKEND = 'true'
  })

  it('does not notify on a request rejected before validation', async () => {
    const { POST } = await loadRoute()
    const response = await POST(request({ ...ENQUIRY, email: 'not-an-email' }))

    expect(response.status).toBe(400)
    expect(notifyEnquiry).not.toHaveBeenCalled()
  })
})
