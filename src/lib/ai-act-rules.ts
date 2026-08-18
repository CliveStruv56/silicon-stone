import type {
  AssessmentAnswers,
  Classification,
  SourceReference,
  UserRole,
} from './ai-act-assessment'
import { RULE_PACK, type PackProhibitedPractice } from './rulepack'

export type LegalStatus = 'current-law' | 'official-guidance' | 'operational-risk' | 'adjacent-risk'

export type RuleCategory =
  | 'scope'
  | 'role'
  | 'prohibited'
  | 'high-risk'
  | 'transparency'
  | 'gpai'
  | 'vendor-evidence'
  | 'gdpr-vendor'
  | 'governance'

export interface RuleSource extends SourceReference {
  article: string
  publisher: string
}

/**
 * What kind of thing a result item is.
 *
 * The card used to render all of them under "Immediate obligations", which was
 * true of roughly a third. A relief you may take up, a support measure whose
 * sandboxes need not exist until 2027, and a statement about how fines are
 * calculated are not tasks — and presenting them as tasks is what made a
 * careful triage read like a guess.
 *
 * `legalStatus` on the rule is a different axis and stays: it says how firm the
 * *authority* is. This says what the reader is being asked to do about it.
 */
export type ActionKind =
  /** Binds you now, on these answers. */
  | 'duty'
  /** Binds only if `condition` holds. The condition is stated, never implied. */
  | 'conditional'
  /** A relief you MAY use. Taking it up has its own conditions. */
  | 'concession'
  /** A support measure available to you. */
  | 'support'
  /** How penalties are calculated. Information, not a task. */
  | 'enforcement'
  /** Recommended, with no standalone statutory duty behind it. */
  | 'good-practice'

/**
 * One item in the result list, as a rule emits it.
 *
 * The Article anchor is a *field*, not prose inside `text`. That is the whole
 * point: a rule can emit four items spanning four provisions and each carries
 * its own anchor, where the rule-level `source` could only carry one. It is
 * also what lets the UI link an item to the pinned corpus instead of leaving
 * the reader to go and look "(Article 11(1))" up themselves.
 */
export interface RuleItem {
  /** Stable across runs. The dedupe key and the React key. */
  id: string
  /** The action or fact. Never ends in a bare "(Article N)" — see `article`. */
  text: string
  kind: ActionKind
  /** The narrow anchor for THIS item, e.g. 'Article 11(1)'. */
  article?: string
  /**
   * Corpus key for the explainer link, e.g. '11'. Set only where the pinned
   * pack actually carries the Article, so a link can never 404.
   */
  corpusArticle?: string
  /** The legal basis, and the conditions that decide whether it applies. */
  basis: string
  /** What to actually do, or what taking the relief up requires. */
  inPractice?: string
  /** For `kind: 'conditional'` — the condition, in the reader's terms. */
  condition?: string
}

/** A `RuleItem` once the aggregator has stamped the rule that emitted it. */
export interface ResultItem extends RuleItem {
  ruleId: string
}

/**
 * A question to put to the vendor, as a rule emits it.
 *
 * Same shape discipline as `RuleItem`, and for the same reason. These were bare
 * strings: seven of them carried an "Article 13 — " prefix inside the prose,
 * eight carried no anchor at all, and nothing distinguished the two cases to a
 * reader. The card could not link a question to the provision it comes from, and
 * a question pasted into a procurement email arrived carrying a citation the
 * vendor had no way to follow.
 *
 * `why` is the vendor-side counterpart of `RuleItem.basis`: what the answer
 * settles, and what it costs you not to have it. Several questions here are
 * owed to you only at the high-risk tier — `why` says so rather than letting
 * the question imply a duty the vendor does not have.
 */
export interface VendorQuestion {
  /** Stable across runs. The dedupe key and the React key. */
  id: string
  /** The question, as you would put it to the vendor. Never opens with an "Article N — " prefix; see `article`. */
  question: string
  /** The narrow anchor for THIS question, e.g. 'Article 13(3)(d)'. */
  article?: string
  /**
   * Corpus key for the explainer link, e.g. '13'. Set only where the pinned pack
   * carries the Article, so a link can never 404.
   */
  corpusArticle?: string
  /** What the answer settles, and why the question earns its place. */
  why: string
}

/** A `VendorQuestion` once the aggregator has stamped the rule that emitted it. */
export interface ResultVendorQuestion extends VendorQuestion {
  ruleId: string
}

export interface RuleFinding {
  id: string
  title: string
  category: RuleCategory
  version: string
  lastReviewed: string
  legalStatus: LegalStatus
  source: RuleSource
  evidence: string[]
  explanation: string
  classification?: Classification
  role?: UserRole
  scoreDelta: number
  confidenceImpact: number
  /**
   * Raises the reported confidence when the *law* is unambiguous on this path,
   * regardless of how many evidence gaps the answer set carries. Only ever
   * raises — a rule cannot use this to talk confidence down, and the aggregate
   * takes the strongest override that fired.
   */
  confidenceOverride?: 'High' | 'Medium'
  reasons: string[]
  missingFacts: string[]
  actions: RuleItem[]
  vendorQuestions: VendorQuestion[]
  adjacentRisks: string[]
  reviewTriggers: string[]
  reportSections: string[]
}

export interface AssessmentRule {
  id: string
  title: string
  category: RuleCategory
  version: string
  lastReviewed: string
  legalStatus: LegalStatus
  source: RuleSource
  priority: number
  when: (answers: AssessmentAnswers) => boolean
  build: (answers: AssessmentAnswers) => Omit<
    RuleFinding,
    'id' | 'title' | 'category' | 'version' | 'lastReviewed' | 'legalStatus' | 'source'
  >
}

export interface RuleEvaluation {
  firedRules: RuleFinding[]
  sourceReferences: SourceReference[]
  score: number
  role: UserRole
  classification: Classification
  confidence: 'High' | 'Medium' | 'Low'
  reasons: string[]
  missingFacts: string[]
  actions: ResultItem[]
  vendorQuestions: ResultVendorQuestion[]
  adjacentRisks: string[]
  reviewTriggers: string[]
  reportSections: string[]
}

/**
 * Version, sources and Article anchors all come from the pinned rule pack —
 * see src/lib/rulepack. Changing the pinned version changes what the engine
 * cites, with no edit here. The trigger predicates below stay in TypeScript on
 * purpose; the reasoning is in the rule pack's module comment.
 */
const RULE_VERSION = RULE_PACK.manifest.version
const LAST_REVIEWED = RULE_PACK.manifest.lastReviewed

export const RULE_BASE_VERSION = RULE_VERSION

/**
 * The source registry, read from the pinned rule pack. Every citation the tool
 * shows resolves through here, so correcting a URL or an Article label is a
 * data edit in rulepack/versions/<version>/sources.json.
 */
const sources = RULE_PACK.sources as Record<string, RuleSource>

/**
 * The anchor a rule cites: its source entry, plus a narrower Article label
 * where the rule is about a specific paragraph. Falls back to the source's own
 * label so a rule missing from the pack still renders something truthful
 * rather than throwing at import time.
 */
function anchor(ruleId: string): RuleSource {
  const mapping = RULE_PACK.ruleAnchors[ruleId]
  const source = sources[mapping?.source ?? 'overview'] ?? sources.overview
  return mapping?.article ? { ...source, article: mapping.article } : source
}

const classificationRank: Record<Classification, number> = {
  'Out of EU scope': 0,
  'Likely minimal-risk': 1,
  'GPAI-related': 2,
  'Likely limited-risk': 3,
  'Uncertain': 4,
  'Likely high-risk': 5,
  // A future-dated prohibition outranks high-risk but must never displace a
  // practice that is prohibited *today* — that one is the headline.
  'Prohibited from 2 December 2026': 6,
  'Prohibited practice': 7,
}

const roleRank: Record<UserRole, number> = {
  Deployer: 1,
  Provider: 2,
  Both: 3,
  Unclear: 4,
}

const annexIIIDomains = new Set([
  'employment',
  'education',
  'healthcare',
  'credit',
  'insurance',
  'public-services',
  'biometrics',
  'critical-infrastructure',
  'law-migration',
  'justice-democracy',
])

const primaryUseAnnexIII: Record<string, string> = {
  employment: 'HR, recruitment, workforce management, or worker monitoring',
  education: 'Education, training, assessment, or admissions',
  healthcare: 'Healthcare, clinical support, triage, or medical admin',
  financial: 'Credit, lending, banking, insurance, or fraud decisions',
  biometrics: 'Biometric identification, categorisation, or emotion detection',
  'critical-infrastructure': 'Critical infrastructure, safety system, or industrial control',
  'law-justice': 'Legal, migration, law enforcement, or democratic process',
}

/**
 * Step 7 answers that describe evaluating a person rather than assisting one.
 * Combined with a materially-affected natural person, these are profiling in
 * the GDPR Art 4(4) sense that Article 6(3) borrows.
 */
const profilingDecisionImpacts = ['ranking', 'eligibility', 'automated-adverse']

/** Natural-person categories at Step 6. 'none' is deliberately absent. */
const naturalPersonGroups = ['workers', 'applicants', 'customers', 'patients', 'students', 'public']

/**
 * Primary uses that profile natural persons regardless of how the output is
 * described at Step 7 — HR/workforce, credit/insurance, and biometric
 * categorisation are evaluations of people by construction.
 */
const profilingPrimaryUses = ['employment', 'financial', 'biometrics']

export type ProfilingBasis = 'confirmed' | 'assumed' | 'declined' | 'none'

export interface ProfilingAssessment {
  value: boolean
  basis: ProfilingBasis
}

/**
 * Whether the answers so far *suggest* profiling, which is what gates the
 * confirmation question. Deliberately broad: a false positive costs one extra
 * question, a false negative silently loses the Article 6(3) override.
 */
export function derivesProfiling(answers: AssessmentAnswers): boolean {
  if (hasAny(answers, 'primary_use', profilingPrimaryUses)) return true
  return (
    hasAny(answers, 'affected_people', naturalPersonGroups) &&
    hasAny(answers, 'decision_impact', profilingDecisionImpacts)
  )
}

/**
 * Resolve `performs_profiling` from the derivation plus the user's confirmation.
 *
 * The derivation gates everything: if the answers no longer suggest profiling,
 * a stale confirmation left behind by an edited answer is ignored rather than
 * carried forward. "Not sure" resolves TRUE — the conservative reading — but
 * records itself as `assumed` so the rationale can say the tier rests on an
 * assumption rather than a fact.
 */
export function performsProfiling(answers: AssessmentAnswers): ProfilingAssessment {
  if (!derivesProfiling(answers)) return { value: false, basis: 'none' }

  const confirmation = first(answers, 'profiling_confirm')
  if (confirmation === 'yes') return { value: true, basis: 'confirmed' }
  if (confirmation === 'no') return { value: false, basis: 'declined' }
  return { value: true, basis: 'assumed' }
}

