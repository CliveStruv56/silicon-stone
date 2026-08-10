import type {
  AssessmentAnswers,
  Classification,
  SourceReference,
  UserRole,
} from './ai-act-assessment'

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
  obligations: string[]
  vendorQuestions: string[]
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
  obligations: string[]
  vendorQuestions: string[]
  adjacentRisks: string[]
  reviewTriggers: string[]
  reportSections: string[]
}

const RULE_VERSION = '2026-08-10'
const LAST_REVIEWED = '2026-08-10'

/**
 * Rule-base changelog. Every entry is a legal claim; verify against the
 * consolidated text before adding one.
 *
 * v2026-08-10 — Digital Omnibus on AI (Regulation (EU) 2026/1744, OJ 24.7.2026,
 *   in force 27.7.2026): Annex III high-risk → 2 Dec 2027; Annex I → 2 Aug 2028;
 *   new Art 5(1)(ba) and (bb) prohibitions from 2 Dec 2026; SMC category added
 *   (Arts 11, 17, 57, 99(6a)). Art 50 transparency in force 2 Aug 2026.
 *   Corrected penalty tiers: Art 50 and GPAI sit at €15M/3% (Arts 99(4)(g), 101)
 *   — no 1.5% band exists. Added the Art 6(3) profiling override. Retention
 *   re-cited to Arts 19(1)/26(6), with Art 12 as the logging capability only.
 *   Art 57(1) sandbox deadline extended to 2 Aug 2027 (from 2 Aug 2026) — this
 *   is a separate provision from the 2 Dec 2027 Annex III application date, and
 *   must not be described as unchanged.
 * v2026-06-02 — initial versioned rule base.
 */
export const RULE_BASE_VERSION = RULE_VERSION

const sources = {
  overview: {
    label: 'European Commission AI Act overview',
    article: 'AI Act overview',
    publisher: 'European Commission',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
  },
  article2: {
    label: 'AI Act Service Desk: Article 2 territorial scope',
    article: 'Article 2',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-2',
  },
  article5: {
    label: 'AI Act Service Desk: Article 5 prohibited AI practices',
    article: 'Article 5',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
  },
  article6: {
    label: 'AI Act Service Desk: Article 6 high-risk classification',
    article: 'Article 6',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6',
  },
  annex3: {
    label: 'AI Act Service Desk: Annex III high-risk areas',
    article: 'Annex III',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3',
  },
  article12: {
    label: 'AI Act Service Desk: Article 12 record-keeping',
    article: 'Article 12',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12',
  },
  article9: {
    label: 'AI Act Service Desk: Article 9 risk management system',
    article: 'Article 9',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-9',
  },
  article11: {
    label: 'AI Act Service Desk: Article 11 technical documentation',
    article: 'Article 11',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-11',
  },
  article13: {
    label: 'AI Act Service Desk: Article 13 transparency and information provision',
    article: 'Article 13',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-13',
  },
  article72: {
    label: 'AI Act Service Desk: Article 72 post-market monitoring',
    article: 'Article 72',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-72',
  },
  article99: {
    label: 'AI Act Service Desk: Article 99 penalties',
    article: 'Article 99',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99',
  },
  article19: {
    label: 'AI Act Service Desk: Article 19 automatically generated logs',
    article: 'Article 19',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-19',
  },
  article49: {
    label: 'AI Act Service Desk: Article 49 registration',
    article: 'Article 49',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-49',
  },
  article26: {
    label: 'AI Act Service Desk: Article 26 deployer obligations',
    article: 'Article 26',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
  },
  article50: {
    label: 'AI Act Service Desk: Article 50 transparency obligations',
    article: 'Article 50',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50',
  },
  article51: {
    label: 'AI Act Service Desk: Article 51 GPAI systemic risk',
    article: 'Article 51',
    publisher: 'European Commission AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-51',
  },
  omnibus: {
    label: 'Regulation (EU) 2026/1744 (Digital Omnibus on AI), in force 27 July 2026',
    article: 'Article 5(1)',
    publisher: 'Official Journal of the European Union',
    url: 'https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng',
  },
  gdpr: {
    label: 'ICO: Data protection impact assessments',
    article: 'GDPR DPIA due diligence',
    publisher: 'Information Commissioner’s Office',
    url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/',
  },
} satisfies Record<string, RuleSource>

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

