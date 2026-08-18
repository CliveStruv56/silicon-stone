import type { AssessmentQuestionV2, QuestionOption } from '../types'

/**
 * The intended-purpose branches (§7.4) — one exact-use question per Annex III
 * area, asked only when the triage selected that area.
 *
 * **This is the fix for defect 3.** v1 asked which sector you were in and made
 * the answer decide the tier, so a microbusiness using AI to schedule
 * appointments was told it ran a high-risk system because it ticked
 * "healthcare". §7.4 states the rule directly: "Each module must distinguish the
 * exact statutory use from ordinary activity in the same sector. For example,
 * healthcare administration must not be classified as high-risk solely because
 * it occurs in healthcare."
 *
 * So each question below lists the Annex III sub-points of its area as options,
 * plus an explicit **"none of these"**. High-risk requires selecting a
 * sub-point. Selecting nothing is a real answer that keeps you out, and it is
 * the answer most users in a listed sector will honestly give.
 *
 * The option labels paraphrase the Annex III text rather than quoting it: a
 * question has to be answerable by someone who has never read the Regulation.
 * The verbatim text is one link away on the provisions page, and the proposition
 * behind each route carries the extract that gets verified.
 */

interface AreaBranch {
  /** The `intended_use_family` value that opens this branch. */
  family: string
  id: string
  prompt: string
  help: string
  whyAsked: string
  /** Annex III sub-points, as `point` → plain-language label. */
  uses: Array<{ value: string; label: string; help?: string }>
  examples?: string[]
}

const NONE: QuestionOption = {
  value: 'none_of_these',
  label: 'None of these — our use is administrative, or something else in this area',
  help: 'This is a real answer, not a gap. Most uses inside a listed sector are not the listed use.',
}