/**
 * Whether the user carries provider-side duties. Articles 6(4) and 49(2) bind
 * the *provider*, so a pure deployer must see them as a vendor-evidence
 * question rather than as an obligation on them.
 */
function hasProviderDuties(answers: AssessmentAnswers): boolean {
  return ['own-product', 'modified-or-resold', 'integrated-third-party'].includes(
    first(answers, 'origin') ?? ''
  )
}

/** Whether any Annex III domain is in play, by either route the engine uses. */
function inAnnexIIIDomain(answers: AssessmentAnswers): boolean {
  if (hasAny(answers, 'sensitive_domains', annexIIIDomains)) return true
  const primaryUse = first(answers, 'primary_use')
  return Boolean(primaryUse && primaryUseAnnexIII[primaryUse])
}

/**
 * True while a threshold question is unresolved. The profiling override is a
 * statement about the *classification*, so it may only raise confidence once
 * territorial scope and role are settled — those sit upstream of it.
 */
function thresholdFactsUnresolved(answers: AssessmentAnswers): boolean {
  return (
    values(answers, 'eu_scope').length === 0 ||
    has(answers, 'eu_scope', 'not-sure') ||
    first(answers, 'origin') === 'not-sure'
  )
}

function values(answers: AssessmentAnswers, id: string): string[] {
  const value = answers[id]
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function first(answers: AssessmentAnswers, id: string): string | undefined {
  return values(answers, id)[0]
}

function has(answers: AssessmentAnswers, id: string, value: string): boolean {
  return values(answers, id).includes(value)
}

function hasAny(answers: AssessmentAnswers, id: string, wanted: string[] | Set<string>): boolean {
  const wantedSet = Array.isArray(wanted) ? new Set(wanted) : wanted
  return values(answers, id).some((value) => wantedSet.has(value))
}

function selected(answers: AssessmentAnswers, id: string): string {
  return values(answers, id).join(', ')
}

/**
 * One point of Article 5(1), as carried by the rule pack. `futureDated` marks
 * the two points inserted by Regulation (EU) 2026/1744, which apply from
 * 2 December 2026 rather than 2 February 2025 — telling someone to "stop now"
 * over a prohibition that does not yet exist would be as wrong as missing it.
 */
type Art5Practice = PackProhibitedPractice

/**
 * Article 5(1) as consolidated at CELEX 02024R1689-20260727 — ten points, after
 * the Omnibus inserted the intercalated (ba) and (bb). Listed in the order the
 * question presents them, which groups the two law-enforcement-scoped points
 * (d, h) last rather than following the Regulation's lettering.
 */
const ART5_PRACTICES: Art5Practice[] = RULE_PACK.prohibitedPractices

/**
 * Anchor each practice to its own point, using the source the pack assigns it.
 * The two Omnibus insertions cite the amending Regulation, since the Service
 * Desk page for Article 5 is not the authority for text that Regulation (EU)
 * 2026/1744 introduced.
 */
function art5Source(practice: Art5Practice): RuleSource {
  const base = sources[practice.source] ?? sources.article5
  return { ...base, article: `Article 5(1)(${practice.point})` }
}

function rule(
  input: Omit<AssessmentRule, 'version' | 'lastReviewed'>
): AssessmentRule {
  return {
    version: RULE_VERSION,
    lastReviewed: LAST_REVIEWED,
    ...input,
  }
}

/**
 * Items shared by more than one rule.
 *
 * These are `const`, not functions, so they must be declared above
 * `AI_ACT_RULE_LIBRARY` — the array is built at module load and a `const` is not
 * hoisted. Sharing the object rather than repeating the prose is what keeps the
 * `id` identical, which is what lets the aggregator dedupe them.
 *
 * A note on `article`: it is set only where the pinned pack already anchors the
 * rule to that provision, or where the corpus carries the Article so the claim
 * can be checked. An item with no verifiable anchor gets no anchor rather than a
 * plausible one.
 */

/**
 * The Annex III application date, read from the pinned pack.
 *
 * Deliberately not typed here. A date in this file would be a legal claim the
 * rule-pack hash gate cannot see, which is the whole reason dates live in the
 * pack. `ANNEX_III_APPLIES_FROM` is exported so a test can assert it still
 * resolves — a pack that renamed this timeline label would otherwise quietly
 * drop the date from every condition below.
 */
export const ANNEX_III_APPLIES_FROM = RULE_PACK.timeline.find(
  (entry) => entry.label === 'Standalone high-risk systems'
)?.date

/**
 * Shared by every duty the engine fires on Annex III *domain presence* rather
 * than on a confirmed tier. Two separate caveats, and the old flat list carried
 * neither: the tier is not settled, and the obligations are not yet in
 * application.
 */
const HIGH_RISK_CONDITION = [
  'Only if the system is in fact high-risk.',
  ANNEX_III_APPLIES_FROM
    ? `The standalone high-risk obligations apply from ${ANNEX_III_APPLIES_FROM} — so this is evidence to have in place before then, not work that is overdue today.`
    : 'Check the application date for standalone high-risk systems before treating this as work for today.',
].join(' ')

/** Emitted by both Annex III routes — the domain rule and the primary-use rule. */
const ANNEX_III_HIGH_RISK_CANDIDATE: RuleItem = {
  id: 'annex-iii-treat-as-high-risk',
  text: 'Treat this as a high-risk candidate until the classification and intended-purpose evidence are confirmed.',
  kind: 'conditional',
  condition:
    'Unless the provider has documented an Article 6(3) exemption. That derogation is narrow and it is the provider’s to claim, not yours to assume.',
  article: 'Article 6(2) and (3)',
  corpusArticle: '6',
  basis:
    'Article 6(2) makes Annex III systems high-risk. Article 6(3) derogates from that only where the system “does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons”, and only where one of four narrow conditions is also met — a narrow procedural task, improving a previously completed human activity, detecting decision-making patterns, or a preparatory task. Until that assessment exists in writing, paragraph 2 is the position.',
  inPractice:
    'Ask the vendor for its classification in writing. If it claims the exemption, ask for the Article 6(4) assessment behind it — a claim without the document is not a classification.',
}

/**
 * The SME and SMC size reliefs.
 *
 * Articles 11(1) and 17(2) are reliefs from *provider* duties on *high-risk*
 * systems, so the rules below emit them only on that path. Firing them for every
 * SME told a deployer of a minimal-risk chatbot it could simplify Annex IV
 * documentation it never owed in the first place.
 */
const ART_11_SIMPLIFIED_DOCS: RuleItem = {
  id: 'sme-art-11-simplified-documentation',
  text: 'You may supply the Annex IV technical documentation in simplified form, and a notified body must accept it.',
  kind: 'concession',
  article: 'Article 11(1)',
  corpusArticle: '11',
  basis:
    'Article 11(1) requires technical documentation for high-risk AI systems, containing at a minimum the elements in Annex IV. SMEs, start-ups and SMCs “may provide the elements … in a simplified manner”, and notified bodies “shall accept the form for the purposes of the conformity assessment”. It is a relief from a duty you only have as the provider of a high-risk system.',
  inPractice:
    'The relief is not a free hand with the format. If you simplify, Article 11(1) requires you to use the Commission’s simplified form — which the Commission is itself required to establish, so check it exists before planning around it.',
}

const ART_17_PROPORTIONATE_QMS: RuleItem = {
  id: 'sme-art-17-proportionate-qms',
  text: 'Your quality management system may be scaled to the size of your organisation — but not below a floor on rigour.',
  kind: 'concession',
  article: 'Article 17(2)',
  corpusArticle: '17',
  basis:
    'Article 17(1) requires a documented quality management system of “Providers of high-risk AI systems”. Article 17(2) makes its implementation “proportionate to the size of the provider’s organisation, in particular, if the provider is an SME, including a start-up, or an SMC” — then sets the floor: providers “shall, in any event, respect the degree of rigour and the level of protection required”. Proportionate means smaller, not weaker.',
  inPractice:
    'Fewer documents and lighter process, covering the same ground. The aspects listed in Article 17(1) still all need an answer.',
}

const ART_57_SANDBOX_PRIORITY: RuleItem = {
  id: 'sme-art-57-sandbox-priority',
  text: 'You are entitled to priority access to an AI regulatory sandbox, once one is running.',
  kind: 'support',
  condition:
    'Not available yet in most of the EU. Member States need only have a national sandbox operational by 2 August 2027.',
  article: 'Article 57(3a), with Article 57(1)',
  corpusArticle: '57',
  basis:
    'Narrower than it sounds. The express priority-access wording is in Article 57(3a), and it is about the sandbox the AI Office has discretion to establish at Union level for Article 75(1) systems: that sandbox “shall provide priority access to SMEs, including start-ups, and SMCs”. Article 57(1) separately requires each Member State to have at least one national sandbox “operational by 2 August 2027”. Article 57 also names accelerating market access for SMEs among the sandboxes’ objectives. Provisions outside this pack’s verified corpus may widen the entitlement; we do not assert what we cannot check.',
  inPractice:
    'A 2027 planning item, not something to act on this quarter. Worth knowing before you buy external assurance you could get inside a sandbox instead.',
}

const ART_99_6_LOWER_OF: RuleItem = {
  id: 'sme-art-99-6-lower-of',
  text: 'If you were fined, the cap is the lower of the percentage and the fixed amount, not the higher.',
  kind: 'enforcement',
  article: 'Article 99(6)',
  corpusArticle: '99',
  basis:
    'For everyone else, Article 99 sets each ceiling as whichever of the fixed sum or the turnover percentage is the higher of the two. Article 99(6) inverts that for SMEs and start-ups across paragraphs 3, 4 and 5 — “whichever thereof is lower”. Article 99(1) separately requires Member States to take the economic viability of SMEs into account when imposing penalties.',
  inPractice:
    'Nothing to do. It is here because it changes what the exposure actually is, which is what most people are trying to work out.',
}

const ART_99_6A_LOWER_OF_SMC: RuleItem = {
  id: 'smc-art-99-6a-lower-of',
  text: 'The lower-of cap applies to you for Article 99(4) and (5) only — Article 5 prohibited-practice fines are not capped this way.',
  kind: 'enforcement',
  article: 'Article 99(6a)',
  corpusArticle: '99',
  basis:
    'Article 99(6a), inserted by the Digital Omnibus, extends the lower-of treatment to small mid-caps — but only for paragraphs 4 and 5, not paragraph 3. So a prohibited-practice infringement stays at the higher of €35 000 000 or 7 % of total worldwide annual turnover. This is narrower than the SME relief at Article 99(6), which does reach paragraph 3.',
  inPractice:
    'Nothing to do, but do not read across from SME guidance: the one tier where the fine is largest is the one where the relief does not reach you.',
}

export const AI_ACT_RULE_LIBRARY: AssessmentRule[] = [
  rule({
    id: 'scope-no-eu-connection',
    title: 'No clear EU territorial connection',
    category: 'scope',
    legalStatus: 'current-law',
    source: anchor('scope-no-eu-connection'),
    priority: 10,
    when: (answers) => values(answers, 'eu_scope').length === 1 && has(answers, 'eu_scope', 'none'),
    build: () => ({
      evidence: ['EU scope selected: no clear EU connection'],
      explanation: 'The user selected no EU organisation, EU users, EU-market placement, or EU-affecting outputs.',
      classification: 'Out of EU scope',
      scoreDelta: -2,
      confidenceImpact: 0,
      reasons: ['You indicated no EU users, market presence, or affected people, so the AI Act may not apply.'],
      missingFacts: [],
      actions: [
        {
          id: 'scope-document-position',
          text: 'Record the territorial scope position, and who signed it off, before deprioritising AI Act work.',
          kind: 'good-practice',
          article: 'Article 2',
          basis:
            'Article 2 sets the Regulation’s territorial scope. If it does not reach you, you have no AI Act duties at all — so this is not one of them. It earns its place because scope is the assumption every other answer here rests on, and the one most likely to change quietly.',
          inPractice:
            'Note which EU connections you considered — EU users, placement on the EU market, outputs affecting people in the EU — and revisit the moment any of them changes.',
        },
      ],
      vendorQuestions: [],
      adjacentRisks: ['Local AI rules (UK, US state laws, sector-specific regimes) may still apply even when the EU AI Act does not.'],
      reviewTriggers: ['EU users, customers, market placement, or EU-affecting outputs are added'],
      reportSections: ['Territorial scope memo'],
    }),
  }),
  rule({
    id: 'scope-uncertain',
    title: 'EU territorial scope uncertain',
    category: 'scope',
    legalStatus: 'current-law',
    source: anchor('scope-uncertain'),
    priority: 20,
    when: (answers) => values(answers, 'eu_scope').length === 0 || has(answers, 'eu_scope', 'not-sure'),
    build: () => ({
      evidence: ['EU scope is missing or marked not sure'],
      explanation: 'Territorial scope is a threshold question and should be resolved before relying on the assessment.',
      classification: 'Uncertain',
      scoreDelta: 0,
      confidenceImpact: 2,
      reasons: [],
      missingFacts: ['Confirm whether the system is used in the EU, placed on the EU market, or affects people in the EU.'],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: [],
      reportSections: ['Territorial scope memo'],
    }),
  }),
  rule({
    id: 'role-third-party-deployer',
    title: 'Third-party AI tool deployer role',
    category: 'role',
    legalStatus: 'current-law',
    source: anchor('role-third-party-deployer'),
    priority: 30,
    when: (answers) => first(answers, 'origin') === 'third-party',
    build: () => ({
      evidence: ['Origin selected: third-party AI tool as supplied'],
      explanation: 'Using a third-party system as supplied generally points to deployer-side triage for an SME user.',
      role: 'Deployer',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: ['You appear primarily to be a deployer using a third-party AI system.'],
      missingFacts: [],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: [],
      reportSections: ['Role analysis: deployer/provider/both'],
    }),
  }),
  rule({
    id: 'role-integrated-third-party',
    title: 'Integrated third-party AI may create mixed responsibilities',
    category: 'role',
    legalStatus: 'current-law',
    source: anchor('role-integrated-third-party'),
    priority: 31,
    when: (answers) => first(answers, 'origin') === 'integrated-third-party',
    build: () => ({
      evidence: ['Origin selected: configured or integrated third-party AI'],
      explanation: 'Integration choices may change the intended purpose or operational risk profile.',
      role: 'Both',
      scoreDelta: 1,
      confidenceImpact: 1,
      reasons: ['You are using a third-party system, but integration choices may create deployer duties and could create provider-like responsibilities if the intended purpose changes.'],
      missingFacts: ['Confirm whether integration changes the intended purpose communicated by the vendor.'],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: ['New integration, configuration, or workflow automation is added'],
      reportSections: ['Role analysis: deployer/provider/both'],
    }),
  }),
  rule({
    id: 'role-provider-own-product',
    title: 'Own AI product or feature provider role',
    category: 'role',
    legalStatus: 'current-law',
    source: anchor('role-provider-own-product'),
    priority: 32,
    when: (answers) => first(answers, 'origin') === 'own-product',
    build: () => ({
      evidence: ['Origin selected: building own AI product or feature'],
      explanation: 'Building or placing an AI product on the market creates provider-side analysis.',
      role: 'Provider',
      scoreDelta: 2,
      confidenceImpact: 0,
      reasons: ['You may have provider-side responsibilities because you build or place an AI product on the market.'],
      missingFacts: [],
      actions: [
        {
          id: 'provider-document-baseline',
          text: 'Document the intended purpose, your risk classification, the instructions for use, and who owns lifecycle monitoring.',
          kind: 'conditional',
          condition: 'The three duties behind this bind providers of high-risk systems. If this system is not high-risk, none of them applies to you.',
          article: 'Articles 11, 13 and 72',
          corpusArticle: '11',
          basis:
            'Three separate provider duties sit behind this, and all three are scoped to high-risk systems: technical documentation under Article 11, instructions for deployers under Article 13, and post-market monitoring under Article 72. The intended purpose is what the classification turns on, so writing it down is what you need first either way.',
          inPractice:
            'Write the intended purpose down before you argue the tier, not after. Stating it once, plainly, is what makes the classification defensible rather than convenient.',
        },
      ],
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: ['Product intended purpose, model, feature set, or market changes'],
      reportSections: ['Provider obligations summary'],
    }),
  }),
  rule({
    id: 'role-modified-resold',
    title: 'Modified, rebranded, or resold AI creates provider-like exposure',
    category: 'role',
    legalStatus: 'current-law',
    source: anchor('role-modified-resold'),
    priority: 33,
    when: (answers) => first(answers, 'origin') === 'modified-or-resold',
    build: () => ({
      evidence: ['Origin selected: fine-tune, materially modify, rebrand, or resell'],
      explanation: 'Material modification, rebranding, or resale can move an SME beyond ordinary deployer posture.',
      role: 'Both',
      scoreDelta: 2,
      confidenceImpact: 1,
      reasons: ['You may have provider-side responsibilities because you fine-tune, materially modify, rebrand, resell, or set a new intended purpose.'],
      missingFacts: ['Confirm exactly what is modified and whether the original vendor classification still applies.'],
      actions: [
        {
          id: 'modified-keep-change-evidence',
          text: 'Keep evidence of what changed from the vendor baseline, and of who controls the intended purpose.',
          kind: 'good-practice',
          basis:
            'Fine-tuning, rebranding or reselling can move you from deployer to provider, which changes whose duties the AI Act’s high-risk requirements are. This evidence is not itself required by the Regulation — it is what settles which side of that line you are on when someone asks.',
          inPractice:
            'A dated change log against the vendor’s original intended-purpose statement is usually enough. The question it has to answer is whether you changed what the system is for, not merely how it is configured.',
        },
      ],
      vendorQuestions: [
        {
          id: 'vendor-modification-permitted',
          question:
            'Do your terms permit fine-tuning, material modification, rebranding, or resale — and which party do you consider the provider once we do any of those?',
          article: 'Article 3',
          corpusArticle: '3',
          why:
            'Article 3 defines a provider as the party that develops an AI system and places it on the market or puts it into service “under its own name or trademark”. Modifying or rebranding is what carries you across that definition, so one answer settles two questions at once: whether the contract permits the change at all, and whose duties attach to what you end up with.',
        },
      ],
      adjacentRisks: ['Contractual allocation of AI Act and data protection responsibilities should be reviewed.'],
      reviewTriggers: ['Fine-tuning, resale, rebranding, or product positioning changes'],
      reportSections: ['Provider obligations summary'],
    }),
  }),
  rule({
    id: 'role-unclear',
    title: 'User role unclear',
    category: 'role',
    legalStatus: 'current-law',
    source: anchor('role-unclear'),
    priority: 34,
    when: (answers) => first(answers, 'origin') === 'not-sure',
    build: () => ({
      evidence: ['Origin selected: not sure'],
      explanation: 'The tool cannot distinguish deployer from provider duties without knowing whether the SME only uses the system or changes its intended purpose.',
      classification: 'Uncertain',
      role: 'Unclear',
      scoreDelta: 0,
      confidenceImpact: 2,
      reasons: [],
      missingFacts: ['Clarify whether you are only using the tool, or whether you modify, rebrand, resell, or set a new intended purpose for it.'],
      actions: [],
      vendorQuestions: [
        {
          id: 'vendor-role-allocation',
          question:
            'Which party do you consider the provider, deployer, importer, distributor, or product manufacturer for this deployment?',
          article: 'Article 3',
          corpusArticle: '3',
          why:
            'Every duty in the Regulation attaches to a role, and Article 3 defines each of them. A vendor that will not state which role it holds has left the allocation unresolved — which is a contract problem you can still fix during procurement and cannot fix after it.',
        },
      ],
      adjacentRisks: [],
      reviewTriggers: [],
      reportSections: ['Role analysis: deployer/provider/both'],
    }),
  }),
  ...ART5_PRACTICES.map((practice, index) =>
    rule({
      id: `prohibited-art5-${practice.point}`,
      title: `Article 5(1)(${practice.point}) prohibited-practice red flag`,
      category: 'prohibited',
      legalStatus: 'current-law',
      source: art5Source(practice),
      priority: 100 + index,
      when: (answers) => has(answers, 'prohibited_screen', `art5-${practice.point}`),
      build: () =>
        practice.futureDated ? futureProhibitedFinding(practice) : prohibitedFinding(practice),
    })
  ),
  rule({
    id: 'prohibited-uncertain',
    title: 'Prohibited-practice position uncertain',
    category: 'prohibited',
    legalStatus: 'current-law',
    source: anchor('prohibited-uncertain'),
    priority: 120,
    when: (answers) => has(answers, 'prohibited_screen', 'not-sure'),
    build: () => ({
      evidence: ['Prohibited-practice screen selected: not sure'],
      explanation: 'Uncertainty on prohibited practices should lower confidence even where no red flag is confirmed.',
      classification: 'Uncertain',
      scoreDelta: 0,
      confidenceImpact: 2,
      reasons: [],
      missingFacts: ['Confirm whether the system involves any Article 5 prohibited-practice red flags before deployment or renewal.'],
      actions: [],
      vendorQuestions: [
        {
          id: 'vendor-article-5-position',
          question:
            'Is the system designed or technically restricted so that it cannot be used for the practices Article 5 prohibits?',
          article: 'Article 5',
          corpusArticle: '5',
          why:
            'A prohibition bites on the practice, not on the product, so no vendor assurance can certify you out of one. What the answer does tell you is whether the capability is present at all — and because a prohibition admits no compliance route, this is the screening question worth resolving before signature rather than after it.',
        },
      ],
      adjacentRisks: [],
      reviewTriggers: ['System behaviour or use expands into biometric, profiling, or vulnerable-person contexts'],
      reportSections: ['Prohibited-practice screening'],
    }),
  }),
  rule({
    id: 'annex-iii-sensitive-domain',
    title: 'Annex III sensitive-domain trigger',
    category: 'high-risk',
    legalStatus: 'current-law',
    source: anchor('annex-iii-sensitive-domain'),
    priority: 200,
    when: (answers) => hasAny(answers, 'sensitive_domains', annexIIIDomains),
    build: (answers) => ({
      evidence: [`Sensitive domains selected: ${selected(answers, 'sensitive_domains')}`],
      explanation: 'The selected domain maps to an Annex III high-risk area that should be treated as a high-risk candidate unless a narrow exemption is confirmed.',
      classification: 'Likely high-risk',
      scoreDelta: 4,
      confidenceImpact: 1,
      reasons: [`The use touches sensitive AI Act areas: ${selected(answers, 'sensitive_domains')}.`],
      // Where the profiling override fires the exemption is unavailable as a
      // matter of law, so pointing the user at it would contradict the result.
      missingFacts: performsProfiling(answers).value
        ? []
        : ['Annex III use cases default to high-risk under the AI Act. Article 6(3) offers a narrow-task exemption (narrow procedural tasks, improving prior human activity, etc.) — confirm the vendor classification and intended purpose before assuming a lower tier applies.'],
      actions: [ANNEX_III_HIGH_RISK_CANDIDATE],
      // The Article 6(3) classification question belongs to
      // vendor-classification-missing, which asks it with its anchor attached.
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: ['Use expands into a new Annex III domain or affects a new group of people'],
      reportSections: ['Annex III classification rationale'],
    }),
  }),
  rule({
    id: 'annex-iii-primary-use',
    title: 'Primary use suggests Annex III high-risk area',
    category: 'high-risk',
    legalStatus: 'current-law',
    source: anchor('annex-iii-primary-use'),
    priority: 201,
    when: (answers) => {
      const primaryUse = first(answers, 'primary_use')
      return Boolean(primaryUse && primaryUseAnnexIII[primaryUse]) && !hasAny(answers, 'sensitive_domains', annexIIIDomains)
    },
    build: (answers) => {
      const primaryUse = first(answers, 'primary_use') ?? 'unknown'
      return {
        evidence: [`Primary use selected: ${primaryUseAnnexIII[primaryUse] ?? primaryUse}`],
        explanation: 'The primary use sits inside an Annex III area even though the sensitive-domain field did not capture it.',
        classification: 'Likely high-risk',
        scoreDelta: 4,
        confidenceImpact: 2,
        reasons: [`The primary use (${primaryUseAnnexIII[primaryUse] ?? primaryUse}) sits inside an Annex III high-risk area, even though no specific sensitive-domain box was ticked.`],
        missingFacts: ['Confirm the specific sensitive-domain breakdown — the primary use suggests Annex III applicability that should be cross-checked against the actual workflow.'],
        actions: [ANNEX_III_HIGH_RISK_CANDIDATE],
        vendorQuestions: performsProfiling(answers).value
          ? []
          : [
              {
                id: 'vendor-annex-iii-classification',
                question:
                  'Do you classify this use case as high-risk under Annex III, and what intended purpose does that classification rest on?',
                article: 'Article 6(2)',
                corpusArticle: '6',
                why:
                  'Article 6(2) provides that “AI systems referred to in Annex III shall be considered to be high-risk”. The vendor’s classification does not bind you — the tier follows the use, and you control the use — but a vendor with no position on it has not done the analysis you would otherwise be relying on.',
              },
            ],
        adjacentRisks: [],
        reviewTriggers: ['Use case or affected group changes'],
        reportSections: ['Annex III classification rationale'],
      }
    },
  }),
  rule({
    id: 'annex-iii-profiling-override',
    title: 'Article 6(3) profiling override — high-risk is not rebuttable',
    category: 'high-risk',
    legalStatus: 'current-law',
    source: anchor('annex-iii-profiling-override'),
    priority: 199,
    when: (answers) => inAnnexIIIDomain(answers) && performsProfiling(answers).value,
    build: (answers) => {
      const { basis } = performsProfiling(answers)
      const assumed = basis === 'assumed'
      const confidenceOverride = thresholdFactsUnresolved(answers)
        ? undefined
        : assumed
          ? ('Medium' as const)
          : ('High' as const)

      return {
        evidence: [
          assumed
            ? 'Profiling of natural persons: assumed from the use case and decision impact'
            : 'Profiling of natural persons: confirmed',
        ],
        explanation:
          'Article 6(3)’s final subparagraph provides that an Annex III system performing profiling of natural persons shall always be considered high-risk. The provision is unqualified: none of the four narrow-task conditions can rescue such a system.',
        classification: 'Likely high-risk',
        scoreDelta: 4,
        confidenceImpact: 0,
        confidenceOverride,
        reasons: [
          assumed
            ? 'This system operates in an Annex III domain and appears to perform profiling of natural persons. Article 6(3) states that such a system shall always be considered high-risk — the narrow-task exemption is not available to it. This rests on an assumption about profiling rather than a confirmed answer, so confirm it before relying on the tier.'
            : 'This system operates in an Annex III domain and performs profiling of natural persons. Article 6(3) states that such a system shall always be considered high-risk — the narrow-task exemption is not available to it. Treat the high-risk classification as firm rather than provisional.',
        ],
        missingFacts: assumed
          ? ['Confirm whether the system evaluates personal aspects of an individual. The high-risk tier here follows from an assumed answer to that question.']
          : [],
        actions: [
          {
            id: 'profiling-no-exemption',
            text: 'Do not plan around an Article 6(3) narrow-task exemption for this system. It is unavailable as a matter of law.',
            kind: 'duty',
            article: 'Article 6(3)',
            corpusArticle: '6',
            basis:
              'The final subparagraph of Article 6(3) is unqualified: “Notwithstanding the first subparagraph, an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling of natural persons.” None of the four narrow-task conditions can rescue such a system, so there is no exemption argument left to make.',
            inPractice:
              'Plan on the full high-risk requirements. If a vendor’s classification relies on the narrow-task exemption for a system that profiles people, that classification is wrong and worth challenging in writing.',
          },
        ],
        vendorQuestions: [
          {
            id: 'vendor-profiling-proviso',
            question:
              'Does your classification take account of the profiling proviso — that an Annex III system performing profiling of natural persons is always high-risk, with no narrow-task exemption available to it?',
            article: 'Article 6(3)',
            corpusArticle: '6',
            why:
              'The final subparagraph of Article 6(3) is unqualified, so a classification resting on the narrow-task exemption for a system that profiles people is wrong as a matter of law. Asking in writing is what turns that from your inference into their stated position.',
          },
        ],
        adjacentRisks: [],
        reviewTriggers: ['The system stops evaluating personal aspects of individuals, or leaves the Annex III domain'],
        reportSections: ['Annex III classification rationale'],
      }
    },
  }),
  rule({
    id: 'annex-iii-exemption-duties',
    title: 'Claiming the Article 6(3) exemption carries its own duties',
    category: 'high-risk',
    legalStatus: 'current-law',
    source: anchor('annex-iii-exemption-duties'),
    priority: 202,
    // Only where the exemption is actually available — the profiling override
    // forecloses it, and surfacing its consequences there would mislead.
    when: (answers) => inAnnexIIIDomain(answers) && !performsProfiling(answers).value,
    build: (answers) => {
      const provider = hasProviderDuties(answers)
      return {
        evidence: ['Annex III domain present with no profiling of natural persons identified'],
        explanation:
          'Article 6(3) is not a quiet opt-out. A provider relying on it must document the assessment before the system is placed on the market or put into service (Article 6(4)) and must still register itself and the system in the EU database (Article 49(2)).',
        scoreDelta: 0,
        confidenceImpact: 0,
        reasons: [],
        missingFacts: [],
        actions: provider
          ? [
              {
                id: 'exemption-document-assessment',
                text: 'If you rely on the narrow-task exemption, document that assessment before the system is placed on the market or put into service, and produce it on request.',
                kind: 'conditional',
                condition: 'Only if you actually claim the Article 6(3) exemption. Not claiming it costs you nothing here.',
                article: 'Article 6(4)',
                corpusArticle: '6',
                basis:
                  'Article 6(4): “A provider who considers that an AI system referred to in Annex III is not high-risk shall document its assessment before that system is placed on the market or put into service… Upon request of national competent authorities, the provider shall provide the documentation of the assessment.” The exemption is a documented position, not a silent one.',
                inPractice:
                  'The assessment has to exist before launch, not after. Writing it up after a regulator asks does not satisfy the provision, and the date on the document is what shows which happened.',
              },
              {
                id: 'exemption-register-anyway',
                text: 'Register yourself and the system in the EU database even where you rely on the exemption.',
                kind: 'conditional',
                condition: 'Only if you claim the Article 6(3) exemption — the registration duty is attached to the claim.',
                article: 'Article 49(2)',
                corpusArticle: '49',
                basis:
                  'Article 6(4) states that such a provider “shall be subject to the registration obligation set out in Article 49(2)”, and Article 49(2) requires that provider to “register themselves and that system in the EU database referred to in Article 71” before placing it on the market. Claiming the exemption does not take you out of the register; it changes which entry you make.',
                inPractice:
                  'This is the step most often missed, because it feels contradictory — you register a system precisely in order to say it is not high-risk.',
              },
            ]
          : [
              {
                id: 'exemption-obtain-vendor-assessment',
                text: 'Where your vendor relies on the narrow-task exemption, obtain its Article 6(4) assessment for your file.',
                kind: 'good-practice',
                article: 'Article 6(4)',
                corpusArticle: '6',
                basis:
                  'The Article 6(4) duty to document the assessment is the provider’s, not yours — so this is not an obligation on you. But if the vendor’s classification is wrong, the system is high-risk and the deployer duties in Article 26 are yours. Holding the assessment is what makes your own position defensible.',
                inPractice:
                  'Ask for it during procurement, while you still have leverage. A vendor that cannot produce it has not done the assessment.',
              },
            ],
        // The Article 49 registration question is asked once, by
        // vendor-registration-missing, so it is not duplicated here.
        vendorQuestions: provider
          ? []
          : [
              {
                id: 'vendor-exemption-assessment',
                question:
                  'Have you documented the assessment behind your narrow-task exemption, and will you produce that documentation on request?',
                article: 'Article 6(4)',
                corpusArticle: '6',
                why:
                  'Article 6(4) requires a provider relying on the exemption to document its assessment before the system is placed on the market or put into service, and to provide that documentation to national competent authorities on request. The duty is the provider’s and not yours — but if the assessment does not exist, the classification you are relying on has nothing behind it.',
              },
            ],
        adjacentRisks: [],
        reviewTriggers: ['The vendor changes its Article 6(3) position or the system’s intended purpose'],
        reportSections: ['Annex III classification rationale'],
      }
    },
  }),
  rule({
    id: 'high-risk-log-retention',
    title: 'Automatically generated logs must be retained',
    category: 'governance',
    legalStatus: 'current-law',
    source: anchor('high-risk-log-retention'),
    priority: 203,
    when: (answers) => inAnnexIIIDomain(answers),
    build: (answers) => ({
      evidence: ['Annex III domain present'],
      explanation:
        'Article 12 requires the technical capability to record events automatically over the system’s lifetime. The retention period is a separate duty: Article 26(6) for deployers, Article 19(1) for providers.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      actions: hasProviderDuties(answers)
        ? [
            {
              id: 'art-19-1-provider-log-retention',
              text: 'As provider, keep the automatically generated logs for at least six months.',
              kind: 'conditional',
              condition: HIGH_RISK_CONDITION,
              article: 'Article 19(1)',
              corpusArticle: '19',
              basis:
                'Article 19(1) requires providers of high-risk AI systems to keep the Article 12(1) logs “to the extent such logs are under their control”, for “a period appropriate to the intended purpose of the high-risk AI system, of at least six months, unless provided otherwise in the applicable Union or national law, in particular in Union law on the protection of personal data”. Six months is a floor, not a target.',
              inPractice:
                'Check the logs are genuinely under your control — the duty is scoped to those that are. Where they sit with a hosting provider, retention becomes a contract question rather than a configuration one.',
            },
            {
              id: 'art-12-logging-capability',
              text: 'Ensure the system technically records events over its lifetime.',
              kind: 'conditional',
              condition: HIGH_RISK_CONDITION,
              article: 'Article 12',
              corpusArticle: '12',
              basis:
                'Article 12(1): “High-risk AI systems shall technically allow for the automatic recording of events (logs) over the lifetime of the system.” This is a capability requirement on the system itself, and it is a different duty from how long anyone keeps the output — that is Article 19(1) for providers and Article 26(6) for deployers.',
              inPractice:
                'A system that cannot log cannot be made compliant by a retention policy. This one is settled at design or procurement time, not afterwards.',
            },
          ]
        : [
            {
              id: 'art-26-6-deployer-log-retention',
              text: 'As deployer, keep the automatically generated logs under your control for at least six months.',
              kind: 'conditional',
              condition: HIGH_RISK_CONDITION,
              article: 'Article 26(6)',
              corpusArticle: '26',
              basis:
                'Article 26(6) requires deployers of high-risk AI systems to keep the logs the system generates automatically, “to the extent such logs are under their control, for a period appropriate to the intended purpose of the high-risk AI system, of at least six months, unless provided otherwise in applicable Union or national law, in particular in Union law on the protection of personal data”.',
              inPractice:
                'Ask what the vendor’s default retention is, and whether you can export. A six-month floor you cannot reach because the platform rolls logs at 30 days is still your problem.',
            },
            {
              id: 'art-12-logging-capability-vendor',
              text: 'Confirm the system technically records events over its lifetime — that capability is your vendor’s duty, not yours.',
              kind: 'good-practice',
              article: 'Article 12',
              corpusArticle: '12',
              basis:
                'Article 12(1) puts the logging capability on the high-risk system, which makes it the provider’s duty to build. Confirming it is therefore not an obligation on you — but your own Article 26(6) retention duty is unachievable if the capability is absent, so it is worth establishing before you rely on it.',
            },
          ],
      vendorQuestions: [],
      adjacentRisks: [
        'Log retention interacts with GDPR storage limitation — a six-month floor under the AI Act does not license indefinite retention of personal data.',
      ],
      reviewTriggers: ['Log storage, export capability, or retention configuration changes'],
      reportSections: ['Evidence register'],
    }),
  }),
  rule({
    id: 'high-impact-decision',
    title: 'Significant decision impact',
    category: 'high-risk',
    legalStatus: 'operational-risk',
    source: anchor('high-impact-decision'),
    priority: 210,
    when: (answers) => hasAny(answers, 'decision_impact', ['ranking', 'eligibility', 'automated-adverse', 'safety-control']),
    build: (answers) => ({
      evidence: [`Decision impact selected: ${selected(answers, 'decision_impact')}`],
      explanation: 'Ranking, eligibility, automated adverse action, and safety-control uses materially increase risk and support high-risk triage when combined with Annex III or product-safety context.',
      scoreDelta: 3,
      confidenceImpact: 0,
      reasons: ['The output can rank, determine eligibility, automate adverse action, or control safety-related activity.'],
      missingFacts: [],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: ['Less human review or more automation'],
      reportSections: ['Decision impact analysis'],
    }),
  }),
  rule({
    id: 'decision-support',
    title: 'AI influences a human decision',
    category: 'high-risk',
    legalStatus: 'operational-risk',
    source: anchor('decision-support'),
    priority: 211,
    when: (answers) => has(answers, 'decision_impact', 'recommendation'),
    build: () => ({
      evidence: ['Decision impact selected: recommendations influence human decision'],
      explanation: 'Decision support may still be material if humans rely on the system in practice.',
      scoreDelta: 1,
      confidenceImpact: 0,
      reasons: ['The system influences a human decision, so the intended purpose and oversight model matter.'],
      missingFacts: [],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: ['Decision support becomes ranking, scoring, eligibility, or automated action'],
      reportSections: ['Decision impact analysis'],
    }),
  }),
  rule({
    id: 'weak-human-oversight',
    title: 'Weak or absent human oversight',
    category: 'high-risk',
    legalStatus: 'operational-risk',
    source: anchor('weak-human-oversight'),
    priority: 220,
    when: (answers) => hasAny(answers, 'human_oversight', ['rubber-stamp', 'none']),
    build: (answers) => ({
      evidence: [`Human oversight selected: ${selected(answers, 'human_oversight')}`],
      explanation: 'Weak oversight increases operational risk and undermines deployer readiness.',
      scoreDelta: 2,
      confidenceImpact: 0,
      reasons: ['Human oversight appears weak, which increases operational and compliance risk.'],
      missingFacts: [],
      actions: [
        {
          id: 'define-human-oversight-roles',
          text: 'Define who reviews outputs, what they must check, and when they can override the system.',
          kind: 'conditional',
          condition:
            'A duty at the high-risk tier. Below it, this is our recommendation rather than the Regulation’s requirement — but weak oversight is what turns a tool’s error into your decision.',
          article: 'Article 26(2)',
          corpusArticle: '26',
          basis:
            'Article 26(2): deployers of high-risk AI systems “shall assign human oversight to natural persons who have the necessary competence, training and authority, as well as the necessary support.” Article 26(3) preserves your freedom to organise your own resources to achieve it, so the shape is yours to choose — the competence, authority and support are not.',
          inPractice:
            'Name people, not teams, and write down what authority they have to say no. Oversight that cannot override is the rubber stamp the Regulation is trying to prevent.',
        },
      ],
      vendorQuestions: [
        {
          id: 'vendor-oversight-measures',
          question:
            'What human oversight measures do you specify for this system, and what competence do you expect of the people performing them?',
          article: 'Article 13(3)(d)',
          corpusArticle: '13',
          why:
            'Where the system is high-risk, the provider’s instructions for use must state “the human oversight measures referred to in Article 14, including the technical measures put in place to facilitate the interpretation of the outputs”. Below that tier the vendor owes you no answer — but the answer is still what tells you whether your reviewers can act on what they see.',
        },
      ],
      adjacentRisks: [],
      reviewTriggers: ['Human review is reduced, removed, or becomes a rubber stamp'],
      reportSections: ['Human oversight review'],
    }),
  }),
  rule({
    id: 'human-oversight-uncertain',
    title: 'Human oversight uncertain',
    category: 'high-risk',
    legalStatus: 'operational-risk',
    source: anchor('human-oversight-uncertain'),
    priority: 221,
    when: (answers) => has(answers, 'human_oversight', 'not-sure'),
    build: () => ({
      evidence: ['Human oversight selected: not sure'],
      explanation: 'Unclear human oversight lowers confidence in the assessment.',
      scoreDelta: 0,
      confidenceImpact: 1,
      reasons: [],
      missingFacts: ['Confirm whether human review is meaningful and whether reviewers have authority to override the AI output.'],
      actions: [],
      vendorQuestions: [
        {
          id: 'vendor-override-controls',
          question:
            'What override, escalation, and intervention controls does the system provide, and can a reviewer stop or reverse an output in practice?',
          article: 'Article 13(3)(d)',
          corpusArticle: '13',
          why:
            'The same instructions-for-use duty covers the technical measures behind oversight, which is the difference between oversight that exists on an organisation chart and oversight that can act. Ask for the controls rather than for the policy: a policy cannot be tested and a control can.',
        },
      ],
      adjacentRisks: [],
      reviewTriggers: [],
      reportSections: ['Human oversight review'],
    }),
  }),
  rule({
    id: 'article-50-chatbot',
    title: 'AI interaction transparency trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: anchor('article-50-chatbot'),
    priority: 300,
    when: (answers) => has(answers, 'transparency', 'chatbot'),
    build: () => transparencyFinding('people interact directly with an AI chatbot or assistant'),
  }),
  rule({
    id: 'article-50-synthetic-media',
    title: 'Synthetic media transparency trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: anchor('article-50-synthetic-media'),
    priority: 301,
    when: (answers) => has(answers, 'transparency', 'synthetic-media'),
    build: () => transparencyFinding('synthetic images, audio, video, or deepfake-style content'),
  }),
  rule({
    id: 'article-50-published-text',
    title: 'Externally published AI-generated text trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: anchor('article-50-published-text'),
    priority: 302,
    when: (answers) => has(answers, 'transparency', 'published-text'),
    build: () => transparencyFinding('externally published AI-generated text'),
  }),
  rule({
    id: 'article-50-emotion-biometric',
    title: 'Emotion or biometric categorisation transparency trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: anchor('article-50-emotion-biometric'),
    priority: 303,
    when: (answers) => has(answers, 'transparency', 'emotion-biometric'),
    build: () => transparencyFinding('emotion recognition or biometric categorisation'),
  }),
  rule({
    id: 'article-50-customer-service',
    title: 'Customer-facing chatbot transparency trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: anchor('article-50-customer-service'),
    priority: 304,
    // A customer-service / user-facing assistant is the canonical Article 50 case.
    // Fire even if the explicit chatbot transparency box was not ticked, but skip
    // when it was, to avoid emitting a duplicate transparency finding.
    when: (answers) =>
      has(answers, 'primary_use', 'customer-service') && !has(answers, 'transparency', 'chatbot'),
    build: () => transparencyFinding('a customer-facing or user-facing AI assistant'),
  }),
  rule({
    id: 'gpai-product-route',
    title: 'GPAI or AI product route',
    category: 'gpai',
    legalStatus: 'current-law',
    source: anchor('gpai-product-route'),
    priority: 400,
    when: (answers) => has(answers, 'primary_use', 'gpai-product'),
    build: () => ({
      evidence: ['Primary use selected: generative AI product, model, or AI feature sold to others'],
      explanation: 'A generative AI product or model route may create GPAI or provider-side obligations separate from ordinary deployer duties.',
      classification: 'GPAI-related',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: ['A generative AI product or model route may create GPAI or provider-side obligations separate from deployer duties.'],
      missingFacts: ['Confirm whether you provide a GPAI model, a downstream application, or an AI feature built on a third-party model.'],
      actions: [
        {
          id: 'document-gpai-role-and-dependencies',
          text: 'Document your model/application role, the intended purpose, downstream users, and your dependency on third-party model providers.',
          kind: 'good-practice',
          basis:
            'Which duties attach depends on whether you provide a general-purpose AI model, a downstream application built on someone else’s model, or an AI feature inside your own product — and those three sit under different parts of the Regulation. This record is what makes that question answerable; it is not itself a requirement.',
          inPractice:
            'The dependency is the part people skip. If your obligations move when your model provider changes its terms, that is a fact about your compliance posture, not just your architecture.',
        },
      ],
      vendorQuestions: [
        {
          id: 'vendor-gpai-documentation',
          question:
            'If we build on your model: what documentation, acceptable-use restrictions, and advance notice of model changes do you supply to downstream providers?',
          why:
            'Your own duties move when the model provider changes its model, its terms or its acceptable-use policy, so the notice period is a compliance fact before it is a commercial one. No Article anchor is offered here because the general-purpose model chapter is outside the corpus pinned to this assessment — treat the answer as procurement evidence rather than as a citation.',
        },
      ],
      adjacentRisks: [],
      reviewTriggers: ['Model capability, distribution model, or downstream customer base changes'],
      reportSections: ['GPAI/provider route analysis'],
    }),
  }),
  rule({
    id: 'vendor-classification-missing',
    title: 'Vendor classification evidence missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: anchor('vendor-classification-missing'),
    priority: 500,
    when: (answers) => !has(answers, 'vendor_docs', 'classification'),
    build: () => vendorEvidenceFinding(
      'vendor AI Act classification or intended-purpose statement is missing',
      {
        id: 'vendor-evidence-classification',
        question:
          'What AI Act classification and intended purpose do you assign to this system, and if you rely on a narrow-task exemption, can you provide the assessment behind it?',
        article: 'Article 6(3)',
        corpusArticle: '6',
        why:
          'Classification decides which duties exist at all, and intended purpose is what any classification is argued from. Where the vendor relies on the Article 6(3) exemption, Article 6(4) requires that assessment to exist in documented form already — so this asks for a document, not for an opinion.',
      }
    ),
  }),
  rule({
    id: 'vendor-instructions-missing',
    title: 'Instructions and oversight guidance missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: anchor('vendor-instructions-missing'),
    priority: 501,
    when: (answers) => !has(answers, 'vendor_docs', 'instructions'),
    build: () => vendorEvidenceFinding(
      'transparency documentation and instructions for use are missing',
      {
        id: 'vendor-evidence-instructions',
        question:
          'Where is your documentation covering capabilities, performance boundaries, known limitations, and instructions for safe use?',
        article: 'Article 13',
        corpusArticle: '13',
        why:
          'Article 13 requires a high-risk system to be accompanied by instructions for use in a form that is “concise, complete, correct and clear”, covering its characteristics, capabilities and limitations of performance. Below that tier it is not owed to you — but its absence is what leaves you unable to state what the system is for.',
      }
    ),
  }),
  rule({
    id: 'vendor-risk-management-missing',
    title: 'Risk management system documentation missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: anchor('vendor-risk-management-missing'),
    priority: 502,
    when: (answers) => !has(answers, 'vendor_docs', 'risk-management'),
    build: () => vendorEvidenceFinding(
      'risk management system documentation is missing',
      {
        id: 'vendor-evidence-risk-management',
        question:
          'Can you provide your risk management system documentation, showing a process that runs across the system’s lifecycle rather than a one-off exercise at launch?',
        article: 'Article 9',
        corpusArticle: '9',
        why:
          'Article 9 requires the risk management system for a high-risk system to be “a continuous iterative process planned and run throughout the entire lifecycle”, with regular systematic review and updating. A document carrying a single date is evidence that the process does not exist.',
      }
    ),
  }),
  rule({
    id: 'vendor-registration-missing',
    title: 'EU database registration evidence missing',
    category: 'vendor-evidence',
    legalStatus: 'current-law',
    source: anchor('vendor-registration-missing'),
    priority: 503,
    // The sharpest procurement lever in the set, and the one least often asked.
    when: (answers) => inAnnexIIIDomain(answers) && !has(answers, 'vendor_docs', 'registration'),
    build: () => vendorEvidenceFinding(
      'EU database registration reference is missing',
      {
        id: 'vendor-evidence-registration',
        question:
          'Has this system been registered in the EU database? If so, what is the registration reference; if not, what is your timeline?',
        article: 'Article 49',
        corpusArticle: '49',
        why:
          'Article 49 requires the provider of an Annex III high-risk system to “register themselves and that system in the EU database referred to in Article 71” before it is placed on the market. It is the sharpest question in this set because the answer is a public fact you can check rather than a claim you have to take on trust.',
      }
    ),
  }),
  rule({
    id: 'vendor-dpa-missing',
    title: 'Data processing terms missing',
    category: 'vendor-evidence',
    legalStatus: 'adjacent-risk',
    source: anchor('vendor-dpa-missing'),
    priority: 502,
    when: (answers) => !has(answers, 'vendor_docs', 'dpa'),
    build: () => vendorEvidenceFinding(
      'data processing agreement or privacy terms are missing',
      {
        id: 'vendor-evidence-data-terms',
        question:
          'Do you provide a data processing agreement, retention terms, a sub-processor list, and a written position on training with customer data?',
        why:
          'This one is data protection law rather than the AI Act, which is why it carries no Article anchor. It belongs in an AI Act assessment because the same deployment almost always raises both — and because a vendor’s position on training with your data is the term most often absent from the contract and most expensive to discover late.',
      }
    ),
  }),
  rule({
    id: 'vendor-logs-missing',
    title: 'Audit logs or export evidence missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: anchor('vendor-logs-missing'),
    priority: 504,
    when: (answers) => !has(answers, 'vendor_docs', 'logs'),
    build: () => vendorEvidenceFinding(
      'logging, audit, or export options are missing',
      {
        id: 'vendor-evidence-logs',
        question:
          'Does the system automatically record events over its lifetime, and can we export logs, decisions, prompts, outputs, user actions, and configuration history for audit?',
        article: 'Articles 12 and 26(6)',
        corpusArticle: '12',
        why:
          'Article 12 puts the recording capability on the provider. Article 26(6) puts the keeping of those logs on you, “for a period appropriate to the intended purpose of the high-risk AI system, of at least six months”, to the extent they are under your control. A system that cannot export what it recorded leaves you owing a duty you have no means to discharge.',
      }
    ),
  }),
  rule({
    id: 'vendor-change-policy-missing',
    title: 'Vendor change-control evidence missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: anchor('vendor-change-policy-missing'),
    priority: 505,
    when: (answers) => !has(answers, 'vendor_docs', 'change-policy'),
    build: () => vendorEvidenceFinding(
      'model update or change notification policy is missing',
      {
        id: 'vendor-evidence-change-policy',
        question:
          'What does your post-market monitoring cover, and how will you notify us of model, feature, policy, or performance changes?',
        article: 'Article 72',
        corpusArticle: '72',
        why:
          'Article 72 requires providers of high-risk systems to establish and document a post-market monitoring system proportionate to the risks. Your side of it is simpler and nowhere written down: an assessment is current only until the system changes, and you cannot re-run it on a change nobody told you about.',
      }
    ),
  }),
  rule({
    id: 'vendor-docs-none-or-unknown',
    title: 'Vendor evidence pack absent or unknown',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: anchor('vendor-docs-none-or-unknown'),
    priority: 505,
    when: (answers) => values(answers, 'vendor_docs').length === 0 || hasAny(answers, 'vendor_docs', ['none', 'not-sure']),
    build: () => ({
      evidence: ['Vendor evidence selected: none, not sure, or unanswered'],
      explanation: 'A missing vendor evidence pack prevents a defensible assessment for SME deployers.',
      scoreDelta: 0,
      confidenceImpact: 1,
      reasons: [],
      missingFacts: ['Obtain the vendor intended-purpose statement, AI Act classification, instructions for use, oversight guidance, and data processing terms.'],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: ['Vendor evidence pack is received or materially updated'],
      reportSections: ['Vendor due diligence questionnaire'],
    }),
  }),
  rule({
    id: 'sme-proportionate-relief',
    title: 'SME and start-up proportionate treatment',
    category: 'governance',
    legalStatus: 'current-law',
    source: anchor('sme-proportionate-relief'),
    priority: 650,
    when: (answers) => hasAny(answers, 'org_size', ['micro', 'small', 'medium']),
    build: (answers) => ({
      evidence: ['Organisation size: SME'],
      explanation:
        'The AI Act treats SMEs and start-ups proportionately on documentation, quality management, sandbox access, and fine ceilings. The documentation and quality-management reliefs are reliefs from provider duties on high-risk systems, so they only apply on that path.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      actions: sizeReliefActions(answers, ART_99_6_LOWER_OF),
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: ['Organisation grows past the SME thresholds'],
      reportSections: ['Classification rationale and confidence'],
    }),
  }),
  rule({
    id: 'smc-proportionate-relief',
    title: 'Small mid-cap proportionate treatment',
    category: 'governance',
    legalStatus: 'current-law',
    source: anchor('smc-proportionate-relief'),
    priority: 651,
    when: (answers) => has(answers, 'org_size', 'small-mid-cap'),
    build: (answers) => ({
      evidence: ['Organisation size: small mid-cap (SMC)'],
      explanation:
        'The Digital Omnibus extended several SME reliefs to small mid-caps, a category defined by reference to point (2) of the Annex to Recommendation (EU) 2025/1099. The fine relief is narrower than the SME version.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      actions: sizeReliefActions(answers, ART_99_6A_LOWER_OF_SMC),
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: ['Organisation grows past the small mid-cap thresholds'],
      reportSections: ['Classification rationale and confidence'],
    }),
  }),
  rule({
    id: 'gdpr-personal-data',
    title: 'Personal data adjacent risk',
    category: 'gdpr-vendor',
    legalStatus: 'adjacent-risk',
    source: anchor('gdpr-personal-data'),
    priority: 600,
    when: (answers) => hasAny(answers, 'data_types', ['personal', 'employee', 'health', 'children', 'biometric', 'special-category']),
    build: () => ({
      evidence: ['Personal or sensitive data selected'],
      explanation: 'Personal data does not automatically change AI Act classification, but it creates a separate governance and evidence requirement.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: ['Personal or sensitive data is involved; check GDPR lawful basis, minimisation, retention, security, and DPIA requirements.'],
      reviewTriggers: ['New data category or more personal data'],
      reportSections: ['Adjacent GDPR and vendor-risk addendum'],
    }),
  }),
  rule({
    id: 'gdpr-sensitive-data',
    title: 'Sensitive data adjacent risk',
    category: 'gdpr-vendor',
    legalStatus: 'adjacent-risk',
    source: anchor('gdpr-sensitive-data'),
    priority: 601,
    when: (answers) => hasAny(answers, 'data_types', ['employee', 'health', 'children', 'biometric', 'special-category']),
    build: () => ({
      evidence: ['Employee, health, children, biometric, or special-category data selected'],
      explanation: 'Sensitive data contexts warrant human data-protection review alongside the AI Act triage.',
      scoreDelta: 0,
      confidenceImpact: 1,
      reasons: [],
      missingFacts: [],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: ['Sensitive data context detected; a human data protection review is recommended alongside AI Act triage.'],
      reviewTriggers: ['Sensitive data category or affected group changes'],
      reportSections: ['Adjacent GDPR and vendor-risk addendum'],
    }),
  }),
  rule({
    id: 'sector-vendor-contract-risk',
    title: 'Sector vendor contract risk',
    category: 'gdpr-vendor',
    legalStatus: 'adjacent-risk',
    source: anchor('sector-vendor-contract-risk'),
    priority: 602,
    when: (answers) => hasAny(answers, 'sensitive_domains', ['employment', 'healthcare', 'credit', 'insurance', 'biometrics']),
    build: () => ({
      evidence: ['Sensitive sector selected'],
      explanation: 'Certain sectors require stronger vendor evidence, audit rights, and contract review even where the AI Act classification is still being confirmed.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      actions: [],
      vendorQuestions: [],
      adjacentRisks: ['This use sits in a sector where vendor contracts, audit rights, and evidence quality matter materially.'],
      reviewTriggers: ['Vendor contract renewal or procurement review'],
      reportSections: ['Adjacent GDPR and vendor-risk addendum'],
    }),
  }),
  rule({
    id: 'system-record-obligation',
    title: 'AI system record baseline',
    category: 'governance',
    legalStatus: 'operational-risk',
    source: anchor('system-record-obligation'),
    priority: 700,
    when: () => true,
    build: () => ({
      evidence: ['Baseline governance rule'],
      explanation: 'Every assessment should produce a reusable AI system record rather than a one-off answer.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      actions: [
        {
          id: 'maintain-ai-system-record',
          text: 'Maintain an AI system record covering intended purpose, owner, users, affected people, data, vendor, and review date.',
          kind: 'good-practice',
          basis:
            'This is our recommendation, not a requirement of the Regulation — no provision of the AI Act obliges an SME deploying a system that is not high-risk to keep a register. It earns its place because it is what every duty that could apply presupposes you can produce: the Article 26 deployer obligations, Article 11 technical documentation, Article 72 post-market monitoring. It is also what makes this assessment re-usable when the system changes, rather than an answer with a shelf life.',
          inPractice:
            'One row per system. The review date is the field that does the work — it is what turns a document into a process.',
        },
        {
          id: 'retain-governance-evidence',
          text: 'Keep evidence of vendor documentation, internal oversight decisions, and material changes.',
          kind: 'good-practice',
          basis:
            'Also our recommendation rather than a statutory duty. Every position in this result — the tier, your role, your oversight model — rests on evidence you either hold or do not. Holding it is the difference between a position and an assertion when a customer, an insurer or an authority asks how you reached it.',
          inPractice:
            'Keep the vendor’s own words: its classification, its intended-purpose statement, its instructions. A summary you wrote is evidence of what you believed, not of what you were told.',
        },
      ],
      vendorQuestions: [],
      adjacentRisks: [],
      reviewTriggers: [],
      reportSections: [
        'AI system record',
        'Classification rationale and confidence',
        'Role analysis: deployer/provider/both',
        'Evidence register',
        '30/60/90-day action plan',
      ],
    }),
  }),
  rule({
    id: 'ongoing-review-triggers',
    title: 'Ongoing reassessment triggers',
    category: 'governance',
    legalStatus: 'operational-risk',
    source: anchor('ongoing-review-triggers'),
    priority: 701,
    when: () => true,
    build: (answers) => {
      const triggers = values(answers, 'change_control')
      return {
        evidence: triggers.length ? [`Selected review triggers: ${triggers.join(', ')}`] : ['No review trigger selected'],
        explanation: 'The assessment should remain useful after implementation dates by defining when it must be revisited.',
        scoreDelta: 0,
        confidenceImpact: 0,
        reasons: [],
        missingFacts: [],
        actions: [],
        vendorQuestions: [],
        adjacentRisks: [],
        reviewTriggers: triggers.length ? triggers.map(reviewTriggerLabel) : [
          'Annual AI register review',
          'Vendor model, terms, or feature changes',
          'Less human review or more automation',
        ],
        reportSections: ['Ongoing review schedule'],
      }
    },
  }),
]

