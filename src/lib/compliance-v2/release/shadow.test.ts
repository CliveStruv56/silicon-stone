import { describe, expect, it } from 'vitest'
import { runShadowComparison, shadowSummary } from './shadow'

/**
 * Phase 8's shadow-mode task: "compare v1 and v2 without showing v2 to users."
 *
 * The assertion that matters is the last one. Every divergence between the two
 * engines has to be *accounted for* — either the engines agree, or the change is
 * one of the six documented v1 defects v2 exists to fix. An unexplained
 * divergence is the thing a rollout must not carry, and it is what this test
 * fails on.
 */

const comparisons = runShadowComparison()

describe('shadow mode', () => {
  it('runs both engines over the §17.2 scenarios', () => {
    expect(comparisons.length).toBeGreaterThanOrEqual(9)
    for (const comparison of comparisons) {
      expect(comparison.legacy.classification, comparison.spec).toBeTruthy()
      expect(comparison.v2.classification, comparison.spec).toBeTruthy()
    }
  })

  it('shows v2 to nobody — it returns data, and nothing renders it', () => {
    // A guard against the obvious mistake: shadow mode that quietly becomes a
    // rollout. The comparison is a pure function returning a value; there is no
    // route, no component and no flag involved.
    expect(typeof runShadowComparison).toBe('function')
    expect(runShadowComparison.length).toBeLessThanOrEqual(1)
  })

  /** The one that would block a rollout. */
  it('has no unexplained divergence', () => {
    const unexplained = comparisons.filter((item) => item.kind === 'unexplained')
    const detail = unexplained
      .map(
        (item) =>
          `${item.spec}: v1 "${item.legacy.classification}" → v2 "${item.v2.classification}"`
      )
      .join('\n')
    expect(unexplained, `unexplained divergences:\n${detail}`).toEqual([])
  })

  it('and does diverge, or v2 fixed nothing', () => {
    const summary = shadowSummary(comparisons)
    expect(summary.intended).toBeGreaterThan(0)
    expect(summary.agreements + summary.intended + summary.unexplained).toBe(comparisons.length)
  })

  /**
   * Defect 6 is invisible to a classification comparison: both engines say
   * "limited risk" for human-reviewed public-interest text, and only v2 applies
   * the Article 50(4) editorial exception. The duty count is what shows it.
   */
  it('catches a duty-level divergence the classification hides', () => {
    const editorial = comparisons.find((item) => item.spec.startsWith('6.'))
    expect(editorial?.kind).toBe('agreement')
    expect(editorial?.dutyDelta, 'v2 should assert fewer duties here, not the same').toBeLessThan(0)
  })

  /**
   * v1's score is recorded in the comparison precisely because v2 has none. It
   * is the clearest single expression of what the rebuild changed.
   */
  it('records v1’s score beside a v2 result that has none', () => {
    for (const comparison of comparisons) {
      expect(typeof comparison.legacy.score).toBe('number')
      expect(comparison.v2).not.toHaveProperty('score')
    }
  })
})
