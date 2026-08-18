import type { AssessmentQuestionV2 } from '../types'

/**
 * The organisation-size follow-ups (§8).
 *
 * §8.1's rule is minimum friction: headcount is asked universally in the triage,
 * and the financial questions only when there is a reason. §8.1 gives three
 * triggers, and only one of them can be known *before* the answers exist — "the
 * user requests a more precise size determination". So that is what gates these:
 * an explicit opt-in, offered only to organisations whose headcount puts them
 * near the thresholds where it could matter.
 *
 * The other two triggers — SME treatment being relevant to an applicable
 * finding, and a penalty explanation being legitimately required — are
 * post-evaluation facts. They cannot gate a question in a linear questionnaire,
 * and the result handles them instead: §8.3's `provisional_headcount_only` is
 * exactly the honest answer to "we would need more to be sure, and you did not
 * offer it".
 *
 * §20.8 is the hard constraint here, and Phase 2's exit criterion: **missing
 * financial information never prevents completion.** Every question below is
 * optional, offers "not sure" and offers "prefer not to say", and none is
 * required on any path. §8.2 also forbids asking anyone to upload anything.
 */

const BAND_HELP =
  'An approximate band is fine. We do not store it against you and we never ask for documents.'

export const ORGANISATION_SIZE_QUESTIONS: AssessmentQuestionV2[] = [
  {
    id: 'size_precision_opt_in',
    section: 'Your organisation',
    prompt: 'Would you like us to be more precise about your organisation’s size?',
    shortPrompt: 'More precise size',
    help:
      'Two or three optional questions. Skipping them costs you nothing — anything that depends on size is simply shown as provisional.',
    whyAsked:
      'Headcount alone cannot settle the formal definition, which also looks at turnover or balance sheet and at whether your organisation is linked to others. Some documentation requirements are lighter for smaller organisations, so a more precise answer can mean a shorter list.',
    answerType: 'single',
    options: [
      { value: 'yes', label: 'Yes, ask me' },
      { value: 'no', label: 'No, provisional is fine' },
    ],
    allowUnknown: false,
    allowNotApplicable: false,
    importance: 'context_only',
    // Only offered where it could change anything. Above the SME thresholds the
    // financial figures cannot move the outcome, so asking would be friction for
    // its own sake — §4.5.
    visibleWhen: { questionId: 'employee_band', includesAny: ['1_9', '10_49', '50_249'] },
  },
  {
    id: 'annual_turnover_band',
    section: 'Your organisation',
    prompt: 'What is your annual turnover?',
    shortPrompt: 'Turnover',
    help: BAND_HELP,
    whyAsked:
      'The formal definition is met by headcount plus *either* turnover or balance sheet, so either one of these two answers is enough.',
    answerType: 'single',
    options: [
      { value: 'under_2m', label: 'Under €2 million' },
      { value: '2m_10m', label: '€2–10 million' },
      { value: '10m_50m', label: '€10–50 million' },
      { value: 'over_50m', label: 'Over €50 million' },
    ],
    allowUnknown: true,
    allowNotApplicable: true,
    importance: 'readiness_only',
    visibleWhen: { questionId: 'size_precision_opt_in', equals: 'yes' },
  },
  {
    id: 'balance_sheet_band',
    section: 'Your organisation',
    prompt: 'What is your annual balance-sheet total?',
    shortPrompt: 'Balance sheet',
    help: BAND_HELP,
    whyAsked:
      'An alternative to turnover, not an addition to it. If you answered the previous question you can skip this one.',
    answerType: 'single',
    options: [
      { value: 'under_2m', label: 'Under €2 million' },
      { value: '2m_10m', label: '€2–10 million' },
      { value: '10m_43m', label: '€10–43 million' },
      { value: 'over_43m', label: 'Over €43 million' },
    ],
    allowUnknown: true,
    allowNotApplicable: true,
    importance: 'readiness_only',
    visibleWhen: { questionId: 'size_precision_opt_in', equals: 'yes' },
  },
  {
    id: 'group_relationship',
    section: 'Your organisation',
    prompt: 'Is your organisation independent, or linked to or partnered with others?',
    shortPrompt: 'Group structure',
    help:
      'Linked usually means one holds a majority of the other. Partner usually means a holding of a quarter or more. If you are owned by a larger group, that is not independent.',
    whyAsked:
      'This is the part most often missed. A small company owned by a large group is generally not treated as small, because the group’s figures count towards the test.',
    answerType: 'single',
    options: [
      { value: 'independent', label: 'Independent' },
      { value: 'linked_or_partner', label: 'Linked to, or partnered with, other enterprises' },
    ],
    allowUnknown: true,
    allowNotApplicable: true,
    importance: 'readiness_only',
    visibleWhen: { questionId: 'size_precision_opt_in', equals: 'yes' },
  },
]
