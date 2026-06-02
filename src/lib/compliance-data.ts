// Compliance Checker Data - EU AI Act Risk Assessment
// Industry-specific decision tree with detailed compliance requirements

export type RiskLevel = 'Unacceptable' | 'High' | 'Limited' | 'Minimal' | 'Uncertain'

export type Industry = 'automotive' | 'fintech' | 'healthcare' | 'manufacturing' | 'general'

export interface Question {
  id: string
  text: string
  description?: string
  options: {
    label: string
    value: string
    nextStep?: string
    riskOutcome?: RiskLevel
  }[]
}

export interface ComplianceChecklist {
  category: string
  items: string[]
}

export interface RiskDetail {
  color: string
  bgColor: string
  title: string
  desc: string
  obligations: string[]
  deadlines: { date: string; description: string }[]
  checklist: ComplianceChecklist[]
  nextSteps: { priority: 'immediate' | '30-days' | '90-days'; action: string }[]
  documentationEstimate: string
}

// --- Questions Decision Tree ---

export const QUESTIONS: Record<string, Question> = {
  // Step 1: Industry Selection
  start: {
    id: 'start',
    text: 'What industry does your AI system operate in?',
    description: 'Select the sector that best describes your organisation to get tailored compliance guidance.',
    options: [
      { label: 'Automotive / Mobility', value: 'automotive', nextStep: 'automotive_function' },
      { label: 'Financial Services / Fintech', value: 'fintech', nextStep: 'fintech_function' },
      { label: 'Healthcare / Medical', value: 'healthcare', nextStep: 'healthcare_function' },
      { label: 'Manufacturing / Industrial', value: 'manufacturing', nextStep: 'manufacturing_function' },
      { label: 'Other / General Purpose', value: 'general', nextStep: 'general_function' },
    ],
  },

  // --- AUTOMOTIVE PATH ---
  automotive_function: {
    id: 'automotive_function',
    text: 'What is the primary function of your automotive AI system?',
    description: 'AI in vehicles and mobility systems has specific risk considerations.',
    options: [
      { label: 'Autonomous Driving (Level 3+)', value: 'autonomous', riskOutcome: 'High' },
      { label: 'Driver Monitoring / Distraction Detection', value: 'driver_monitoring', nextStep: 'automotive_biometric' },
      { label: 'Predictive Maintenance', value: 'maintenance', riskOutcome: 'Minimal' },
      { label: 'Traffic Management / Smart Infrastructure', value: 'traffic', nextStep: 'automotive_infrastructure' },
      { label: 'In-Vehicle Infotainment / Voice Assistant', value: 'infotainment', riskOutcome: 'Limited' },
    ],
  },
  automotive_biometric: {
    id: 'automotive_biometric',
    text: 'Does your driver monitoring system use biometric identification?',
    description: 'Facial recognition or emotion detection in vehicles has specific requirements.',
    options: [
      { label: 'Yes, facial recognition for driver identification', value: 'facial', riskOutcome: 'High' },
      { label: 'Yes, emotion/drowsiness detection', value: 'emotion', riskOutcome: 'High' },
      { label: 'No, only behavioural patterns (steering, speed)', value: 'behavioral', riskOutcome: 'Limited' },
    ],
  },
  automotive_infrastructure: {
    id: 'automotive_infrastructure',
    text: 'Is this system part of critical public infrastructure?',
    description: 'Traffic control systems managing public roads have safety implications.',
    options: [
      { label: 'Yes, controls traffic signals or public road systems', value: 'critical', riskOutcome: 'High' },
      { label: 'No, private fleet or facility management only', value: 'private', riskOutcome: 'Limited' },
    ],
  },

  // --- FINTECH PATH ---
  fintech_function: {
    id: 'fintech_function',
    text: 'What is the primary function of your financial AI system?',
    description: 'AI in financial services often involves high-risk decision-making about individuals.',
    options: [
      { label: 'Credit Scoring / Loan Decisions', value: 'credit', riskOutcome: 'High' },
      { label: 'Fraud Detection / AML Monitoring', value: 'fraud', nextStep: 'fintech_fraud_type' },
      { label: 'Algorithmic Trading / Market Analysis', value: 'trading', nextStep: 'fintech_trading_impact' },
      { label: 'Customer Service Chatbot', value: 'chatbot', riskOutcome: 'Limited' },
      { label: 'Insurance Underwriting / Pricing', value: 'insurance', riskOutcome: 'High' },
    ],
  },
  fintech_fraud_type: {
    id: 'fintech_fraud_type',
    text: 'How does your fraud detection system impact customers?',
    description: 'The level of human oversight and customer impact determines the risk tier.',
    options: [
      { label: 'Automatically blocks transactions or freezes accounts', value: 'auto_block', riskOutcome: 'High' },
      { label: 'Flags for human review before any action', value: 'human_review', riskOutcome: 'Limited' },
      { label: 'Internal monitoring only, no direct customer impact', value: 'internal', riskOutcome: 'Minimal' },
    ],
  },
  fintech_trading_impact: {
    id: 'fintech_trading_impact',
    text: 'What is the scale and autonomy of your trading system?',
    description: 'Systemic risk and market impact determine regulatory scrutiny.',
    options: [
      { label: 'High-frequency trading with market-moving volumes', value: 'hft', riskOutcome: 'High' },
      { label: 'Portfolio recommendations with human approval', value: 'advisory', riskOutcome: 'Limited' },
      { label: 'Research and analysis tools only', value: 'research', riskOutcome: 'Minimal' },
    ],
  },

  // --- HEALTHCARE PATH ---
  healthcare_function: {
    id: 'healthcare_function',
    text: 'What is the primary function of your healthcare AI system?',
    description: 'Medical AI systems are often safety components with strict requirements.',
    options: [
      { label: 'Medical Device (Diagnosis, Treatment)', value: 'device', nextStep: 'healthcare_device_class' },
      { label: 'Drug Discovery / Clinical Research', value: 'research', riskOutcome: 'Limited' },
      { label: 'Administrative / Scheduling / Billing', value: 'admin', riskOutcome: 'Minimal' },
      { label: 'Patient Triage / Prioritization', value: 'triage', riskOutcome: 'High' },
      { label: 'Medical Imaging Analysis', value: 'imaging', riskOutcome: 'High' },
    ],
  },
  healthcare_device_class: {
    id: 'healthcare_device_class',
    text: 'What is the intended use and risk class of the medical device?',
    description: 'Medical device AI is regulated under both AI Act and MDR.',
    options: [
      { label: 'Class IIb or III (implantable, life-supporting)', value: 'high_class', riskOutcome: 'High' },
      { label: 'Class IIa (diagnostic, moderate risk)', value: 'moderate_class', riskOutcome: 'High' },
      { label: 'Class I (low risk, general wellness)', value: 'low_class', riskOutcome: 'Limited' },
    ],
  },

  // --- MANUFACTURING PATH ---
  manufacturing_function: {
    id: 'manufacturing_function',
    text: 'What is the primary function of your manufacturing AI system?',
    description: 'Industrial AI may be a safety component or purely operational.',
    options: [
      { label: 'Safety System (Emergency Shutoffs, Hazard Detection)', value: 'safety', riskOutcome: 'High' },
      { label: 'Quality Control / Defect Detection', value: 'qc', nextStep: 'manufacturing_qc_impact' },
      { label: 'Predictive Maintenance', value: 'maintenance', riskOutcome: 'Minimal' },
      { label: 'Supply Chain Optimization', value: 'supply_chain', riskOutcome: 'Minimal' },
      { label: 'Robotics / Automation Control', value: 'robotics', nextStep: 'manufacturing_robotics_type' },
    ],
  },
  manufacturing_qc_impact: {
    id: 'manufacturing_qc_impact',
    text: 'What products does your quality control system inspect?',
    description: 'Safety-critical product inspection carries higher requirements.',
    options: [
      { label: 'Medical devices or pharmaceuticals', value: 'medical', riskOutcome: 'High' },
      { label: 'Automotive safety components', value: 'automotive', riskOutcome: 'High' },
      { label: 'Consumer electronics or general goods', value: 'consumer', riskOutcome: 'Limited' },
    ],
  },
  manufacturing_robotics_type: {
    id: 'manufacturing_robotics_type',
    text: 'What type of robotic automation is involved?',
    description: 'Collaborative robots working near humans have safety implications.',
    options: [
      { label: 'Collaborative robots (cobots) working with humans', value: 'cobot', riskOutcome: 'High' },
      { label: 'Industrial robots in safety-caged areas', value: 'caged', riskOutcome: 'Limited' },
      { label: 'Automated guided vehicles (AGVs) in restricted zones', value: 'agv', riskOutcome: 'Limited' },
    ],
  },

  // --- GENERAL PATH ---
  general_function: {
    id: 'general_function',
    text: 'What is the primary function of your AI system?',
    description: 'Select the category that best describes the system\'s core purpose.',
    options: [
      { label: 'Social Scoring or Behavioral Manipulation', value: 'manipulation', riskOutcome: 'Unacceptable' },
      { label: 'Biometric Identification / Categorization', value: 'biometrics', nextStep: 'biometrics_type' },
      { label: 'Generative AI / Chatbot / Content Creation', value: 'genai', nextStep: 'genai_type' },
      { label: 'Education / Assessment / Learning', value: 'education', nextStep: 'education_type' },
      { label: 'Employment / HR / Recruitment', value: 'employment', riskOutcome: 'High' },
      { label: 'Law Enforcement / Migration Control', value: 'law', riskOutcome: 'High' },
      { label: 'Internal Operations / Optimization', value: 'internal', riskOutcome: 'Minimal' },
    ],
  },
  biometrics_type: {
    id: 'biometrics_type',
    text: 'What type of biometric processing does your system perform?',
    description: 'Real-time remote biometric identification in public spaces is prohibited.',
    options: [
      { label: 'Real-time remote identification in public spaces', value: 'realtime_public', riskOutcome: 'Unacceptable' },
      { label: 'Emotion recognition in workplace or education', value: 'emotion_work', riskOutcome: 'Unacceptable' },
      { label: 'Authentication (1:1 verification)', value: 'auth', riskOutcome: 'Limited' },
      { label: 'Post-event analysis for law enforcement', value: 'post_event', riskOutcome: 'High' },
    ],
  },
  genai_type: {
    id: 'genai_type',
    text: 'What type of generative AI system is this?',
    description: 'General Purpose AI Models with systemic risks have additional obligations.',
    options: [
      { label: 'Foundation model with systemic risk (GPT-4 class, 10^25 FLOP+)', value: 'gpai_systemic', riskOutcome: 'High' },
      { label: 'Foundation model under systemic risk threshold', value: 'gpai_standard', riskOutcome: 'Limited' },
      { label: 'Application built on third-party foundation model', value: 'app_layer', nextStep: 'genai_app_use' },
      { label: 'Deepfake / synthetic media generation', value: 'deepfake', riskOutcome: 'Limited' },
    ],
  },
  genai_app_use: {
    id: 'genai_app_use',
    text: 'What is the primary use case of your GenAI application?',
    description: 'Applications integrating GenAI may inherit higher risk based on use.',
    options: [
      { label: 'High-risk domain (healthcare, legal, financial advice)', value: 'high_risk_domain', riskOutcome: 'High' },
      { label: 'Customer service / general assistance', value: 'customer_service', riskOutcome: 'Limited' },
      { label: 'Creative / entertainment / marketing', value: 'creative', riskOutcome: 'Limited' },
      { label: 'Internal productivity tools', value: 'internal', riskOutcome: 'Minimal' },
    ],
  },
  education_type: {
    id: 'education_type',
    text: 'How does your AI system impact educational outcomes?',
    description: 'AI that affects access to education or evaluates students is high-risk.',
    options: [
      { label: 'Determines admission or access to education', value: 'admission', riskOutcome: 'High' },
      { label: 'Evaluates students / assigns grades', value: 'grading', riskOutcome: 'High' },
      { label: 'Personalized learning recommendations', value: 'personalized', riskOutcome: 'Limited' },
      { label: 'Administrative support only', value: 'admin', riskOutcome: 'Minimal' },
    ],
  },
}

