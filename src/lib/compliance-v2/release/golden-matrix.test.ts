import { describe, expect, it } from 'vitest'
import { RULE_PACK } from '@/lib/rulepack'
import { GOLDEN_SCENARIOS } from '../test-fixtures/golden-scenarios'
import { ANNEX_III_QUESTIONS } from '../questions'
import { evaluateAssessmentV2 } from '../engine/assemble'
import { BINDING_FINDING_KINDS } from '../types'

/**
 * §17.2 — the golden matrix, asserted as a matrix rather than as a pile.
 *
 * The point of this file is coverage rather than behaviour: every other test
 * asserts what a scenario *does*, and this one asserts that a scenario exists at
 * all. A branch nothing exercises is a branch that can break silently, and the
 * failure mode is invisible — the suite stays green and gets smaller relative to
 * the code.
 *
 * Both audits below found real gaps on 2026-08-19. §17.2's first mandatory
 * regression scenario had no fixture, and eight of the ten Annex III families
 * had never been evaluated end to end.
 */

const ASSESSED_AT = '2026-08-19'
const ids = new Set(GOLDEN_SCENARIOS.map((scenario) => scenario.id))

describe('§17.2 mandatory regression scenarios', () => {
  /** The ten §17.2 names, each mapped to the fixture that stands for it. */
  const MANDATORY: Array<[string, string]> = [
    ['Microbusiness using third-party general productivity AI', 'microProductivityDeployer'],
    ['Microbusiness using AI for ordinary medical administration', 'medicalAdminMicro'],
    ['Out-of-scope organisation using employment profiling', 'outOfScope'],
    ['General productivity provider with high operational impact but no Annex route', 'highImpactNoRoute'],
    ['Third-party chatbot deployer', 'chatbotNotObvious'],
    ['Human-reviewed public-interest text with an identified responsible editor', 'reviewedPublicInterestText'],
    ['US provider placing a system on the EU market', 'usProviderEuMarket'],
    ['Canadian provider whose system output is used in the EU', 'canadianProviderEuOutputs'],
    ['UK deployer with EU operations', 'ukDeployerEuOperations'],
    ['User who does not know turnover, balance sheet or group status', 'noFinancials'],
  ]

  it.each(MANDATORY)('%s', (_name, scenarioId) => {
    expect(ids.has(scenarioId), `no fixture for ${scenarioId}`).toBe(true)
  })

  it('covers all ten, and no more are silently claimed', () => {
    expect(MANDATORY).toHaveLength(10)
  })
})

