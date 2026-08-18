import { describe, expect, it } from 'vitest'
import { classify, hasStatutoryRoute } from './classify'
import { evaluateArticle50, routesOwedBy } from './article-50'
import { evaluateAnnexIII, evaluateArticle6Exemption } from './annex-routes'
import { evaluateArticle5 } from './article-5'
import { GOLDEN_SCENARIOS, scenario } from '../test-fixtures/golden-scenarios'
import { validateAnswers } from '../validation/answers'

/**
 * Phase 3: the classification routes.
 *
 * Three of the six documented v1 defects are fixed here, and each has a test
 * naming it. The Phase 3 exit criteria have their own block at the end.
 */

describe('Annex III routes', () => {
  /**
   * v1 defect 3. Ticking "healthcare" made a scheduling tool high-risk, and the
   * anchor it produced — "Article 6(2) and (3)" — named the mechanism because
   * there was no point to name. Now the sector opens a branch and the branch
   * asks what the system actually does.
   */
  it('a sector alone does not create high-risk status', () => {
    const result = classify(scenario('medicalAdminMicro'))
    expect(result.classification).toBe('no_specific_category_identified')
    expect(result.statutoryRoutes).toEqual([])
  })

  it('the listed use in the same sector does', () => {
    const result = classify(scenario('publicBenefitsEligibility'))
    expect(result.classification).toBe('likely_high_risk')
    expect(result.statutoryRoutes).toContain('Annex III, point 5(a)')
  })

  it('names the exact point rather than the area', () => {
    const { routes } = evaluateAnnexIII(scenario('hrScreeningProfiling'))
    expect(routes.map((route) => route.citation)).toEqual(['Annex III, point 4(a)'])
    expect(routes[0].provision).toBe('Article 6(2)')
  })

  it('returns cannot_determine rather than a default when the exact use is unknown', () => {
    const answers = {
      ...scenario('hrScreeningProfiling'),
      annex_iii_employment_use: {
        questionId: 'annex_iii_employment_use',
        state: 'unknown' as const,
        value: null,
        source: 'manual' as const,
      },
    }
    const evaluation = evaluateAnnexIII(answers)
    expect(evaluation.applicability).toBe('cannot_determine')
    expect(evaluation.routes).toEqual([])
  })
})

describe('Article 6(3)', () => {
  it('is foreclosed where the system profiles natural persons', () => {
    const answers = scenario('hrScreeningProfiling')
    const exemption = evaluateArticle6Exemption(answers, evaluateAnnexIII(answers))
    expect(exemption.outcome).toBe('foreclosed_by_profiling')

    const result = classify(answers)
    expect(result.classification).toBe('likely_high_risk')
    expect(result.confidence).toBe('high')
    expect(result.statutoryRoutes).toContain('Article 6(3)')
  })

  it('lifts the classification where both halves are met', () => {
    const result = classify(scenario('hrNarrowTaskExemption'))
    expect(result.classification).toBe('no_specific_category_identified')
    // The route it derogates from is still cited — a reader needs both halves
    // to check the reasoning.
    expect(result.statutoryRoutes).toContain('Annex III, point 4(a)')
    expect(result.statutoryRoutes).toContain('Article 6(3)')
  })

  /** Cumulative, not alternative: a narrow task alone does not lift it. */
  it('does not lift it on a narrow-task condition alone', () => {
    const answers = {
      ...scenario('hrNarrowTaskExemption'),
      no_significant_risk_of_harm: {
        questionId: 'no_significant_risk_of_harm',
        state: 'answered' as const,
        value: 'no',
        source: 'manual' as const,
      },
    }
    const exemption = evaluateArticle6Exemption(answers, evaluateAnnexIII(answers))
    expect(exemption.outcome).toBe('not_available')
    expect(classify(answers).classification).toBe('likely_high_risk')
  })

  it('holds the tier open where profiling is unresolved', () => {
    const result = classify(scenario('hrProfilingUnresolved'))
    expect(result.classification).toBe('possible_high_risk')
    expect(result.confidence).toBe('low')
    expect(result.missingAnswerIds).toContain('performs_profiling')
  })
})

describe('Annex I', () => {
  it('fires only where both limbs are met', () => {
    expect(classify(scenario('regulatedProductBothLimbs')).classification).toBe('likely_high_risk')
    expect(classify(scenario('regulatedProductBothLimbs')).statutoryRoutes).toContain(
      'Annex I, via Article 6(1)'
    )
  })

  it('is possible, not settled, on one limb alone', () => {
    const result = classify(scenario('regulatedProductOneLimb'))
    expect(result.classification).toBe('possible_high_risk')
    expect(result.missingAnswerIds).toContain('annex_i_route')
  })
})

