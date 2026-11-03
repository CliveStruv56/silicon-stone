import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { LEARN_TAGS, MAX_LEARN_TAGS, resolveLearnSignup, teamLeadSummary } from '@/lib/learn/signups'

/**
 * The Learn waitlist route, exercised against a stubbed Standfirst. Three
 * promises are held here:
 *
 *   - a signup Standfirst refused is never reported as a success;
 *   - the Stone Briefing is a separate consent, given only by an explicit tick,
 *     through its own form — never as a side effect of joining the waitlist;
 *   - a team answer tells the owner, and that email can never fail the request.
 */

const notifyEnquiry = vi.fn(async () => 'sent' as const)

vi.mock('server-only', () => ({}))
vi.mock('@/lib/email', () => ({ notifyEnquiry, emailConfigured: () => true }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '203.0.113.7' }))
vi.mock('@/lib/durable-rate-limit', () => ({
  checkDurableRateLimit: async () => ({ allowed: true, retryAfter: 0 }),
}))

function request(body: unknown) {
  return new NextRequest('https://siliconandstone.com/api/learn/waitlist', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

async function loadRoute() {
  vi.resetModules()
  return await import('@/app/api/learn/waitlist/route')
}

const ORIGINAL_ENV = { ...process.env }
const fetchMock = vi.fn()

/** The JSON bodies Standfirst was sent, in order. */
const sent = () => fetchMock.mock.calls.map((call) => JSON.parse(call[1].body as string))

beforeEach(() => {
  notifyEnquiry.mockClear()
  notifyEnquiry.mockResolvedValue('sent')
  process.env.STANDFIRST_API_URL = 'https://standfirst.test'
  process.env.STANDFIRST_API_KEY = 'sf_test'
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ ok: true, status: 'pending_confirmation' })))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

