import type { ActionKind } from '@/lib/ai-act-rules'

/**
 * The v2 data contracts (§6 of the implementation specification).
 *
 * A new namespace, as §6 requires — v1's result stays exactly as it is while it
 * keeps serving users. What is *not* new is the vocabulary: `FindingKind` below
 * is the shipped `ActionKind` extended, not a parallel set of words for the same
 * distinctions. `FINDING_KIND_FROM_ACTION_KIND` is a total map, so a v1 item can
 * always be expressed in v2 terms and the two can be compared in Phase 8's
 * shadow mode without a lossy translation in the middle.
 */

// --- 6.1 Answer model ----------------------------------------------------

/**
 * The four ways a question can be complete.
 *
 * `unknown` is a completion, not an absence. v1's engine resolves an explicit
 * "not sure" on the personal-data question to the same result as "no personal
 * data" — defect 5 in `docs/compliance-checker-v1-known-defects.md` — which is
 * exactly what a state, rather than a magic enum value, prevents.
 */
export type AnswerState = 'answered' | 'unknown' | 'not_applicable' | 'declined'

export type AnswerValue = string | string[] | boolean | number | null

export interface AssessmentAnswerV2 {
  questionId: string
  state: AnswerState
  value: AnswerValue
  source: 'manual' | 'intake_confirmed'
  answeredAt?: string
}

/** The answers for one assessment, keyed by question id. */
export type AnswerRecordV2 = Record<string, AssessmentAnswerV2>

// --- 6.2 Question model --------------------------------------------------

/**
 * What an answer is load-bearing for.
 *
 * `classification_decisive` is the one with teeth: §9.5 forbids high confidence
 * while any such question is unanswered, and §17.3 makes it an invariant.
 */
export type QuestionImportance =
  | 'classification_decisive'
  | 'finding_decisive'
  | 'readiness_only'
  | 'context_only'

export interface QuestionOption {
  value: string
  label: string
  help?: string
}

export interface AssessmentQuestionV2 {
  id: string
  section: string
  prompt: string
  shortPrompt?: string
  help: string
  /** §7.1: shown as optional supporting text, never as the prompt. */
  whyAsked: string
  examples?: string[]
  answerType: 'single' | 'multi' | 'boolean' | 'number' | 'text'
  options?: QuestionOption[]
  /** §4.3: whether "Not sure" is offered. */
  allowUnknown: boolean
  allowNotApplicable: boolean
  importance: QuestionImportance
  visibleWhen?: ConditionExpression
  validate?: ValidationRule[]
  /**
   * §6.2: "required" means the user must supply an answer *state*, not that they
   * must know the substantive answer. A required question with `allowUnknown`
   * is satisfied by "not sure".
   */
  required?: boolean
  /**
   * Required only on some paths. §7.2 needs exactly this for
   * `intended_use_description`: optional on a controlled route, required as an
   * answer state once the user has said their use is something else — because
   * on that path it is the only description of the system the engine gets.
   */
  requiredWhen?: ConditionExpression
}

export interface ValidationRule {
  kind: 'maxSelections' | 'maxLength' | 'min' | 'max'
  value: number
  message: string
}

// --- Dependency expressions ---------------------------------------------

/**
 * Branch conditions, as data rather than as a predicate function.
 *
 * The specification names these "dependency expressions" and requires the
 * catalogue to be validatable at build time (Phase 1 exit criterion). A
 * `(answers) => boolean` closure cannot be checked for referencing a question
 * that does not exist, or one that is asked later in the flow; a tree of plain
 * objects can, and `collectQuestionIds` below is what does it.
 *
 * v1's rule triggers stay as TypeScript predicates on purpose — that decision is
 * recorded in the rule pack's module comment and is about *legal* triggers,
 * which are a different thing from questionnaire visibility.
 */
