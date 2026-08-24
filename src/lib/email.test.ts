import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

/**
 * What actually goes over the wire to Resend, and what happens when it cannot.
 *
 * The payload shape is worth a test on its own because two of its fields fail
 * *silently* when wrong: Resend's reply-to field is `reply_to`, not `replyTo`,
 * and an unknown key is ignored rather than rejected — so a camelCase slip
 * sends a notification whose replies go back to the site's own sending address
 * instead of the enquirer, and nothing anywhere reports it.
 *
 * The rest is the fail-open contract. This runs on a public form, after the
 * enquiry has already been saved, so no outcome here may throw.
 */

vi.mock('server-only', () => ({}))

const ENQUIRY = {
  name: 'Jordan Blake',
  email: 'jordan@example-corp.com',
  company: 'Example Corp',
  interest: 'Exposure Diagnostic',
  message: 'We deploy an Annex III system.',
}

const ORIGINAL_ENV = { ...process.env }

async function load(env: Record<string, string | undefined>) {
  vi.resetModules()
  process.env = { ...ORIGINAL_ENV, ...env }
  return await import('./email')
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

const CONFIGURED = {
  RESEND_API_KEY: 're_test_key',
  ENQUIRY_NOTIFY_TO: 'owner@siliconandstone.com',
  ENQUIRY_NOTIFY_FROM: 'Silicon & Stone <briefing@siliconandstone.com>',
}

describe('notifyEnquiry', () => {
  it('posts the payload Resend expects', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { notifyEnquiry } = await load(CONFIGURED)
    await expect(notifyEnquiry(ENQUIRY, 'stored')).resolves.toBe('sent')

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer re_test_key',
    )

    const payload = JSON.parse(init.body as string)
    expect(payload.from).toBe(CONFIGURED.ENQUIRY_NOTIFY_FROM)
    expect(payload.to).toEqual([CONFIGURED.ENQUIRY_NOTIFY_TO])
    // snake_case: the whole reason this test exists.
    expect(payload.reply_to).toBe(ENQUIRY.email)
    expect(payload).not.toHaveProperty('replyTo')
    expect(payload.subject).toContain('Exposure Diagnostic')
    expect(payload.text).toContain('We deploy an Annex III system.')
  })

  it('is bounded by a timeout signal rather than waiting indefinitely', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { notifyEnquiry } = await load(CONFIGURED)
    await notifyEnquiry(ENQUIRY, 'stored')

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('reports unconfigured — and sends nothing — when a variable is missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    for (const missing of [
      'RESEND_API_KEY',
      'ENQUIRY_NOTIFY_TO',
      'ENQUIRY_NOTIFY_FROM',
    ]) {
      const { notifyEnquiry } = await load({ ...CONFIGURED, [missing]: '' })
      await expect(notifyEnquiry(ENQUIRY, 'stored')).resolves.toBe(
        'unconfigured',
      )
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns "failed" rather than throwing when Resend rejects the send', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"message":"domain not verified"}', { status: 403 })),
    )

    const { notifyEnquiry } = await load(CONFIGURED)
    await expect(notifyEnquiry(ENQUIRY, 'stored')).resolves.toBe('failed')
  })

  it('returns "failed" rather than throwing when the network dies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNRESET')
      }),
    )

    const { notifyEnquiry } = await load(CONFIGURED)
    await expect(notifyEnquiry(ENQUIRY, 'stored')).resolves.toBe('failed')
  })

  it('does not put the enquirer’s message into a log line', async () => {
    const errors: unknown[][] = []
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args)
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(ENQUIRY), { status: 422 })),
    )

    const { notifyEnquiry } = await load(CONFIGURED)
    await notifyEnquiry(ENQUIRY, 'stored')

    const logged = JSON.stringify(errors)
    expect(logged).not.toContain('Annex III')
    expect(logged).not.toContain(ENQUIRY.email)
  })
})

describe('emailConfigured', () => {
  it('is true only when all three variables are set', async () => {
    expect((await load(CONFIGURED)).emailConfigured()).toBe(true)
    expect(
      (await load({ ...CONFIGURED, ENQUIRY_NOTIFY_FROM: '' })).emailConfigured(),
    ).toBe(false)
  })
})
