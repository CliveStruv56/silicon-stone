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
}

const sourceReferences: SourceReference[] = [
  {
    label: 'European Commission AI Act overview',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
  },
  {
    label: 'AI Act Service Desk: Article 2 territorial scope',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-2',
  },
  {
    label: 'AI Act Service Desk: Article 5 prohibited AI practices',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
  },
  {
    label: 'AI Act Service Desk: Article 6 high-risk classification',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6',
  },
  {
    label: 'AI Act Service Desk: Annex III high-risk areas',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3',
  },
  {
    label: 'AI Act Service Desk: Article 26 deployer obligations',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
  },
  {
    label: 'AI Act Service Desk: Article 50 transparency obligations',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50',
  },
  {
    label: 'AI Act Service Desk: Article 51 GPAI systemic risk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-51',
  },
]

const sensitiveDomains = new Set([
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

const highImpactDecisions = new Set([
  'automated-adverse',
  'ranking',
  'eligibility',
  'safety-control',
])

const primaryUseAnnexIII: Record<string, true> = {
  employment: true,
  education: true,
  healthcare: true,
  financial: true,
  biometrics: true,
  'critical-infrastructure': true,
  'law-justice': true,
}

const prohibitedPractices = new Set([
  'social-scoring',
  'manipulation',
  'workplace-emotion',
  'public-biometric-id',
  'facial-scraping',
])

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

function values(answers: AssessmentAnswers, id: string): string[] {
  const value = answers[id]
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function has(answers: AssessmentAnswers, id: string, value: string): boolean {
  return values(answers, id).includes(value)
}

function hasAny(answers: AssessmentAnswers, id: string, check: Set<string> | string[]): boolean {
  const wanted = Array.isArray(check) ? new Set(check) : check
  return values(answers, id).some((value) => wanted.has(value))
}

function labelFor(question: AssessmentQuestion, value: string): string {
  return question.options?.find((option) => option.value === value)?.label ?? value
}

function selectedLabels(questionId: string, answers: AssessmentAnswers): string[] {
  const question = assessmentQuestions.find((item) => item.id === questionId)
  if (!question) return values(answers, questionId)
  return values(answers, questionId).map((value) => labelFor(question, value))
}

export function getVisibleQuestions(answers: AssessmentAnswers): AssessmentQuestion[] {
  return assessmentQuestions.filter((question) => !question.showIf || question.showIf(answers))
}

export function evaluateAssessment(answers: AssessmentAnswers): AssessmentResult {
  let score = 0
  const reasons: string[] = []
  const missingFacts: string[] = []
  const obligations = new Set<string>()
  const vendorQuestions = new Set<string>()
  const adjacentRisks = new Set<string>()
  const reviewTriggers = new Set<string>()
  const reportSections = new Set<string>()

  const origin = values(answers, 'origin')[0]
  const impact = values(answers, 'decision_impact')[0]
  const oversight = values(answers, 'human_oversight')[0]
  const euScope = values(answers, 'eu_scope')
  const vendorDocs = values(answers, 'vendor_docs')
  const toolName = typeof answers.tool_name === 'string' && answers.tool_name.trim()
    ? answers.tool_name.trim()
    : 'this AI system'

  const onlyNoEuScope = euScope.length === 1 && euScope[0] === 'none'

  if (!euScope.length || has(answers, 'eu_scope', 'not-sure')) {
    missingFacts.push('Confirm whether the system is used in the EU, placed on the EU market, or affects people in the EU.')
  }

  if (has(answers, 'eu_scope', 'none')) {
    reasons.push('You selected no clear EU connection, so AI Act scope should be confirmed before treating this as an EU compliance issue.')
    score -= 2
  }

  let role: UserRole = 'Deployer'
  if (origin === 'own-product' || origin === 'modified-or-resold') {
    role = origin === 'modified-or-resold' ? 'Both' : 'Provider'
    score += 2
    reasons.push('You may have provider-side responsibilities because you build, materially modify, rebrand, resell, or place an AI product on the market.')
  } else if (origin === 'integrated-third-party') {
    role = 'Both'
    score += 1
    reasons.push('You are using a third-party system, but integration choices may create deployer duties and could create provider-like responsibilities if the intended purpose changes.')
  } else if (origin === 'not-sure') {
    role = 'Unclear'
    missingFacts.push('Clarify whether you are only using the tool, or whether you modify, rebrand, resell, or set a new intended purpose for it.')
  } else {
    reasons.push('You appear primarily to be a deployer using a third-party AI system.')
  }

  if (hasAny(answers, 'prohibited_screen', prohibitedPractices)) {
    score = Math.max(score, 100)
    reasons.push('One or more selected practices maps to a prohibited-practice red flag and needs immediate human/legal review.')
    obligations.add('Stop or pause the affected use until the prohibited-practice position is reviewed.')
    obligations.add('Document the use case, affected people, and vendor/system behaviour before any further deployment.')
  }

  const primaryUse = values(answers, 'primary_use')[0]
  const annexIIIFromSensitiveDomains = hasAny(answers, 'sensitive_domains', sensitiveDomains)
  const annexIIIFromPrimaryUse = primaryUse ? Boolean(primaryUseAnnexIII[primaryUse]) : false
  const annexIIIHit = annexIIIFromSensitiveDomains || annexIIIFromPrimaryUse

  if (annexIIIFromSensitiveDomains) {
    score += 4
    reasons.push(`The use touches sensitive AI Act areas: ${selectedLabels('sensitive_domains', answers).filter((item) => item !== 'None of these').join(', ')}.`)
  } else if (annexIIIFromPrimaryUse) {
    score += 4
    const primaryUseQuestion = assessmentQuestions.find((item) => item.id === 'primary_use')
    const primaryUseLabel = primaryUseQuestion ? labelFor(primaryUseQuestion, primaryUse) : primaryUse
    reasons.push(`The primary use (${primaryUseLabel}) sits inside an Annex III high-risk area, even though no specific sensitive-domain box was ticked.`)
    missingFacts.push('Confirm the specific sensitive-domain breakdown — the primary use suggests Annex III applicability that should be cross-checked against the actual workflow.')
  }

  if (hasAny(answers, 'decision_impact', highImpactDecisions)) {
    score += 3
    reasons.push('The output can rank, determine eligibility, automate adverse action, or control safety-related activity.')
  } else if (impact === 'recommendation') {
    score += 1
    reasons.push('The system influences a human decision, so the intended purpose and oversight model matter.')
  }

  if (oversight === 'none' || oversight === 'rubber-stamp') {
    score += 2
    reasons.push('Human oversight appears weak, which increases operational and compliance risk.')
    obligations.add('Define who reviews outputs, what they must check, and when they can override the system.')
  } else if (oversight === 'not-sure') {
    missingFacts.push('Confirm whether human review is meaningful and whether reviewers have authority to override the AI output.')
  }

  if (hasAny(answers, 'transparency', ['chatbot', 'synthetic-media', 'published-text', 'emotion-biometric'])) {
    score += 1
    reasons.push('The system may trigger transparency duties because it interacts with people, generates content, or detects emotion/biometric categories.')
    obligations.add('Ensure users are told when they interact with AI and label AI-generated or synthetic content where required.')
  }

  if (hasAny(answers, 'data_types', ['personal', 'employee', 'health', 'children', 'biometric', 'special-category'])) {
    adjacentRisks.add('Personal or sensitive data is involved; check GDPR lawful basis, minimisation, retention, security, and DPIA requirements.')
  }
  if (hasAny(answers, 'data_types', ['employee', 'health', 'children', 'biometric', 'special-category'])) {
    adjacentRisks.add('Sensitive data context detected; a human data protection review is recommended alongside AI Act triage.')
  }
  if (hasAny(answers, 'sensitive_domains', ['employment', 'healthcare', 'credit', 'insurance', 'biometrics'])) {
    adjacentRisks.add('This use sits in a sector where vendor contracts, audit rights, and evidence quality matter materially.')
  }

  if (!vendorDocs.length || has(answers, 'vendor_docs', 'none') || has(answers, 'vendor_docs', 'not-sure')) {
    missingFacts.push('Obtain the vendor intended-purpose statement, AI Act classification, instructions for use, oversight guidance, and data processing terms.')
  }
  if (!vendorDocs.includes('classification')) {
    vendorQuestions.add('What AI Act classification and intended purpose does the vendor assign to this system?')
  }
  if (!vendorDocs.includes('instructions')) {
    vendorQuestions.add('What instructions for use, limitations, human oversight guidance, and misuse warnings does the vendor provide?')
  }
  if (!vendorDocs.includes('dpa')) {
    vendorQuestions.add('Does the vendor provide a DPA, data retention terms, sub-processor list, and position on training with customer data?')
  }
  if (!vendorDocs.includes('logs')) {
    vendorQuestions.add('Can you export logs, decisions, prompts, outputs, user actions, and configuration history for audit or incident review?')
  }
  if (!vendorDocs.includes('change-policy')) {
    vendorQuestions.add('How will the vendor notify you about model, feature, policy, or performance changes?')
  }

  values(answers, 'change_control').forEach((trigger) => {
    const question = assessmentQuestions.find((item) => item.id === 'change_control')
    reviewTriggers.add(labelFor(question!, trigger))
  })

  if (!reviewTriggers.size) {
    reviewTriggers.add('Annual AI register review')
    reviewTriggers.add('Vendor model, terms, or feature changes')
    reviewTriggers.add('Less human review or more automation')
  }

  obligations.add('Maintain an AI system record covering intended purpose, owner, users, affected people, data, vendor, and review date.')
  obligations.add('Keep evidence of vendor documentation, internal oversight decisions, and material changes.')

  if (score >= 4 && score < 100) {
    obligations.add('Treat this as a likely high-risk candidate until the vendor classification and intended-purpose evidence are confirmed.')
  }

  reportSections.add('AI system record')
  reportSections.add('Classification rationale and confidence')
  reportSections.add('Role analysis: deployer/provider/both')
  reportSections.add('Vendor due diligence questionnaire')
  reportSections.add('Evidence register')
  reportSections.add('Adjacent GDPR and vendor-risk addendum')
  reportSections.add('30/60/90-day action plan')

  let classification: Classification = 'Likely minimal-risk'
  if (score >= 100) {
    classification = 'Prohibited practice'
  } else if (onlyNoEuScope) {
    classification = 'Out of EU scope'
    reasons.push('You indicated no EU users, market presence, or affected people, so the AI Act may not apply. Article 2 still catches providers placing AI systems on the EU market and outputs used by people in the EU.')
    obligations.add('Confirm and document the territorial scope position before deprioritising AI Act work; revisit if EU usage, customers, or outputs change.')
    adjacentRisks.add('Local AI rules (UK, US state laws, sector-specific regimes) may still apply even when the EU AI Act does not.')
  } else if (has(answers, 'primary_use', 'gpai-product')) {
    classification = annexIIIHit || score >= 4 ? 'Likely high-risk' : 'GPAI-related'
    reasons.push('A generative AI product or model route may create GPAI or provider-side obligations separate from deployer duties.')
  } else if (annexIIIHit || score >= 5) {
    classification = 'Likely high-risk'
  } else if (score >= 2) {
    classification = 'Likely limited-risk'
  }

  if (annexIIIHit && classification === 'Likely high-risk') {
    missingFacts.push('Annex III use cases default to high-risk under the AI Act. Article 6(3) offers a narrow-task exemption (narrow procedural tasks, improving prior human activity, etc.) — confirm the vendor classification and intended purpose before assuming a lower tier applies.')
  }

  if (role === 'Unclear' || has(answers, 'prohibited_screen', 'not-sure')) {
    classification = classification === 'Likely minimal-risk' ? 'Uncertain' : classification
  }

  const uncertainty = missingFacts.length + (role === 'Unclear' ? 1 : 0)
  let confidence: 'High' | 'Medium' | 'Low'
  if (score >= 100) {
    confidence = 'High'
  } else if (onlyNoEuScope) {
    confidence = 'High'
  } else if (uncertainty >= 3) {
    confidence = 'Low'
  } else if (uncertainty >= 1) {
    confidence = 'Medium'
  } else {
    confidence = 'High'
  }

  const summary = classification === 'Out of EU scope'
    ? `${toolName} appears to be outside EU AI Act territorial scope on this first-pass assessment. Document the reasoning and re-check if EU users, customers, or outputs are added.`
    : `${toolName} is classified as ${classification.toLowerCase()} on this first-pass assessment. The result should be treated as an AI system record and reviewed when the use case, vendor, data, or level of automation changes.`

  return {
    classification,
    role,
    confidence,
    score,
    summary,
    reasons: reasons.length ? reasons : ['No high-risk or prohibited-practice trigger was selected, based on the answers provided.'],
    missingFacts,
    obligations: [...obligations],
    vendorQuestions: [...vendorQuestions],
    adjacentRisks: [...adjacentRisks],
    reviewTriggers: [...reviewTriggers],
    reportSections: [...reportSections],
    sourceReferences,
  }
}
