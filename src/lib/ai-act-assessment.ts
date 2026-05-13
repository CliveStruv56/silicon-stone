import { evaluateRuleLibrary, type RuleFinding } from './ai-act-rules'

export type AssessmentValue = string | string[]

export type AssessmentAnswers = Record<string, AssessmentValue>

export type Classification =
  | 'Prohibited practice'
  | 'Likely high-risk'
  | 'Likely limited-risk'
  | 'Likely minimal-risk'
  | 'GPAI-related'
  | 'Out of EU scope'
  | 'Uncertain'

export type UserRole = 'Deployer' | 'Provider' | 'Both' | 'Unclear'

export type QuestionType = 'single' | 'multi' | 'text'

export interface AssessmentOption {
  label: string
  value: string
  description?: string
}

export interface AssessmentQuestion {
  id: string
  section: string
  text: string
  help?: string
  type: QuestionType
  options?: AssessmentOption[]
  placeholder?: string
  required?: boolean
  showIf?: (answers: AssessmentAnswers) => boolean
}

export interface SourceReference {
  label: string
  url: string
}

export interface AssessmentResult {
  classification: Classification
  role: UserRole
  confidence: 'High' | 'Medium' | 'Low'
  score: number
  summary: string
  reasons: string[]
  missingFacts: string[]
  obligations: string[]
  vendorQuestions: string[]
  adjacentRisks: string[]
  reviewTriggers: string[]
  reportSections: string[]
  sourceReferences: SourceReference[]
  firedRules: RuleFinding[]
}

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'assessment_reason',
    section: 'Context',
    text: 'Why are you assessing this AI tool today?',
    type: 'single',
    required: true,
    options: [
      { label: 'Considering a new third-party tool', value: 'new-tool' },
      { label: 'Already using it', value: 'existing-tool' },
      { label: 'Vendor changed terms, features, or model', value: 'vendor-change' },
      { label: 'Internal audit, board request, or annual review', value: 'review' },
      { label: 'Building or selling an AI product', value: 'building-product' },
    ],
  },
  {
    id: 'tool_name',
    section: 'Context',
    text: 'What is the tool or system called?',
    type: 'text',
    placeholder: 'e.g. Microsoft Copilot, HR screening vendor, support chatbot',
  },
  {
    id: 'origin',
    section: 'Role',
    text: 'Which best describes your use of the AI system?',
    type: 'single',
    required: true,
    options: [
      { label: 'We use a third-party AI tool as supplied', value: 'third-party' },
      { label: 'We configure or integrate a third-party AI tool into our workflow', value: 'integrated-third-party' },
      { label: 'We fine-tune, materially modify, rebrand, or resell it', value: 'modified-or-resold' },
      { label: 'We are building our own AI product or feature', value: 'own-product' },
      { label: 'Not sure', value: 'not-sure' },
    ],
  },
  {
    id: 'eu_scope',
    section: 'Scope',
    text: 'What EU connection does this system have?',
    help: 'Select all that apply.',
    type: 'multi',
    required: true,
    options: [
      { label: 'Our organisation is in the EU', value: 'eu-org' },
      { label: 'The system is used by people in the EU', value: 'eu-users' },
      { label: 'Outputs are used for decisions affecting people in the EU', value: 'eu-outputs' },
      { label: 'We place or sell this system into the EU market', value: 'eu-market' },
      { label: 'No clear EU connection', value: 'none' },
      { label: 'Not sure', value: 'not-sure' },
    ],
  },
  {
    id: 'primary_use',
    section: 'Use Case',
    text: 'What is the main business use?',
    type: 'single',
    required: true,
    options: [
      { label: 'General productivity, drafting, research, or internal admin', value: 'general-productivity' },
      { label: 'Customer service or user-facing chatbot', value: 'customer-service' },
      { label: 'HR, recruitment, workforce management, or worker monitoring', value: 'employment' },
      { label: 'Education, training, assessment, or admissions', value: 'education' },
      { label: 'Healthcare, clinical support, triage, or medical admin', value: 'healthcare' },
      { label: 'Credit, lending, banking, insurance, or fraud decisions', value: 'financial' },
      { label: 'Biometric identification, categorisation, or emotion detection', value: 'biometrics' },
      { label: 'Critical infrastructure, safety system, or industrial control', value: 'critical-infrastructure' },
      { label: 'Legal, migration, law enforcement, or democratic process', value: 'law-justice' },
      { label: 'Generative AI product, model, or AI feature sold to others', value: 'gpai-product' },
    ],
  },
  {
    id: 'affected_people',
    section: 'Use Case',
    text: 'Who can be materially affected by the outputs?',
    type: 'multi',
    options: [
      { label: 'Employees or contractors', value: 'workers' },
      { label: 'Job applicants', value: 'applicants' },
      { label: 'Customers or consumers', value: 'customers' },
      { label: 'Patients or care recipients', value: 'patients' },
      { label: 'Students or learners', value: 'students' },
      { label: 'Members of the public', value: 'public' },
      { label: 'No individual is materially affected', value: 'none' },
    ],
  },
  {
    id: 'decision_impact',
    section: 'Impact',
    text: 'How are the AI outputs used?',
    type: 'single',
    required: true,
    options: [
      { label: 'Drafting or research only; a person makes the decision independently', value: 'assistive' },
      { label: 'Recommendations influence a human decision', value: 'recommendation' },
      { label: 'Ranks, scores, prioritises, or shortlists people or cases', value: 'ranking' },
      { label: 'Determines access, eligibility, pricing, approval, refusal, or other significant outcomes', value: 'eligibility' },
      { label: 'Automatically blocks, refuses, freezes, disciplines, or otherwise takes adverse action', value: 'automated-adverse' },
      { label: 'Controls a safety-related product, process, or infrastructure system', value: 'safety-control' },
    ],
  },
  {
    id: 'human_oversight',
    section: 'Impact',
    text: 'What human oversight exists before the output affects someone?',
    type: 'single',
    required: true,
    options: [
      { label: 'Meaningful review with authority to override', value: 'meaningful' },
      { label: 'Human approval exists, but reviewers usually follow the AI', value: 'rubber-stamp' },
      { label: 'No human review before impact', value: 'none' },
      { label: 'Not sure', value: 'not-sure' },
    ],
  },
  {
    id: 'sensitive_domains',
    section: 'Risk Signals',
    text: 'Which sensitive areas are involved?',
    help: 'Select all that apply. These map closely to AI Act high-risk and prohibited-practice screening.',
    type: 'multi',
    options: [
      { label: 'Employment or worker management', value: 'employment' },
      { label: 'Education or assessment', value: 'education' },
      { label: 'Healthcare or patient triage', value: 'healthcare' },
      { label: 'Creditworthiness, lending, or access to essential private services', value: 'credit' },
      { label: 'Insurance underwriting or pricing', value: 'insurance' },
      { label: 'Public benefits or essential public services', value: 'public-services' },
      { label: 'Biometric identification or categorisation', value: 'biometrics' },
      { label: 'Critical infrastructure or safety component', value: 'critical-infrastructure' },
      { label: 'Law enforcement, migration, border control, or asylum', value: 'law-migration' },
      { label: 'Justice, legal decision support, or democratic processes', value: 'justice-democracy' },
      { label: 'None of these', value: 'none' },
    ],
  },
  {
    id: 'prohibited_screen',
    section: 'Risk Signals',
    text: 'Does the use involve any of these red-flag practices?',
    type: 'multi',
    options: [
      { label: 'Social scoring of people across contexts', value: 'social-scoring' },
      { label: 'Manipulation or exploitation of vulnerable people', value: 'manipulation' },
      { label: 'Emotion recognition in workplace or education', value: 'workplace-emotion' },
      { label: 'Real-time remote biometric identification in public spaces', value: 'public-biometric-id' },
      { label: 'Scraping facial images to build recognition databases', value: 'facial-scraping' },
      { label: 'None of these', value: 'none' },
      { label: 'Not sure', value: 'not-sure' },
    ],
  },
  {
    id: 'data_types',
    section: 'Data',
    text: 'What data does the system process?',
    type: 'multi',
    options: [
      { label: 'No personal data', value: 'none' },
      { label: 'Personal data', value: 'personal' },
      { label: 'Employee or applicant data', value: 'employee' },
      { label: 'Health data', value: 'health' },
      { label: 'Children or learner data', value: 'children' },
      { label: 'Biometric data', value: 'biometric' },
      { label: 'Other special-category or sensitive data', value: 'special-category' },
      { label: 'Not sure', value: 'not-sure' },
    ],
  },
  {
    id: 'transparency',
    section: 'Transparency',
    text: 'Does the system interact with people or generate content?',
    type: 'multi',
    options: [
      { label: 'People interact directly with an AI chatbot or assistant', value: 'chatbot' },
      { label: 'It creates synthetic images, audio, video, or deepfake-style content', value: 'synthetic-media' },
      { label: 'It generates text published externally', value: 'published-text' },
      { label: 'It detects emotion or biometric categories', value: 'emotion-biometric' },
      { label: 'None of these', value: 'none' },
    ],
  },
  {
    id: 'vendor_docs',
    section: 'Vendor Evidence',
    text: 'What AI/vendor documentation do you already have?',
    type: 'multi',
    options: [
      { label: 'AI Act classification or intended-purpose statement', value: 'classification' },
      { label: 'Instructions for use and human oversight guidance', value: 'instructions' },
      { label: 'Data processing agreement or privacy terms', value: 'dpa' },
      { label: 'Logging, audit, or export options', value: 'logs' },
      { label: 'Model update/change notification policy', value: 'change-policy' },
      { label: 'None of these', value: 'none' },
      { label: 'Not sure', value: 'not-sure' },
    ],
  },
  {
    id: 'change_control',
    section: 'Ongoing Governance',
    text: 'What would trigger a reassessment?',
    help: 'This makes the output useful after AI Act dates pass.',
    type: 'multi',
    options: [
      { label: 'New department or use case', value: 'new-use' },
      { label: 'New data category or more personal data', value: 'new-data' },
      { label: 'Less human review or more automation', value: 'more-automation' },
      { label: 'Vendor model, terms, or feature changes', value: 'vendor-change' },
      { label: 'Customer, worker, or regulator complaint', value: 'complaint' },
      { label: 'Annual AI register review', value: 'annual-review' },
    ],
  },
]

