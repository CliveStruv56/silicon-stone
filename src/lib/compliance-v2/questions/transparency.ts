import type { AssessmentQuestionV2, ConditionExpression } from '../types'

/**
 * The Article 50 branch (§7.7) and the Article 6(3) exemption questions.
 *
 * §7.7 requires separate branches per paragraph, and its closing rule is the one
 * this file is shaped by: "Each finding must identify whether the relevant duty
 * belongs to a provider or deployer. A deployer may receive a recommendation to
 * confirm provider functionality, but a provider duty must not be relabelled as
 * the deployer's legal obligation."
 *
 * So the questions establish, separately: whether the system interacts with
 * people (50(1), a **provider** duty on design); whether it generates synthetic
 * content (50(2), a **provider** marking duty); whether emotion recognition or
 * biometric categorisation is deployed (50(3), a **deployer** duty); and whether
 * deep fakes or public-interest text are published (50(4), **deployer** duties).
 *
 * Every one of those paragraphs carries an exception, and each exception gets its
 * own question. Article 50(4)'s second subparagraph is defect 6: v1 emitted a
 * flat disclosure duty for AI-generated public-interest text even where the text
 * had been through human review with an identified person holding editorial
 * responsibility, which is precisely the case the paragraph carves out.
 */

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

/** The families whose systems plausibly engage Article 50 at all. */
const TRANSPARENCY_FAMILIES: ConditionExpression = {
  any: [
    { questionId: 'intended_use_family', includesAny: ['chatbot_interaction', 'synthetic_content', 'gpai_model', 'biometrics'] },
    { questionId: 'intended_use_family', state: 'unknown' },
  ],
}

export const TRANSPARENCY_QUESTIONS: AssessmentQuestionV2[] = [
  {
    id: 'interacts_with_people',
    section: 'Transparency',
    prompt: 'Does the system interact directly with people?',
    shortPrompt: 'Direct interaction',
    help: 'A chatbot, a voice assistant, or anything else a person exchanges messages with.',
    whyAsked:
      'Article 50(1) puts a design duty on the *provider* of such a system: it must be built so people are told they are dealing with an AI. Knowing whether that applies here is what separates your duty from your supplier’s.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    required: true,
    visibleWhen: TRANSPARENCY_FAMILIES,
  },
  {
    id: 'interaction_obvious',
    section: 'Transparency',
    prompt: 'Would it be obvious to a reasonable person that they are dealing with an AI?',
    shortPrompt: 'Obvious',
    help:
      'The test is not whether *you* know. It is whether a reasonably well-informed, observant and circumspect person would, given the circumstances and the context of use.',
    whyAsked:
      'Article 50(1) does not require disclosure where the interaction is already obvious on that test. This is a real exception, not a loophole — but it is judged from the user’s side, not yours.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { questionId: 'interacts_with_people', equals: 'yes' },
  },
  {
    id: 'generates_synthetic_content',
    section: 'Transparency',
    prompt: 'Does the system generate synthetic audio, image, video or text?',
    shortPrompt: 'Generates content',
    help: 'Producing new content, or materially changing content that already exists.',
    whyAsked:
      'Article 50(2) requires the *provider* of such a system to mark its output in a machine-readable format. If you deploy someone else’s, this establishes what to ask them for rather than what you owe.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    required: true,
    visibleWhen: TRANSPARENCY_FAMILIES,
  },
  {
    id: 'synthetic_assistive_only',
    section: 'Transparency',
    prompt: 'Does it only assist with standard editing, leaving the input substantially unchanged?',
    shortPrompt: 'Assistive editing',
    help: 'Spell-checking, tidying grammar, adjusting levels — changes that do not alter what the content says.',
    whyAsked:
      'Article 50(2)’s marking duty does not apply to systems performing an assistive function for standard editing, or which do not substantially alter the input data or its meaning.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { questionId: 'generates_synthetic_content', equals: 'yes' },
  },
  {
    id: 'deepfake_output',
    section: 'Transparency',
    prompt: 'Does it produce image, audio or video that could pass for real people, places or events?',
    shortPrompt: 'Deep fakes',
    help: 'The Regulation calls this a deep fake. It does not have to be malicious to count.',
    whyAsked:
      'Article 50(4) puts a disclosure duty on the *deployer* of such a system — on you, not on whoever built it.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { questionId: 'generates_synthetic_content', equals: 'yes' },
  },
  {
    id: 'deepfake_artistic',
    section: 'Transparency',
    prompt: 'Is the content evidently part of an artistic, creative, satirical or fictional work?',
    shortPrompt: 'Creative work',
    help: 'Evidently, from the audience’s point of view — not merely intended that way.',
    whyAsked:
      'Where it is, Article 50(4) limits the duty to disclosing that generated content exists, in a way that does not hamper the display or enjoyment of the work. The duty narrows; it does not disappear.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { questionId: 'deepfake_output', equals: 'yes' },
  },
  {
    id: 'public_interest_text',
    section: 'Transparency',
    prompt: 'Do you publish AI-generated or AI-edited text to inform the public on matters of public interest?',
    shortPrompt: 'Public-interest text',
    help: 'News, analysis, public information. Marketing and internal documents are not this.',
    whyAsked:
      'Article 50(4) requires a deployer publishing such text to disclose that it was artificially generated or manipulated — with one exception, which the next question establishes.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { questionId: 'generates_synthetic_content', equals: 'yes' },
  },
  {
    id: 'editorial_review_responsibility',
    section: 'Transparency',
    prompt: 'Has that text been through human review, with a named person or organisation holding editorial responsibility for it?',
    shortPrompt: 'Editorial responsibility',
    help: 'Both halves are needed: a review, and someone who is answerable for what is published.',
    whyAsked:
      'This is the exception. Article 50(4) does not require disclosure where the content has undergone human review or editorial control and a natural or legal person holds editorial responsibility for the publication.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { questionId: 'public_interest_text', equals: 'yes' },
  },
  {
    id: 'deploys_emotion_or_categorisation',
    section: 'Transparency',
    prompt: 'Do you operate an emotion recognition or biometric categorisation system on people?',
    shortPrompt: 'Emotion or categorisation',
    help: 'Operating it, whoever built it.',
    whyAsked:
      'Article 50(3) puts an information duty on the *deployer* — you must tell the people exposed to it that it is operating. It is your duty even when the system is someone else’s.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: TRANSPARENCY_FAMILIES,
  },
]

