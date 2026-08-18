import { RULE_PACK } from '@/lib/rulepack'
import type { AssessmentQuestionV2 } from '../types'

/**
 * The Article 5 screen (§7.6) and the Annex I / Article 6(1) route.
 *
 * §7.6's user-facing rule is the one implemented here: "A broad positive screen
 * returns `potentially_prohibited` until all legally material conditions and
 * exceptions have been resolved… The user-facing output must use 'potentially
 * prohibited' unless the complete deterministic rule path has been satisfied and
 * the relevant exceptions have been excluded."
 *
 * **Scope note, stated rather than left to be discovered.** §7.6 also asks for
 * separate conditions and exception questions for *every* supported prohibited
 * practice. What is here is the screen, the law-enforcement authorisation
 * exception that recurs across several of the points, and the Article 5(1a)
 * safeguards test that decides when the two future-dated prohibitions reach a
 * general-purpose system. The remaining per-practice condition trees are legal
 * content still to author, and until they exist the engine holds every positive
 * screen at `potentially_prohibited` — which is the safe direction and exactly
 * what §7.6 requires of an unresolved path.
 *
 * The practice list comes from the pinned pack rather than a literal here, so a
 * change to the prohibitions is a pack edit and a version bump, not a code
 * change.
 */

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const PRACTICE_OPTIONS = RULE_PACK.prohibitedPractices.map((practice) => ({
  value: `art5_${practice.point}`,
  label: practice.summary,
  help: practice.futureDated ? `Prohibited from ${practice.appliesFrom}, not today.` : undefined,
}))

/** The screen values that came from the pack, for the engine to map back. */
export const PROHIBITED_SCREEN_VALUES = PRACTICE_OPTIONS.map((option) => option.value)

export const PROHIBITED_QUESTIONS: AssessmentQuestionV2[] = [
  {
    id: 'prohibited_screen',
    section: 'Prohibited practices',
    prompt: 'Does the system do any of these?',
    shortPrompt: 'Article 5 screen',
    help:
      'Read the whole list, including anything that sounds unlike your system. These are the practices the Regulation bans outright, and a ban has no compliance route — there is nothing to build towards except stopping.',
    whyAsked:
      'This is the only part of the assessment where the answer could mean stopping rather than documenting. We ask everyone, whatever their sector, because a prohibition attaches to the practice and not to the industry.',
    answerType: 'multi',
    options: [
      ...PRACTICE_OPTIONS,
      { value: 'none_of_these', label: 'None of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    validate: [
      { kind: 'maxSelections', value: PRACTICE_OPTIONS.length + 1, message: 'Select from the list.' },
    ],
  },
  {
    id: 'law_enforcement_authorisation',
    section: 'Prohibited practices',
    prompt: 'Is this use specifically authorised by law for a law enforcement purpose?',
    shortPrompt: 'Authorised by law',
    help:
      'Authorised by a specific legal basis, not merely lawful in general. If you are not a public authority acting under one, the answer is no.',
    whyAsked:
      'Several of Article 5’s prohibitions carry narrow law enforcement exceptions with their own safeguards and authorisation requirements. A "no" here closes those exceptions rather than opening them, which is why it is worth asking plainly.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: {
      not: { questionId: 'prohibited_screen', includesAny: ['none_of_these'] },
    },
  },
  {
    id: 'technical_safety_measures',
    section: 'Prohibited practices',
    prompt: 'Does the system have reasonable and adequate technical safety measures against that output, and have you tested them?',
    shortPrompt: 'Safety measures',
    help: 'Both halves matter: the measures, and evidence that they were tested.',
    whyAsked:
      'For the two prohibitions that arrive on 2 December 2026, Article 5(1a) turns on whether the system’s design and capabilities make that output a reasonably foreseeable and reproducible outcome without significant technical modification, absent reasonable and adequate technical safety measures. The safeguards are what keep a general-purpose system outside the prohibition.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: {
      questionId: 'prohibited_screen',
      includesAny: RULE_PACK.prohibitedPractices
        .filter((practice) => practice.futureDated)
        .map((practice) => `art5_${practice.point}`),
    },
  },
]

/**
 * Annex I / Article 6(1): the product-safety route.
 *
 * A separate route from Annex III with a different test — the system is a safety
 * component of, or is itself, a product covered by the Union harmonisation
 * legislation in Annex I, *and* that product must undergo third-party conformity
 * assessment. Both limbs, which is why this is two options rather than one.
 */
export const ANNEX_I_QUESTIONS: AssessmentQuestionV2[] = [
  {
    id: 'annex_i_route',
    section: 'What it does',
    prompt: 'Which of these is true of the system and the product it sits in?',
    shortPrompt: 'Product safety',
    help:
      'Machinery, medical devices, lifts, toys, radio equipment, vehicles and similar. If your product carries a CE mark for safety, this is probably you.',
    whyAsked:
      'Article 6(1) is the other route to high-risk, and it is cumulative: the system has to be a safety component of a regulated product (or be one), *and* that product has to need a third-party conformity assessment. One without the other does not reach it.',
    answerType: 'multi',
    options: [
      {
        value: 'safety_component_of_regulated_product',
        label: 'It is a safety component of a product covered by EU product-safety law, or is itself such a product',
      },
      {
        value: 'third_party_conformity_assessment',
        label: 'That product has to undergo a third-party conformity assessment before it is sold',
      },
      { value: 'none_of_these', label: 'Neither of these' },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: {
      any: [
        { questionId: 'intended_use_family', equals: 'regulated_product' },
        { questionId: 'regulated_product_own_name', equals: 'yes' },
      ],
    },
  },
]