/**
 * The size reliefs that apply, given who the reader is.
 *
 * Articles 11(1) and 17(2) relieve *provider* duties on *high-risk* systems, so
 * they are gated on that path with the same predicates the Article 6(4) and
 * log-retention rules already use. Firing them on organisation size alone — as
 * this did — told an SME deploying a minimal-risk chatbot that it could simplify
 * Annex IV technical documentation it never owed, and scale down a quality
 * management system Article 17(1) never required of it.
 *
 * Sandbox access and the fine ceiling are not tier-dependent, so they always
 * apply. The penalty item differs between SMEs and SMCs and is passed in.
 */
function sizeReliefActions(answers: AssessmentAnswers, penaltyRelief: RuleItem): RuleItem[] {
  const highRiskProvider = hasProviderDuties(answers) && inAnnexIIIDomain(answers)
  return [
    ...(highRiskProvider ? [ART_11_SIMPLIFIED_DOCS, ART_17_PROPORTIONATE_QMS] : []),
    ART_57_SANDBOX_PRIORITY,
    penaltyRelief,
  ]
}

/**
 * The practice is passed whole rather than as a label so each item can carry its
 * own point-level anchor — `Article 5(1)(f)` rather than a generic `Article 5`.
 * The "stop" item's id is per-point for the same reason: two selected practices
 * produce two anchored bullets, where the old identical prose collapsed to one.
 */
