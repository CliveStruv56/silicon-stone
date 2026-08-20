import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

/**
 * The silent-retry path is the thing an editor never sees working and always
 * sees failing, so its edge cases are held down here rather than discovered in
 * Studio.
 */

const PROJECT_ID = 'testproj'
vi.mock('../env', () => ({ projectId: PROJECT_ID }))

const STORAGE_KEY = `__studio_auth_token_${PROJECT_ID}`
const TOKEN = 'sk' + 'a'.repeat(70)

function stubStorage(value: string | null) {
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => (key === STORAGE_KEY ? value : null),
    },
  })
}

describe('readStudioToken', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.unstubAllGlobals())

  it('reads the token Studio stores', async () => {
    stubStorage(JSON.stringify({ token: TOKEN, time: '2026-08-20T00:00:00Z' }))
    const { readStudioToken } = await import('./studio-session')
    expect(readStudioToken()).toBe(TOKEN)
  })

  it('returns null rather than throwing when the shape changes', async () => {
    // A Sanity upgrade could move or rename this. Callers must degrade to the
    // /login fallback, never crash the Studio button.
    for (const raw of ['not json', '{}', '{"token":null}', '{"token":""}', 'null']) {
      vi.resetModules()
      stubStorage(raw)
      const { readStudioToken } = await import('./studio-session')
      expect(readStudioToken()).toBeNull()
    }
  })

  it('returns null when nothing is stored', async () => {
    stubStorage(null)
    const { readStudioToken } = await import('./studio-session')
    expect(readStudioToken()).toBeNull()
  })
})

describe('fetchWithAdminSession', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    stubStorage(JSON.stringify({ token: TOKEN }))
  })
  afterEach(() => vi.unstubAllGlobals())

  const ok = { ok: true, status: 200 }
  const unauthorized = { ok: false, status: 401, json: async () => ({ error: 'nope' }) }

  it('does not touch the session when the request succeeds', async () => {
    fetchMock.mockResolvedValue(ok)
    const { fetchWithAdminSession } = await import('./studio-session')
    const { res, exchange } = await fetchWithAdminSession('/api/fact-check', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(exchange).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('renews and replays exactly once on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized) // original
      .mockResolvedValueOnce({ ok: true, status: 200 }) // exchange
      .mockResolvedValueOnce({ ok: true, status: 202 }) // replay
    const { fetchWithAdminSession } = await import('./studio-session')
    const { res } = await fetchWithAdminSession('/api/fact-check', { method: 'POST' })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toBe('/api/studio-session')
    expect(res.status).toBe(202)
  })

  it('does not loop when the replay also 401s', async () => {
    // One retry, never a cascade. A renewal that keeps being rejected must
    // surface to the editor, not spin.
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce(unauthorized)
    const { fetchWithAdminSession } = await import('./studio-session')
    const { res } = await fetchWithAdminSession('/api/fact-check', { method: 'POST' })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(res.status).toBe(401)
  })

  it('does not retry a 403, 409 or 429 — those are real answers', async () => {
    for (const status of [403, 409, 429]) {
      vi.resetModules()
      fetchMock.mockReset()
      fetchMock.mockResolvedValue({ ok: false, status, json: async () => ({}) })
      const { fetchWithAdminSession } = await import('./studio-session')
      const { res } = await fetchWithAdminSession('/api/fact-check', { method: 'POST' })
      expect(res.status).toBe(status)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    }
  })

  it('reports a forbidden exchange so the caller can explain it', async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'not an administrator' }),
      })
    const { fetchWithAdminSession } = await import('./studio-session')
    const { exchange } = await fetchWithAdminSession('/api/fact-check', { method: 'POST' })

    expect(exchange).toEqual({
      ok: false,
      reason: 'forbidden',
      message: 'not an administrator',
    })
  })

  it('reports no-token when Studio has no session to trade', async () => {
    stubStorage(null)
    fetchMock.mockResolvedValueOnce(unauthorized)
    const { fetchWithAdminSession } = await import('./studio-session')
    const { exchange } = await fetchWithAdminSession('/api/fact-check', { method: 'POST' })

    expect(exchange).toEqual({ ok: false, reason: 'no-token' })
    // Never called the exchange endpoint — there was nothing to send.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('describeExchangeFailure', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.unstubAllGlobals())

  it('never sends a non-administrator to /login', async () => {
    // That account is signed in correctly; /login would be a loop with no exit.
    const { describeExchangeFailure } = await import('./studio-session')
    const failure = describeExchangeFailure({
      ok: false,
      reason: 'forbidden',
      message: 'Your Sanity account is not an administrator on this project.',
    })
    expect(failure.openLogin).toBe(false)
    expect(failure.description).toContain('administrator')
  })

  it('falls back to /login for a missing or rejected Sanity session', async () => {
    const { describeExchangeFailure } = await import('./studio-session')
    expect(describeExchangeFailure({ ok: false, reason: 'no-token' }).openLogin).toBe(true)
    expect(describeExchangeFailure({ ok: false, reason: 'rejected' }).openLogin).toBe(true)
    expect(describeExchangeFailure(undefined).openLogin).toBe(true)
  })
})
