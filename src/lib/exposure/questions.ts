import type { AssessmentQuestionV2 } from '@/lib/compliance-v2/types'
import { CORE_QUESTIONS } from '@/lib/compliance-v2/questions'

/**
 * The Exposure Check's questions: one organisation-level pass, about eight
 * questions, no free text.
 *
 * Five are the Compliance Checker v2 definitions with the same ids and the same
 * option values, so an answer given here means the same thing to the v2 engine
 * and can be carried into a per-system run later. What changes is the framing:
 * v2 asks about "this AI system", the Exposure Check about the organisation's AI
 * systems taken together, so the prompts are reworded and the use question
 * becomes multi-select. Option values are never changed — that is what keeps the
 * two catalogues speaking one vocabulary.
 *
 * The three new questions are readiness signals. None of them decides scope.
 */

function fromV2(id: string): AssessmentQuestionV2 {
  const question = CORE_QUESTIONS.find((item) => item.id === id)
  if (!question) throw new Error(`Exposure Check: v2 question "${id}" no longer exists`)
  return question
}

const establishment = fromV2('organisation_establishment')
const connection = fromV2('ai_market_connection')
const activity = fromV2('organisation_activity')
const useFamily = fromV2('intended_use_family')
const headcount = fromV2('employee_band')

export const EXPOSURE_QUESTIONS: AssessmentQuestionV2[] = [
  { ...establishment, section: 'Where you operate' },
  {
    ...connection,
    prompt: 'Do any of your AI systems have one of these connections to the EU?',
    help:
      'Think across every AI system or tool you build, sell or use. Choose every connection that applies to at least one of them. If none do, say so: that is an answer.',
  },
  {
    ...activity,
    prompt: 'What does your organisation do with AI systems?',
    help:
      'Choose every one that applies across your systems. Most organisations only use systems built by others; building or selling one as well is common.',
  },
  {
    ...useFamily,
    prompt: 'Which of these describe any AI system you build, sell or use?',
    help:
      'Choose every one that applies. This only decides which areas we flag for a closer look: being in a sector is not the same as a regulated use, and the Compliance Checker asks about the use itself.',
    answerType: 'multi',
    validate: [{ kind: 'maxSelections', value: 15, message: 'Select up to fifteen.' }],
  },
  headcount,
  {
    id: 'system_count',
    section: 'Your AI systems',
    prompt: 'Roughly how many AI systems or tools does your organisation build or use?',
    shortPrompt: 'Number of systems',
    help: 'Count anything with AI in it that staff or customers use: assistants, chatbots, screening tools, features inside software you buy.',
    whyAsked: 'It sets the size of the job. It does not change whether the Act applies.',
    answerType: 'single',
    options: [
      { value: '1', label: 'One' },
      { value: '2_5', label: '2–5' },
      { value: '6_20', label: '6–20' },
      { value: '20_plus', label: 'More than 20' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'readiness_only',
    required: true,
  },
  {
    id: 'ai_inventory',
    section: 'Your AI systems',
    prompt: 'Do you keep a list of the AI systems your organisation builds or uses?',
    shortPrompt: 'AI inventory',
    help: 'A spreadsheet counts. So does a register kept by IT or procurement.',
    whyAsked: 'Every later step starts from knowing which systems you have.',
    answerType: 'single',
    options: [
      { value: 'yes', label: 'Yes, and it is kept up to date' },
      { value: 'partly', label: 'Partly, or it is out of date' },
      { value: 'no', label: 'No' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'readiness_only',
    required: true,
  },
  {
    id: 'ai_literacy_measures',
    section: 'Your AI systems',
    prompt: 'Have staff who use or run AI systems had training or guidance on them?',
    shortPrompt: 'AI literacy',
    help: 'Anything from a short briefing to a formal course, as long as it covers the systems people actually use.',
    whyAsked:
      'AI literacy has been a duty for providers and deployers since the first application date, whatever the risk level of the system.',
    answerType: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'partly', label: 'Some staff, or some systems' },
      { value: 'no', label: 'No' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'readiness_only',
    required: true,
  },
]