function prohibitedFinding(practice: Art5Practice): Omit<RuleFinding, 'id' | 'title' | 'category' | 'version' | 'lastReviewed' | 'legalStatus' | 'source'> {
  const label = practice.summary
  return {
    evidence: [`Prohibited-practice screen selected: ${label}`],
    explanation: `The selected use involves ${label}, which is a prohibited-practice red flag requiring immediate review.`,
    classification: 'Prohibited practice',
    scoreDelta: 100,
    confidenceImpact: 0,
    reasons: ['One or more selected practices maps to a prohibited-practice red flag and needs immediate human/legal review.'],
    missingFacts: [],
    actions: [
      {
        id: `stop-prohibited-use-${practice.point}`,
        text: `Stop or pause this use — ${label} — until the prohibited-practice position is reviewed.`,
        kind: 'duty',
        article: `Article 5(1)(${practice.point})`,
        corpusArticle: '5',
        basis: `Article 5(1) prohibits this practice outright, and has done since ${practice.appliesFrom}. A prohibition is not a requirement you can satisfy: there is no conformity assessment route, no documentation that cures it, and no risk-management measure that makes it lawful.`,
        inPractice:
          'This is the one result in the tool that warrants a call to a lawyer today rather than a plan. Prohibited-practice infringements also carry the highest penalty ceiling in the Regulation.',
      },
      {
        id: 'document-prohibited-use-case',
        text: 'Document the use case, affected people, and vendor/system behaviour before any further deployment.',
        kind: 'good-practice',
        basis:
          'Not a requirement of the Regulation — it is what your own legal review will ask for first. Pausing a use without recording why tends to mean the same use returns in six months under a different name.',
      },
    ],
    vendorQuestions: [
      {
        id: `vendor-prohibited-capability-${practice.point}`,
        question: `Is this system designed, marketed, or technically capable of the use we have flagged — ${label}?`,
        article: `Article 5(1)(${practice.point})`,
        corpusArticle: '5',
        why: `Article 5(1) prohibits this practice outright, and has done since ${practice.appliesFrom}. Nothing the vendor says makes it lawful — but a written answer is the first thing your legal review will ask for, and a vendor that markets the capability has told you where the risk sits.`,
      },
    ],
    adjacentRisks: [],
    reviewTriggers: ['Any biometric, profiling, worker, education, public-space, or vulnerable-person use is proposed'],
    reportSections: ['Prohibited-practice screening'],
  }
}

