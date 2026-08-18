import { evaluateAssessment } from '@/lib/ai-act-assessment'
import type { Classification } from '@/lib/ai-act-assessment'
import type { LegalClassification } from '../types'
import { BINDING_FINDING_KINDS } from '../types'
import { LEGACY_SCENARIOS } from '../legacy-baseline'
import { evaluateAssessmentV2 } from '../engine/assemble'
import { GOLDEN_SCENARIOS } from '../test-fixtures/golden-scenarios'

/**
 * Shadow mode (Phase 8): run both engines over the same scenarios and record
 * where they disagree, **without showing v2 to anyone**.
 *
 * The obvious way to do this — run v2 on live traffic and log — is not available
 * and is not wanted: v2 asks a different set of questions, so there is no live
 * answer record it could be handed. What is available is the pair of scenario
 * sets, which describe the same ten §17.2 situations in each engine's own
 * vocabulary. Comparing those is the honest version of shadow mode here, and it
 * answers the question that matters before a rollout: *where would a user's
 * answer change, and is every change one we meant?*
 *
 * **A divergence is not a bug.** v2 exists to change six documented v1 outputs.
 * Every divergence is therefore classified as `intended` or `unexplained`, and
 * only the second kind is a finding. `docs/compliance-checker-v1-known-defects.md`
 * is the list the first kind is checked against.
 *
 * **The comparison is on the classification, and duties are counted beside it.**
 * Classification alone would miss the whole of defect 6, where both engines say
 * "limited risk" and only one of them applies the Article 50(4) editorial
 * exception — same headline, different obligation. `dutyDelta` is the cheap
 * signal for that. It is a count rather than a diff: two engines with different
 * rule vocabularies cannot have their obligations matched up automatically, and
 * pretending otherwise would produce confident nonsense.
 */

export type DivergenceKind = 'intended' | 'unexplained' | 'agreement'

export interface ShadowComparison {
  /** The §17.2 scenario both engines are answering. */
  spec: string
  legacyScenarioId: string
  v2ScenarioId: string
  legacy: { classification: Classification; confidence: string; score: number; duties: number }
  v2: {
    classification: LegalClassification
    confidence: string
    statutoryRoutes: string[]
    duties: number
  }
  /** v2 duties minus v1 duties. Negative means v2 asserts fewer. */
  dutyDelta: number
  kind: DivergenceKind
  /** Why the change was expected, where it was. */
  note: string
}

/**
 * The §17.2 scenarios, paired across the two vocabularies.
 *
 * Hand-written rather than derived, because the pairing *is* the judgement: the
 * two engines ask different questions, and saying "these two records describe
 * the same situation" is a claim a person has to make.
 */
const PAIRS: Array<{
  spec: string
  legacy: string
  v2: string
  /** True where v2 is *meant* to reach a different answer. `note` says why. */
  intendedChange?: boolean
  note: string
}> = [
  {
    spec: '1. Microbusiness using third-party general productivity AI',
    legacy: 'microProductivity',
    v2: 'microProductivityDeployer',
    note: 'Both should land on no specific category. A divergence here is unexplained.',
  },
  {
    spec: '2. Microbusiness using AI for ordinary medical administration',
    legacy: 'microMedicalAdmin',
    intendedChange: true,
    v2: 'medicalAdminMicro',
    note: 'v1 defect 3: being in a listed sector drove the tier. v2 asks whether the *use* is a listed one, and ordinary administration is not.',
  },
  {
    spec: '3. Out-of-scope organisation using employment profiling',
    legacy: 'outOfScopeEmploymentProfiling',
    intendedChange: true,
    v2: 'outOfScope',
    note: 'v1 defect 1: an out-of-scope result still carried obligations. v2 emits none at all.',
  },
  {
    spec: '4. General productivity provider with high operational impact but no Annex route',
    legacy: 'productivityProviderHighImpact',
    intendedChange: true,
    v2: 'highImpactNoRoute',
    note: 'v1 defect 2: a score of 5 or more returned high-risk with no rule having classified anything. v2 has no score.',
  },
  {
    spec: '5. Third-party chatbot deployer',
    legacy: 'chatbotDeployer',
    v2: 'chatbotNotObvious',
    note: 'Both reach a transparency result. v2 additionally splits the Article 50(1) duty onto the provider rather than the reader.',
  },
  {
    spec: '6. Human-reviewed public-interest text with an identified responsible editor',
    legacy: 'reviewedPublishedText',
    intendedChange: true,
    v2: 'reviewedPublicInterestText',
    note: 'v1 defect 6: the Article 50(4) editorial exception was not applied. v2 applies it, so the duty disappears.',
  },
  {
    spec: '7. US provider placing a system on the EU market',
    legacy: 'usProviderEuMarket',
    v2: 'usProviderEmploymentAnnexIii',
    note:
      'Both reach high-risk, by different reasoning: v1 because the employment sector was ticked (defect 3), v2 because the Annex III point 4 *use* was selected and profiling forecloses the Article 6(3) derogation. Agreement here is agreement on the answer, not on the route.',
  },
  {
    spec: '9. UK deployer with EU operations',
    legacy: 'ukDeployerEuOperations',
    v2: 'ukDeployerChatbot',
    note:
      'v1 has no establishment question at all, so scenarios 7–9 collapse together in it; v2 separates establishment from market connection. Both reach a transparency result.',
  },
  {
    spec: '10. User who does not know turnover, balance sheet or group status',
    legacy: 'unknownFinancials',
    intendedChange: true,
    v2: 'noFinancials',
    note:
      'The one divergence shadow mode found beyond the six documented v1 defects, and it is a real weakness rather than a wrinkle: v1 returns "Uncertain" at score 0 because a *size* answer is missing, and organisation size cannot change a risk tier. v2 classifies on the facts that decide the tier and carries the missing size separately as a material unknown, which is §20.7 and §20.8 working together.',
  },
]

