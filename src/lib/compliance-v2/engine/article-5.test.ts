import { describe, expect, it } from 'vitest'
import { RULE_PACK } from '@/lib/rulepack'
import { article5Engaged, article5EngagedNow, evaluateArticle5 } from './article-5'
import { classify } from './classify'
import { evaluateAssessmentV2 } from './assemble'
import { QUESTION_BY_ID, visibleQuestions } from '../questions'
import { ARTICLE_5_CONDITION_QUESTIONS } from '../questions/article-5-conditions'
import { LEGAL_PROPOSITIONS } from '../legal-content/propositions'
import { GOLDEN_SCENARIOS, answered, record, scenario, unknown } from '../test-fixtures/golden-scenarios'

/**
 * §7.6 — the per-practice condition trees.
 *
 * The three outcomes are the three describe blocks. What matters most is the
 * middle one: before these trees existed, a flagged practice could never be
 * cleared, and an emotion-inference system used for a medical reason — a case
 * Article 5(1)(f) excepts in its own words — carried the gravest result this
 * tool can give, permanently.
 */

const ASSESSED_AT = '2026-08-19'
const evaluate = (id: string) => evaluateArticle5(scenario(id))

describe('a limb failing clears the practice', () => {
  it('emotion inference outside a workplace or school is not Article 5(1)(f)', () => {
    const result = evaluate('article5EmotionOutsideWorkplace')
    expect(result.engaged).toEqual([])
    expect(result.cleared).toHaveLength(1)
    expect(result.cleared[0].point).toBe('f')
    expect(result.cleared[0].clearedBecause).toMatch(/neither in the workplace nor in an education institution/)
  })

  it('a deceptive technique that causes no significant harm is not Article 5(1)(a)', () => {
    const result = evaluate('article5ManipulationNoHarm')
    expect(result.engaged).toEqual([])
    expect(result.cleared[0].clearedBecause).toMatch(/not reasonably likely to cause, significant harm/)
  })

  it('and the classification comes back off the prohibition entirely', () => {
    const result = classify(scenario('article5ManipulationNoHarm'))
    expect(result.classification).not.toBe('potentially_prohibited')
    expect(result.explanation).not.toMatch(/potentially prohibited/)
  })
})

describe('an exception the provision states clears it too', () => {
  it('Article 5(1)(f): intended for medical or safety reasons', () => {
    const result = evaluate('article5EmotionMedicalException')
    expect(result.engaged).toEqual([])
    expect(result.cleared[0].clearedBecause).toMatch(/medical or safety reasons/)
    expect(result.explanation).toMatch(/it is not engaged|none of them is engaged/)
  })

  it('Article 5(1)(d): supporting a human assessment on objective facts', () => {
    const result = evaluate('article5PredictivePolicingException')
    expect(result.engaged).toEqual([])
    expect(result.cleared[0].clearedBecause).toMatch(/objective and verifiable facts/)
  })

  it('Article 5(1)(g): labelling a lawfully acquired dataset, or law enforcement', () => {
    const result = evaluate('article5BiometricCategorisationCarveout')
    expect(result.engaged).toEqual([])
    expect(result.cleared[0].clearedBecause).toMatch(/lawfully acquired biometric dataset/)
  })

  it('Article 5(1a)(b): a deployer who does not use the system for that purpose', () => {
    const result = evaluate('article5DeepfakeDeployerNotUsing')
    expect(result.engaged).toEqual([])
    expect(result.cleared[0].point).toBe('ba')
  })

  /**
   * Article 5(1)(h) inverts: the exception is a conjunction of an objective and
   * three safeguards, so anything short of the whole of it leaves the
   * prohibition engaged. This is the case a looser reading gets wrong.
   */
  it('Article 5(1)(h): the objective alone does not clear it', () => {
    const partial = evaluate('article5RealTimeBiometricPartialSafeguards')
    expect(partial.engaged).toHaveLength(1)
    expect(partial.engaged[0].outcome).toBe('all_limbs_met')

    const authorised = evaluate('article5RealTimeBiometricAuthorised')
    expect(authorised.engaged).toEqual([])
    expect(authorised.cleared[0].clearedBecause).toMatch(/prior authorisation/)
  })

  it('and no listed objective closes the exception without reading the paperwork', () => {
    const result = evaluate('article5RealTimeBiometricEngaged')
    expect(result.engaged).toHaveLength(1)
    expect(result.engaged[0].missingAnswerIds).toEqual([])
  })
})

