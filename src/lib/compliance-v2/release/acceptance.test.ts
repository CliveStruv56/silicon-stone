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
  it('is exactly criteria 14 and 16, and both are reported', () => {
    const unautomated = outcomes.filter((item) => item.kind !== 'automated')
    expect(unautomated.map((item) => item.id)).toEqual([14, 16])
    for (const criterion of unautomated) {
      expect(criterion.passed, `${criterion.id} must not report as passing`).toBe(false)
      expect(criterion.evidence.length).toBeGreaterThan(80)
    }
  })

  it('16 is blocked rather than merely unchecked, and says on what', () => {
    const criterion = outcomes.find((item) => item.id === 16)
    expect(criterion?.kind).toBe('blocked')
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
    expect(summary.automatedTotal).toBe(16)
    expect(summary.automatedPassing).toBe(16)
    expect(summary.manual).toBe(1)
    expect(summary.blocked).toBe(1)

    // The field is named for what it means. `automatedClean` is not "ready".
    expect(summary.automatedClean).toBe(true)
    expect(Object.keys(summary)).not.toContain('ready')
  })
})
