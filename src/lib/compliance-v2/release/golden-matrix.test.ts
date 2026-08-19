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
    expect(duties.length, 'a high-risk provider with no duties is the defect').toBeGreaterThan(8)
    for (const duty of duties) {
      expect(duty.appliesToRoles, duty.id).toContain('provider')
      expect(duty.source?.provision, `${duty.id} quotes nothing`).toBeTruthy()
    }

    /**
     * And the list is Chapter III Section 2, not a subset of it.
     *
     * This assertion replaces one that checked the caveat finding
     * `high-risk-provider-duties-incomplete` mentioned Article 43. That finding
     * existed because Articles 10, 14, 15, 16 and 43 were outside the pinned
     * corpus and no citation to them could be verified; rule pack `2026-08-19`
     * put them in, so the caveat was deleted rather than narrowed. The invariant
     * worth keeping is the one it stood in for: a high-risk provider is told
     * what it owes, by Article number, from a pack that can quote each one.
     */
    const provisions = duties.flatMap((duty) => (duty.source ? [duty.source.provision] : []))
    for (const article of [
      'Article 9',
      'Article 10',
      'Article 11',
      'Article 12',
      'Article 14',
      'Article 15',
      'Article 16',
      'Article 17',
      'Article 19',
      'Article 43',
    ]) {
      expect(
        provisions.some((provision) => provision.startsWith(article)),
        `no duty cites ${article}`
      ).toBe(true)
    }

    expect(
      provider.legalFindings.find(
        (finding) => finding.id === 'high-risk-provider-duties-incomplete'
      ),
      'the caveat is gone because the list it apologised for is complete'
    ).toBeUndefined()
  })

  /**
   * Article 43's routes, each with a scenario. Same spirit as the Annex III
   * family assertion above: a branch nothing exercises can break silently, and
   * the three procedures differ by an external audit.
   */
  it('every Article 43 route is exercised', () => {
    const ROUTES: Array<[string, RegExp]> = [
      ['art43BiometricsStandardsApplied', /Annex VI or Annex VII/],
      ['art43BiometricsNoStandards', /Annex VII, with a notified body/],
      ['art43AnnexIiiPointFour', /Annex VI internal control/],
      ['art43ProductRoute', /the procedure under the product/],
    ]

    for (const [scenarioId, title] of ROUTES) {
      const scenario = GOLDEN_SCENARIOS.find((item) => item.id === scenarioId)
      expect(scenario, `missing ${scenarioId}`).toBeDefined()
      const finding = evaluateAssessmentV2(scenario!.answers, ASSESSED_AT).legalFindings.find(
        (item) => item.id === 'art-43-conformity-assessment'
      )
      expect(finding?.title, `${scenarioId} names no procedure`).toMatch(title)
    }
  })

  /**
   * The unknown, asserted as an unknown. Annex VI is the cheaper procedure, so
   * a default in that direction would be both silent and expensive.
   */
  it('an unknown standards answer leaves the route unresolved, never Annex VI', () => {
    const result = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'art43BiometricsStandardsUnknown')!.answers,
      ASSESSED_AT
    )
    const finding = result.legalFindings.find(
      (item) => item.id === 'art-43-conformity-assessment'
    )
    expect(finding?.kind).toBe('unresolved_issue')
    expect(finding?.applicability).toBe('cannot_determine')
    expect(finding?.missingAnswerIds).toContain('art43_harmonised_standards')
    expect(finding?.title).not.toMatch(/Annex VI/)
    expect(finding?.practicalMeaning).not.toMatch(/internal control/)
  })

  it('a substantial modification adds the Article 43(4) re-assessment', () => {
    const result = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'art43SubstantialModification')!.answers,
      ASSESSED_AT
    )
    const finding = result.legalFindings.find((item) => item.id === 'art-43-4-reassessment')
    expect(finding, 'a modified high-risk system is re-assessed').toBeDefined()
    expect(finding?.source?.provision).toBe('Article 43(4)')
    expect(BINDING_FINDING_KINDS).toContain(finding!.kind)
  })

  /**
   * The deployer half of the same invariant, added 2026-08-20.
   *
   * Until then a high-risk deployer received two findings — Article 26(6) and
   * the supplier-side Article 13 item — while Article 26 contains eleven
   * operative paragraphs addressed to it. Same shape of gap as the provider path
   * had, one role over.
   */
  it('a high-risk deployer is told the whole of Article 26', () => {
    const deployer = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'hrScreeningProfiling')!.answers,
      ASSESSED_AT
    )
    expect(deployer.classification).toBe('likely_high_risk')

    const provisions = deployer.legalFindings
      .filter((finding) => finding.source)
      .map((finding) => finding.source!.provision)

    // Every operative paragraph of Article 26. (3) is a without-prejudice clause
    // and states no duty, so it is deliberately absent.
    for (const paragraph of [1, 2, 4, 5, 6, 7, 8, 9, 11, 12]) {
      expect(
        provisions.some((provision) => provision === `Article 26(${paragraph})`),
        `no deployer finding cites Article 26(${paragraph})`
      ).toBe(true)
    }
    expect(provisions).not.toContain('Article 26(3)')
  })

  /**
   * The conditional ones are typed conditional, not asserted as facts about the
   * reader. Article 26 addresses deployers generally, but paragraphs 4, 7, 8, 9
   * and 10 each turn on something the questionnaire never asks.
   */
  it('does not assert unasked facts about the deployer', () => {
    const deployer = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'hrScreeningProfiling')!.answers,
      ASSESSED_AT
    )
    for (const paragraph of [4, 7, 8, 9]) {
      const finding = deployer.legalFindings.find(
        (item) => item.source?.provision === `Article 26(${paragraph})`
      )
      expect(finding?.kind, `Article 26(${paragraph}) is not conditional`).toBe(
        'conditional_obligation'
      )
      expect(finding?.applicability).toBe('possibly_applies')
    }
  })

  /**
   * Article 26(10) governs *post*-remote biometric identification and is emitted
   * only on the route that reaches it. Article 5(1)(h) governs the real-time
   * case and is a different provision with different consequences.
   */
  it('emits the post-remote biometric duty only on the biometrics route', () => {
    const biometrics = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'annexIiiBiometrics')!.answers,
      ASSESSED_AT
    )
    const employment = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'hrScreeningProfiling')!.answers,
      ASSESSED_AT
    )
    const cites = (result: typeof biometrics) =>
      result.legalFindings.some((finding) => finding.source?.provision === 'Article 26(10)')

    expect(cites(biometrics), 'the biometrics route should reach Article 26(10)').toBe(true)
    expect(cites(employment), 'an employment deployer should not').toBe(false)
  })

  /** The caveat the provider path shed, now on the deployer path, and honest. */
  it('says plainly that Article 26 is not the whole of a deployer’s duties', () => {
    const deployer = evaluateAssessmentV2(
      GOLDEN_SCENARIOS.find((item) => item.id === 'hrScreeningProfiling')!.answers,
      ASSESSED_AT
    )
    const caveat = deployer.legalFindings.find(
      (finding) => finding.id === 'high-risk-deployer-duties-incomplete'
    )
    expect(caveat?.kind).toBe('unresolved_issue')
    expect(caveat?.practicalMeaning).toMatch(/Article 27/)
    // A non-binding finding whose action speaks in duties reads as one.
    expect(caveat?.action).not.toMatch(/\b(must|shall|required|prohibited)\b/i)
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