describe('a complete path says so, and still says "potentially"', () => {
  it('names every limb it established', () => {
    const result = evaluate('article5ManipulationAllLimbsMet')
    expect(result.engaged).toHaveLength(1)
    expect(result.engaged[0].outcome).toBe('all_limbs_met')
    expect(result.engaged[0].satisfied).toHaveLength(4)
    expect(result.engaged[0].unresolved).toEqual([])
  })

  /** §7.6's user-facing rule, on the path where it is most tempting to break. */
  it('does not conclude "prohibited", even with every limb met', () => {
    const result = classify(scenario('article5ManipulationAllLimbsMet'))
    expect(result.classification).toBe('potentially_prohibited')
    expect(result.explanation).toMatch(/potentially prohibited/)
  })

  it('raises confidence to medium, never high', () => {
    const complete = evaluateAssessmentV2(scenario('article5ManipulationAllLimbsMet'), ASSESSED_AT)
    const finding = complete.legalFindings.find((item) => item.id === 'article-5-a')
    expect(finding?.confidence).toBe('medium')
    expect(finding?.applicability).toBe('likely_applies')

    const partial = evaluateAssessmentV2(scenario('prohibitedScreenPositive'), ASSESSED_AT)
    expect(partial.legalFindings.find((item) => item.id === 'article-5-f')?.confidence).toBe('low')
  })

  /** A prohibition is never an obligation: there is nothing that discharges it. */
  it('is never typed as a duty on either path', () => {
    for (const id of ['article5ManipulationAllLimbsMet', 'prohibitedScreenPositive']) {
      const result = evaluateAssessmentV2(scenario(id), ASSESSED_AT)
      for (const finding of result.legalFindings.filter((item) => item.ruleId === 'article-5-conditions')) {
        expect(finding.kind, `${id}/${finding.id}`).not.toBe('current_obligation')
        expect(finding.kind, `${id}/${finding.id}`).not.toBe('future_obligation')
      }
    }
  })
})

describe('an unknown limb never clears anything', () => {
  /** §4.6 and defect 5: "not sure" is not "no". */
  it('leaves the practice unresolved and names the limb', () => {
    const result = evaluate('article5ManipulationHarmUnknown')
    expect(result.engaged).toHaveLength(1)
    expect(result.engaged[0].outcome).toBe('unresolved')
    expect(result.engaged[0].unresolved).toHaveLength(1)
    expect(result.engaged[0].missingAnswerIds).toEqual(['art5_ab_significant_harm'])
    expect(result.cleared).toEqual([])
  })

  it('an untouched tree is unresolved, not cleared', () => {
    const result = evaluate('prohibitedScreenPositive')
    expect(result.engaged).toHaveLength(1)
    expect(result.engaged[0].outcome).toBe('unresolved')
    expect(result.engaged[0].satisfied).toEqual([])
  })

  it('an unknown screen is still an unresolved screen', () => {
    const result = evaluateArticle5(
      record(unknown('prohibited_screen'))
    )
    expect(result.uncertain).toBe(true)
    expect(result.engaged).toEqual([])
    expect(result.cleared).toEqual([])
  })
})

describe('the whole evaluation', () => {
  it('reports a cleared practice and an engaged one side by side', () => {
    const result = evaluate('article5TwoPracticesMixedOutcome')
    expect(result.engaged.map((item) => item.point)).toEqual(['e'])
    expect(result.cleared.map((item) => item.point)).toEqual(['f'])
    expect(article5Engaged(result)).toBe(true)
    expect(article5EngagedNow(result)).toBe(true)
  })

  it('a cleared practice is shown to the reader, not silently dropped', () => {
    const result = evaluateAssessmentV2(scenario('article5EmotionMedicalException'), ASSESSED_AT)
    const cleared = result.legalFindings.find((item) => item.id === 'article-5-cleared-f')
    expect(cleared).toBeDefined()
    expect(cleared?.kind).toBe('recommended_safeguard')
    expect(cleared?.whyItApplies).toMatch(/medical or safety reasons/)
    expect(cleared?.action).toMatch(/re-run this assessment/)
  })

  it('a cleared-only screen produces no prohibition headline', () => {
    const result = evaluateAssessmentV2(scenario('article5EmotionMedicalException'), ASSESSED_AT)
    expect(result.classification).not.toBe('potentially_prohibited')
    expect(result.statutoryRoutes.every((route) => !route.startsWith('Article 5'))).toBe(true)
  })

  it('a cleared screen with nothing ticked is unchanged', () => {
    const result = evaluate('medicalAdminMicro')
    expect(result.engaged).toEqual([])
    expect(result.cleared).toEqual([])
    expect(result.uncertain).toBe(false)
  })
})

