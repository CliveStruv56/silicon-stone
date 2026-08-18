import { describe, expect, it } from 'vitest'
import { evaluateAssessment, type AssessmentAnswers } from '@/lib/ai-act-assessment'
import { groupObligations } from '@/lib/ai-act-obligations'
import { PENALTY_TIERS } from '@/lib/ai-act-timeline'
import { LEGACY_SCENARIOS } from './legacy-baseline'

/**
 * The §17.3 invariants, run against **v1**.
 *
 * Phase 0 is a safety harness, not a fix. So this file does two different jobs
 * and keeps them visibly apart:
 *
 * - `invariants v1 already satisfies` — real regression guards. v1 stays live
 *   until the §20 gates pass, and these must not break while v2 is built.
 * - `known v1 defects` — each test asserts that a defect is **still present**.
 *   That is deliberate and uncomfortable, which is the point: it is a
 *   characterisation test, so the defect cannot be forgotten, and when v2 fixes
 *   it the test fails and has to be moved and inverted rather than quietly
 *   dropped. None of these is a v2 expectation. `docs/compliance-checker-v1-known-defects.md`
 *   explains each one and what the right answer is.
 */

const scenario = (id: string) => {
  const found = LEGACY_SCENARIOS.find((item) => item.id === id)
  if (!found) throw new Error(`no scenario ${id}`)
  return evaluateAssessment(found.answers)
}

/** Items whose duty falls on a provider, never on a pure deployer. */
const PROVIDER_ONLY_ITEMS = new Set([
  'provider-document-baseline',
  'art-19-1-provider-log-retention',
  'art-12-logging-capability',
  'exemption-document-assessment',
  'exemption-register-anyway',
  'sme-art-11-simplified-documentation',
  'sme-art-17-proportionate-qms',
])

describe('invariants v1 already satisfies', () => {
  /** §17.3: a recommendation cannot render in the legal-obligations section. */
  it('no recommendation reaches the obligations group', () => {
    for (const item of LEGACY_SCENARIOS) {
      const groups = groupObligations(evaluateAssessment(item.answers).actions)
      const duties = groups.find((group) => group.heading === 'Actions to take')
      for (const action of duties?.items ?? []) {
        expect(['duty', 'conditional'], `${item.id}: ${action.id}`).toContain(action.kind)
      }
    }
  })

  /** §17.3: an entitlement cannot render as an obligation. */
  it('no concession or support measure reaches the obligations group', () => {
    for (const item of LEGACY_SCENARIOS) {
      const groups = groupObligations(evaluateAssessment(item.answers).actions)
      const duties = groups.find((group) => group.heading === 'Actions to take')
      const kinds = (duties?.items ?? []).map((action) => action.kind)
      expect(kinds, item.id).not.toContain('concession')
      expect(kinds, item.id).not.toContain('support')
      expect(kinds, item.id).not.toContain('enforcement')
    }
  })

  /**
   * §17.3: a provider-only finding cannot be assigned to a deployer without a
   * provider role. v1 gates these on `hasProviderDuties()`, and the size
   * reliefs additionally on being in an Annex III domain.
   */
  it('no provider-only item reaches a pure deployer', () => {
    for (const item of LEGACY_SCENARIOS) {
      const result = evaluateAssessment(item.answers)
      if (result.role !== 'Deployer') continue
      for (const action of result.actions) {
        expect(PROVIDER_ONLY_ITEMS.has(action.id), `${item.id}: ${action.id}`).toBe(false)
      }
    }
  })

  /**
   * §17.3: an unknown decisive answer prevents high confidence. Decisive here
   * means it can move the tier — scope, role, profiling, the Article 5 screen
   * and oversight. Each is checked separately because they reach confidence by
   * different routes (`confidenceImpact`, `missingFacts`, and the override).
   */
  it.each<[string, AssessmentAnswers]>([
    ['eu_scope', { eu_scope: ['not-sure'] }],
    ['origin', { origin: 'not-sure' }],
    ['prohibited_screen', { prohibited_screen: ['not-sure'] }],
    ['human_oversight', { human_oversight: 'not-sure' }],
  ])('an unknown %s answer keeps confidence below High', (_label, override) => {
    const base = LEGACY_SCENARIOS.find((item) => item.id === 'chatbotDeployer')!.answers
    const result = evaluateAssessment({ ...base, ...override })
    expect(result.confidence).not.toBe('High')
  })

  /**
   * §20.8: a user must be able to finish without turnover or balance-sheet
   * figures. v1 never asks for either — `org_size` is headcount bands plus
   * "prefer not to say" — so this passes today. It is asserted because Phase 2
   * adds an organisation-size evaluator, which is exactly where the requirement
   * would get reintroduced by accident.
   */
  it('a user who will not state organisation size still reaches a classification', () => {
    const result = scenario('unknownFinancials')
    expect(result.classification).toBeTruthy()
    expect(result.actions.length).toBeGreaterThan(0)
  })
})