export type ConditionExpression =
  | { all: ConditionExpression[] }
  | { any: ConditionExpression[] }
  | { not: ConditionExpression }
  /** True when the question is in this state — the only way to test "not sure". */
  | { questionId: string; state: AnswerState }
  /** True when the question is `answered` and its value equals this. */
  | { questionId: string; equals: string | number | boolean }
  /** True when the question is `answered` and its array value contains any of these. */
  | { questionId: string; includesAny: string[] }

// --- 6.3 Legal conclusion model -----------------------------------------

export type ScopeOutcome = 'in_scope' | 'likely_in_scope' | 'out_of_scope' | 'scope_uncertain'

export type LegalClassification =
  | 'potentially_prohibited'
  | 'likely_high_risk'
  | 'possible_high_risk'
  | 'specific_transparency_duties'
  | 'no_specific_category_identified'
  | 'out_of_scope'
  | 'insufficient_information'

export type LegalRole =
  | 'provider'
  | 'deployer'
  | 'importer'
  | 'distributor'
  | 'product_manufacturer'
  | 'authorised_representative'

/**
 * What kind of statement a finding is — §4.2's eight labels, plus one.
 *
 * The ninth, `enforcement_information`, is the extension the shipped vocabulary
 * forced. v1 already types a penalty-ceiling statement as `enforcement`, because
 * "how a fine would be calculated" is neither an obligation, a recommendation,
 * nor an entitlement, and presenting it as any of those is the mistake the
 * 2026-08-17 work existed to fix. §4.2's list has no home for it, and folding it
 * into `adjacent_law` would say it comes from another regime, which it does not.
 *
 * Note what this does *not* license: §4.5 and defect 4 still forbid showing
 * penalty material that does not relate to the user's own result. Having a kind
 * for it is not permission to render it everywhere.
 */
export type FindingKind =
  | 'current_obligation'
  | 'future_obligation'
  | 'conditional_obligation'
  | 'recommended_safeguard'
  | 'supplier_responsibility'
  | 'entitlement_or_relief'
  | 'enforcement_information'
  | 'adjacent_law'
  | 'unresolved_issue'

export type Applicability =
  | 'applies'
  | 'likely_applies'
  | 'possibly_applies'
  | 'does_not_apply'
  | 'cannot_determine'

/**
 * Every v1 item kind, in v2 terms. Total by construction — `Record<ActionKind,…>`
 * means adding a kind to v1 without deciding its v2 meaning fails to compile.
 *
 * Two of the mappings are worth stating rather than leaving to be inferred:
 *
 * - `support` and `concession` both become `entitlement_or_relief`. v1 separates
 *   a relief you may take up (Article 11(1)'s simplified documentation) from a
 *   support measure available to you (Article 57 sandbox priority); §4.2 has one
 *   label for both, and the distinction survives in the finding's own prose.
 * - `conditional` becomes `conditional_obligation`, never `future_obligation`.
 *   v1 has no separate future status and encodes futurity in the condition text
 *   — so a v1 duty that is really "not until 2 December 2027" translates as
 *   conditional, which is true but weaker than v2 will state it. Phase 3 splits
 *   them at the source; this map must not guess which is which.
 */
export const FINDING_KIND_FROM_ACTION_KIND: Record<ActionKind, FindingKind> = {
  duty: 'current_obligation',
  conditional: 'conditional_obligation',
  concession: 'entitlement_or_relief',
  support: 'entitlement_or_relief',
  enforcement: 'enforcement_information',
  'good-practice': 'recommended_safeguard',
}

/** The kinds that may render in an obligations section. Everything else may not. */
export const BINDING_FINDING_KINDS: readonly FindingKind[] = [
  'current_obligation',
  'future_obligation',
  'conditional_obligation',
]

// --- 6.4 Finding model ---------------------------------------------------

export interface LegalSourceReference {
  documentId: string
  documentTitle: string
  provision: string
  officialUrl: string
  rulepackVersion: string
  reviewedAt: string
  shortExtract: string
  plainEnglishSummary: string
  conditions: string[]
  exceptions: string[]
}