export function getVisibleQuestions(answers: AssessmentAnswers): AssessmentQuestion[] {
  return assessmentQuestions.filter((question) => !question.showIf || question.showIf(answers))
}

export function evaluateAssessment(answers: AssessmentAnswers): AssessmentResult {
  const ruleEvaluation = evaluateRuleLibrary(answers)
  const toolName = typeof answers.tool_name === 'string' && answers.tool_name.trim()
    ? answers.tool_name.trim()
    : 'this AI system'

  const summary = ruleEvaluation.classification === 'Out of EU scope'
    ? `${toolName} appears to be outside EU AI Act territorial scope on this first-pass assessment. Document the reasoning and re-check if EU users, customers, or outputs are added.`
    : `${toolName} is classified as ${ruleEvaluation.classification.toLowerCase()} on this first-pass assessment. The result should be treated as an AI system record and reviewed when the use case, vendor, data, or level of automation changes.`

  return {
    classification: ruleEvaluation.classification,
    role: ruleEvaluation.role,
    confidence: ruleEvaluation.confidence,
    score: ruleEvaluation.score,
    summary,
    reasons: ruleEvaluation.reasons,
    missingFacts: ruleEvaluation.missingFacts,
    obligations: ruleEvaluation.obligations,
    vendorQuestions: ruleEvaluation.vendorQuestions,
    adjacentRisks: ruleEvaluation.adjacentRisks,
    reviewTriggers: ruleEvaluation.reviewTriggers,
    reportSections: ruleEvaluation.reportSections,
    sourceReferences: ruleEvaluation.sourceReferences,
    firedRules: ruleEvaluation.firedRules,
  }
}
