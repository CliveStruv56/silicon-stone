import fs from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const recordZeroResult = vi.fn()
vi.mock('@/lib/search/zero-results', () => ({
  recordZeroResult: (...args: unknown[]) => recordZeroResult(...args),
}))

const { reportZeroResult } = await import('@/app/(website)/search/actions')

beforeEach(() => recordZeroResult.mockReset())

describe('what site search keeps about a reader', () => {
  // Rate-limit analytics is off for every limiter: see src/lib/rate-limit-analytics.test.ts.
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