export interface ComplianceFindingV2 {
  id: string
  ruleId: string
  title: string
  kind: FindingKind
  applicability: Applicability
  appliesToRoles: LegalRole[]
  /** §9.4: every legal duty carries this, or the rulepack declares it current. */
  effectiveFrom?: string
  whyItApplies: string
  practicalMeaning: string
  action: string
  evidenceToKeep: string[]
  /** Answer ids this conclusion rests on — §4.1, facts before conclusions. */
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
  source?: LegalSourceReference
  priority: 'urgent' | 'high' | 'normal' | 'low'
  confidence: 'high' | 'medium' | 'low'
}

// --- 6.5 Complete result model ------------------------------------------

export type OrganisationSizeStatus =
  | 'confirmed'
  | 'provisional_headcount_only'
  | 'uncertain_group_relationship'
  | 'insufficient_information'

export interface OrganisationSizeResult {
  status: OrganisationSizeStatus
  /** Plain-language statement, e.g. "Likely microenterprise based on headcount." */
  summary: string
  /** §8.4: only the band that could apply, never the full ladder. */
  band?: 'micro' | 'small' | 'medium' | 'small_mid_cap' | 'large'
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

export interface EvaluatedScope {
  outcome: ScopeOutcome
  explanation: string
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

export interface EvaluatedRole {
  role: LegalRole
  applicability: Applicability
  explanation: string
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

/** A fact the assessment needed and did not get, and what it would have changed. */
export interface MaterialUnknown {
  questionId: string
  question: string
  whatItWouldChange: string
  importance: QuestionImportance
}

export type GdprRegime = 'eu_gdpr' | 'uk_gdpr'

/**
 * A pointer to a data-protection instrument, at instrument level.
 *
 * Deliberately not a `LegalSourceReference`. That type carries a `shortExtract`
 * and a `rulepackVersion`, and both mean the same thing here: the text was
 * string-matched against the pinned corpus at build time. **No GDPR text is in
 * the pinned pack** — the rule pack is the AI Act, and the regulatory retrieval
 * corpus that does hold the GDPR is editorial-only and is never an authority for
 * anything this tool puts on screen. Reusing `LegalSourceReference` would let a
 * GDPR quotation inherit a guarantee nothing gave it.
 *
 * So the overlay quotes nothing and cites no provision. It links the instrument,
 * names the concept, and says what to go and check. That is the honest shape
 * until §11.3's "separately approved GDPR proposition" exists.
 */
export interface GdprReference {
  label: string
  url: string
  appliesTo: GdprRegime | 'both'
}

export interface GdprAiOverlayResult {
  /** §11.3: EU, UK, or both where the answers cannot separate them. */
  regimes: GdprRegime[]
  /** Why those regimes, including the case where the answers could not separate them. */
  jurisdictionNote: string
  findings: ComplianceFindingV2[]
  references: GdprReference[]
  notice: string
}

/**
 * The only kinds an overlay finding may take (§11.3), absent an approved GDPR
 * proposition. Nothing binding: this tool has not established a data-protection
 * duty and must not present one.
 */
export const GDPR_OVERLAY_KINDS: readonly FindingKind[] = [
  'adjacent_law',
  'recommended_safeguard',
  'unresolved_issue',
]

export interface ComplianceResultV2 {
  schemaVersion: '2'
  checkerVersion: string
  rulepackVersion: string
  assessedAt: string
  scope: EvaluatedScope
  roles: EvaluatedRole[]
  classification: LegalClassification
  classificationExplanation: string
  /** §20.2: a high-risk classification is invalid without at least one. */
  statutoryRoutes: string[]
  organisationSize: OrganisationSizeResult
  legalFindings: ComplianceFindingV2[]
  readinessFindings: ComplianceFindingV2[]
  gdprOverlay?: GdprAiOverlayResult
  materialUnknowns: MaterialUnknown[]
  reviewTriggers: string[]
  disclaimer: string
}