describe('Article 50', () => {
  /**
   * §7.7's rule. v1 emitted one flat Article 50 duty for everyone, which told a
   * deployer they owed a design duty they cannot discharge.
   */
  it('keeps the 50(1) design duty on the provider, not the deployer', () => {
    const answers = scenario('chatbotNotObvious')
    const routes = evaluateArticle50(answers)
    const interaction = routes.find((route) => route.id === 'art-50-1-interaction')

    expect(interaction?.owedBy).toBe('provider')
    expect(interaction?.applicability).toBe('applies')

    const { owed, supplierSide } = routesOwedBy(routes, ['deployer'])
    expect(owed).toEqual([])
    expect(supplierSide.map((route) => route.id)).toContain('art-50-1-interaction')
  })

  it('classifies a transparency-only system as such', () => {
    const result = classify(scenario('chatbotNotObvious'))
    expect(result.classification).toBe('specific_transparency_duties')
    expect(result.statutoryRoutes).toContain('Article 50(1)')
  })

  /**
   * v1 defect 6. Article 50(4)'s second subparagraph does not require disclosure
   * where the text has been through human review and someone holds editorial
   * responsibility. v1 modelled no exception at all.
   */
  it('applies the editorial-responsibility exception', () => {
    const routes = evaluateArticle50(scenario('reviewedPublicInterestText'))
    const text = routes.find((route) => route.id === 'art-50-4-public-interest-text')
    expect(text?.applicability).toBe('does_not_apply')
    expect(text?.exception).toMatch(/editorial responsibility/)
  })

  it('and keeps the duty where editorial responsibility is absent', () => {
    const routes = evaluateArticle50(scenario('unreviewedPublicInterestText'))
    const text = routes.find((route) => route.id === 'art-50-4-public-interest-text')
    expect(text?.applicability).toBe('applies')
    expect(text?.owedBy).toBe('deployer')
    expect(text?.explanation).toMatch(/Human review alone does not lift it/)
  })
})

describe('Article 5', () => {
  /** §7.6: the output stays "potentially prohibited" until the path is complete. */
  it('never concludes prohibited outright', () => {
    const answers = scenario('prohibitedScreenPositive')
    const article5 = evaluateArticle5(answers)
    expect(article5.engaged).toHaveLength(1)
    expect(article5.engaged[0].unresolved.length).toBeGreaterThan(0)

    const result = classify(answers)
    expect(result.classification).toBe('potentially_prohibited')
    expect(result.confidence).toBe('low')
    expect(result.explanation).toMatch(/potentially prohibited/)
  })

  it('takes the headline over every other route', () => {
    const answers = {
      ...scenario('hrScreeningProfiling'),
      prohibited_screen: {
        questionId: 'prohibited_screen',
        state: 'answered' as const,
        value: ['art5_f'],
        source: 'manual' as const,
      },
    }
    expect(classify(answers).classification).toBe('potentially_prohibited')
  })

  it('a cleared screen is a real answer, not an absence', () => {
    const article5 = evaluateArticle5(scenario('medicalAdminMicro'))
    expect(article5.engaged).toEqual([])
    expect(article5.uncertain).toBe(false)
    expect(article5.triggeringAnswerIds).toContain('prohibited_screen')
  })
})

describe('scope suppression', () => {
  it('an out-of-scope result carries no classification route at all', () => {
    const result = classify(scenario('outOfScope'))
    expect(result.classification).toBe('out_of_scope')
    expect(result.statutoryRoutes).toEqual([])
  })
})

describe('Phase 3 exit criteria', () => {
  /** 1. Every high-risk outcome contains a statutory route. */
  it('no high-risk outcome exists without a route to cite', () => {
    for (const item of GOLDEN_SCENARIOS) {
      const result = classify(item.answers)
      expect(hasStatutoryRoute(result), `${item.id}: ${result.classification} with no route`).toBe(
        true
      )
    }
  })

  /**
   * 2. Sector selection alone cannot create high-risk status — and this is the
   * defect that made v1's result untrustworthy, so it is asserted across every
   * area rather than on one example.
   */
  it('every Annex III area returns no route when its listed uses are declined', () => {
    const areas: Array<[string, string]> = [
      ['biometrics', 'annex_iii_biometrics_use'],
      ['education', 'annex_iii_education_use'],
      ['employment', 'annex_iii_employment_use'],
      ['essential_services', 'annex_iii_essential_services_use'],
      ['credit_insurance', 'annex_iii_credit_insurance_use'],
      ['law_enforcement', 'annex_iii_law_enforcement_use'],
      ['migration_border', 'annex_iii_migration_use'],
      ['justice_democracy', 'annex_iii_justice_use'],
    ]

    for (const [family, questionId] of areas) {
      const answers = {
        ...scenario('medicalAdminMicro'),
        intended_use_family: {
          questionId: 'intended_use_family',
          state: 'answered' as const,
          value: family,
          source: 'manual' as const,
        },
        annex_iii_essential_services_use: undefined as never,
        [questionId]: {
          questionId,
          state: 'answered' as const,
          value: ['none_of_these'],
          source: 'manual' as const,
        },
      }
      delete (answers as Record<string, unknown>).annex_iii_essential_services_use

      const result = classify(answers)
      expect(result.classification, family).not.toBe('likely_high_risk')
      expect(evaluateAnnexIII(answers).routes, family).toEqual([])
    }
  })

  /** 3. Provider and deployer transparency duties remain distinct. */
  it('a provider duty is never handed to a deployer', () => {
    const routes = evaluateArticle50(scenario('unreviewedPublicInterestText'))
    const { owed } = routesOwedBy(routes, ['deployer'])
    expect(owed.length).toBeGreaterThan(0)
    for (const route of owed) {
      expect(route.owedBy, route.id).toBe('deployer')
    }
  })

  /** 4. The known regression scenarios pass — v1 defects 2, 3 and 6. */
  it('v1 defect 2: operational impact without a route is not high-risk', () => {
    const result = classify(scenario('highImpactNoRoute'))
    expect(result.classification).toBe('no_specific_category_identified')
    expect(result.statutoryRoutes).toEqual([])
  })

  it('every golden scenario is still a valid record', () => {
    for (const item of GOLDEN_SCENARIOS) {
      expect(validateAnswers(item.answers).errors, item.id).toEqual([])
    }
  })

  /** §9.5, and the thing v1 had no notion of: confidence from completeness. */
  it('an unresolved classification-decisive answer keeps confidence off high', () => {
    expect(classify(scenario('hrProfilingUnresolved')).confidence).not.toBe('high')
  })
})