const AREAS: AreaBranch[] = [
  {
    family: 'biometrics',
    id: 'annex_iii_biometrics_use',
    prompt: 'Which of these does the system actually do?',
    help: 'Choose the one that matches. If none does, say so.',
    whyAsked:
      'Annex III point 1 lists three specific biometric uses. Handling biometric data for some other purpose — unlocking a phone, verifying that someone is who they say they are — is not one of them.',
    uses: [
      {
        value: 'remote_identification',
        label: 'Identifies people at a distance, from a database, without their active participation',
        help: 'Not the same as verifying one person against their own record, which is expressly excluded.',
      },
      {
        value: 'categorisation_sensitive',
        label: 'Sorts people into categories by inferring sensitive or protected characteristics',
      },
      { value: 'emotion_recognition', label: 'Infers people’s emotions' },
    ],
    examples: [
      'Confirming a customer is the account holder from their own stored face is verification, and is excluded.',
      'Scanning a crowd against a watchlist is remote identification, and is not.',
    ],
  },
  {
    family: 'critical_infrastructure',
    id: 'annex_iii_infrastructure_use',
    prompt: 'Is the system a safety component in running critical infrastructure?',
    help:
      'A safety component is one whose failure endangers health or safety, not one whose failure is merely expensive or inconvenient.',
    whyAsked:
      'Annex III point 2 covers safety components in the management and operation of critical digital infrastructure, road traffic, and the supply of water, gas, heating or electricity. Office software used by an energy company is not that.',
    uses: [
      {
        value: 'safety_component',
        label: 'Yes — it is a safety component in critical digital infrastructure, road traffic, or water, gas, heating or electricity supply',
      },
    ],
  },
  {
    family: 'education',
    id: 'annex_iii_education_use',
    prompt: 'Which of these does the system actually do?',
    help: 'Choose the one that matches. If none does, say so.',
    whyAsked:
      'Annex III point 3 lists four specific educational uses. Timetabling, fee collection and course administration are not among them.',
    uses: [
      { value: 'admission', label: 'Decides access, admission or assignment to an institution' },
      { value: 'learning_outcomes', label: 'Evaluates learning outcomes, including to steer how someone learns' },
      { value: 'education_level', label: 'Assesses what level of education a person will receive or can access' },
      { value: 'exam_monitoring', label: 'Monitors or detects prohibited behaviour during tests' },
    ],
  },
  {
    family: 'employment',
    id: 'annex_iii_employment_use',
    prompt: 'Which of these does the system actually do?',
    help: 'Choose the one that matches. If none does, say so.',
    whyAsked:
      'Annex III point 4 covers recruitment and selection, and decisions about the terms of a working relationship. Payroll, rota-filling and HR record-keeping are not among them.',
    uses: [
      {
        value: 'recruitment_selection',
        label: 'Recruits or selects people — targeting job adverts, filtering applications, evaluating candidates',
      },
      {
        value: 'work_relationship_decisions',
        label: 'Affects the terms of work — promotion, termination, task allocation, or monitoring and evaluating performance',
      },
    ],
    examples: [
      'Ranking applicants by fit is recruitment and selection.',
      'Generating a draft job advert for a person to write is not.',
    ],
  },
  {
    family: 'essential_services',
    id: 'annex_iii_essential_services_use',
    prompt: 'Does the system decide who is eligible for essential public benefits or services?',
    help:
      'This one turns on who is doing it. The point covers use by public authorities, or by someone acting on their behalf.',
    whyAsked:
      'Annex III point 5(a) covers evaluating eligibility for essential public assistance benefits and services — including healthcare services — and granting, reducing, revoking or reclaiming them. Administering a private service is not that, and neither is administration inside a public body.',
    uses: [
      {
        value: 'public_benefits_eligibility',
        label: 'Yes — it evaluates eligibility for essential public benefits or services, or grants, reduces, revokes or reclaims them, by or for a public authority',
      },
    ],
    examples: [
      'Scoring benefit claims for a local authority is the listed use.',
      'Scheduling appointments at a clinic is not, whoever runs the clinic.',
    ],
  },
  {
    family: 'credit_insurance',
    id: 'annex_iii_credit_insurance_use',
    prompt: 'Which of these does the system actually do?',
    help: 'Choose the one that matches. If none does, say so.',
    whyAsked:
      'Annex III point 5 covers creditworthiness and credit scoring, and risk assessment and pricing in life and health insurance. Fraud detection is expressly carved out, and other insurance lines are not listed.',
    uses: [
      {
        value: 'creditworthiness',
        label: 'Evaluates creditworthiness or sets a credit score',
        help: 'Detecting financial fraud is expressly excluded from this point.',
      },
      {
        value: 'life_health_insurance_pricing',
        label: 'Assesses risk or sets pricing for life or health insurance',
      },
    ],
  },
  {
    family: 'emergency_dispatch',
    id: 'annex_iii_emergency_use',
    prompt: 'Does the system triage or dispatch emergency response?',
    help: 'Including patient triage in emergency healthcare.',
    whyAsked:
      'Annex III point 5(d) covers evaluating and classifying emergency calls, dispatching or prioritising first response, and emergency healthcare triage. Non-emergency scheduling is not covered.',
    uses: [
      {
        value: 'emergency_triage',
        label: 'Yes — it classifies emergency calls, dispatches or prioritises first response, or triages emergency patients',
      },
    ],
  },
  {
    family: 'law_enforcement',
    id: 'annex_iii_law_enforcement_use',
    prompt: 'Which of these does the system actually do, for or on behalf of a law enforcement authority?',
    help: 'Choose the one that matches. If none does, say so.',
    whyAsked:
      'Annex III point 6 lists five specific law enforcement uses. Case management and administration inside a police force are not among them.',
    uses: [
      { value: 'victim_risk', label: 'Assesses someone’s risk of becoming a victim of crime' },
      { value: 'polygraph', label: 'Acts as a polygraph or similar tool' },
      { value: 'evidence_reliability', label: 'Evaluates the reliability of evidence' },
      { value: 'offending_risk', label: 'Assesses risk of offending or re-offending, or personality traits and past behaviour' },
      { value: 'profiling_investigation', label: 'Profiles people in the course of detecting, investigating or prosecuting crime' },
    ],
  },
  {
    family: 'migration_border',
    id: 'annex_iii_migration_use',
    prompt: 'Which of these does the system actually do, for or on behalf of a competent public authority?',
    help: 'Choose the one that matches. If none does, say so.',
    whyAsked:
      'Annex III point 7 lists four specific migration and border uses. Verifying travel documents is expressly excluded from the identification limb.',
    uses: [
      { value: 'polygraph', label: 'Acts as a polygraph or similar tool' },
      { value: 'entry_risk', label: 'Assesses a security, irregular-migration or health risk posed by someone entering' },
      { value: 'application_examination', label: 'Assists in examining asylum, visa or residence applications, including the reliability of evidence' },
      {
        value: 'detection_identification',
        label: 'Detects, recognises or identifies people in a migration or border context',
        help: 'Verifying travel documents is expressly excluded.',
      },
    ],
  },
  {
    family: 'justice_democracy',
    id: 'annex_iii_justice_use',
    prompt: 'Which of these does the system actually do?',
    help: 'Choose the one that matches. If none does, say so.',
    whyAsked:
      'Annex III point 8 covers assisting a judicial authority in applying law to facts, and influencing elections or voting behaviour. Administrative and logistical campaign tools that voters are not exposed to are expressly excluded.',
    uses: [
      {
        value: 'judicial_assistance',
        label: 'Assists a judicial authority in researching or interpreting facts and law, or in applying law to facts',
        help: 'Including similar use in alternative dispute resolution.',
      },
      {
        value: 'election_influence',
        label: 'Influences the outcome of an election or referendum, or people’s voting behaviour',
        help: 'Tools that only organise or optimise a campaign, which voters are never exposed to, are excluded.',
      },
    ],
  },
]

export const ANNEX_III_QUESTIONS: AssessmentQuestionV2[] = AREAS.map((area) => ({
  id: area.id,
  section: 'What it does',
  prompt: area.prompt,
  shortPrompt: 'Exact use',
  help: area.help,
  whyAsked: area.whyAsked,
  examples: area.examples,
  // Multi rather than single: a system can do more than one listed thing, and
  // each one it does is a separate statutory route the result has to name.
  answerType: 'multi',
  options: [...area.uses, NONE],
  allowUnknown: true,
  allowNotApplicable: false,
  importance: 'classification_decisive',
  required: true,
  visibleWhen: { questionId: 'intended_use_family', equals: area.family },
}))

/** `intended_use_family` → the question that establishes its exact use. */
export const ANNEX_III_QUESTION_BY_FAMILY: Record<string, string> = Object.fromEntries(
  AREAS.map((area) => [area.family, area.id])
)

/** Every Annex III use value, so the engine can map an answer to a route. */
export const ANNEX_III_USE_VALUES: Record<string, string[]> = Object.fromEntries(
  AREAS.map((area) => [area.id, area.uses.map((use) => use.value)])
)