export function runShadowComparison(assessedAt = '2026-08-19'): ShadowComparison[] {
  return PAIRS.map((pair) => {
    const legacyScenario = LEGACY_SCENARIOS.find((item) => item.id === pair.legacy)
    const v2Scenario = GOLDEN_SCENARIOS.find((item) => item.id === pair.v2)
    if (!legacyScenario) throw new Error(`no legacy scenario ${pair.legacy}`)
    if (!v2Scenario) throw new Error(`no v2 scenario ${pair.v2}`)

    const legacy = evaluateAssessment(legacyScenario.answers)
    const v2 = evaluateAssessmentV2(v2Scenario.answers, assessedAt)

    const agrees = comparable(legacy.classification, v2.classification)
    // Accounted for **per scenario**, not by a global list of allowed
    // classification pairs. A global list says "this change is fine anywhere",
    // which is exactly how a real divergence gets waved through in the one
    // scenario nobody meant it to happen in.
    const kind: DivergenceKind = agrees
      ? 'agreement'
      : pair.intendedChange
        ? 'intended'
        : 'unexplained'

    return {
      spec: pair.spec,
      legacyScenarioId: pair.legacy,
      v2ScenarioId: pair.v2,
      legacy: {
        classification: legacy.classification,
        confidence: legacy.confidence,
        score: legacy.score,
        duties: legacy.actions.filter((action) => action.kind === 'duty').length,
      },
      v2: {
        classification: v2.classification,
        confidence: v2.legalFindings[0]?.confidence ?? 'n/a',
        statutoryRoutes: v2.statutoryRoutes,
        duties: v2.legalFindings.filter((finding) => BINDING_FINDING_KINDS.includes(finding.kind))
          .length,
      },
      dutyDelta:
        v2.legalFindings.filter((finding) => BINDING_FINDING_KINDS.includes(finding.kind)).length -
        legacy.actions.filter((action) => action.kind === 'duty').length,
      kind,
      note: pair.note,
    }
  })
}

/**
 * Do the two vocabularies say the same thing?
 *
 * Not string equality — the enums were deliberately rewritten. This is the
 * mapping that says which v1 label and which v2 label mean the same outcome.
 */
function comparable(legacy: Classification, v2: LegalClassification): boolean {
  const EQUIVALENT: Record<Classification, LegalClassification[]> = {
    'Prohibited practice': ['potentially_prohibited'],
    'Prohibited from 2 December 2026': ['potentially_prohibited'],
    'Likely high-risk': ['likely_high_risk', 'possible_high_risk'],
    'Likely limited-risk': ['specific_transparency_duties'],
    'Likely minimal-risk': ['no_specific_category_identified'],
    'GPAI-related': ['no_specific_category_identified', 'specific_transparency_duties'],
    'Out of EU scope': ['out_of_scope'],
    Uncertain: ['insufficient_information'],
  }
  return EQUIVALENT[legacy]?.includes(v2) ?? false
}

export interface ShadowSummary {
  comparisons: ShadowComparison[]
  agreements: number
  intended: number
  unexplained: number
}

export function shadowSummary(comparisons = runShadowComparison()): ShadowSummary {
  return {
    comparisons,
    agreements: comparisons.filter((item) => item.kind === 'agreement').length,
    intended: comparisons.filter((item) => item.kind === 'intended').length,
    unexplained: comparisons.filter((item) => item.kind === 'unexplained').length,
  }
}