/**
 * Article 5(1)(ba) and (bb) apply from 2 December 2026. Until then the practice
 * is lawful, so this finding plans a withdrawal against a date rather than
 * ordering an immediate stop — and it scores below `prohibitedFinding` so a
 * practice prohibited today always takes the headline.
 */
function futureProhibitedFinding(practice: Art5Practice): Omit<RuleFinding, 'id' | 'title' | 'category' | 'version' | 'lastReviewed' | 'legalStatus' | 'source'> {
  const label = practice.summary
  return {
    evidence: [`Prohibited-practice screen selected: ${label}`],
    explanation: `The selected use involves ${label}, which becomes a prohibited practice on 2 December 2026 under Article 5(1)(ba)–(bb), inserted by Regulation (EU) 2026/1744. It is not prohibited today.`,
    classification: 'Prohibited from 2 December 2026',
    scoreDelta: 50,
    confidenceImpact: 0,
    reasons: [
      'A selected practice is prohibited from 2 December 2026 under the Digital Omnibus amendments. It is not prohibited today, but the use cannot continue past that date.',
    ],
    missingFacts: [],
    actions: [
      {
        id: `plan-withdrawal-${practice.point}`,
        text: `Plan the redesign, restriction, or withdrawal of this use — ${label} — so it is complete before ${practice.appliesFrom}.`,
        kind: 'duty',
        article: `Article 5(1)(${practice.point})`,
        corpusArticle: '5',
        basis: `Inserted by Regulation (EU) 2026/1744 and prohibited from ${practice.appliesFrom}. It is not prohibited today, which is why this is a date to finish work against rather than an instruction to stop now — but a prohibition admits no compliance route, so there is nothing to build towards except stopping.`,
        inPractice:
          'Work back from the date. A redesign that lands the week before leaves no room for the safeguards below to be tested.',
      },
      {
        id: 'document-art-5-1a-safeguards',
        text: 'Document the intended purpose and the technical safeguards that prevent this output.',
        kind: 'good-practice',
        article: 'Article 5(1a)',
        corpusArticle: '5',
        basis:
          'Article 5(1a) decides when these two prohibitions bite, and it reaches further than intended purpose: the practice is caught where generation or manipulation is the intended purpose, or else where the system’s “design, training, architecture, capabilities or user-facing functionalities make that generation or manipulation a reasonably foreseeable and reproducible outcome, without requiring significant technical modification, and the system does not have reasonable and adequate technical safety measures”. The safeguards are what keep a general-purpose system outside the prohibition; the documentation is what shows they were there.',
        inPractice:
          'Record what the safeguards are and when you tested them. "Reasonably foreseeable and reproducible" is a question about capability, not about what anyone intended.',
      },
    ],
    vendorQuestions: [
      {
        id: `vendor-future-prohibited-safeguards-${practice.point}`,
        question: `What technical safety measures prevent this system being used for ${label}, and will you attest to compliance before ${practice.appliesFrom}?`,
        article: `Article 5(1)(${practice.point})`,
        corpusArticle: '5',
        why: `The practice is prohibited from ${practice.appliesFrom}. Article 5(1a) decides when the prohibition reaches a general-purpose system, and it turns on whether the system’s design and capabilities make that use a reasonably foreseeable and reproducible outcome absent reasonable and adequate technical safety measures — so the safeguards, and evidence that they were tested, are what keep the system outside it.`,
      },
    ],
    adjacentRisks: [
      'Non-consensual intimate imagery and CSAM carry criminal and platform-liability exposure independent of the AI Act; this is a matter for legal counsel now, not on 2 December 2026.',
    ],
    reviewTriggers: [
      'Approach of the 2 December 2026 prohibition date',
      'Any change to model capability, safety filters, or output restrictions',
    ],
    reportSections: ['Prohibited-practice screening'],
  }
}

