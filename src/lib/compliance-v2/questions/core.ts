import type { AssessmentQuestionV2 } from '../types'

/**
 * The universal triage (§7.2) — the eight questions every assessment asks
 * before any branch opens.
 *
 * **"Not sure" is a state, never an option value.** §7.2 lists "Not sure" among
 * the options for most of these, but §6.1 is the stronger instruction: an
 * explicit unknown "must not be converted to `false`, an empty string or a
 * default enum value". An option value *is* a default enum value. So every
 * "Not sure" in §7.2 is implemented as `allowUnknown: true`, which is what makes
 * it survive into the result as an unknown rather than as a choice — and what
 * stops v1's defect 5, where "not sure" about personal data produced a result
 * identical to "no personal data".
 *
 * The one place §7.2 conflates two different facts is
 * `organisation_establishment`, whose list reads "Not sure / multinational".
 * Those are not the same answer: an organisation established in several places
 * knows exactly where it is established, and the scope evaluator needs that. It
 * is split here into a `multiple` option plus the unknown state.
 *
 * §7.2's closing rule is load-bearing and is why `intended_use_family` is
 * `context_only` rather than decisive: the triage selects branches, and **sector
 * alone must not establish high-risk status**. Defect 3 is what happens without
 * that rule.
 */

export const CORE_QUESTIONS: AssessmentQuestionV2[] = [
  {
    id: 'organisation_establishment',
    section: 'Where you operate',
    prompt: 'Where is your organisation established?',
    shortPrompt: 'Establishment',
    help:
      'Where the organisation is legally based, not where the AI system or its supplier is. If you have entities in more than one place, choose "More than one".',
    whyAsked:
      'The AI Act reaches organisations outside the EU as well as inside it, but by different routes. Where you are established decides which route we test.',
    answerType: 'single',
    options: [
      { value: 'eu_eea', label: 'An EU or EEA member state' },
      { value: 'uk', label: 'The United Kingdom' },
      { value: 'us', label: 'The United States' },
      { value: 'canada', label: 'Canada' },
      { value: 'other', label: 'Somewhere else' },
      {
        value: 'multiple',
        label: 'More than one of these',
        help: 'Group companies or branches established in several jurisdictions.',
      },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
  },
  {
    id: 'ai_market_connection',
    section: 'Where you operate',
    prompt: 'Which of these describe the AI system’s connection to the EU?',
    shortPrompt: 'EU connection',
    help: 'Choose every one that applies. If none of them do, say so — that is an answer.',
    whyAsked:
      'Establishment alone does not decide whether the Regulation applies. This is the question that does, and it is the one most often answered wrongly by assuming that a company outside the EU is outside the Act.',
    examples: [
      'A US vendor selling an AI product to EU customers is placing it on the EU market.',
      'A Canadian company whose model scores EU job applicants is producing output used in the Union.',
    ],
    answerType: 'multi',
    options: [
      { value: 'placed_on_eu_market', label: 'It is placed on, or offered in, the EU market' },
      { value: 'put_into_service_eu', label: 'It is put into service in the EU' },
      { value: 'output_used_in_eu', label: 'Its output is used in the EU' },
      { value: 'used_from_eu_establishment', label: 'We use it from an EU establishment' },
      { value: 'none', label: 'None of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    validate: [{ kind: 'maxSelections', value: 4, message: 'Select up to four connections.' }],
  },
  {
    id: 'organisation_activity',
    section: 'Your role',
    prompt: 'What does your organisation do with this AI system?',
    shortPrompt: 'Your activity',
    help:
      'Choose every one that applies. Most organisations do only the last one. Doing more than one is common and is not a problem — it just changes which duties are yours.',
    whyAsked:
      'Every duty in the AI Act attaches to a role, and the role follows from what you actually do with the system rather than from what your contract calls you.',
    // Multi rather than single. §7.2 lists "More than one" as an option, which a
    // multi-select makes unnecessary — and a list of what you actually do is
    // more useful to the role evaluator than the fact that there are several.
    answerType: 'multi',
    options: [
      { value: 'built_or_commissioned', label: 'We built it, or had it built for us' },
      { value: 'supplied_under_own_name', label: 'We supply it under our own name or trademark' },
      { value: 'imported_into_eu', label: 'We import it into the EU' },
      { value: 'distributed_or_resold', label: 'We distribute or resell it' },
      {
        value: 'integrated_or_configured',
        label: 'We integrate or configure someone else’s system',
        help: 'Connecting it to your own software, or changing its settings.',
      },
      {
        value: 'used_internally_or_for_customers',
        label: 'We use someone else’s system, internally or with customers',
      },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    validate: [{ kind: 'maxSelections', value: 6, message: 'Select up to six activities.' }],
  },
  {
    id: 'intended_use_family',
    section: 'What it does',
    prompt: 'What is the system mainly used for?',
    shortPrompt: 'Use',
    help:
      'Pick the closest match. If nothing fits, choose "Something else" — the general route asks about your use directly and reaches the same conclusions.',
    whyAsked:
      'This selects which questions you are asked next. It does not decide your result: being in a regulated sector is not the same as a regulated use, and we ask about the use itself before concluding anything.',
    answerType: 'single',
    options: [
      { value: 'biometrics', label: 'Biometric identification, categorisation or emotion inference' },
      { value: 'critical_infrastructure', label: 'Safety in critical infrastructure' },
      { value: 'education', label: 'Education or vocational training' },
      { value: 'employment', label: 'Employment, recruitment or worker management' },
      { value: 'essential_services', label: 'Access to essential public or private services' },
      { value: 'credit_insurance', label: 'Credit scoring, or life and health insurance pricing' },
      { value: 'emergency_dispatch', label: 'Emergency call triage or dispatch' },
      { value: 'law_enforcement', label: 'Law enforcement' },
      { value: 'migration_border', label: 'Migration, asylum or border control' },
      { value: 'justice_democracy', label: 'Justice or democratic processes' },
      { value: 'regulated_product', label: 'Part of a product covered by EU product-safety law' },
      { value: 'chatbot_interaction', label: 'A chatbot or assistant people interact with directly' },
      { value: 'synthetic_content', label: 'Generating or editing images, audio, video or text' },
      { value: 'gpai_model', label: 'A general-purpose AI model we provide to others' },
      { value: 'something_else', label: 'Something else' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    // Deliberately not decisive. §7.2: "The triage must select relevant branches
    // but must not use sector alone to establish high-risk status."
    importance: 'context_only',
    required: true,
  },
  {
    id: 'intended_use_description',
    section: 'What it does',
    prompt: 'In your own words, what does the system do?',
    shortPrompt: 'Description',
    help:
      'A sentence or two is enough. Say what goes in, what comes out, and what happens next as a result.',
    whyAsked:
      'On the general route this is the only description of the system we have, so it is what the branch questions are drawn from. "Not sure how to describe it" is a valid answer and does not stop the assessment.',
    examples: [
      'It reads incoming support emails and drafts a reply for an agent to check and send.',
      'It scores loan applications and declines anything below a threshold automatically.',
    ],
    answerType: 'text',
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    validate: [{ kind: 'maxLength', value: 1_000, message: 'Keep it under 1,000 characters.' }],
    // Optional on a controlled route, required as an answer state once the user
    // has said their use is something else — §7.2.
    requiredWhen: { questionId: 'intended_use_family', equals: 'something_else' },
  },
  {
    id: 'individual_impact',
    section: 'What it does',
    prompt: 'How does the system affect decisions about people?',
    shortPrompt: 'Effect on people',
    help: 'Think about the decision the output feeds into, not the accuracy of the output itself.',
    whyAsked:
      'Several of the Act’s routes turn on whether a system decides something about a person, or merely helps someone else decide. This is also what separates a high-risk use from ordinary administration in the same sector.',
    answerType: 'single',
    options: [
      { value: 'no_decisions_about_people', label: 'It makes no decision about individuals' },
      {
        value: 'administrative_only',
        label: 'Administrative assistance only',
        help: 'Scheduling, filing, formatting, routing — nothing that changes an outcome for someone.',
      },
      { value: 'informs_human_decision', label: 'It informs a decision a person makes' },
      { value: 'recommends_ranks_scores', label: 'It recommends, ranks or scores people' },
      { value: 'determines_outcome', label: 'It determines an outcome automatically' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
  },
  {
    id: 'personal_data_use',
    section: 'What it does',
    prompt: 'Does the system use personal data?',
    shortPrompt: 'Personal data',
    help:
      'Personal data is anything relating to an identifiable person — names, emails, staff records, customer histories, images of people.',
    whyAsked:
      'Data protection law applies alongside the AI Act and is not covered by it. If personal data may be involved we add a short, separate set of questions, and we say plainly that it is not a full GDPR audit.',
    answerType: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'possibly', label: 'Possibly' },
      { value: 'no', label: 'No' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    required: true,
  },
  {
    id: 'employee_band',
    section: 'Your organisation',
    prompt: 'How many people does your organisation employ?',
    shortPrompt: 'Headcount',
    help: 'A rough band is fine. We never ask you to upload anything.',
    whyAsked:
      'Some of the Act’s documentation requirements are lighter for smaller organisations. Headcount alone cannot settle it — the formal definition also looks at financial figures and group relationships — so anything size-dependent is shown as provisional unless you choose to tell us more.',
    answerType: 'single',
    options: [
      { value: '1_9', label: '1–9' },
      { value: '10_49', label: '10–49' },
      { value: '50_249', label: '50–249' },
      { value: '250_749', label: '250–749' },
      { value: '750_plus', label: '750 or more' },
    ],
    allowUnknown: true,
    // §8.2: "prefer not to say" is a real answer here, not an evasion.
    allowNotApplicable: true,
    importance: 'finding_decisive',
    required: true,
  },
]