// --- Risk Level Details ---

export const RISK_DETAILS: Record<RiskLevel, RiskDetail> = {
  Unacceptable: {
    color: 'text-alert-red',
    bgColor: 'bg-alert-red',
    title: 'Unacceptable Risk (Prohibited)',
    desc: 'This AI practice is banned in the European Union due to fundamental rights violations. Deployment or placing on market is prohibited.',
    obligations: [
      'Cease deployment immediately',
      'Remove from EU market',
      'Inform affected parties',
      'Legal penalties: Up to €35M or 7% of global turnover',
    ],
    deadlines: [
      { date: 'February 2, 2025', description: 'Prohibition effective' },
    ],
    checklist: [
      {
        category: 'Immediate Actions',
        items: [
          'Stop all EU deployments',
          'Document cessation for regulatory purposes',
          'Assess alternative compliant approaches',
          'Consult legal counsel on liability exposure',
        ],
      },
    ],
    nextSteps: [
      { priority: 'immediate', action: 'Halt EU operations of this AI system' },
      { priority: 'immediate', action: 'Engage legal counsel for compliance strategy' },
      { priority: '30-days', action: 'Explore compliant alternative approaches' },
    ],
    documentationEstimate: 'Cessation documentation required',
  },

  High: {
    color: 'text-silicon-amber',
    bgColor: 'bg-silicon-amber',
    title: 'High Risk',
    desc: 'Permitted but subject to strict compliance obligations before market entry. Requires conformity assessment and registration in EU database.',
    obligations: [
      'Fundamental Rights Impact Assessment (FRIA)',
      'Risk management system implementation',
      'Data governance framework',
      'Technical documentation',
      'Human oversight mechanisms',
      'Accuracy and robustness testing',
      'Registration in EU database',
      'Post-market monitoring',
    ],
    deadlines: [
      { date: 'August 2, 2025', description: 'GPAI model obligations begin' },
      { date: 'August 2, 2026', description: 'Full high-risk requirements apply' },
      { date: 'August 2, 2027', description: 'Annex I systems (embedded in products)' },
    ],
    checklist: [
      {
        category: 'Risk Management',
        items: [
          'Establish risk management system',
          'Identify and analyse known/foreseeable risks',
          'Implement risk mitigation measures',
          'Document residual risk acceptance criteria',
        ],
      },
      {
        category: 'Data Governance',
        items: [
          'Document training data sources and provenance',
          'Implement data quality measures',
          'Address bias in training data',
          'Ensure GDPR compliance for personal data',
        ],
      },
      {
        category: 'Technical Documentation',
        items: [
          'System description and intended purpose',
          'Design specifications and architecture',
          'Monitoring and performance metrics',
          'Instructions for use and limitations',
        ],
      },
      {
        category: 'Human Oversight',
        items: [
          'Design for human-in-the-loop or on-the-loop',
          'Define human oversight procedures',
          'Ensure operators can intervene/override',
          'Document competence requirements for operators',
        ],
      },
    ],
    nextSteps: [
      { priority: 'immediate', action: 'Conduct gap analysis against AI Act requirements' },
      { priority: 'immediate', action: 'Begin Fundamental Rights Impact Assessment' },
      { priority: '30-days', action: 'Establish risk management system framework' },
      { priority: '30-days', action: 'Audit training data for bias and quality' },
      { priority: '90-days', action: 'Develop technical documentation package' },
      { priority: '90-days', action: 'Implement human oversight mechanisms' },
    ],
    documentationEstimate: '200-500 pages of technical documentation typical',
  },

  Limited: {
    color: 'text-stone-teal',
    bgColor: 'bg-stone-teal',
    title: 'Limited Risk (Transparency)',
    desc: 'Subject to specific transparency obligations. Users must be informed they are interacting with AI, and AI-generated content must be disclosed.',
    obligations: [
      'Disclose AI interaction to users',
      'Label AI-generated content clearly',
      'Mark deepfakes and synthetic media',
      'Enable users to identify AI-generated text',
      'Maintain transparency documentation',
    ],
    deadlines: [
      { date: 'August 2, 2025', description: 'Transparency obligations for GPAI' },
      { date: 'August 2, 2026', description: 'Full transparency requirements' },
    ],
    checklist: [
      {
        category: 'User Notification',
        items: [
          'Implement clear AI disclosure notices',
          'Design user-facing transparency UI',
          'Ensure disclosure before interaction starts',
          'Document disclosure mechanisms',
        ],
      },
      {
        category: 'Content Labeling',
        items: [
          'Implement AI-generated content markers',
          'Use machine-readable labeling where applicable',
          'Ensure labels persist with content',
          'Define labeling standards for all outputs',
        ],
      },
    ],
    nextSteps: [
      { priority: 'immediate', action: 'Audit current disclosure practices' },
      { priority: '30-days', action: 'Implement AI disclosure UI components' },
      { priority: '30-days', action: 'Develop content labeling system' },
      { priority: '90-days', action: 'Document transparency compliance' },
    ],
    documentationEstimate: '20-50 pages of transparency documentation',
  },

  Minimal: {
    color: 'text-text-muted',
    bgColor: 'bg-text-muted',
    title: 'Minimal Risk',
    desc: 'No specific AI Act restrictions. Standard data protection (GDPR) and sector-specific regulations still apply.',
    obligations: [
      'Voluntary adherence to codes of conduct',
      'Standard GDPR compliance for personal data',
      'Sector-specific regulations as applicable',
      'Best practice documentation recommended',
    ],
    deadlines: [
      { date: 'No AI Act deadline', description: 'GDPR and sector rules apply continuously' },
    ],
    checklist: [
      {
        category: 'Recommended Best Practices',
        items: [
          'Document system purpose and functionality',
          'Maintain data processing records (GDPR)',
          'Consider voluntary transparency measures',
          'Monitor for regulatory scope changes',
        ],
      },
    ],
    nextSteps: [
      { priority: '30-days', action: 'Ensure GDPR compliance is current' },
      { priority: '90-days', action: 'Consider voluntary AI Act alignment' },
      { priority: '90-days', action: 'Monitor regulatory developments' },
    ],
    documentationEstimate: 'Minimal AI-specific documentation (GDPR records required)',
  },

  Uncertain: {
    color: 'text-text-muted',
    bgColor: 'bg-text-muted',
    title: 'Analysis Inconclusive',
    desc: 'The tool could not strictly categorize your system based on these inputs. Your use case may require detailed legal analysis.',
    obligations: [
      'Consult with legal experts',
      'Request guidance from national authority',
      'Document your own risk assessment',
      'Apply precautionary high-risk measures if in doubt',
    ],
    deadlines: [
      { date: 'Varies', description: 'Depends on final classification' },
    ],
    checklist: [
      {
        category: 'Next Steps',
        items: [
          'Engage AI Act legal specialist',
          'Document system characteristics in detail',
          'Consider requesting regulatory sandbox participation',
          'Prepare for potential high-risk classification',
        ],
      },
    ],
    nextSteps: [
      { priority: 'immediate', action: 'Consult legal expert for classification' },
      { priority: '30-days', action: 'Document detailed system analysis' },
      { priority: '30-days', action: 'Prepare contingency compliance plan' },
    ],
    documentationEstimate: 'Varies based on final classification',
  },
}

// Key implementation milestone for any legacy consumers.
export const KEY_DEADLINE = {
  date: 'August 2, 2026',
  label: 'AI Act Transparency Milestone',
  description: 'Transparency obligations remain relevant while certain high-risk transition dates are subject to formal adoption of the 7 May 2026 political agreement',
}