function transparencyFinding(label: string): Omit<RuleFinding, 'id' | 'title' | 'category' | 'version' | 'lastReviewed' | 'legalStatus' | 'source'> {
  return {
    evidence: [`Transparency signal selected: ${label}`],
    explanation: 'Article 50-style transparency duties may apply where users interact with AI or content is generated, synthetic, or biometric/emotion related.',
    classification: 'Likely limited-risk',
    scoreDelta: 1,
    confidenceImpact: 0,
    reasons: ['The system may trigger transparency duties because it interacts with people, generates content, or detects emotion/biometric categories.'],
    missingFacts: [],
    // One shared id across all five Article 50 rules, so several transparency
    // signals still produce one bullet rather than five identical ones.
    actions: [
      {
        id: 'transparency-inform-and-label',
        text: 'Tell people when they are interacting with AI, and mark AI-generated or synthetic content.',
        kind: 'duty',
        article: 'Article 50',
        corpusArticle: '50',
        basis:
          'Article 50 splits these duties by role, and each limb carries its own exceptions. 50(1) puts the “you are interacting with an AI system” disclosure on providers, unless it is obvious to a reasonably well-informed, observant and circumspect person. 50(2) requires providers of systems generating synthetic audio, image, video or text to mark outputs in a machine-readable, detectable format. 50(3) requires deployers of emotion-recognition or biometric-categorisation systems to inform the people exposed to them. 50(4) requires deployers to disclose deep fakes, and AI-generated text published to inform the public on matters of public interest.',
        inPractice:
          'Work out which limb you are on before designing the notice. The provider-side machine-readable marking duty and the deployer-side disclosure duty are different jobs, and a banner on your site satisfies neither on its own.',
      },
    ],
    vendorQuestions: [
      {
        id: 'vendor-transparency-controls',
        question:
          'What user-facing disclosure, labelling, and machine-readable marking does the system provide, and which of those can we configure?',
        article: 'Article 50',
        corpusArticle: '50',
        why:
          'Article 50 places disclosure duties on providers and deployers alike, and the deployer half is unsatisfiable where the vendor supplies no controls to satisfy it with. Establish what exists before you tell a customer or a regulator that a notice is in place.',
      },
    ],
    adjacentRisks: [],
    reviewTriggers: ['The system becomes user-facing or begins generating external content'],
    reportSections: ['Transparency obligations'],
  }
}