interface Art5Practice {
  /** The point within Article 5(1), e.g. 'a', 'ba'. Also the rule-ID suffix. */
  point: string
  /** Short phrase used in the fired-rule evidence and explanation copy. */
  summary: string
  /**
   * True for the two points inserted by Regulation (EU) 2026/1744, which apply
   * from 2 December 2026 rather than 2 February 2025. These produce a
   * future-dated verdict — telling someone to "stop now" over a prohibition
   * that does not yet exist would be as wrong as missing it entirely.
   */
  futureDated?: boolean
}

/**
 * Article 5(1) as consolidated at CELEX 02024R1689-20260727 — ten points, after
 * the Omnibus inserted the intercalated (ba) and (bb). Listed in the order the
 * question presents them, which groups the two law-enforcement-scoped points
 * (d, h) last rather than following the Regulation's lettering.
 */
const ART5_PRACTICES: Art5Practice[] = [
  { point: 'a', summary: 'subliminal, purposefully manipulative, or deceptive techniques that materially distort behaviour' },
  { point: 'b', summary: 'exploitation of vulnerabilities of age, disability, or a specific social or economic situation' },
  { point: 'ba', summary: 'generating or manipulating non-consensual intimate imagery of an identifiable person', futureDated: true },
  { point: 'bb', summary: 'generating or manipulating child sexual abuse material', futureDated: true },
  { point: 'c', summary: 'social scoring leading to detrimental or disproportionate treatment' },
  { point: 'e', summary: 'untargeted scraping of facial images to build or expand recognition databases' },
  { point: 'f', summary: 'inferring emotions in the workplace or in educational institutions' },
  { point: 'g', summary: 'biometric categorisation deducing protected characteristics' },
  { point: 'd', summary: 'predicting criminal offences based solely on profiling or personality traits' },
  { point: 'h', summary: '“real-time” remote biometric identification in publicly accessible spaces for law enforcement' },
]

/**
 * Anchor each practice to its own point. The two Omnibus insertions cite the
 * amending Regulation, since the Service Desk page for Article 5 is not the
 * authority for text that Regulation (EU) 2026/1744 introduced.
 */
