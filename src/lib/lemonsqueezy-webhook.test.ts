import crypto from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/redis', () => ({ getRedis: () => null }))

const SECRET = 'whsec_test'
const ORIGINAL_ENV = { ...process.env }
const fetchMock = vi.fn()

function order() {
  const raw = JSON.stringify({
    meta: { event_name: 'order_created' },
    data: { attributes: { user_email: 'Buyer@Example.com', first_order_item: { variant_id: 111 } }, id: crypto.randomUUID() },
  })
  return new NextRequest('https://siliconandstone.com/api/webhooks/lemonsqueezy', {
    method: 'POST',
    body: raw,
    headers: { 'x-signature': crypto.createHmac('sha256', SECRET).update(raw).digest('hex') },
  })
}

beforeEach(() => {
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET
  process.env.LEMONSQUEEZY_VARIANT_ID_SECTOR_REPORT_MANUFACTURING = '111'
  process.env.STANDFIRST_API_URL = 'https://standfirst.test'
  process.env.STANDFIRST_API_KEY = 'sf_test'
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, status: 'recorded' })))
  vi.stubGlobal('fetch', fetchMock)
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

describe('Lemon Squeezy order_created', () => {
  it('tags the buyer without subscribing them', async () => {
    const { POST } = await import('@/app/api/webhooks/lemonsqueezy/route')
    expect((await POST(order())).status).toBe(200)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      email: 'buyer@example.com',
      subscribe: false,
      tags: ['buyer-sector-report-manufacturing'],
    })
  })

  it('answers 500 when Standfirst fails, so Lemon Squeezy retries', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 503 }))
    const { POST } = await import('@/app/api/webhooks/lemonsqueezy/route')
    expect((await POST(order())).status).toBe(500)
  })
})
