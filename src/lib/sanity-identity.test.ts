import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

/**
 * These tests guard the boundary that lets a Sanity login stand in for the
 * admin access code. Three properties matter, and all three are the kind that
 * fail silently if broken:
 *
 *   1. The identity lookup is scoped to THIS project, not the global Sanity
 *      host — otherwise any valid Sanity token anywhere authenticates here.
 *   2. Membership alone never grants access; the administrator role does.
 *   3. Upstream failure fails CLOSED.
 */

const PROJECT_ID = 'testproj'

vi.mock('server-only', () => ({}))
vi.mock('@/sanity/env', () => ({ projectId: PROJECT_ID }))

const okUser = (roles: unknown) => ({
  ok: true,
  json: async () => ({ id: 'p9hG7gikg', name: 'Clive Struver', roles }),
})

async function loadModule() {
  return import('./sanity-identity')
}

describe('verifySanityAdminToken', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const VALID = 'sk' + 'a'.repeat(70)

  it('calls the project-scoped Sanity host, never the global one', async () => {
    fetchMock.mockResolvedValue(okUser([{ name: 'administrator' }]))
    const { verifySanityAdminToken } = await loadModule()
    await verifySanityAdminToken(VALID)

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain(`https://${PROJECT_ID}.api.sanity.io/`)
    // The global host would accept a token belonging to somebody else's
    // project. If this ever passes, the role check is the only thing left.
    expect(url).not.toMatch(/^https:\/\/api\.sanity\.io/)
  })

  it('sends the token as a bearer header and nowhere else', async () => {
    fetchMock.mockResolvedValue(okUser([{ name: 'administrator' }]))
    const { verifySanityAdminToken } = await loadModule()
    await verifySanityAdminToken(VALID)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${VALID}`)
    // A token in the query string lands in access logs and referrers.
    expect(url).not.toContain(VALID)
  })

  it('accepts an administrator', async () => {
    fetchMock.mockResolvedValue(okUser([{ name: 'administrator', title: 'Administrator' }]))
    const { verifySanityAdminToken } = await loadModule()
    await expect(verifySanityAdminToken(VALID)).resolves.toEqual({
      id: 'p9hG7gikg',
      name: 'Clive Struver',
    })
  })

  it('refuses a project member who is not an administrator', async () => {
    // The whole point of the role check: an editor invited to Sanity must not
    // inherit the metered generation pipeline.
    for (const role of ['editor', 'viewer', 'contributor', 'developer']) {
      fetchMock.mockResolvedValue(okUser([{ name: role }]))
      const { verifySanityAdminToken } = await loadModule()
      await expect(verifySanityAdminToken(VALID)).resolves.toBeNull()
    }
  })

  it('refuses a user with no roles at all', async () => {
    for (const roles of [[], null, undefined, 'administrator', { name: 'administrator' }]) {
      fetchMock.mockResolvedValue(okUser(roles))
      const { verifySanityAdminToken } = await loadModule()
      await expect(verifySanityAdminToken(VALID)).resolves.toBeNull()
    }
  })

  it('refuses when Sanity rejects the token', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    const { verifySanityAdminToken } = await loadModule()
    await expect(verifySanityAdminToken(VALID)).resolves.toBeNull()
  })

  it('fails closed when the lookup throws', async () => {
    // An outage must not read as a pass. It also must not read as "your token
    // was rejected" in the logs, hence the console.error in the source.
    fetchMock.mockRejectedValue(new Error('network down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { verifySanityAdminToken } = await loadModule()
    await expect(verifySanityAdminToken(VALID)).resolves.toBeNull()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('rejects malformed tokens without calling Sanity at all', async () => {
    const { verifySanityAdminToken } = await loadModule()
    const bad = [
      '',
      'short',
      'sk with spaces aaaaaaaaaaaaaaaaaaaaaaaaa',
      `sk${'a'.repeat(30)}\nX-Injected: 1`,
      'x'.repeat(600),
    ]
    for (const token of bad) {
      await expect(verifySanityAdminToken(token)).resolves.toBeNull()
    }
    // A header-splitting token would produce an upstream 400 that reads like an
    // outage; refusing locally keeps the failure legible.
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('fetchSanityIdentity', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('reports a valid non-admin distinctly, so the route can explain it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okUser([{ name: 'editor' }])))
    const { fetchSanityIdentity } = await import('./sanity-identity')
    await expect(fetchSanityIdentity('sk' + 'a'.repeat(70))).resolves.toEqual({
      id: 'p9hG7gikg',
      name: 'Clive Struver',
      isAdmin: false,
    })
  })
})
