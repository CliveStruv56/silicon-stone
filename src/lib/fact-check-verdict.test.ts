import { describe, it, expect } from 'vitest'
import { liveVerdict, verdictFor } from './fact-check-verdict'
import { preflightArticle } from './publish-preflight'

/**
 * Reported from real use, 21 August 2026: "the indicator at the bottom of the
 * screen still said major issues, even after I had addressed all of the
 * highlighted issues."
 *
 * `overallVerdict` is written once when the run completes. Applying a revision
 * sets `claims[…].applied` and patches the body, and nothing recomputes the
 * verdict — so the badge could never clear without paying for another run.
 */
const claim = (verdict: string, applied?: boolean) => ({ verdict, applied })

describe('verdictFor', () => {
  it('ranks inaccurate above everything', () => {
    expect(verdictFor([claim('accurate'), claim('needs-context'), claim('inaccurate')])).toBe(
      'major-issues',
    )
  })

  it('treats outdated and needs-context as minor', () => {
    expect(verdictFor([claim('accurate'), claim('outdated')])).toBe('minor-issues')
    expect(verdictFor([claim('needs-context')])).toBe('minor-issues')
  })

  it('reports unverifiable only when they are the majority', () => {
    expect(verdictFor([claim('unverifiable'), claim('accurate')])).toBe('clean')
    expect(verdictFor([claim('unverifiable'), claim('unverifiable'), claim('accurate')])).toBe(
      'unverifiable',
    )
  })

  it('is clean with nothing flagged', () => {
    expect(verdictFor([claim('accurate'), claim('accurate')])).toBe('clean')
    expect(verdictFor([])).toBe('clean')
  })
})

describe('liveVerdict', () => {
  it('drops to minor once the inaccurate claim has been addressed', () => {
    const live = liveVerdict({
      overallVerdict: 'major-issues',
      claims: [claim('inaccurate', true), claim('needs-context'), claim('accurate')],
    })

    expect(live.verdict).toBe('minor-issues')
    expect(live.applied).toBe(1)
    expect(live.outstanding).toBe(1)
    expect(live.addressed).toBe(false)
  })

  it('reports addressed — never clean — once every flagged claim is applied', () => {
    const live = liveVerdict({
      overallVerdict: 'major-issues',
      claims: [claim('inaccurate', true), claim('needs-context', true), claim('accurate')],
    })

    expect(live.addressed).toBe(true)
    expect(live.applied).toBe(2)
    expect(live.outstanding).toBe(0)
  })

  it('leaves an untouched report exactly as the run left it', () => {
    const live = liveVerdict({
      overallVerdict: 'major-issues',
      claims: [claim('inaccurate'), claim('accurate')],
    })

    expect(live.verdict).toBe('major-issues')
    expect(live.outstanding).toBe(1)
    expect(live.addressed).toBe(false)
  })

  it('an accurate claim still counts toward "mostly unverifiable"', () => {
    // Applied claims leave the set; accurate ones never had a revision to
    // apply, so they stay in the denominator.
    const live = liveVerdict({
      claims: [claim('unverifiable'), claim('unverifiable'), claim('accurate')],
    })
    expect(live.verdict).toBe('unverifiable')
  })

  it('falls back to the stored verdict when there are no claims, and says so', () => {
    const live = liveVerdict({ overallVerdict: 'major-issues', claims: null })
    expect(live.verdict).toBe('major-issues')
    expect(live.derived).toBe(false)
  })
})

describe('the publish dialog follows the same arithmetic', () => {
  const doc = (claims: ReturnType<typeof claim>[]) => ({
    contentType: 'signal',
    citations: [{ url: 'https://example.org' }],
    body: [{ _type: 'block', _key: 'a', children: [{ text: 'Finished prose.' }] }],
    factCheck: { status: 'completed', overallVerdict: 'major-issues', claims },
  })

  it('counts what is left to address rather than restating the frozen verdict', () => {
    const issues = preflightArticle(doc([claim('inaccurate'), claim('inaccurate', true)]))
    const found = issues.find((i) => i.id === 'fact-check-major-issues')
    expect(found?.title).toBe('The fact-check found major issues — 1 claim still to address')
  })

  it('swaps the adverse warning for a staleness one once all are addressed', () => {
    const issues = preflightArticle(doc([claim('inaccurate', true), claim('accurate')]))
    expect(issues.find((i) => i.id === 'fact-check-major-issues')).toBeUndefined()
    const stale = issues.find((i) => i.id === 'fact-check-stale')
    expect(stale?.severity).toBe('warning')
    expect(stale?.title).toBe('The fact-check predates your revisions')
    expect(stale?.detail).toContain('Nothing has verified the new wording')
  })

  it('never turns an addressed report into no warning at all', () => {
    const issues = preflightArticle(doc([claim('inaccurate', true)]))
    expect(issues.length).toBeGreaterThan(0)
  })

  it('fails closed when an adverse verdict has no claims to explain it', () => {
    const issues = preflightArticle({
      contentType: 'signal',
      citations: [{ url: 'https://example.org' }],
      body: [{ _type: 'block', _key: 'a', children: [{ text: 'Finished prose.' }] }],
      factCheck: { status: 'completed', overallVerdict: 'major-issues' },
    })
    expect(issues.find((i) => i.id === 'fact-check-major-issues')?.title).toBe(
      'The fact-check found major issues',
    )
  })
})
