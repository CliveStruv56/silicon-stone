import type { AssessmentQuestionV2, ConditionExpression } from '../types'

/**
 * The one question Article 43 needs, and no more (§7.4's discipline applied to
 * a procedural provision).
 *
 * Article 43 branches three ways, and the engine can already tell two of them
 * apart from answers it collects anyway: which Annex III point applies, and
 * whether the Annex I product route applies. Only the first branch — Annex III
 * point 1, biometrics — turns on something nobody has been asked. There, the
 * provider *chooses* between Annex VI internal control and an Annex VII notified
 * body **only where harmonised standards under Article 40, or common
 * specifications under Article 41, have been applied**. Where they have not,
 * Annex VII is mandatory.
 *
 * That is a real cost difference — a notified body is an external audit — so the
 * question earns its place, and the answer is decisive for what the result says.
 *
 * TWO THINGS ABOUT THE GATE.
 *
 * It is Annex III point 1 **and** a provider route, because the procedure is the
 * provider's to choose and the finding is emitted only where a provider role is
 * actually held. The `any` limb below is an exact superset of the ways
 * `roles.ts` returns `provider: applies`: built or commissioned, supplied under
 * own name, or one of the three Article 25 transfer routes answered "yes".
 * Where any of those is *unresolved* the role comes back `cannot_determine` and
 * no Article 43 finding fires, so a deployer of someone else's face-recognition
 * system is never asked how it was certified — which is not their answer to
 * give.
 *
 * And "not sure" leaves the route **unresolved**. Annex VI is the cheaper
 * procedure; defaulting an unknown to it would tell a provider it may
 * self-certify a biometric system when the answer that decides it was never
 * given. That is the expensive direction to be wrong in, so the engine says it
 * cannot tell and names the fact that would settle it.
 */

/** The Annex III point 1 uses, as `annex_iii_biometrics_use` records them. */
export const ANNEX_III_POINT_1_USES = [
  'remote_identification',
  'categorisation_sensitive',
  'emotion_recognition',
]

/**
 * Every way `providerRole()` reaches `applies`. Kept beside the question it
 * gates so the two are read together; a divergence would show up as a provider
 * being told the route is unresolved having never been asked.
 */
const PROVIDER_ROUTES: ConditionExpression = {
  any: [
    {
      questionId: 'organisation_activity',
      includesAny: ['built_or_commissioned', 'supplied_under_own_name'],
    },
    { questionId: 'own_name_supply', equals: 'yes' },
    { questionId: 'intended_purpose_changed', equals: 'yes' },
    { questionId: 'material_modification', equals: 'yes' },
  ],
}

export const CONFORMITY_QUESTIONS: AssessmentQuestionV2[] = [
  {
    id: 'art43_harmonised_standards',
    section: 'Conformity assessment',
    prompt:
      'Have you applied harmonised standards, or common specifications, covering the requirements for high-risk systems?',
    shortPrompt: 'Standards applied',
    help:
      'Harmonised standards are the ones published in the Official Journal under Article 40. Common specifications are what the Commission issues under Article 41 where no standard exists yet. Applying one is voluntary — the question is which of these describes what you have actually done.',
    whyAsked:
      'For a biometric system, this answer decides whether you may assess conformity yourself or must involve a notified body. It is the single largest cost difference in the whole procedure, and it turns on this rather than on the size of your organisation.',
    examples: [
      'Applying a published standard in full, and being able to show which clauses map to which requirement, is the first answer.',
      'Applying the parts that fitted and writing your own approach for the rest is the second, and it does not preserve the choice.',
    ],
    answerType: 'single',
    options: [
      {
        value: 'applied_in_full',
        label: 'Yes — applied in full, across all of the requirements',
      },
      {
        value: 'applied_in_part',
        label: 'Partly — we applied some of a standard, not all of it',
      },
      {
        value: 'restricted_standard',
        label: 'We applied a standard that was published with a restriction',
        help: 'The Official Journal reference says the standard only confers presumption of conformity for part of what it covers.',
      },
      {
        value: 'none_applied',
        label: 'No — we have not applied a harmonised standard or a common specification',
        help: 'Including where none exists yet for what your system does.',
      },
    ],
    allowUnknown: true,
    allowNotApplicable: false,
    importance: 'finding_decisive',
    required: true,
    visibleWhen: {
      all: [
        { questionId: 'annex_iii_biometrics_use', includesAny: ANNEX_III_POINT_1_USES },
        PROVIDER_ROUTES,
      ],
    },
  },
]
