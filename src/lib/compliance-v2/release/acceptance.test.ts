import { describe, expect, it } from 'vitest'
import { acceptanceSummary, evaluateAcceptance, releaseSamples } from './acceptance'

/**
 * §20's release acceptance criteria, run.
 *
 * Two things are asserted, and the second matters as much as the first: every
 * automated criterion passes, **and** the criteria that cannot be automated are
 * still reported rather than dropped. A checklist that quietly loses its
 * unverifiable items reads as complete when it is not, which is the failure this
 * whole tool is arranged against.
 */

const outcomes = evaluateAcceptance()

describe('§20 — automated criteria', () => {
  const automated = outcomes.filter((item) => item.kind === 'automated')

  it.each(automated.map((item) => [item.id, item.text, item] as const))(
    '§20.%i %s',
    (_id, _text, criterion) => {
      expect(criterion.failures, criterion.evidence).toEqual([])
      expect(criterion.passed).toBe(true)
    }
  )

  it('checks a real sample rather than an empty one', () => {
    expect(releaseSamples().length).toBeGreaterThan(40)
  })
})

describe('§20 — what is not automated', () => {
  /**
   * The exact list, asserted. If one of these becomes automatable it should be
   * moved deliberately, and if a new criterion quietly becomes manual this
   * fails.
   */
  it('is exactly criterion 14, and it is reported', () => {
    // Was [14, 16] until 2026-08-19. Criterion 16 was `blocked` on §22.1 and
    // §22.2 being open product decisions; the owner took both that day, so it
    // became automatable and was moved. That is the intended direction of
    // travel for this list — a criterion leaves it when the thing it was
    // waiting on exists, never because it got tidied.
    const unautomated = outcomes.filter((item) => item.kind !== 'automated')
    expect(unautomated.map((item) => item.id)).toEqual([14])
    for (const criterion of unautomated) {
      expect(criterion.passed, `${criterion.id} must not report as passing`).toBe(false)
      expect(criterion.evidence.length).toBeGreaterThan(80)
    }
  })

  it('has nothing left blocked', () => {
    expect(outcomes.filter((item) => item.kind === 'blocked')).toEqual([])
  })

  it('16 now checks the recorded decisions rather than waiting on them', () => {
    const criterion = outcomes.find((item) => item.id === 16)
    expect(criterion?.kind).toBe('automated')
    expect(criterion?.passed).toBe(true)
    // The evidence must still name the periods, because the criterion is about
    // what the tool keeps — "enforced" with no figures is not evidence.
    expect(criterion?.evidence).toMatch(/30 days/)
    expect(criterion?.evidence).toMatch(/two years/)
    expect(criterion?.evidence).toMatch(/24 hours/)
    expect(criterion?.evidence).toMatch(/§22\.1/)
  })
})

describe('the summary', () => {
  it('reports all eighteen criteria, and never claims release readiness', () => {
    const summary = acceptanceSummary(outcomes)
    expect(summary.outcomes).toHaveLength(18)
    expect(summary.outcomes.map((item) => item.id)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 1)
    )
    expect(summary.automatedTotal).toBe(17)
    expect(summary.automatedPassing).toBe(17)
    expect(summary.manual).toBe(1)
    expect(summary.blocked).toBe(0)

    // The field is named for what it means. `automatedClean` is not "ready".
    expect(summary.automatedClean).toBe(true)
    expect(Object.keys(summary)).not.toContain('ready')
  })
})