describe('the questions behind the trees', () => {
  /** Every practice in the pinned pack has a tree, or the screen lies. */
  it('every prohibited practice in the pack has at least one condition question', () => {
    for (const practice of RULE_PACK.prohibitedPractices) {
      const asked = ARTICLE_5_CONDITION_QUESTIONS.filter((question) =>
        JSON.stringify(question.visibleWhen).includes(`art5_${practice.point}`)
      )
      expect(asked.length, `no condition question for Article 5(1)(${practice.point})`).toBeGreaterThan(0)
    }
  })

  it('every one of them is classification-decisive and offers "not sure"', () => {
    for (const question of ARTICLE_5_CONDITION_QUESTIONS) {
      expect(question.importance, question.id).toBe('classification_decisive')
      expect(question.allowUnknown, question.id).toBe(true)
      expect(question.section, question.id).toBe('Prohibited practices')
    }
  })

  /** They open only for the practice they belong to. */
  it('a reader who ticks one practice is asked only about that practice', () => {
    const asked = visibleQuestions(scenario('article5EmotionMedicalException'))
      .map((question) => question.id)
      .filter((id) => id.startsWith('art5_'))
    expect(asked).toEqual(['art5_f_context', 'art5_f_medical_safety'])
  })

  it('a cleared screen is asked none of them', () => {
    const asked = visibleQuestions(scenario('medicalAdminMicro')).map((question) => question.id)
    expect(asked.some((id) => id.startsWith('art5_') || id === 'technical_safety_measures')).toBe(false)
  })

  /**
   * The safeguards question is the second half of Article 5(1a)(a)(ii) and is a
   * non-sequitur on its own, so it is asked only where that route is live.
   */
  it('the safeguards question opens only behind the foreseeable-output route', () => {
    const gate = QUESTION_BY_ID.get('technical_safety_measures')
    expect(gate?.visibleWhen).toEqual({ questionId: 'art5_babb_foreseeable_output', equals: 'yes' })

    const asked = visibleQuestions(scenario('article5DeepfakeNoSafeguards')).map((q) => q.id)
    expect(asked).toContain('technical_safety_measures')
    expect(visibleQuestions(scenario('article5DeepfakeDeployerNotUsing')).map((q) => q.id)).not.toContain(
      'technical_safety_measures'
    )
  })

  /** The generic law-enforcement question is gone; nothing should still ask for it. */
  it('no question or scenario still references the retired generic authorisation question', () => {
    expect(QUESTION_BY_ID.has('law_enforcement_authorisation')).toBe(false)
    for (const item of GOLDEN_SCENARIOS) {
      expect(Object.keys(item.answers), item.id).not.toContain('law_enforcement_authorisation')
    }
  })
})

describe('the legal content behind the cards', () => {
  it('every practice in the pack has a corpus-verified proposition', () => {
    for (const practice of RULE_PACK.prohibitedPractices) {
      const proposition = LEGAL_PROPOSITIONS.find(
        (item) => item.id === `prop-art-5-1-${practice.point}`
      )
      expect(proposition, `no proposition for Article 5(1)(${practice.point})`).toBeDefined()
      expect(proposition?.corpusArticle).toBe('5')
      expect(proposition?.conditions.length).toBeGreaterThan(1)
      expect(proposition?.reviewStatus).toBe('internal')
    }
  })

  /**
   * Article 5 reaches placing on the market, putting into service *and* use, so
   * it binds every role. A narrower list would make `verifyReport` strip the
   * finding from an importer's report.
   */
  it('binds every role, so no reader loses the finding to a role check', () => {
    for (const proposition of LEGAL_PROPOSITIONS.filter((item) => item.ruleId === 'article-5-conditions')) {
      expect(proposition.applicableRoles.length, proposition.id).toBe(6)
    }
  })

  it('the card quotes the provision it is about', () => {
    const result = evaluateAssessmentV2(scenario('article5ManipulationAllLimbsMet'), ASSESSED_AT)
    const finding = result.legalFindings.find((item) => item.id === 'article-5-a')
    expect(finding?.source?.provision).toBe('Article 5(1)(a)')
    expect(finding?.source?.shortExtract).toMatch(/subliminal techniques/)
  })
})