/**
 * Article 6(3): the narrow-task exemption, and the profiling proviso that
 * forecloses it.
 *
 * Asked only once an Annex III route has actually fired, because the exemption
 * is a derogation from a classification that must exist first. Asking it of
 * someone who never reached Annex III would invite them to claim relief from a
 * duty they never had.
 */
const IN_ANNEX_III: ConditionExpression = {
  any: [
    { questionId: 'annex_iii_biometrics_use', includesAny: ['remote_identification', 'categorisation_sensitive', 'emotion_recognition'] },
    { questionId: 'annex_iii_infrastructure_use', includesAny: ['safety_component'] },
    { questionId: 'annex_iii_education_use', includesAny: ['admission', 'learning_outcomes', 'education_level', 'exam_monitoring'] },
    { questionId: 'annex_iii_employment_use', includesAny: ['recruitment_selection', 'work_relationship_decisions'] },
    { questionId: 'annex_iii_essential_services_use', includesAny: ['public_benefits_eligibility'] },
    { questionId: 'annex_iii_credit_insurance_use', includesAny: ['creditworthiness', 'life_health_insurance_pricing'] },
    { questionId: 'annex_iii_emergency_use', includesAny: ['emergency_triage'] },
    { questionId: 'annex_iii_law_enforcement_use', includesAny: ['victim_risk', 'polygraph', 'evidence_reliability', 'offending_risk', 'profiling_investigation'] },
    { questionId: 'annex_iii_migration_use', includesAny: ['polygraph', 'entry_risk', 'application_examination', 'detection_identification'] },
    { questionId: 'annex_iii_justice_use', includesAny: ['judicial_assistance', 'election_influence'] },
  ],
}

export const EXEMPTION_QUESTIONS: AssessmentQuestionV2[] = [
  {
    id: 'performs_profiling',
    section: 'What it does',
    prompt: 'Does the system evaluate personal aspects of people — their performance, behaviour, interests, health, reliability, location or movements?',
    shortPrompt: 'Profiling',
    help: 'The Regulation calls this profiling. Handling personal data is not profiling; evaluating a person from it is.',
    whyAsked:
      'This is asked before the exemption questions and not after, because it decides whether the exemption is available at all. An Annex III system that profiles people is always high-risk, and no narrow-task argument reaches it.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: IN_ANNEX_III,
  },
  {
    id: 'narrow_task_condition',
    section: 'What it does',
    prompt: 'Which of these describes the system’s role in the decision?',
    shortPrompt: 'Narrow task',
    help: 'Choose the one that fits. If none does, say so — that is the common answer.',
    whyAsked:
      'Article 6(3) lifts the high-risk classification where the system does not pose a significant risk of harm and one of four conditions is met. All of it has to be true, which is why the next question asks about the risk of harm separately.',
    answerType: 'multi',
    options: [
      { value: 'narrow_procedural', label: 'It performs a narrow procedural task' },
      { value: 'improves_prior_human', label: 'It improves the result of an activity a person has already completed' },
      {
        value: 'detects_patterns',
        label: 'It detects patterns or deviations in past decisions, without replacing or influencing the human assessment already made',
        help: 'And without displacing proper human review.',
      },
      { value: 'preparatory', label: 'It performs a preparatory task to the assessment' },
      { value: 'none_of_these', label: 'None of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: { all: [IN_ANNEX_III, { questionId: 'performs_profiling', equals: 'no' }] },
  },
  {
    id: 'no_significant_risk_of_harm',
    section: 'What it does',
    prompt: 'Are you satisfied the system poses no significant risk of harm to health, safety or fundamental rights — including by not materially influencing the outcome of the decision?',
    shortPrompt: 'No significant risk',
    help: 'This is a judgement you would have to defend in writing, so answer it as you would defend it.',
    whyAsked:
      'It is the first half of Article 6(3), and it is cumulative with the condition above: meeting a narrow-task condition is not enough on its own. Claiming the exemption also creates its own documentation and registration duties.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: {
      all: [
        IN_ANNEX_III,
        { questionId: 'performs_profiling', equals: 'no' },
        { not: { questionId: 'narrow_task_condition', includesAny: ['none_of_these'] } },
      ],
    },
  },
]

export { IN_ANNEX_III }
