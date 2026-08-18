import { evaluateAssessment, type AssessmentAnswers } from '@/lib/ai-act-assessment'

/**
 * The ten mandatory regression scenarios of §17.2, expressed in the **v1**
 * question vocabulary, plus a recording of what v1 currently answers for each.
 *
 * This is a characterisation baseline, not a specification. Several of the
 * recorded outputs are wrong — that is the point. Phase 0's exit criterion is
 * that "known incorrect v1 outputs are documented as v1 behaviour, not copied
 * as v2 expectations", so nothing in this file may be used as a v2 target.
 * `v1-invariants.test.ts` names the specific defects and
 * `docs/compliance-checker-v1-known-defects.md` explains each one.
 *
 * What it is good for: catching an *accidental* change to v1 while v2 is being
 * built alongside it. v1 stays live for users until the §20 gates pass, so a
 * refactor that silently moves a live classification should fail a test rather
 * than reach production.
 *
 * Two scenarios cannot be faithfully expressed at all, which is itself a
 * finding rather than a gap in this file:
 *
 * - **7, 8 and 9 (US, Canadian, UK organisations)** collapse together. v1 has
 *   no establishment-country question; `eu_scope` records the *connection* to
 *   the Union, never where the organisation sits. Scenarios 7 and 8 differ here
 *   only in which connection is ticked, and produce identical results.
 * - **10 (unknown financials)** is trivially satisfied because v1 never asks
 *   for turnover, balance sheet or group status — `org_size` is headcount bands
 *   plus "prefer not to say". Recorded so v2 cannot regress it.
 */

export interface LegacyScenario {
  id: string
  /** The §17.2 scenario this stands in for. */
  spec: string
  answers: AssessmentAnswers
}

const COMMON = {
  prohibited_screen: ['none'],
  change_control: ['annual-review'],
} satisfies AssessmentAnswers

