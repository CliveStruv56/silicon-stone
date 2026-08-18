import type { AssessmentQuestionV2, ConditionExpression } from '../types'

/**
 * The role branch (§7.3).
 *
 * §7.3's instruction is the whole design of this file: "Integration,
 * configuration, fine-tuning or resale must not automatically create provider
 * status. Provider transition requires the relevant legal conditions to be
 * established or marked uncertain." So the triage question
 * `organisation_activity` records what the organisation *does*, and these
 * questions establish whether the conditions that move a duty from one party to
 * another are actually met.
 *
 * Each is a yes/no with "not sure" available, because an unresolved condition
 * must produce `cannot_determine` rather than a default in either direction —
 * defaulting to "no" understates duties, defaulting to "yes" invents them.
 */

/** Anyone downstream of the original provider, plus the case where we do not know. */
const DOWNSTREAM_OR_UNKNOWN: ConditionExpression = {
  any: [
    {
      questionId: 'organisation_activity',
      includesAny: [
        'integrated_or_configured',
        'distributed_or_resold',
        'used_internally_or_for_customers',
        'imported_into_eu',
      ],
    },
    { questionId: 'organisation_activity', state: 'unknown' },
  ],
}

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export const ROLE_QUESTIONS: AssessmentQuestionV2[] = [
  {
    id: 'own_name_supply',
    section: 'Your role',
    prompt: 'Do you supply the system to anyone else under your own name or trademark?',
    shortPrompt: 'Own name',
    help:
      'This means the people using it see it as your product. Reselling something that still carries the original supplier’s name is not this.',
    whyAsked:
      'Putting your own name on someone else’s AI system is one of the specific things that moves the supplier’s duties onto you. Nothing else on this page does that by itself.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: {
      all: [
        { not: { questionId: 'organisation_activity', includesAny: ['supplied_under_own_name'] } },
        DOWNSTREAM_OR_UNKNOWN,
      ],
    },
  },
  {
    id: 'intended_purpose_changed',
    section: 'Your role',
    prompt: 'Have you changed what the system is for?',
    shortPrompt: 'Purpose changed',
    help:
      'Using it for a different job than the supplier intended — not using it more, or using it in a new team for the same job.',
    whyAsked:
      'Changing the purpose a system is put to can make you responsible for it in the way its original supplier was. Using it as supplied, however heavily, does not.',
    examples: [
      'A tool sold for drafting marketing copy, used to screen job applications, has had its purpose changed.',
      'The same tool rolled out to three more marketing teams has not.',
    ],
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: DOWNSTREAM_OR_UNKNOWN,
  },
  {
    id: 'material_modification',
    section: 'Your role',
    prompt: 'Have you substantially modified the system?',
    shortPrompt: 'Modified',
    help:
      'A substantial modification is a change to the system itself that was not planned for by the supplier — retraining it on your own data, or altering how it reaches its output.',
    whyAsked:
      'A substantial modification is the second thing that can move the supplier’s duties onto you. Ordinary configuration is not a modification, which the next question separates out.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'classification_decisive',
    required: true,
    visibleWhen: DOWNSTREAM_OR_UNKNOWN,
  },
  {
    id: 'configuration_only',
    section: 'Your role',
    prompt: 'Are you only changing settings the supplier provides, or connecting it to your own software?',
    shortPrompt: 'Configuration only',
    help: 'Using the options the product ships with, or plugging it into your existing systems.',
    whyAsked:
      'Integration and configuration are the most common activities and the most commonly mistaken for taking on the supplier’s duties. They do not, on their own — this question is here to record that plainly rather than leave it to be inferred.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { questionId: 'organisation_activity', includesAny: ['integrated_or_configured'] },
  },
  {
    id: 'modification_still_high_risk',
    section: 'Your role',
    prompt: 'After the change, is the system used for one of the uses the Act treats as high-risk?',
    shortPrompt: 'Still high-risk',
    help:
      'If you are not sure, say so — later questions establish this properly, and your answer here does not override them.',
    whyAsked:
      'A modification moves the supplier’s duties onto you only where the system is, or becomes, high-risk. We ask now because you may already know; if you do not, the assessment establishes it from your use.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: {
      any: [
        { questionId: 'intended_purpose_changed', equals: 'yes' },
        { questionId: 'material_modification', equals: 'yes' },
      ],
    },
  },
  {
    id: 'places_on_eu_market_from_outside',
    section: 'Your role',
    prompt: 'Do you place the system on the EU market from outside the EU?',
    shortPrompt: 'Places on EU market',
    help: 'Selling, licensing or otherwise making it available to people in the EU.',
    whyAsked:
      'The Act reaches suppliers established anywhere once the system is placed on the EU market. Where you are established changes which duties fall to you and whether you need a representative in the Union — not whether the Act applies.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { not: { questionId: 'organisation_establishment', equals: 'eu_eea' } },
  },
  {
    id: 'supplied_onwards_unchanged',
    section: 'Your role',
    prompt: 'Do you pass the system on without changing it?',
    shortPrompt: 'Passed on unchanged',
    help: 'Reselling or distributing it as you received it, under the original supplier’s name.',
    whyAsked:
      'Someone in the supply chain who is neither the supplier nor the importer has a shorter, different set of duties. Establishing that you are in that position is what keeps the longer set off you.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: { questionId: 'organisation_activity', includesAny: ['distributed_or_resold'] },
  },
  {
    id: 'regulated_product_own_name',
    section: 'Your role',
    prompt: 'Is the system built into a product you sell under your own name, where that product has its own EU safety rules?',
    shortPrompt: 'In a regulated product',
    help:
      'Machinery, medical devices, lifts, toys, vehicles and similar. If your product does not carry a CE mark for safety, this is almost certainly not you.',
    whyAsked:
      'Where an AI system is a safety component of a product already regulated for safety, the duties attach through that product’s rules as well, and they fall on whoever puts their name on the product.',
    answerType: 'single',
    options: YES_NO,
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    visibleWhen: {
      any: [
        {
          questionId: 'organisation_activity',
          includesAny: ['built_or_commissioned', 'supplied_under_own_name'],
        },
        { questionId: 'intended_use_family', equals: 'regulated_product' },
      ],
    },
  },
]
