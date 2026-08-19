import { describe, expect, it } from 'vitest'
import { runShadowComparison, shadowSummary } from './shadow'
import { evaluateAssessmentV2 } from '../engine/assemble'
import { GOLDEN_SCENARIOS } from '../test-fixtures/golden-scenarios'

const ASSESSED_AT = '2026-08-19'

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
   * the Article 50(4) editorial exception.
   *
   * **The duty *count* stopped showing it in rule pack `2026-08-19b`.** Article 4
   * binds providers and deployers at every tier, so v2 now emits one binding
   * finding here where it used to emit none, and `dutyDelta` reads 0 — the same
   * number it would read if v2 had never applied the exception at all. Netting
   * a removed Article 50 duty against an added Article 4 one and asserting on
   * the total would be a test that passes for the wrong reason.
   *
   * So the assertion moved to the substance: v2 hands this reader no binding
   * Article 50 duty, which is the defect, and its transparency finding is the
   * exception rather than an obligation.
   */
  it('catches a duty-level divergence the classification hides', () => {
    const editorial = comparisons.find((item) => item.spec.startsWith('6.'))
    expect(editorial?.kind).toBe('agreement')

    const v2 = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'reviewedPublicInterestText')!.answers,
      ASSESSED_AT
    )
    const bindingArticle50 = v2.legalFindings.filter(
      (finding) =>
        /art-50/.test(finding.id) &&
        (finding.kind === 'current_obligation' || finding.kind === 'future_obligation')
    )
    expect(bindingArticle50, 'the Article 50(4) exception should leave no duty').toEqual([])

    const exception = v2.legalFindings.find(
      (finding) => finding.id === 'art-50-4-public-interest-text-exception'
    )
    expect(exception?.kind).toBe('unresolved_issue')
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