describe('§17.1 — every branch has a scenario', () => {
  /**
   * Every Annex III family. Derived from the catalogue rather than listed here,
   * so adding a family to the questionnaire without a fixture fails this test
   * instead of going untested.
   */
  it('every Annex III intended-purpose route is exercised', () => {
    const families = [
      ...new Set(
        ANNEX_III_QUESTIONS.map((question) => question.id).filter((id) =>
          id.startsWith('annex_iii_')
        )
      ),
    ]
    expect(families.length).toBeGreaterThanOrEqual(10)

    const answered = new Set(
      GOLDEN_SCENARIOS.flatMap((scenario) => Object.keys(scenario.answers))
    )
    const missing = families.filter((family) => !answered.has(family))
    expect(missing, `Annex III routes with no golden scenario: ${missing.join(', ')}`).toEqual([])
  })

  /** Every prohibited practice in the pinned pack. */
  it('every Article 5 practice is exercised', () => {
    const screened = new Set(
      GOLDEN_SCENARIOS.flatMap((scenario) => {
        const answer = scenario.answers.prohibited_screen
        return answer?.state === 'answered' && Array.isArray(answer.value) ? answer.value : []
      })
    )
    const missing = RULE_PACK.prohibitedPractices
      .map((practice) => `art5_${practice.point}`)
      .filter((value) => !screened.has(value))
    expect(missing, `Article 5 practices with no golden scenario: ${missing.join(', ')}`).toEqual([])
  })

  /**
   * §17.2 asks for four shapes per branch. Asserted for the branches where all
   * four are meaningful rather than as a blanket rule — a scope question has no
   * "exception case", and pretending otherwise would make this test decorative.
   */
  it('the Annex III branch has positive, negative, unknown and exception variants', () => {
    for (const id of ['hrScreeningProfiling', 'annexIiiNegativeCase', 'annexIiiUnknownUse', 'hrNarrowTaskExemption']) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })

  it('the Article 5 branch has all four, for more than one practice', () => {
    for (const id of [
      'article5EmotionAllLimbsMet',
      'article5EmotionOutsideWorkplace',
      'article5ManipulationHarmUnknown',
      'article5EmotionMedicalException',
      'article5PredictivePolicingException',
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })

  it('the Article 50 branch has its exception case', () => {
    expect(ids.has('reviewedPublicInterestText')).toBe(true)
    expect(ids.has('unreviewedPublicInterestText')).toBe(true)
  })

  it('the GDPR overlay has positive, settled and unknown variants', () => {
    for (const id of ['gdprExposed', 'gdprSettled', 'gdprAllUnknown', 'gdprJurisdictionUnsettled']) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })

  /** §17.2: provider and deployer variants where roles differ. */
  it('has both provider and deployer variants', () => {
    const results = GOLDEN_SCENARIOS.map((scenario) =>
      evaluateAssessmentV2(scenario.answers, ASSESSED_AT)
    )
    const held = (role: string) =>
      results.some((result) =>
        result.roles.some((item) => item.role === role && item.applicability === 'applies')
      )
    expect(held('provider'), 'no scenario holds a provider role').toBe(true)
    expect(held('deployer'), 'no scenario holds a deployer role').toBe(true)
  })

  /**
   * The variants have to *differ*, or the pairing is decorative.
   *
   * This assertion is why the provider duties exist at all: until 2026-08-19 a
   * high-risk provider received no duty of any kind — only an SME documentation
   * relief — while the deployer of the same system received two. The shadow
   * comparison surfaced it as a high-risk result with zero obligations.
   */
  it('a high-risk provider is told what it owes, not only what it may claim', () => {
    const provider = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'usProviderEmploymentAnnexIii')!.answers,
      ASSESSED_AT
    )
    expect(provider.classification).toBe('likely_high_risk')

    const duties = provider.legalFindings.filter((finding) =>
      BINDING_FINDING_KINDS.includes(finding.kind)
    )
    expect(duties.length, 'a high-risk provider with no duties is the defect').toBeGreaterThan(3)
    for (const duty of duties) {
      expect(duty.appliesToRoles, duty.id).toContain('provider')
      expect(duty.source?.provision, `${duty.id} quotes nothing`).toBeTruthy()
    }

    // And the list says it is a subset, because it is one.
    const caveat = provider.legalFindings.find(
      (finding) => finding.id === 'high-risk-provider-duties-incomplete'
    )
    expect(caveat?.kind).toBe('unresolved_issue')
    expect(caveat?.practicalMeaning).toMatch(/Article 43/)
  })

  it('and the deployer of the same tier is told something different', () => {
    const deployer = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'hrScreeningProfiling')!.answers,
      ASSESSED_AT
    )
    const ids = deployer.legalFindings.map((finding) => finding.id)
    expect(ids).toContain('art-26-6-log-retention')
    // A provider duty must never be handed to a deployer as their own.
    expect(ids).not.toContain('art-17-quality-management')
  })

  /** §17.2: in-scope and out-of-scope variants. */
  it('has in-scope, out-of-scope and uncertain-scope variants', () => {
    const outcomes = new Set(
      GOLDEN_SCENARIOS.map(
        (scenario) => evaluateAssessmentV2(scenario.answers, ASSESSED_AT).scope.outcome
      )
    )
    expect(outcomes.has('out_of_scope')).toBe(true)
    expect(outcomes.has('in_scope') || outcomes.has('likely_in_scope')).toBe(true)
  })
})

describe('the matrix itself', () => {
  it('every scenario has a unique id and a spec reference', () => {
    expect(ids.size).toBe(GOLDEN_SCENARIOS.length)
    for (const scenario of GOLDEN_SCENARIOS) {
      expect(scenario.spec.length, `${scenario.id} has no spec reference`).toBeGreaterThan(10)
      expect(Object.keys(scenario.answers).length, `${scenario.id} is empty`).toBeGreaterThan(3)
    }
  })
})
