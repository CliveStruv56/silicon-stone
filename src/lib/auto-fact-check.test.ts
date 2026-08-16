import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { AUTO_FACT_CHECK_FORMATS, shouldAutoFactCheck } from './auto-fact-check'

describe('shouldAutoFactCheck', () => {
  it('covers the two formats with the highest claim density', () => {
    expect(shouldAutoFactCheck('signal')).toBe(true)
    expect(shouldAutoFactCheck('deep_dive')).toBe(true)
  })

  it('leaves the short and explanatory formats alone', () => {
    // A report that is nearly always empty is a report nobody reads.
    for (const format of ['pulse', 'guide', 'youtube']) {
      expect(shouldAutoFactCheck(format)).toBe(false)
    }
  })

  it('is false for an unknown format rather than throwing', () => {
    expect(shouldAutoFactCheck('research')).toBe(false)
    expect(shouldAutoFactCheck('')).toBe(false)
  })

  it('includes the Deep Dive, which the voice pass only audits', () => {
    // The format with the most claims had the least automatic scrutiny; that
    // is the whole reason this exists.
    expect(AUTO_FACT_CHECK_FORMATS.has('deep_dive')).toBe(true)
  })
})

describe('the auto fact-check is wired up', () => {
  const form = fs.readFileSync(
    path.join(process.cwd(), 'src/app/(admin)/create/create-form.tsx'),
    'utf8',
  )
  const actions = fs.readFileSync(
    path.join(process.cwd(), 'src/app/(admin)/create/actions.ts'),
    'utf8',
  )

  it('the action returns the created draft id for the client to check', () => {
    expect(actions).toMatch(/articleId/)
    expect(actions).toMatch(/ok: true, \.\.\.\(articleId/)
  })

  it('the form starts the check before navigating away', () => {
    expect(form).toMatch(/await startAutoFactCheck\(format, result\.articleId\)/)
    expect(form.indexOf('startAutoFactCheck(format')).toBeLessThan(
      form.indexOf('router.push("/studio/structure/article")'),
    )
  })

  it('it posts to the existing hardened route rather than duplicating its guards', () => {
    // /api/fact-check already owns auth, rate limiting, the re-entrancy guard
    // and the background run. Re-implementing any of that here would drift.
    expect(form).toMatch(/fetch\("\/api\/fact-check"/)
  })

  it('a failure to start is not reported as a failed generation', () => {
    // The draft is already saved by this point; an unstarted advisory check
    // must never look like a lost draft.
    expect(form).toMatch(/console\.warn\("\[create\] auto fact-check request failed/)
    expect(form).not.toMatch(/alert\([^)]*fact-check/i)
  })
})

describe('the constant does not live in a "use server" module', () => {
  // A "use server" file may only export async functions; exporting a Set from
  // one is a build-time rule violation waiting to bite.
  const actions = fs.readFileSync(
    path.join(process.cwd(), 'src/app/(admin)/create/actions.ts'),
    'utf8',
  )

  it('actions.ts exports no format set', () => {
    expect(actions).not.toMatch(/export const AUTO_FACT_CHECK_FORMATS/)
  })
})