function vendorEvidenceFinding(
  evidence: string,
  question: VendorQuestion
): Omit<RuleFinding, 'id' | 'title' | 'category' | 'version' | 'lastReviewed' | 'legalStatus' | 'source'> {
  return {
    evidence: [`Vendor evidence gap: ${evidence}`],
    explanation: 'The missing item should be collected before relying on the system in a regulated or material workflow.',
    scoreDelta: 0,
    confidenceImpact: 0,
    reasons: [],
    missingFacts: [],
    actions: [],
    vendorQuestions: [question],
    adjacentRisks: [],
    reviewTriggers: [],
    reportSections: ['Vendor due diligence questionnaire'],
  }
}

function reviewTriggerLabel(value: string): string {
  const labels: Record<string, string> = {
    'new-use': 'New department or use case',
    'new-data': 'New data category or more personal data',
    'more-automation': 'Less human review or more automation',
    'vendor-change': 'Vendor model, terms, or feature changes',
    complaint: 'Customer, worker, or regulator complaint',
    'annual-review': 'Annual AI register review',
  }
  return labels[value] ?? value
}

export function evaluateRuleLibrary(answers: AssessmentAnswers): RuleEvaluation {
  const firedRules = AI_ACT_RULE_LIBRARY
    .filter((item) => item.when(answers))
    .sort((a, b) => a.priority - b.priority)
    .map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      version: item.version,
      lastReviewed: item.lastReviewed,
      legalStatus: item.legalStatus,
      source: item.source,
      ...item.build(answers),
    }))

  const score = firedRules.reduce((total, item) => total + item.scoreDelta, 0)
  const confidenceImpact = firedRules.reduce((total, item) => total + item.confidenceImpact, 0)
  const classification = pickClassification(firedRules, score)
  const role = pickRole(firedRules)

  const reasons = unique(flatten(firedRules.map((item) => item.reasons)))
  const missingFacts = unique(flatten(firedRules.map((item) => item.missingFacts)))
  // Deduped by `id`, not by prose: two rules wording the same duty slightly
  // differently used to render twice, because the string was the only identity
  // an item had. The rule id rides along so the UI can join an item back to the
  // "Rules fired" audit card.
  const actions = uniqueBy(
    flatten(firedRules.map((rule) => rule.actions.map((item) => ({ ...item, ruleId: rule.id })))),
    (item) => item.id
  )
  // Deduped by `id` for the same reason the actions are: the rule that owns
  // the anchor and the rule that merely raises the topic used to emit two
  // near-identical strings, and only one of them carried a citation.
  const vendorQuestions = uniqueBy(
    flatten(firedRules.map((rule) => rule.vendorQuestions.map((item) => ({ ...item, ruleId: rule.id })))),
    (item) => item.id
  )
  const adjacentRisks = unique(flatten(firedRules.map((item) => item.adjacentRisks)))
  const reviewTriggers = unique(flatten(firedRules.map((item) => item.reviewTriggers)))
  const reportSections = unique(flatten(firedRules.map((item) => item.reportSections)))

  return {
    firedRules,
    sourceReferences: uniqueBy(
      firedRules.map((item) => ({ label: item.source.label, url: item.source.url })),
      (item) => item.url
    ),
    score,
    role,
    classification,
    confidence: applyConfidenceOverride(
      confidenceImpact >= 3 || missingFacts.length >= 3 ? 'Low' : confidenceImpact >= 1 || missingFacts.length >= 1 ? 'Medium' : 'High',
      firedRules
    ),
    reasons: reasons.length ? reasons : ['No high-risk, prohibited-practice, transparency, or GPAI trigger was selected, based on the answers provided.'],
    missingFacts,
    actions,
    vendorQuestions,
    adjacentRisks,
    reviewTriggers,
    reportSections,
  }
}