function art5Source(practice: Art5Practice): RuleSource {
  const base = practice.futureDated ? sources.omnibus : sources.article5
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

export const AI_ACT_RULE_LIBRARY: AssessmentRule[] = [
  rule({
    id: 'scope-no-eu-connection',
    title: 'No clear EU territorial connection',
    category: 'scope',
    legalStatus: 'current-law',
    source: sources.article2,
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
      obligations: ['Confirm and document the territorial scope position before deprioritising AI Act work; revisit if EU usage, customers, or outputs change.'],
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
    source: sources.article2,
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
      obligations: [],
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
    source: sources.article26,
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
      obligations: [],
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
    source: sources.article26,
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
      obligations: [],
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
    source: sources.overview,
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
      obligations: ['Document intended purpose, risk classification, instructions for use, and lifecycle monitoring responsibilities.'],
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
    source: sources.overview,
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
      obligations: ['Maintain evidence of what changed from the vendor baseline and who controls intended purpose.'],
      vendorQuestions: ['Does the vendor permit fine-tuning, resale, rebranding, or material modification under its AI Act and product terms?'],
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
    source: sources.overview,
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
      obligations: [],
      vendorQuestions: ['Ask the vendor which party is provider, deployer, importer, distributor, or product manufacturer for this deployment.'],
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
        practice.futureDated
          ? futureProhibitedFinding(practice.summary)
          : prohibitedFinding(practice.summary),
    })
  ),
  rule({
    id: 'prohibited-uncertain',
    title: 'Prohibited-practice position uncertain',
    category: 'prohibited',
    legalStatus: 'current-law',
    source: sources.article5,
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
      obligations: [],
      vendorQuestions: ['Ask the vendor whether the system is designed or restricted to avoid Article 5 prohibited practices.'],
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
    source: sources.annex3,
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
      obligations: ['Treat this as a likely high-risk candidate until the vendor classification and intended-purpose evidence are confirmed.'],
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
    source: sources.annex3,
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
        obligations: ['Treat this as a likely high-risk candidate until the vendor classification and intended-purpose evidence are confirmed.'],
        vendorQuestions: performsProfiling(answers).value
          ? []
          : ['Does the vendor classify this use case as high-risk under Annex III?'],
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
    source: sources.article6,
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
        obligations: [
          'Do not plan around an Article 6(3) narrow-task exemption for this system. Where profiling of natural persons is performed, the exemption is unavailable as a matter of law.',
        ],
        vendorQuestions: [
          'Does the vendor acknowledge that Article 6(3)’s profiling proviso removes the narrow-task exemption for this system, and does its classification reflect that?',
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
    source: sources.article49,
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
        obligations: provider
          ? [
              'If you rely on an Article 6(3) narrow-task exemption, document that assessment before the system is placed on the market or put into service, and produce it to national competent authorities on request (Article 6(4)).',
              'Register yourself and the system in the EU database even where the exemption applies (Article 49(2)).',
            ]
          : [
              'Where your vendor relies on an Article 6(3) narrow-task exemption, obtain its Article 6(4) assessment for your file — the duty is the provider’s, but the evidence is what makes your own position defensible.',
            ],
        // The Article 49 registration question is asked once, by
        // vendor-registration-missing, so it is not duplicated here.
        vendorQuestions: provider
          ? []
          : ['Article 6(4) — Has your vendor documented its Article 6(3) assessment, and will it produce that documentation on request?'],
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
    source: sources.article26,
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
      obligations: hasProviderDuties(answers)
        ? [
            'As provider, keep the automatically generated logs for at least six months, subject to any longer period required by Union or national law (Article 19(1)).',
            'Ensure the system technically records events over its lifetime — that logging capability is Article 12, and is separate from how long you keep the output.',
          ]
        : [
            'As deployer, keep the automatically generated logs under your control for a period appropriate to the intended purpose and in any event at least six months, unless Union or national law — including data protection law — provides otherwise (Article 26(6)).',
            'Confirm the system technically records events over its lifetime; that logging capability is the vendor’s Article 12 duty, and is separate from your retention period.',
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
    source: sources.article6,
    priority: 210,
    when: (answers) => hasAny(answers, 'decision_impact', ['ranking', 'eligibility', 'automated-adverse', 'safety-control']),
    build: (answers) => ({
      evidence: [`Decision impact selected: ${selected(answers, 'decision_impact')}`],
      explanation: 'Ranking, eligibility, automated adverse action, and safety-control uses materially increase risk and support high-risk triage when combined with Annex III or product-safety context.',
      scoreDelta: 3,
      confidenceImpact: 0,
      reasons: ['The output can rank, determine eligibility, automate adverse action, or control safety-related activity.'],
      missingFacts: [],
      obligations: [],
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
    source: sources.article6,
    priority: 211,
    when: (answers) => has(answers, 'decision_impact', 'recommendation'),
    build: () => ({
      evidence: ['Decision impact selected: recommendations influence human decision'],
      explanation: 'Decision support may still be material if humans rely on the system in practice.',
      scoreDelta: 1,
      confidenceImpact: 0,
      reasons: ['The system influences a human decision, so the intended purpose and oversight model matter.'],
      missingFacts: [],
      obligations: [],
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
    source: sources.article26,
    priority: 220,
    when: (answers) => hasAny(answers, 'human_oversight', ['rubber-stamp', 'none']),
    build: (answers) => ({
      evidence: [`Human oversight selected: ${selected(answers, 'human_oversight')}`],
      explanation: 'Weak oversight increases operational risk and undermines deployer readiness.',
      scoreDelta: 2,
      confidenceImpact: 0,
      reasons: ['Human oversight appears weak, which increases operational and compliance risk.'],
      missingFacts: [],
      obligations: ['Define who reviews outputs, what they must check, and when they can override the system.'],
      vendorQuestions: ['What human oversight procedures and operator competence expectations does the vendor recommend?'],
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
    source: sources.article26,
    priority: 221,
    when: (answers) => has(answers, 'human_oversight', 'not-sure'),
    build: () => ({
      evidence: ['Human oversight selected: not sure'],
      explanation: 'Unclear human oversight lowers confidence in the assessment.',
      scoreDelta: 0,
      confidenceImpact: 1,
      reasons: [],
      missingFacts: ['Confirm whether human review is meaningful and whether reviewers have authority to override the AI output.'],
      obligations: [],
      vendorQuestions: ['What oversight controls, escalation routes, and override mechanisms are available?'],
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
    source: sources.article50,
    priority: 300,
    when: (answers) => has(answers, 'transparency', 'chatbot'),
    build: () => transparencyFinding('people interact directly with an AI chatbot or assistant'),
  }),
  rule({
    id: 'article-50-synthetic-media',
    title: 'Synthetic media transparency trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: sources.article50,
    priority: 301,
    when: (answers) => has(answers, 'transparency', 'synthetic-media'),
    build: () => transparencyFinding('synthetic images, audio, video, or deepfake-style content'),
  }),
  rule({
    id: 'article-50-published-text',
    title: 'Externally published AI-generated text trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: sources.article50,
    priority: 302,
    when: (answers) => has(answers, 'transparency', 'published-text'),
    build: () => transparencyFinding('externally published AI-generated text'),
  }),
  rule({
    id: 'article-50-emotion-biometric',
    title: 'Emotion or biometric categorisation transparency trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: sources.article50,
    priority: 303,
    when: (answers) => has(answers, 'transparency', 'emotion-biometric'),
    build: () => transparencyFinding('emotion recognition or biometric categorisation'),
  }),
  rule({
    id: 'article-50-customer-service',
    title: 'Customer-facing chatbot transparency trigger',
    category: 'transparency',
    legalStatus: 'current-law',
    source: sources.article50,
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
    source: sources.article51,
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
      obligations: ['Document model/application role, intended purpose, downstream users, and dependency on third-party model providers.'],
      vendorQuestions: ['If built on a third-party model, what GPAI documentation, acceptable-use restrictions, and model update notices does the model provider supply?'],
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
    source: sources.article6,
    priority: 500,
    when: (answers) => !has(answers, 'vendor_docs', 'classification'),
    build: () => vendorEvidenceFinding(
      'vendor AI Act classification or intended-purpose statement is missing',
      'Article 6(3) — What AI Act classification and intended purpose do you assign to this system, and if you rely on a narrow-task exemption, can you provide the Article 6(4) assessment?'
    ),
  }),
  rule({
    id: 'vendor-instructions-missing',
    title: 'Instructions and oversight guidance missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: sources.article13,
    priority: 501,
    when: (answers) => !has(answers, 'vendor_docs', 'instructions'),
    build: () => vendorEvidenceFinding(
      'transparency documentation and instructions for use are missing',
      'Article 13 — Where is your transparency documentation covering capabilities, performance boundaries, known limitations, and instructions for safe use?'
    ),
  }),
  rule({
    id: 'vendor-risk-management-missing',
    title: 'Risk management system documentation missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: sources.article9,
    priority: 502,
    when: (answers) => !has(answers, 'vendor_docs', 'risk-management'),
    build: () => vendorEvidenceFinding(
      'risk management system documentation is missing',
      'Article 9 — Can you provide your risk management system documentation showing a continuous, iterative process across the system’s lifecycle?'
    ),
  }),
  rule({
    id: 'vendor-registration-missing',
    title: 'EU database registration evidence missing',
    category: 'vendor-evidence',
    legalStatus: 'current-law',
    source: sources.article49,
    priority: 503,
    // The sharpest procurement lever in the set, and the one least often asked.
    when: (answers) => inAnnexIIIDomain(answers) && !has(answers, 'vendor_docs', 'registration'),
    build: () => vendorEvidenceFinding(
      'EU database registration reference is missing',
      'Article 49 — Has this system been registered in the EU database? If so, what is the registration reference? If not, what is your timeline?'
    ),
  }),
  rule({
    id: 'vendor-dpa-missing',
    title: 'Data processing terms missing',
    category: 'vendor-evidence',
    legalStatus: 'adjacent-risk',
    source: sources.gdpr,
    priority: 502,
    when: (answers) => !has(answers, 'vendor_docs', 'dpa'),
    build: () => vendorEvidenceFinding(
      'data processing agreement or privacy terms are missing',
      'Does the vendor provide a DPA, data retention terms, sub-processor list, and position on training with customer data?'
    ),
  }),
  rule({
    id: 'vendor-logs-missing',
    title: 'Audit logs or export evidence missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: sources.article12,
    priority: 504,
    when: (answers) => !has(answers, 'vendor_docs', 'logs'),
    build: () => vendorEvidenceFinding(
      'logging, audit, or export options are missing',
      'Articles 12 and 26(6) — Does the system automatically record events over its lifetime, and can you export logs, decisions, prompts, outputs, user actions, and configuration history for audit?'
    ),
  }),
  rule({
    id: 'vendor-change-policy-missing',
    title: 'Vendor change-control evidence missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: sources.article72,
    priority: 505,
    when: (answers) => !has(answers, 'vendor_docs', 'change-policy'),
    build: () => vendorEvidenceFinding(
      'model update or change notification policy is missing',
      'Article 72 — What does your post-market monitoring cover, and how will you notify us about model, feature, policy, or performance changes?'
    ),
  }),
  rule({
    id: 'vendor-docs-none-or-unknown',
    title: 'Vendor evidence pack absent or unknown',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: sources.article26,
    priority: 505,
    when: (answers) => values(answers, 'vendor_docs').length === 0 || hasAny(answers, 'vendor_docs', ['none', 'not-sure']),
    build: () => ({
      evidence: ['Vendor evidence selected: none, not sure, or unanswered'],
      explanation: 'A missing vendor evidence pack prevents a defensible assessment for SME deployers.',
      scoreDelta: 0,
      confidenceImpact: 1,
      reasons: [],
      missingFacts: ['Obtain the vendor intended-purpose statement, AI Act classification, instructions for use, oversight guidance, and data processing terms.'],
      obligations: [],
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
    source: sources.article11,
    priority: 650,
    when: (answers) => hasAny(answers, 'org_size', ['micro', 'small', 'medium']),
    build: () => ({
      evidence: ['Organisation size: SME'],
      explanation:
        'The AI Act treats SMEs and start-ups proportionately on documentation, quality management, sandbox access, and fine ceilings.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      obligations: [
        'As an SME you may supply Annex IV technical documentation in the simplified form set out in the Commission’s form, which notified bodies must accept (Article 11(1)).',
        'Your quality management system may be implemented proportionately to the size of your organisation, subject to a floor on rigour (Article 17(2)).',
        'You have priority access to AI regulatory sandboxes (Article 57).',
        'Fines take the lower of the percentage and the fixed amount, across Article 99 paragraphs 3, 4 and 5 (Article 99(6)).',
      ],
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
    source: sources.article99,
    priority: 651,
    when: (answers) => has(answers, 'org_size', 'small-mid-cap'),
    build: () => ({
      evidence: ['Organisation size: small mid-cap (SMC)'],
      explanation:
        'The Digital Omnibus extended several SME reliefs to small mid-caps, a category defined by reference to point (2) of the Annex to Recommendation (EU) 2025/1099. The fine relief is narrower than the SME version.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      obligations: [
        'As a small mid-cap you may supply Annex IV technical documentation in simplified form using the Commission’s form, which notified bodies must accept (Article 11(1)).',
        'Your quality management system may be implemented proportionately to the size of your organisation, subject to a floor on rigour (Article 17(2)).',
        'You have priority access to AI regulatory sandboxes (Article 57).',
        'Fines take the lower of the percentage and the fixed amount for Article 99 paragraphs 4 and 5 only (Article 99(6a)). This relief does not extend to Article 5 prohibited-practice fines, which remain at the higher of €35M or 7% of total worldwide annual turnover.',
      ],
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
    source: sources.gdpr,
    priority: 600,
    when: (answers) => hasAny(answers, 'data_types', ['personal', 'employee', 'health', 'children', 'biometric', 'special-category']),
    build: () => ({
      evidence: ['Personal or sensitive data selected'],
      explanation: 'Personal data does not automatically change AI Act classification, but it creates a separate governance and evidence requirement.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      obligations: [],
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
    source: sources.gdpr,
    priority: 601,
    when: (answers) => hasAny(answers, 'data_types', ['employee', 'health', 'children', 'biometric', 'special-category']),
    build: () => ({
      evidence: ['Employee, health, children, biometric, or special-category data selected'],
      explanation: 'Sensitive data contexts warrant human data-protection review alongside the AI Act triage.',
      scoreDelta: 0,
      confidenceImpact: 1,
      reasons: [],
      missingFacts: [],
      obligations: [],
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
    source: sources.gdpr,
    priority: 602,
    when: (answers) => hasAny(answers, 'sensitive_domains', ['employment', 'healthcare', 'credit', 'insurance', 'biometrics']),
    build: () => ({
      evidence: ['Sensitive sector selected'],
      explanation: 'Certain sectors require stronger vendor evidence, audit rights, and contract review even where the AI Act classification is still being confirmed.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      obligations: [],
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
    source: sources.overview,
    priority: 700,
    when: () => true,
    build: () => ({
      evidence: ['Baseline governance rule'],
      explanation: 'Every assessment should produce a reusable AI system record rather than a one-off answer.',
      scoreDelta: 0,
      confidenceImpact: 0,
      reasons: [],
      missingFacts: [],
      obligations: [
        'Maintain an AI system record covering intended purpose, owner, users, affected people, data, vendor, and review date.',
        'Keep evidence of vendor documentation, internal oversight decisions, and material changes.',
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
    source: sources.overview,
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
        obligations: [],
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

function prohibitedFinding(label: string): Omit<RuleFinding, 'id' | 'title' | 'category' | 'version' | 'lastReviewed' | 'legalStatus' | 'source'> {
  return {
    evidence: [`Prohibited-practice screen selected: ${label}`],
    explanation: `The selected use involves ${label}, which is a prohibited-practice red flag requiring immediate review.`,
    classification: 'Prohibited practice',
    scoreDelta: 100,
    confidenceImpact: 0,
    reasons: ['One or more selected practices maps to a prohibited-practice red flag and needs immediate human/legal review.'],
    missingFacts: [],
    obligations: [
      'Stop or pause the affected use until the prohibited-practice position is reviewed.',
      'Document the use case, affected people, and vendor/system behaviour before any further deployment.',
    ],
    vendorQuestions: ['Ask the vendor to confirm whether the system is designed, marketed, or technically capable of this prohibited-practice use.'],
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
function futureProhibitedFinding(label: string): Omit<RuleFinding, 'id' | 'title' | 'category' | 'version' | 'lastReviewed' | 'legalStatus' | 'source'> {
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
    obligations: [
      'Plan the redesign, restriction, or withdrawal of the affected use so it is complete before 2 December 2026.',
      'Document the intended purpose and the technical safeguards that prevent this output — the prohibition catches outputs that are a reasonably foreseeable and reproducible outcome without adequate safety measures, not only outputs that are the intended purpose (Article 5(1a)).',
    ],
    vendorQuestions: [
      'What technical safeguards prevent this system generating non-consensual intimate imagery or child sexual abuse material, and will the vendor attest to Article 5(1)(ba)–(bb) compliance before 2 December 2026?',
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
    obligations: ['Ensure users are told when they interact with AI and label AI-generated or synthetic content where required.'],
    vendorQuestions: ['What user-facing transparency notices, labels, and technical disclosure controls does the vendor provide?'],
    adjacentRisks: [],
    reviewTriggers: ['The system becomes user-facing or begins generating external content'],
    reportSections: ['Transparency obligations'],
  }
}

function vendorEvidenceFinding(
  evidence: string,
  question: string
): Omit<RuleFinding, 'id' | 'title' | 'category' | 'version' | 'lastReviewed' | 'legalStatus' | 'source'> {
  return {
    evidence: [`Vendor evidence gap: ${evidence}`],
    explanation: 'The missing item should be collected before relying on the system in a regulated or material workflow.',
    scoreDelta: 0,
    confidenceImpact: 0,
    reasons: [],
    missingFacts: [],
    obligations: [],
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
  const obligations = unique(flatten(firedRules.map((item) => item.obligations)))
  const vendorQuestions = unique(flatten(firedRules.map((item) => item.vendorQuestions)))
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
    obligations,
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
