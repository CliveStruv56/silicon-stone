import fs from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const recordZeroResult = vi.fn()
vi.mock('@/lib/search/zero-results', () => ({
  recordZeroResult: (...args: unknown[]) => recordZeroResult(...args),
}))

const { limiterRecordsAnalytics } = await import('@/lib/durable-rate-limit')
const { reportZeroResult } = await import('@/app/(website)/search/actions')

beforeEach(() => recordZeroResult.mockReset())

/** Search limiters that must not leave identifiers behind in Upstash analytics. */
const SEARCH_LIMITERS = ['searchZeroLog', 'publicSearch', 'publicSearchDaily'] as const

describe('what site search keeps about a reader', () => {
  it('turns Upstash analytics off for every search limiter', () => {
    for (const key of SEARCH_LIMITERS) expect(limiterRecordsAnalytics(key), key).toBe(false)
    // Control: the default is unchanged for everything else.
    expect(limiterRecordsAnalytics('login')).toBe(true)
  })

  it('logs zero-result searches only through the settled reporter, never on render', () => {
    const page = fs.readFileSync('src/app/(website)/search/page.tsx', 'utf8')
    expect(page.includes('recordZeroResult')).toBe(false)
    expect(page.includes('after(')).toBe(false)
    expect(page).toMatch(/<ZeroResultReporter query=\{query\} \/>/)
  })
})

describe('reportZeroResult (server action)', () => {
  it('records a settled query that matches nothing', async () => {
    await reportZeroResult('  Quantum   Sovereignty ')
    expect(recordZeroResult).toHaveBeenCalledWith('quantum sovereignty')
  })

  it('ignores anything that is not a plausible query', async () => {
    await reportZeroResult(42)
    await reportZeroResult({ q: 'x' })
    await reportZeroResult('x'.repeat(501))
    await reportZeroResult('   ')
    expect(recordZeroResult).not.toHaveBeenCalled()
  })

  it('refuses a "nothing matched" claim the page registry contradicts', async () => {
    await reportZeroResult('pricing')
    expect(recordZeroResult).not.toHaveBeenCalled()
  })
})
