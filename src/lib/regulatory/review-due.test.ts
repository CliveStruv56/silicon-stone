import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { REVIEW_WARNING_DAYS, reviewStatus } from './review-due'

describe('reviewStatus', () => {
  it('is lapsed exactly when reg:check fails: the day after reviewBy', () => {
    expect(reviewStatus('2026-11-11', '2026-11-12')).toEqual({ state: 'lapsed', daysLeft: -1 })
    // The review date itself is still a working day.
    expect(reviewStatus('2026-11-11', '2026-11-11')).toEqual({ state: 'due', daysLeft: 0 })
  })

  it('warns from REVIEW_WARNING_DAYS out, and not a day earlier', () => {
    expect(reviewStatus('2026-11-22', '2026-11-01')).toEqual({ state: 'due', daysLeft: REVIEW_WARNING_DAYS })
    expect(reviewStatus('2026-11-23', '2026-11-01')).toEqual({ state: 'current', daysLeft: REVIEW_WARNING_DAYS + 1 })
  })

  it('counts calendar days across a month and a DST change', () => {
    // Europe moves its clocks on 25 October 2026; UTC arithmetic must not.
    expect(reviewStatus('2026-11-01', '2026-10-20').daysLeft).toBe(12)
  })

  it('reports a missing date as missing, never as current', () => {
    expect(reviewStatus(undefined, '2026-10-30')).toEqual({ state: 'missing', daysLeft: null })
    expect(reviewStatus('', '2026-10-30').state).toBe('missing')
  })

  it('throws on a malformed date rather than guessing', () => {
    expect(() => reviewStatus('11/11/2026', '2026-10-30')).toThrow(/Not an ISO date/)
  })
})

describe('the warning reaches somewhere a person looks', () => {
  const root = process.cwd()
  const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

  it('reg:check and reg:review-due share the one definition', () => {
    // Two copies of "lapsed" would eventually disagree, and the build would
    // fail on a day the watcher had called fine.
    expect(read('scripts/regulatory/check.ts')).toMatch(/import \{[^}]*\breviewStatus\b[^}]*\} from '..\/..\/src\/lib\/regulatory\/review-due'/)
    expect(read('scripts/regulatory/review-due.ts')).toMatch(/\breviewStatus\(/)
    expect(JSON.parse(read('package.json')).scripts['reg:review-due']).toContain('scripts/regulatory/review-due.ts')
  })

  it('the weekly workflow runs it, raises an issue on exit 2, and fails on any other error', () => {
    // A warning step that does not run is worse than none: it reads as cover.
    const workflow = read('.github/workflows/regulatory-drift.yml')
    expect(workflow).toMatch(/npm run --silent reg:review-due/)
    expect(workflow).toMatch(/if: steps\.review\.outputs\.status == '2'/)
    expect(workflow).toMatch(/regulatory-review-due/)
    expect(workflow).toMatch(/if: steps\.review\.outputs\.status != '0' && steps\.review\.outputs\.status != '2'\s+run: \|[\s\S]*?exit 1/)
  })
})