export const LEGACY_SCENARIOS: LegacyScenario[] = [
  {
    id: 'microProductivity',
    spec: '1. Microbusiness using third-party general productivity AI',
    answers: {
      ...COMMON,
      assessment_reason: 'new-tool',
      origin: 'third-party',
      org_size: 'micro',
      eu_scope: ['eu-org'],
      primary_use: 'general-productivity',
      affected_people: ['none'],
      decision_impact: 'assistive',
      profiling_confirm: 'no',
      human_oversight: 'meaningful',
      sensitive_domains: ['none'],
      data_types: ['none'],
      transparency: ['none'],
      vendor_docs: ['classification', 'instructions'],
    },
  },
  {
    id: 'microMedicalAdmin',
    spec: '2. Microbusiness using AI for ordinary medical administration',
    answers: {
      ...COMMON,
      assessment_reason: 'existing-tool',
      origin: 'third-party',
      org_size: 'micro',
      eu_scope: ['eu-org'],
      primary_use: 'healthcare',
      affected_people: ['patients'],
      decision_impact: 'assistive',
      profiling_confirm: 'no',
      human_oversight: 'meaningful',
      sensitive_domains: ['healthcare'],
      data_types: ['health'],
      transparency: ['none'],
      vendor_docs: ['classification'],
    },
  },
  {
    id: 'outOfScopeEmploymentProfiling',
    spec: '3. Out-of-scope organisation using employment profiling',
    answers: {
      ...COMMON,
      assessment_reason: 'review',
      origin: 'third-party',
      org_size: 'small',
      eu_scope: ['none'],
      primary_use: 'employment',
      affected_people: ['applicants'],
      decision_impact: 'eligibility',
      profiling_confirm: 'yes',
      human_oversight: 'rubber-stamp',
      sensitive_domains: ['employment'],
      data_types: ['personal'],
      transparency: ['none'],
      vendor_docs: ['none'],
    },
  },
  {
    id: 'productivityProviderHighImpact',
    spec: '4. General productivity provider, high operational impact, no Annex route',
    answers: {
      ...COMMON,
      assessment_reason: 'building-product',
      origin: 'own-product',
      org_size: 'small',
      eu_scope: ['eu-users'],
      primary_use: 'general-productivity',
      affected_people: ['customers'],
      decision_impact: 'automated-adverse',
      profiling_confirm: 'no',
      human_oversight: 'none',
      sensitive_domains: ['none'],
      data_types: ['personal'],
      transparency: ['none'],
      vendor_docs: ['none'],
    },
  },
  {
    id: 'chatbotDeployer',
    spec: '5. Third-party chatbot deployer',
    answers: {
      ...COMMON,
      assessment_reason: 'new-tool',
      origin: 'third-party',
      org_size: 'small',
      eu_scope: ['eu-org'],
      primary_use: 'customer-service',
      affected_people: ['customers'],
      decision_impact: 'assistive',
      profiling_confirm: 'no',
      human_oversight: 'meaningful',
      sensitive_domains: ['none'],
      data_types: ['personal'],
      transparency: ['chatbot'],
      vendor_docs: ['instructions'],
    },
  },
  {
    id: 'reviewedPublishedText',
    spec: '6. Human-reviewed public-interest text with an identified responsible editor',
    answers: {
      ...COMMON,
      assessment_reason: 'existing-tool',
      origin: 'third-party',
      org_size: 'micro',
      eu_scope: ['eu-org'],
      primary_use: 'general-productivity',
      affected_people: ['public'],
      decision_impact: 'assistive',
      profiling_confirm: 'no',
      human_oversight: 'meaningful',
      sensitive_domains: ['none'],
      data_types: ['none'],
      transparency: ['published-text'],
      vendor_docs: ['instructions'],
    },
  },
  {
    id: 'usProviderEuMarket',
    spec: '7. US provider placing a system on the EU market',
    answers: {
      ...COMMON,
      assessment_reason: 'building-product',
      origin: 'own-product',
      org_size: 'small',
      eu_scope: ['eu-market'],
      primary_use: 'employment',
      affected_people: ['applicants'],
      decision_impact: 'ranking',
      profiling_confirm: 'yes',
      human_oversight: 'meaningful',
      sensitive_domains: ['employment'],
      data_types: ['personal'],
      transparency: ['none'],
      vendor_docs: ['classification'],
    },
  },
  {
    id: 'canadianProviderEuOutputs',
    spec: '8. Canadian provider whose system output is used in the EU',
    answers: {
      ...COMMON,
      assessment_reason: 'building-product',
      origin: 'own-product',
      org_size: 'small',
      eu_scope: ['eu-outputs'],
      primary_use: 'employment',
      affected_people: ['applicants'],
      decision_impact: 'ranking',
      profiling_confirm: 'yes',
      human_oversight: 'meaningful',
      sensitive_domains: ['employment'],
      data_types: ['personal'],
      transparency: ['none'],
      vendor_docs: ['classification'],
    },
  },
  {
    id: 'ukDeployerEuOperations',
    spec: '9. UK deployer with EU operations',
    answers: {
      ...COMMON,
      assessment_reason: 'review',
      origin: 'third-party',
      org_size: 'medium',
      eu_scope: ['eu-users'],
      primary_use: 'customer-service',
      affected_people: ['customers'],
      decision_impact: 'recommendation',
      profiling_confirm: 'no',
      human_oversight: 'meaningful',
      sensitive_domains: ['none'],
      data_types: ['personal'],
      transparency: ['chatbot'],
      vendor_docs: ['instructions'],
    },
  },
  {
    id: 'unknownFinancials',
    spec: '10. User who does not know turnover, balance sheet or group status',
    answers: {
      assessment_reason: 'new-tool',
      origin: 'third-party',
      org_size: 'prefer-not-to-say',
      eu_scope: ['eu-org'],
      primary_use: 'general-productivity',
      affected_people: ['none'],
      decision_impact: 'assistive',
      profiling_confirm: 'not-sure',
      human_oversight: 'not-sure',
      sensitive_domains: ['none'],
      prohibited_screen: ['not-sure'],
      data_types: ['not-sure'],
      transparency: ['none'],
      vendor_docs: ['not-sure'],
      change_control: ['annual-review'],
    },
  },
]

export interface LegacyOutcome {
  classification: string
  role: string
  confidence: string
  score: number
  firedRules: string[]
  /** `kind|article|id` per item — the shape a v1 result actually renders. */
  actions: string[]
}

/**
 * The comparable part of a v1 result.
 *
 * Prose is deliberately excluded. Wording changes are editorial and frequent;
 * a classification, a role, a confidence label, the set of rules that fired and
 * the typed items they produced are the load-bearing output, and those are what
 * a v1 refactor must not move by accident.
 */
export function summariseV1(answers: AssessmentAnswers): LegacyOutcome {
  const result = evaluateAssessment(answers)
  return {
    classification: result.classification,
    role: result.role,
    confidence: result.confidence,
    score: result.score,
    firedRules: result.firedRules.map((rule) => rule.id),
    actions: result.actions.map((item) => `${item.kind}|${item.article ?? '-'}|${item.id}`),
  }
}
