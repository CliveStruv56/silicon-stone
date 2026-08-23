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

  it('swaps the adverse warning for one about the unverified correction', () => {
    // This assertion originally expected `fact-check-stale`, and what it was
    // protecting was that clearing the adverse verdict must not clear the
    // warning. That still holds; the message is now the sharper of the two,
    // because the applied claim was one the evidence contradicted rather than
    // merely one it wanted qualified. See the 2026-08-23 gap.
    const issues = preflightArticle(doc([claim('inaccurate', true), claim('accurate')]))
    expect(issues.find((i) => i.id === 'fact-check-major-issues')).toBeUndefined()
    const warned = issues.find((i) => i.id === 'fact-check-corrected-not-rechecked')
    expect(warned?.severity).toBe('warning')
    expect(warned?.title).toBe('A contradicted claim was revised but not re-checked')
    expect(warned?.detail).toContain('not a re-verified fact')
  })

  it('still reports plain staleness when the addressed claims were lesser ones', () => {
    const issues = preflightArticle(doc([claim('needs-context', true), claim('accurate')]))
    const stale = issues.find((i) => i.id === 'fact-check-stale')
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

describe('a contradicted claim that was patched but not re-checked', () => {
  /**
   * The case that fell between every branch of the publish guard, found on a
   * real draft on 2026-08-23: twelve claims, one `inaccurate`, three
   * `needs-context`, and the editor had applied the revision to the inaccurate
   * one and nothing else.
   *
   * The recomputed verdict drops to `minor-issues`, which the guard
   * deliberately does not warn on, and `addressed` is false because three
   * claims are still outstanding. So the dialog said nothing at all about an
   * article carrying an unverified correction to a factual error.
   */
  const realShape = {
    overallVerdict: 'major-issues',
    claims: [
      { verdict: 'accurate' },
      { verdict: 'accurate' },
      { verdict: 'accurate' },
      { verdict: 'inaccurate', applied: true },
      { verdict: 'needs-context' },
      { verdict: 'needs-context' },
      { verdict: 'needs-context' },
      { verdict: 'unverifiable' },
      { verdict: 'unverifiable' },
      { verdict: 'unverifiable' },
      { verdict: 'unverifiable' },
      { verdict: 'unverifiable' },
    ],
  }

  it('reports the correction, where the verdict and addressed both fall silent', () => {
    const live = liveVerdict(realShape)
    expect(live.verdict).toBe('minor-issues')
    expect(live.addressed).toBe(false)
    // The one signal that survives the other two going quiet.
    expect(live.correctedInaccurate).toBe(1)
  })

  it('does not count a contradicted claim nobody has acted on', () => {
    // Still outstanding: the major-issues branch covers it, and counting it
    // here would double-report the same claim.
    const live = liveVerdict({ claims: [{ verdict: 'inaccurate' }] })
    expect(live.correctedInaccurate).toBe(0)
    expect(live.verdict).toBe('major-issues')
  })

  it('does not count an applied revision to a lesser claim', () => {
    // Applying a revision to needs-context adds a qualifier; applying one to an
    // inaccurate claim replaces a sentence the evidence said was wrong.
    const live = liveVerdict({ claims: [{ verdict: 'needs-context', applied: true }] })
    expect(live.correctedInaccurate).toBe(0)
    expect(live.addressed).toBe(true)
  })

  it('counts every contradicted claim that was patched', () => {
    const live = liveVerdict({
      claims: [
        { verdict: 'inaccurate', applied: true },
        { verdict: 'inaccurate', applied: true },
        { verdict: 'needs-context' },
      ],
    })
    expect(live.correctedInaccurate).toBe(2)
  })

  it('is zero when there are no claims to reason about', () => {
    expect(liveVerdict({ overallVerdict: 'major-issues' }).correctedInaccurate).toBe(0)
  })
})
