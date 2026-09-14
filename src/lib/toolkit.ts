/** Shared content for the consolidated product and its post-purchase instructions. */
export const TOOLKIT_TERMS = {
  updateMonths: 12,
  reviewMinutes: 45,
  reviewSystems: 3,
  bookingDays: 90,
  submissionWorkingDays: 3,
  workbookRetentionDays: 30,
} as const

export const TOOLKIT_FEATURES = [
  { title: 'Quick-start gap assessment', description: 'A twenty-question starting point that separates AI exposure from preparedness and identifies the evidence and actions needing attention.' },
  { title: 'One AI Systems Register', description: 'Catalogue systems, embedded AI features, vendors, departments, purposes, data inputs and outputs, ownership, roles, classifications, evidence and review dates. Includes illustrative examples and location flags.' },
  { title: 'Risk classification and requirements', description: 'A scope and role decision tree, worked examples and article references, followed by detailed checklists for providers, deployers, importers and distributors.' },
  { title: 'Vendor assessment and dependency scoring', description: 'Collect supplier evidence with the Vendor Assessment Questionnaire. Score data sovereignty, contractual lock-in, regulatory risk, concentration and alternative availability.' },
  { title: 'Editable policies and board summary', description: 'Adapt the Internal AI Governance Policy, customer Transparency Notice, Vendor Assessment Questionnaire and one-page Board-Ready Risk Summary for your organisation.' },
  { title: 'Action tracker and implementation guidance', description: 'Turn findings into actions with system references, owners, deadlines and evidence. Track progress in a dashboard and follow a 90-day plan with a glossary and source references.' },
] as const

export const TOOLKIT_WORKFLOW = [
  ['Assess', 'Identify gaps and the questions that need investigation.'],
  ['Catalogue', 'Record your systems and assign owners.'],
  ['Classify', 'Record your role, risk reasoning and applicable requirements.'],
  ['Assess suppliers', 'Collect evidence and score dependencies.'],
  ['Assign actions', 'Agree priorities, owners, dates and evidence.'],
  ['Brief leadership', 'Present the findings and your next 90 days.'],
] as const

export const PROFESSIONAL_STEPS = [
  { title: 'Book your review', description: 'Arrange one 45-minute Zoom discussion within 90 days of purchase. Invite the colleagues responsible for the selected systems.' },
  { title: 'Submit your workbook securely', description: 'Use your private file-request link at least three working days before the meeting. Include your company context, main questions and up to three AI systems for review.' },
  { title: 'Work through your findings', description: 'Clive reviews your material in advance, then discusses classification reasoning, supplier evidence, priority gaps and the next 90 days with your team.' },
  { title: 'Receive your action summary', description: 'A concise written record of agreed priorities, decisions, unresolved questions and recommended next steps.' },
] as const