describe('known v1 defects', () => {
  /**
   * DEFECT 1 — §17.3: an out-of-scope result cannot contain current EU AI Act
   * obligations. v1 returns "Out of EU scope" as the headline and then renders
   * duties under the Regulation it has just said does not apply. The engine
   * suppresses the *classification* and nothing else; the comment in
   * `pickClassification` treats the content findings as "signals to revisit",
   * but the result card presents them as actions to take.
   *
   * v2: an out-of-scope result carries no current obligation of any kind.
   */
  it('DEFECT: an out-of-scope result still renders AI Act duties', () => {
    const result = scenario('outOfScopeEmploymentProfiling')
    expect(result.classification).toBe('Out of EU scope')

    const binding = result.actions.filter(
      (item) => item.kind === 'duty' || item.kind === 'conditional'
    )
    expect(binding.length).toBeGreaterThan(0)
    expect(binding.map((item) => item.id)).toContain('profiling-no-exemption')
  })

  /**
   * DEFECT 2 — §17.3: a score cannot change legal classification, and §20.2:
   * every high-risk result identifies an exact Article 6 / Annex route.
   *
   * A general-productivity provider with an adverse automated decision and no
   * human oversight scores 7 and is classified "Likely high-risk" — with no
   * classification rule fired at all. `pickClassification` returns high-risk on
   * `score >= 5` alone. The user is then handed provider documentation duties
   * on the strength of an arithmetic total.
   *
   * v2: the score becomes an operational-readiness measure and cannot reach the
   * legal classification.
   */
  it('DEFECT: a score alone produces a high-risk classification', () => {
    const result = scenario('productivityProviderHighImpact')
    expect(result.classification).toBe('Likely high-risk')
    expect(result.score).toBeGreaterThanOrEqual(5)

    // No rule asserted a classification — the tier came from the score.
    const classifying = result.firedRules.filter((rule) => rule.classification)
    expect(classifying).toEqual([])

    // And no Annex III or Article 6 route is anywhere in the result.
    const routes = result.actions.filter((item) => /Article 6/.test(item.article ?? ''))
    expect(routes).toEqual([])
  })

  /**
   * DEFECT 3 — §20.2 again, by a different route, and the Phase 3 exit
   * criterion "sector selection alone cannot create high-risk status".
   *
   * Ordinary medical administration — appointment scheduling, billing — is not
   * an Annex III use. Annex III point 5(a) reaches AI used to evaluate
   * eligibility for public assistance benefits and services, and point 5(d)
   * emergency triage; ordinary practice administration is neither. v1 asks only
   * which sector you are in, so ticking "healthcare" makes the system
   * high-risk. The anchor it produces, "Article 6(2) and (3)", names the
   * mechanism rather than the Annex III point, because there is no point to
   * name.
   *
   * v2: an exact intended-purpose route, or no high-risk classification.
   */
  it('DEFECT: ticking a sector alone produces a high-risk classification', () => {
    const result = scenario('microMedicalAdmin')
    expect(result.classification).toBe('Likely high-risk')
    expect(result.firedRules.map((rule) => rule.id)).toContain('annex-iii-sensitive-domain')

    // The anchor names the classification mechanism, never an Annex III point.
    const route = result.actions.find((item) => item.id === 'annex-iii-treat-as-high-risk')
    expect(route?.article).toBe('Article 6(2) and (3)')
    expect(route?.article).not.toMatch(/Annex III, point/)
  })

  /**
   * DEFECT 4 — §4.5 (no irrelevant information) and §17.3's size-band
   * invariant. A micro business using a general productivity tool, with no
   * obligations at all, is still shown an Article 57 sandbox measure and an
   * Article 99(6) penalty ceiling. The markdown export goes further and prints
   * the complete penalty table and the complete timeline on every result.
   *
   * v2: suppress size, penalty and timeline material that does not relate to
   * the user's own result.
   */
  it('DEFECT: a minimal-risk micro business is shown penalty and sandbox material', () => {
    const result = scenario('microProductivity')
    expect(result.classification).toBe('Likely minimal-risk')
    expect(result.actions.filter((item) => item.kind === 'duty')).toEqual([])

    const ids = result.actions.map((item) => item.id)
    expect(ids).toContain('sme-art-99-6-lower-of')
    expect(ids).toContain('sme-art-57-sandbox-priority')
    // And the export prints every band, not the ones that could apply here.
    expect(PENALTY_TIERS.length).toBeGreaterThan(1)
  })

  /**
   * DEFECT 5 — §20.7 (unknown facts must be visible and never silently
   * defaulted) and §4.6 (fail safely). An explicit "not sure" on `data_types`
   * produces a result byte-identical to answering "no personal data". The
   * unknown is resolved to the *favourable* answer and then discarded: no
   * missing fact, no reason, no effect on confidence, and the GDPR overlay does
   * not fire.
   *
   * The four decisive unknowns are handled — see the passing test above — so
   * this is not systemic. It is a hole in one question, and it fails in the
   * direction that matters: a user who does not know whether the system touches
   * personal data is told nothing does.
   *
   * v2: an unknown is a state the engine carries, never a value it resolves.
   */
  it('DEFECT: an unknown data-type answer is silently treated as "none"', () => {
    const base = LEGACY_SCENARIOS.find((item) => item.id === 'chatbotDeployer')!.answers
    const none = evaluateAssessment({ ...base, data_types: ['none'] })
    const unknown = evaluateAssessment({ ...base, data_types: ['not-sure'] })

    expect(unknown.confidence).toBe(none.confidence)
    expect(unknown.missingFacts).toEqual(none.missingFacts)
    expect(unknown.adjacentRisks).toEqual(none.adjacentRisks)
    expect(unknown.firedRules.map((rule) => rule.id)).toEqual(
      none.firedRules.map((rule) => rule.id)
    )
  })

  /**
   * DEFECT 6 — §17.2 scenario 6. Article 50(4) does not require disclosure of
   * AI-generated text published to inform the public on matters of public
   * interest where the content has undergone human review or editorial control
   * and a natural or legal person holds editorial responsibility. v1 has no
   * exception handling: selecting "published text" yields a flat Article 50
   * duty regardless of review or editorial responsibility.
   *
   * v2: paragraph- and role-specific Article 50 routes, with their exceptions.
   */
  it('DEFECT: the Article 50 published-text exception is not modelled', () => {
    const result = scenario('reviewedPublishedText')
    const transparency = result.actions.find((item) => item.id === 'transparency-inform-and-label')
    expect(transparency?.kind).toBe('duty')
    // Human oversight is 'meaningful' in this scenario and changes nothing.
    expect(result.actions.map((item) => item.id)).toContain('transparency-inform-and-label')
  })
})