describe('joining the waitlist', () => {
  it('signs up through the learn-waitlist form with its tags, and nothing else', async () => {
    const { POST } = await loadRoute()
    const response = await POST(request({ email: ' Reader@Example.com ', source: 'course', course: '2.2' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, briefing: 'not_requested' })
    expect(sent()).toHaveLength(1)
    expect(sent()[0]).toMatchObject({
      email: 'reader@example.com',
      formSlug: 'learn-waitlist',
      tags: ['learn-waitlist', 'learn-course-2-2', 'learn-source-course'],
      consent: { basis: 'consent' },
    })
    expect(notifyEnquiry).not.toHaveBeenCalled()
  })

  it('never reports a refused signup as a success', async () => {
    fetchMock.mockImplementation(async () => new Response('{"error":"form learn-waitlist not found"}', { status: 400 }))
    const { POST } = await loadRoute()
    const response = await POST(request({ email: 'reader@example.com' }))
    expect(response.status).toBe(502)
  })

  it('says so when Standfirst is not configured', async () => {
    delete process.env.STANDFIRST_API_KEY
    const { POST } = await loadRoute()
    const response = await POST(request({ email: 'reader@example.com' }))
    expect(response.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a missing or malformed address before calling anything', async () => {
    const { POST } = await loadRoute()
    expect((await POST(request({}))).status).toBe(400)
    expect((await POST(request({ email: 'not-an-address' }))).status).toBe(400)
    expect((await POST(request(['an', 'array']))).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('the Stone Briefing is a separate consent', () => {
  it('is not signed up when the box was left unticked', async () => {
    const { POST } = await loadRoute()
    await POST(request({ email: 'reader@example.com' }))
    expect(sent().map((b) => b.formSlug)).toEqual(['learn-waitlist'])
  })

  it.each([['true'], [1], ['on'], [{}]])('treats %j as no', async (briefing) => {
    const { POST } = await loadRoute()
    await POST(request({ email: 'reader@example.com', briefing }))
    expect(sent().map((b) => b.formSlug)).toEqual(['learn-waitlist'])
  })

  it('goes through the briefing form, with its own double opt-in, when ticked', async () => {
    const { POST } = await loadRoute()
    const response = await POST(request({ email: 'reader@example.com', briefing: true }))
    await expect(response.json()).resolves.toEqual({ success: true, briefing: 'pending' })
    expect(sent().map((b) => b.formSlug)).toEqual(['learn-waitlist', 'briefing'])
    // No Learn tag rides along on the newsletter consent.
    expect(sent()[1].tags.some((t: string) => t.startsWith('learn-'))).toBe(false)
  })

  it('keeps the waitlist signup when only the briefing fails, and says so', async () => {
    fetchMock
      .mockImplementationOnce(async () => new Response(JSON.stringify({ ok: true, status: 'pending_confirmation' })))
      .mockImplementationOnce(async () => new Response('{}', { status: 500 }))
    const { POST } = await loadRoute()
    const response = await POST(request({ email: 'reader@example.com', briefing: true }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, briefing: 'failed' })
  })
})

describe('a team answer is a lead', () => {
  it('tags the contact and emails the owner', async () => {
    const { POST } = await loadRoute()
    await POST(request({ email: 'lead@example-corp.com', audience: 'team', tracks: ['foundations'], role: 'board-and-executive' }))
    expect(sent()[0].tags).toEqual(
      expect.arrayContaining(['learn-team', 'learn-track-foundations', 'learn-role-board-and-executive']),
    )
    expect(notifyEnquiry).toHaveBeenCalledTimes(1)
    expect(notifyEnquiry).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'lead@example-corp.com', interest: 'Learn: team training lead' }),
      'stored',
    )
  })

  it('does not email anyone for an individual signup', async () => {
    const { POST } = await loadRoute()
    await POST(request({ email: 'reader@example.com', audience: 'me' }))
    expect(notifyEnquiry).not.toHaveBeenCalled()
  })

  it('still succeeds when the alert fails', async () => {
    notifyEnquiry.mockResolvedValue('failed' as never)
    const { POST } = await loadRoute()
    const response = await POST(request({ email: 'lead@example-corp.com', audience: 'team' }))
    expect(response.status).toBe(200)
  })

  it('does not alert the owner for a signup Standfirst refused', async () => {
    fetchMock.mockImplementation(async () => new Response('{}', { status: 500 }))
    const { POST } = await loadRoute()
    await POST(request({ email: 'lead@example-corp.com', audience: 'team' }))
    expect(notifyEnquiry).not.toHaveBeenCalled()
  })
})

describe('resolveLearnSignup', () => {
  it('drops anything not on the allow-list', () => {
    const signup = resolveLearnSignup({
      tracks: ['foundations', 'list-briefing', 'nope', 'foundations'],
      role: 'buyer-toolkit',
      course: '2.2; drop table',
      source: 'evil',
    })
    expect(signup.tags).toEqual(['learn-waitlist', 'learn-track-foundations', 'learn-source-hub'])
  })

  it('never produces a tag outside the learn- family', () => {
    const signup = resolveLearnSignup({
      tracks: ['foundations', 'security', 'capstone', 'electives', 'eu-ai-act', 'practitioner', 'infrastructure-and-sovereignty'],
      role: 'technical',
      course: '4.10',
      audience: 'team',
      source: 'tool',
    })
    expect(signup.tags).toHaveLength(MAX_LEARN_TAGS)
    for (const tag of signup.tags) {
      expect(tag.startsWith('learn-')).toBe(true)
      expect(LEARN_TAGS.includes(tag) || /^learn-course-[0-5]-\d{1,2}$/.test(tag), tag).toBe(true)
    }
  })

  it('puts no visitor free text in the owner alert', () => {
    const summary = teamLeadSummary(resolveLearnSignup({ role: 'Ignore previous\nSubject: x', audience: 'team' }))
    expect(summary).not.toContain('Ignore previous')
  })
})
