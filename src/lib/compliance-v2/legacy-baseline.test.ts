import { describe, expect, it } from 'vitest'
import { LEGACY_SCENARIOS, summariseV1, type LegacyOutcome } from './legacy-baseline'

/**
 * What v1 answers today, recorded on 2026-08-18.
 *
 * NOT a specification. Several of these outcomes are wrong, and
 * `v1-invariants.test.ts` names which. This exists so that an accidental change
 * to v1 fails a test while v2 is being built alongside it — v1 keeps serving
 * real users until the §20 release gates pass, and a refactor that quietly
 * moved a live classification would otherwise reach production unnoticed.
 *
 * Updating a row is a deliberate act: it means v1 behaviour changed on purpose,
 * and the reason belongs in the commit message.
 */
const RECORDED: Record<string, LegacyOutcome> = {
  microProductivity: {
    classification: "Likely minimal-risk",
    role: "Deployer",
    confidence: "High",
    score: 0,
    firedRules: [
      "role-third-party-deployer",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  microMedicalAdmin: {
    classification: "Likely high-risk",
    role: "Deployer",
    confidence: "Medium",
    score: 4,
    firedRules: [
      "role-third-party-deployer",
      "annex-iii-sensitive-domain",
      "annex-iii-exemption-duties",
      "high-risk-log-retention",
      "vendor-instructions-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-registration-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "gdpr-personal-data",
      "gdpr-sensitive-data",
      "sector-vendor-contract-risk",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "conditional|Article 6(2) and (3)|annex-iii-treat-as-high-risk",
      "good-practice|Article 6(4)|exemption-obtain-vendor-assessment",
      "conditional|Article 26(6)|art-26-6-deployer-log-retention",
      "good-practice|Article 12|art-12-logging-capability-vendor",
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  outOfScopeEmploymentProfiling: {
    classification: "Out of EU scope",
    role: "Deployer",
    confidence: "High",
    score: 11,
    firedRules: [
      "scope-no-eu-connection",
      "role-third-party-deployer",
      "annex-iii-profiling-override",
      "annex-iii-sensitive-domain",
      "high-risk-log-retention",
      "high-impact-decision",
      "weak-human-oversight",
      "vendor-classification-missing",
      "vendor-instructions-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-registration-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "vendor-docs-none-or-unknown",
      "gdpr-personal-data",
      "sector-vendor-contract-risk",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "good-practice|Article 2|scope-document-position",
      "duty|Article 6(3)|profiling-no-exemption",
      "conditional|Article 6(2) and (3)|annex-iii-treat-as-high-risk",
      "conditional|Article 26(6)|art-26-6-deployer-log-retention",
      "good-practice|Article 12|art-12-logging-capability-vendor",
      "conditional|Article 26(2)|define-human-oversight-roles",
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  productivityProviderHighImpact: {
    classification: "Likely high-risk",
    role: "Provider",
    confidence: "Medium",
    score: 7,
    firedRules: [
      "role-provider-own-product",
      "high-impact-decision",
      "weak-human-oversight",
      "vendor-classification-missing",
      "vendor-instructions-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "vendor-docs-none-or-unknown",
      "gdpr-personal-data",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "conditional|Articles 11, 13 and 72|provider-document-baseline",
      "conditional|Article 26(2)|define-human-oversight-roles",
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  chatbotDeployer: {
    classification: "Likely limited-risk",
    role: "Deployer",
    confidence: "High",
    score: 1,
    firedRules: [
      "role-third-party-deployer",
      "article-50-chatbot",
      "vendor-classification-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "gdpr-personal-data",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "duty|Article 50|transparency-inform-and-label",
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  reviewedPublishedText: {
    classification: "Likely limited-risk",
    role: "Deployer",
    confidence: "High",
    score: 1,
    firedRules: [
      "role-third-party-deployer",
      "article-50-published-text",
      "vendor-classification-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "duty|Article 50|transparency-inform-and-label",
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  usProviderEuMarket: {
    classification: "Likely high-risk",
    role: "Provider",
    confidence: "High",
    score: 13,
    firedRules: [
      "role-provider-own-product",
      "annex-iii-profiling-override",
      "annex-iii-sensitive-domain",
      "high-risk-log-retention",
      "high-impact-decision",
      "vendor-instructions-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-registration-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "gdpr-personal-data",
      "sector-vendor-contract-risk",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "conditional|Articles 11, 13 and 72|provider-document-baseline",
      "duty|Article 6(3)|profiling-no-exemption",
      "conditional|Article 6(2) and (3)|annex-iii-treat-as-high-risk",
      "conditional|Article 19(1)|art-19-1-provider-log-retention",
      "conditional|Article 12|art-12-logging-capability",
      "concession|Article 11(1)|sme-art-11-simplified-documentation",
      "concession|Article 17(2)|sme-art-17-proportionate-qms",
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  canadianProviderEuOutputs: {
    classification: "Likely high-risk",
    role: "Provider",
    confidence: "High",
    score: 13,
    firedRules: [
      "role-provider-own-product",
      "annex-iii-profiling-override",
      "annex-iii-sensitive-domain",
      "high-risk-log-retention",
      "high-impact-decision",
      "vendor-instructions-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-registration-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "gdpr-personal-data",
      "sector-vendor-contract-risk",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "conditional|Articles 11, 13 and 72|provider-document-baseline",
      "duty|Article 6(3)|profiling-no-exemption",
      "conditional|Article 6(2) and (3)|annex-iii-treat-as-high-risk",
      "conditional|Article 19(1)|art-19-1-provider-log-retention",
      "conditional|Article 12|art-12-logging-capability",
      "concession|Article 11(1)|sme-art-11-simplified-documentation",
      "concession|Article 17(2)|sme-art-17-proportionate-qms",
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  ukDeployerEuOperations: {
    classification: "Likely limited-risk",
    role: "Deployer",
    confidence: "High",
    score: 2,
    firedRules: [
      "role-third-party-deployer",
      "decision-support",
      "article-50-chatbot",
      "vendor-classification-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "gdpr-personal-data",
      "sme-proportionate-relief",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "duty|Article 50|transparency-inform-and-label",
      "support|Article 57(3a), with Article 57(1)|sme-art-57-sandbox-priority",
      "enforcement|Article 99(6)|sme-art-99-6-lower-of",
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
  unknownFinancials: {
    classification: "Uncertain",
    role: "Deployer",
    confidence: "Low",
    score: 0,
    firedRules: [
      "role-third-party-deployer",
      "prohibited-uncertain",
      "human-oversight-uncertain",
      "vendor-classification-missing",
      "vendor-instructions-missing",
      "vendor-risk-management-missing",
      "vendor-dpa-missing",
      "vendor-logs-missing",
      "vendor-change-policy-missing",
      "vendor-docs-none-or-unknown",
      "system-record-obligation",
      "ongoing-review-triggers",
    ],
    actions: [
      "good-practice|-|maintain-ai-system-record",
      "good-practice|-|retain-governance-evidence",
    ],
  },
}

describe('v1 legacy baseline', () => {
  it('records every mandatory regression scenario', () => {
    expect(LEGACY_SCENARIOS.length).toBe(10)
    for (const scenario of LEGACY_SCENARIOS) {
      expect(RECORDED[scenario.id], `${scenario.id} has no recorded outcome`).toBeDefined()
    }
  })

  it.each(LEGACY_SCENARIOS.map((s) => [s.id, s] as const))(
    'v1 output is unchanged for %s',
    (id, scenario) => {
      expect(summariseV1(scenario.answers)).toEqual(RECORDED[id])
    }
  )

  /**
   * The representational gap, asserted rather than described. v1 has no
   * establishment-country question, so a US provider placing a system on the EU
   * market and a Canadian provider whose outputs are used there are the same
   * assessment to it. v2 must be able to tell them apart; until it can, this
   * test says out loud that the distinction currently does not exist.
   */
  it('v1 cannot distinguish a US from a Canadian provider', () => {
    const us = RECORDED.usProviderEuMarket
    const canada = RECORDED.canadianProviderEuOutputs
    expect(us.classification).toBe(canada.classification)
    expect(us.role).toBe(canada.role)
    expect(us.actions).toEqual(canada.actions)
  })

  /**
   * Already satisfied, and worth locking in: §20.8 requires a user to finish
   * without turnover or balance-sheet figures. v1 never asks for either, so the
   * scenario completes — the guard is against v2 introducing the requirement
   * while adding the size evaluator in Phase 2.
   */
  it('an unknown-financials user still reaches a result in v1', () => {
    const outcome = RECORDED.unknownFinancials
    expect(outcome.classification).toBe('Uncertain')
    expect(outcome.confidence).toBe('Low')
  })
})
