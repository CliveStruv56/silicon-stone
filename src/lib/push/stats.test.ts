import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/sanity/env', () => ({
  apiVersion: '2026-01-13',
  dataset: 'test',
  projectId: 'testproj',
}))

const isAuthenticatedAdmin = vi.fn()
const getRedis = vi.fn()
const pushSendConfigured = vi.fn(() => true)

vi.mock('@/lib/admin-auth', () => ({ isAuthenticatedAdmin: () => isAuthenticatedAdmin() }))
vi.mock('@/lib/redis', () => ({ getRedis: () => getRedis() }))
vi.mock('@/lib/push/send', () => ({ pushSendConfigured: () => pushSendConfigured() }))

const { GET } = await import('@/app/api/push/stats/route')

/**
 * The operator had no way to see subscriber numbers anywhere in the app, and the
 * Redis credentials are marked Sensitive in Vercel so they cannot be read back
 * even from the console side. Publishing an Audit-tier article notifies a topic
 * whose size nobody could observe.
 *
 * The distinction these tests protect is the one that makes the number usable:
 * a zero because nobody subscribed reads identically to a zero because there is
 * no store to ask, and only `configured` tells them apart.
 */
beforeEach(() => {
  isAuthenticatedAdmin.mockReset()
  getRedis.mockReset()
  pushSendConfigured.mockReset()
  pushSendConfigured.mockReturnValue(true)
})

const redisWith = (counts: Record<string, number>) => ({
  scard: (key: string) => Promise.resolve(counts[key] ?? 0),
})

describe('GET /api/push/stats', () => {
  it('refuses anyone without the writer session', async () => {
    isAuthenticatedAdmin.mockResolvedValue(false)
    getRedis.mockReturnValue(redisWith({ 'push:topic:audit-deep-dives': 12 }))

    const res = await GET()
    expect(res.status).toBe(401)
    // The count must not leak past the gate.
    expect(JSON.stringify(await res.json())).not.toContain('12')
  })

  it('counts each topic by its own key', async () => {
    isAuthenticatedAdmin.mockResolvedValue(true)
    getRedis.mockReturnValue(
      redisWith({
        'push:topic:audit-deep-dives': 12,
        'push:topic:ai-act-deadlines': 5,
      }),
    )

    const body = await (await GET()).json()
    expect(body.configured).toBe(true)
    expect(body.total).toBe(17)
    expect(body.topics).toEqual([
      { id: 'ai-act-deadlines', label: 'AI Act deadline alerts', subscribers: 5 },
      { id: 'audit-deep-dives', label: 'New Audit-tier Deep Dives', subscribers: 12 },
    ])
  })

  it('reports a real zero as configured — nobody has subscribed', async () => {
    isAuthenticatedAdmin.mockResolvedValue(true)
    getRedis.mockReturnValue(redisWith({}))

    const body = await (await GET()).json()
    expect(body.configured).toBe(true)
    expect(body.total).toBe(0)
  })

  it('distinguishes an unconfigured store from an empty one', async () => {
    isAuthenticatedAdmin.mockResolvedValue(true)
    getRedis.mockReturnValue(null)

    const body = await (await GET()).json()
    expect(body.configured).toBe(false)
    expect(body.total).toBe(0)
    expect(body.topics.every((t: { subscribers: number }) => t.subscribers === 0)).toBe(true)
  })

  it('reports sendability separately from the store — VAPID keys are a different gate', async () => {
    isAuthenticatedAdmin.mockResolvedValue(true)
    getRedis.mockReturnValue(redisWith({ 'push:topic:audit-deep-dives': 3 }))
    pushSendConfigured.mockReturnValue(false)

    const body = await (await GET()).json()
    expect(body.configured).toBe(true)
    expect(body.canSend).toBe(false)
    expect(body.total).toBe(3)
  })

  it('never returns the subscriptions themselves — only counts', async () => {
    isAuthenticatedAdmin.mockResolvedValue(true)
    getRedis.mockReturnValue(redisWith({ 'push:topic:audit-deep-dives': 2 }))

    const raw = JSON.stringify(await (await GET()).json())
    expect(raw).not.toContain('endpoint')
    expect(raw).not.toContain('p256dh')
    expect(raw).not.toContain('auth')
  })
})