const confidenceRank: Record<'Low' | 'Medium' | 'High', number> = { Low: 0, Medium: 1, High: 2 }

/**
 * Confidence is normally derived from how much the answer set leaves unknown.
 * That is the right default, but it under-reports the cases where the law is
 * unambiguous and the remaining gaps are about *readiness*, not about which
 * tier applies — a system caught by the Article 6(3) profiling proviso is
 * high-risk whether or not its vendor has produced a DPA.
 *
 * An override only ever raises the reported confidence, and the strongest one
 * that fired wins.
 */
function applyConfidenceOverride(
  base: 'High' | 'Medium' | 'Low',
  rules: RuleFinding[]
): 'High' | 'Medium' | 'Low' {
  return rules.reduce<'High' | 'Medium' | 'Low'>((current, item) => {
    if (!item.confidenceOverride) return current
    return confidenceRank[item.confidenceOverride] > confidenceRank[current] ? item.confidenceOverride : current
  }, base)
}

function pickClassification(rules: RuleFinding[], score: number): Classification {
  // Territorial scope is a threshold question. If the scope rule has cleared
  // the user as out-of-scope, content-based rules (prohibited practice, Annex
  // III high-risk, etc.) must not override the headline classification —
  // their findings still appear in reasons / obligations / review triggers as
  // signals to revisit if the EU connection later changes.
  const outOfScope = rules.some((item) => item.classification === 'Out of EU scope')
  if (outOfScope) return 'Out of EU scope'

  const hasGpaiRoute = rules.some((item) => item.classification === 'GPAI-related')
  const explicit = rules
    .map((item) => item.classification)
    .filter((item): item is Classification => Boolean(item) && item !== 'Out of EU scope')
    .sort((a, b) => classificationRank[b] - classificationRank[a])[0]

  if (explicit) {
    if (explicit === 'GPAI-related' && score >= 5) return 'Likely high-risk'
    if (hasGpaiRoute && explicit === 'Likely limited-risk') return 'GPAI-related'
    return explicit
  }

  if (score >= 5) return 'Likely high-risk'
  if (score >= 2) return 'Likely limited-risk'
  return 'Likely minimal-risk'
}

function pickRole(rules: RuleFinding[]): UserRole {
  return rules
    .map((item) => item.role)
    .filter((item): item is UserRole => Boolean(item))
    .sort((a, b) => roleRank[b] - roleRank[a])[0] ?? 'Deployer'
}

function flatten<T>(items: T[][]): T[] {
  return items.flat()
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const value = key(item)
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}
