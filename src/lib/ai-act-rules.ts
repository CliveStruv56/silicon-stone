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

const RULE_VERSION = '2026-05-11'
const LAST_REVIEWED = '2026-05-11'

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
  'Prohibited practice': 6,
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
  rule({
    id: 'prohibited-social-scoring',
    title: 'Social scoring prohibited-practice red flag',
    category: 'prohibited',
    legalStatus: 'current-law',
    source: sources.article5,
    priority: 100,
    when: (answers) => has(answers, 'prohibited_screen', 'social-scoring'),
    build: () => prohibitedFinding('social scoring of people across contexts'),
  }),
  rule({
    id: 'prohibited-manipulation-vulnerability',
    title: 'Manipulation or vulnerable-person exploitation red flag',
    category: 'prohibited',
    legalStatus: 'current-law',
    source: sources.article5,
    priority: 101,
    when: (answers) => has(answers, 'prohibited_screen', 'manipulation'),
    build: () => prohibitedFinding('manipulation or exploitation of vulnerable people'),
  }),
  rule({
    id: 'prohibited-workplace-education-emotion',
    title: 'Workplace or education emotion recognition red flag',
    category: 'prohibited',
    legalStatus: 'current-law',
    source: sources.article5,
    priority: 102,
    when: (answers) => has(answers, 'prohibited_screen', 'workplace-emotion'),
    build: () => prohibitedFinding('emotion recognition in workplace or education'),
  }),
  rule({
    id: 'prohibited-public-biometric-id',
    title: 'Real-time remote biometric identification red flag',
    category: 'prohibited',
    legalStatus: 'current-law',
    source: sources.article5,
    priority: 103,
    when: (answers) => has(answers, 'prohibited_screen', 'public-biometric-id'),
    build: () => prohibitedFinding('real-time remote biometric identification in public spaces'),
  }),
  rule({
    id: 'prohibited-facial-scraping',
    title: 'Facial image scraping red flag',
    category: 'prohibited',
    legalStatus: 'current-law',
    source: sources.article5,
    priority: 104,
    when: (answers) => has(answers, 'prohibited_screen', 'facial-scraping'),
    build: () => prohibitedFinding('scraping facial images to build recognition databases'),
  }),
  rule({
    id: 'prohibited-uncertain',
    title: 'Prohibited-practice position uncertain',
    category: 'prohibited',
    legalStatus: 'current-law',
    source: sources.article5,
    priority: 105,
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
      missingFacts: ['Annex III use cases default to high-risk under the AI Act. Article 6(3) offers a narrow-task exemption (narrow procedural tasks, improving prior human activity, etc.) — confirm the vendor classification and intended purpose before assuming a lower tier applies.'],
      obligations: ['Treat this as a likely high-risk candidate until the vendor classification and intended-purpose evidence are confirmed.'],
      vendorQuestions: ['Does the vendor classify this as an Annex III high-risk system, and what Article 6(3) exemption analysis, if any, does it rely on?'],
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
        vendorQuestions: ['Does the vendor classify this use case as high-risk under Annex III?'],
        adjacentRisks: [],
        reviewTriggers: ['Use case or affected group changes'],
        reportSections: ['Annex III classification rationale'],
      }
    },
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
    source: sources.article26,
    priority: 500,
    when: (answers) => !has(answers, 'vendor_docs', 'classification'),
    build: () => vendorEvidenceFinding(
      'vendor AI Act classification or intended-purpose statement is missing',
      'What AI Act classification and intended purpose does the vendor assign to this system?'
    ),
  }),
  rule({
    id: 'vendor-instructions-missing',
    title: 'Instructions and oversight guidance missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: sources.article26,
    priority: 501,
    when: (answers) => !has(answers, 'vendor_docs', 'instructions'),
    build: () => vendorEvidenceFinding(
      'instructions for use and human oversight guidance are missing',
      'What instructions for use, limitations, human oversight guidance, and misuse warnings does the vendor provide?'
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
    source: sources.article26,
    priority: 503,
    when: (answers) => !has(answers, 'vendor_docs', 'logs'),
    build: () => vendorEvidenceFinding(
      'logging, audit, or export options are missing',
      'Can you export logs, decisions, prompts, outputs, user actions, and configuration history for audit or incident review?'
    ),
  }),
  rule({
    id: 'vendor-change-policy-missing',
    title: 'Vendor change-control evidence missing',
    category: 'vendor-evidence',
    legalStatus: 'operational-risk',
    source: sources.article26,
    priority: 504,
    when: (answers) => !has(answers, 'vendor_docs', 'change-policy'),
    build: () => vendorEvidenceFinding(
      'model update or change notification policy is missing',
      'How will the vendor notify you about model, feature, policy, or performance changes?'
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
    confidence: confidenceImpact >= 3 || missingFacts.length >= 3 ? 'Low' : confidenceImpact >= 1 || missingFacts.length >= 1 ? 'Medium' : 'High',
    reasons: reasons.length ? reasons : ['No high-risk, prohibited-practice, transparency, or GPAI trigger was selected, based on the answers provided.'],
    missingFacts,
    obligations,
    vendorQuestions,
    adjacentRisks,
    reviewTriggers,
    reportSections,
  }
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
