import { RULE_PACK } from '@/lib/rulepack'
import type { AnswerRecordV2 } from '../types'
import { includesAny, isNo, isYes, saidUnknown, valueOf, valuesOf } from './read'

/**
 * Article 5, with the per-practice condition trees §7.6 asks for.
 *
 * Every prohibition in Article 5 is a **conjunction**. (a) needs a technique and
 * material distortion and an impaired informed decision and significant harm;
 * (f) needs emotion inference and a workplace or education setting and the
 * absence of a medical or safety purpose. A "no" to any limb takes the practice
 * out entirely. That is what this file evaluates, and it is why the honest
 * output of a positive screen is usually *not* an alarm.
 *
 * Three outcomes per practice, and each says something different:
 *
 * - `not_engaged` — a limb failed, or an exception the provision itself states
 *   is made out. The practice is cleared, and `clearedBecause` says which limb
 *   did it. It is reported rather than silently dropped: a reader who ticked
 *   "infers emotions" needs to see that the answer was considered.
 * - `unresolved` — every limb so far is satisfied and at least one is unanswered
 *   or unknown. This is `potentially_prohibited` with a specific list.
 * - `all_limbs_met` — every limb of the definition is satisfied and no stated
 *   exception applies.
 *
 * **`all_limbs_met` still reports as "potentially prohibited", and that is
 * deliberate.** §6.3's classification enum has no `prohibited` value, and this
 * is not the tool to invent one. Every answer feeding these trees is a
 * self-reported judgement about the user's own system — "does it materially
 * distort behaviour?" is a question courts spend days on — and the legal content
 * here is `internal` review status. What a complete path buys is a much stronger
 * statement (every limb of the definition is met on your answers, no stated
 * exception applies, here is the provision) and a higher confidence, which is
 * the accurate thing to say and stops short of the thing that would not be.
 *
 * §7.6 is satisfied in the direction it cares about: the output uses
 * "potentially prohibited" *unless* the complete deterministic path is satisfied
 * and the exceptions excluded — and where it is, the tool says so in terms.
 */

// --- Limbs ---------------------------------------------------------------

type LimbState = 'satisfied' | 'failed' | 'unresolved'

interface Limb {
  state: LimbState
  /** Phrased as the thing that is true when the limb is satisfied. */
  label: string
  /** Phrased as the reason the practice is cleared when the limb fails. */
  clears?: string
  answerIds: string[]
}

/** A limb satisfied by "yes". */
function whenYes(answers: AnswerRecordV2, id: string, label: string, clears: string): Limb {
  const state: LimbState = isYes(answers, id) ? 'satisfied' : isNo(answers, id) ? 'failed' : 'unresolved'
  return { state, label, clears, answerIds: [id] }
}

/**
 * A limb satisfied by "no" — an exception the provision states.
 *
 * Inverted on purpose. The prohibition is engaged while the exception is *not*
 * made out, so "yes, the exception applies" is what clears the practice.
 */
function whenNo(answers: AnswerRecordV2, id: string, label: string, clears: string): Limb {
  const state: LimbState = isNo(answers, id) ? 'satisfied' : isYes(answers, id) ? 'failed' : 'unresolved'
  return { state, label, clears, answerIds: [id] }
}

/** A limb satisfied by selecting anything other than the none-option. */
function whenAnySelected(
  answers: AnswerRecordV2,
  id: string,
  label: string,
  clears: string
): Limb {
  const selected = valuesOf(answers, id)
  const state: LimbState = !selected.length
    ? 'unresolved'
    : selected.some((value) => value !== 'none_of_these')
      ? 'satisfied'
      : 'failed'
  return { state, label, clears, answerIds: [id] }
}

/** Combine limbs where any one satisfying is enough — a statutory "or". */
function either(label: string, clears: string, ...limbs: Limb[]): Limb {
  const answerIds = [...new Set(limbs.flatMap((limb) => limb.answerIds))]
  if (limbs.some((limb) => limb.state === 'satisfied')) {
    return { state: 'satisfied', label, clears, answerIds }
  }
  if (limbs.every((limb) => limb.state === 'failed')) {
    return { state: 'failed', label, clears, answerIds }
  }
  return { state: 'unresolved', label, clears, answerIds }
}

/** Combine limbs where all must satisfy — a statutory "and". */
function both(label: string, clears: string, ...limbs: Limb[]): Limb {
  const answerIds = [...new Set(limbs.flatMap((limb) => limb.answerIds))]
  if (limbs.some((limb) => limb.state === 'failed')) {
    return { state: 'failed', label, clears, answerIds }
  }
  if (limbs.every((limb) => limb.state === 'satisfied')) {
    return { state: 'satisfied', label, clears, answerIds }
  }
  return { state: 'unresolved', label, clears, answerIds }
}

// --- The trees -----------------------------------------------------------

/**
 * Article 5(1a): the gate in front of both future-dated prohibitions.
 *
 * The statute splits it by what you do rather than by what you are. Placing on
 * the market or putting into service is caught where the generation is the
 * intended purpose, **or** where it is a foreseeable and reproducible outcome
 * without adequate safeguards. *Use* is caught only where the deployer uses the
 * system for that purpose. Evaluated as a disjunction of the two routes, because
 * an organisation can be on both, and either one engages the prohibition.
 */
function article5aGate(answers: AnswerRecordV2): Limb {
  const marketRoute = either(
    'placing it on the market or putting it into service reaches the prohibition',
    'neither route into Article 5(1a) is made out for placing it on the market',
    whenYes(
      answers,
      'art5_babb_intended_purpose',
      'generating or manipulating that material is the intended purpose of the system',
      'that generation is not the intended purpose of the system'
    ),
    both(
      'the output is foreseeable and reproducible, and adequate safeguards are absent',
      'the output is not a foreseeable and reproducible result, or adequate safeguards are in place',
      whenYes(
        answers,
        'art5_babb_foreseeable_output',
        'the output is a reasonably foreseeable and reproducible result without significant technical modification',
        'the output is not a reasonably foreseeable and reproducible result'
      ),
      whenNo(
        answers,
        'technical_safety_measures',
        'the system lacks reasonable and adequate technical safety measures against that output',
        'reasonable and adequate technical safety measures are in place'
      )
    )
  )

  const useRoute = whenYes(
    answers,
    'art5_babb_deployer_use',
    'the system is used for the purpose of generating or manipulating that material',
    'the system is not used for the purpose of generating such material'
  )

  return either(
    'Article 5(1a) is engaged by how this system is supplied or used',
    'neither Article 5(1a) route — supply or use — is made out',
    marketRoute,
    useRoute
  )
}

/**
 * Article 5(1)(h) inverts: the practice is prohibited *unless* it is strictly
 * necessary for one of three objectives **and** the Article 5(2)–(3) safeguards
 * are all in place. So the exception is a conjunction, and anything short of the
 * whole of it leaves the prohibition engaged.
 */
function realTimeBiometricException(answers: AnswerRecordV2): Limb {
  const objective = valuesOf(answers, 'art5_h_objective')
  const safeguards = valuesOf(answers, 'art5_h_safeguards')
  const REQUIRED = ['prior_authorisation', 'fundamental_rights_assessment', 'eu_database_registration']

  const label =
    'the use is not within a listed objective with all of the required authorisations in place'
  const clears =
    'the use is strictly necessary for one of the three listed objectives, with prior authorisation, a fundamental rights impact assessment and EU database registration all in place'
  const answerIds = ['art5_h_objective', 'art5_h_safeguards']

  if (!objective.length) return { state: 'unresolved', label, clears, answerIds }

  // No listed objective means the exception cannot open at all, whatever the
  // paperwork says. That resolves the limb without needing the safeguards.
  if (!objective.some((value) => value !== 'none_of_these')) {
    return { state: 'satisfied', label, clears, answerIds: ['art5_h_objective'] }
  }

  if (!safeguards.length) return { state: 'unresolved', label, clears, answerIds }
  const complete = REQUIRED.every((item) => safeguards.includes(item))
  return { state: complete ? 'failed' : 'satisfied', label, clears, answerIds }
}

/** Every limb of every supported practice, keyed by the pack's point. */
function limbsFor(point: string, answers: AnswerRecordV2): Limb[] {
  const distortion = whenYes(
    answers,
    'art5_ab_material_distortion',
    'materially distorting behaviour is its objective or its effect',
    'materially distorting behaviour is neither its objective nor its effect'
  )
  const harm = whenYes(
    answers,
    'art5_ab_significant_harm',
    'it causes, or is reasonably likely to cause, significant harm',
    'it does not cause, and is not reasonably likely to cause, significant harm'
  )

  switch (point) {
    case 'a':
      return [
        whenAnySelected(
          answers,
          'art5_a_technique',
          'it deploys a subliminal, purposefully manipulative or deceptive technique',
          'it deploys none of the techniques Article 5(1)(a) names'
        ),
        distortion,
        whenYes(
          answers,
          'art5_a_informed_decision',
          'it appreciably impairs an informed decision, producing a decision the person would not otherwise have taken',
          'it does not appreciably impair a person’s ability to make an informed decision'
        ),
        harm,
      ]

    case 'b':
      return [
        whenAnySelected(
          answers,
          'art5_b_vulnerability',
          'it exploits a vulnerability of age, disability, or a specific social or economic situation',
          'it exploits none of the three vulnerabilities Article 5(1)(b) names'
        ),
        distortion,
        harm,
      ]

    case 'ba':
      return [
        whenNo(
          answers,
          'art5_ba_consent',
          'the depicted person has not given freely-given, specific, informed, unambiguous and explicit consent',
          'the depicted person gives freely-given, specific, informed, unambiguous and explicit consent'
        ),
        (() => {
          const scope = valueOf(answers, 'art5_ba_manipulation_scope')
          const label =
            'what the system does counts as generation, or as manipulation within the meaning of Article 5(1b)'
          const clears =
            'the system only manipulates material without increasing the exposure of intimate parts or altering the nature of a depicted sexual activity, which Article 5(1b) says is not manipulation'
          const answerIds = ['art5_ba_manipulation_scope']
          if (scope === 'neither') return { state: 'failed' as const, label, clears, answerIds }
          if (scope === 'increases_or_alters' || scope === 'generates_new') {
            return { state: 'satisfied' as const, label, clears, answerIds }
          }
          return { state: 'unresolved' as const, label, clears, answerIds }
        })(),
        article5aGate(answers),
      ]

    case 'bb':
      return [
        whenNo(
          answers,
          'art5_bb_without_right',
          'no "without right" defence under national law applies',
          'a "without right" defence under national law applies to this use'
        ),
        article5aGate(answers),
      ]

    case 'c':
      return [
        whenYes(
          answers,
          'art5_c_evaluation',
          'it evaluates or classifies people over time by their social behaviour or personal characteristics',
          'it does not evaluate people over time by their social behaviour or personal characteristics'
        ),
        whenAnySelected(
          answers,
          'art5_c_detriment',
          'the score leads to detrimental treatment of one of the two kinds Article 5(1)(c) names',
          'the score leads to neither kind of detrimental treatment Article 5(1)(c) names'
        ),
      ]

    case 'd':
      return [
        whenYes(
          answers,
          'art5_d_solely_profiling',
          'the risk assessment rests solely on profiling or on assessing personality traits',
          'the risk assessment does not rest solely on profiling or personality assessment'
        ),
        whenNo(
          answers,
          'art5_d_supports_human_assessment',
          'it does not merely support a human assessment already grounded in objective, verifiable facts',
          'it supports a human assessment of involvement in criminal activity that is already based on objective and verifiable facts directly linked to that activity — the exception Article 5(1)(d) states'
        ),
      ]

    case 'e':
      return [
        whenYes(
          answers,
          'art5_e_database',
          'it creates or expands a facial recognition database',
          'it does not create or expand a facial recognition database'
        ),
        whenYes(
          answers,
          'art5_e_untargeted',
          'the images come from untargeted scraping of the internet or CCTV footage',
          'the images do not come from untargeted scraping of the internet or CCTV footage'
        ),
      ]

    case 'f':
      return [
        whenAnySelected(
          answers,
          'art5_f_context',
          'the inference happens in the workplace or in an education institution',
          'the inference happens neither in the workplace nor in an education institution'
        ),
        whenNo(
          answers,
          'art5_f_medical_safety',
          'it is not intended for medical or safety reasons',
          'the system is intended to be put in place or placed on the market for medical or safety reasons — the exception Article 5(1)(f) states'
        ),
      ]

    case 'g':
      return [
        whenAnySelected(
          answers,
          'art5_g_characteristics',
          'it deduces or infers one of the characteristics Article 5(1)(g) lists',
          'it deduces none of the characteristics Article 5(1)(g) lists'
        ),
        whenNo(
          answers,
          'art5_g_carveout',
          'it is not the labelling or filtering of a lawfully acquired biometric dataset, nor categorisation of biometric data in the area of law enforcement',
          'it is the labelling or filtering of a lawfully acquired biometric dataset, or categorisation of biometric data in the area of law enforcement, which Article 5(1)(g) says it does not cover'
        ),
      ]

    case 'h':
      return [
        whenYes(
          answers,
          'art5_h_realtime_public',
          'it is "real-time" remote biometric identification in a publicly accessible space for law enforcement',
          'it is not "real-time" remote biometric identification in a publicly accessible space for law enforcement'
        ),
        realTimeBiometricException(answers),
      ]

    default:
      // A practice in the pack with no tree here. Unresolvable rather than
      // silently clear — a pack that grows a point must not quietly acquire a
      // practice this engine treats as harmless.
      return [
        {
          state: 'unresolved',
          label: 'the conditions and exceptions of this prohibition',
          clears: '',
          answerIds: [],
        },
      ]
  }
}

// --- Evaluation ----------------------------------------------------------

export type PracticeOutcome = 'all_limbs_met' | 'unresolved' | 'not_engaged'

export interface ProhibitedPracticeFinding {
  point: string
  summary: string
  /** Undefined where the practice is already prohibited. */
  appliesFrom?: string
  futureDated: boolean
  outcome: PracticeOutcome
  /** Limbs established on these answers. */
  satisfied: string[]
  /** What would move this off "potentially prohibited". */
  unresolved: string[]
  /** Why the practice is not engaged, where it is not. */
  clearedBecause?: string
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

export interface Article5Evaluation {
  /** Practices still live: `unresolved` or `all_limbs_met`. */
  engaged: ProhibitedPracticeFinding[]
  /** Practices the screen raised and the conditions took out. */
  cleared: ProhibitedPracticeFinding[]
  /** True where the user said "not sure" rather than clearing the screen. */
  uncertain: boolean
  explanation: string
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

const PRACTICE_BY_VALUE = new Map(
  RULE_PACK.prohibitedPractices.map((practice) => [`art5_${practice.point}`, practice])
)

function evaluatePractice(value: string, answers: AnswerRecordV2): ProhibitedPracticeFinding {
  const practice = PRACTICE_BY_VALUE.get(value)
  const point = practice?.point ?? value.replace(/^art5_/, '')
  const futureDated = Boolean(practice?.futureDated)
  const limbs = limbsFor(point, answers)

  const failed = limbs.find((limb) => limb.state === 'failed')
  const outstanding = limbs.filter((limb) => limb.state === 'unresolved')

  const outcome: PracticeOutcome = failed
    ? 'not_engaged'
    : outstanding.length
      ? 'unresolved'
      : 'all_limbs_met'

  return {
    point,
    summary: practice?.summary ?? value,
    appliesFrom: futureDated ? practice?.appliesFrom : undefined,
    futureDated,
    outcome,
    satisfied: limbs.filter((limb) => limb.state === 'satisfied').map((limb) => limb.label),
    unresolved: outstanding.map((limb) => limb.label),
    clearedBecause: failed?.clears || undefined,
    triggeringAnswerIds: [
      'prohibited_screen',
      ...new Set(
        limbs
          .filter((limb) => limb.state !== 'unresolved')
          .flatMap((limb) => limb.answerIds)
      ),
    ],
    missingAnswerIds: [...new Set(outstanding.flatMap((limb) => limb.answerIds))],
  }
}

export function evaluateArticle5(answers: AnswerRecordV2): Article5Evaluation {
  if (saidUnknown(answers, 'prohibited_screen')) {
    return {
      engaged: [],
      cleared: [],
      uncertain: true,
      explanation:
        'The prohibited-practice screen is unresolved. This is the one part of the assessment where the answer could mean stopping rather than documenting, so it should be settled before the result is relied on.',
      triggeringAnswerIds: [],
      missingAnswerIds: ['prohibited_screen'],
    }
  }

  const selected = valuesOf(answers, 'prohibited_screen').filter((value) => value !== 'none_of_these')

  if (!selected.length) {
    return {
      engaged: [],
      cleared: [],
      uncertain: false,
      explanation: 'No prohibited-practice red flag was selected.',
      triggeringAnswerIds: ['prohibited_screen'],
      missingAnswerIds: [],
    }
  }

  const evaluated = selected.map((value) => evaluatePractice(value, answers))
  const engaged = evaluated.filter((item) => item.outcome !== 'not_engaged')
  const cleared = evaluated.filter((item) => item.outcome === 'not_engaged')

  const complete = engaged.filter((item) => item.outcome === 'all_limbs_met')
  const outstanding = engaged.filter((item) => item.outcome === 'unresolved')
  const future = engaged.filter((item) => item.futureDated)
  const current = engaged.filter((item) => !item.futureDated)

  const explanation = engaged.length
    ? [
        current.length
          ? `${current.length === 1 ? 'A practice you selected is' : 'Practices you selected are'} prohibited outright today. A prohibition admits no compliance route: there is no conformity assessment that satisfies it, no documentation that cures it, and no risk measure that makes it lawful.`
          : '',
        future.length
          ? `${future.length === 1 ? 'A practice you selected becomes' : 'Practices you selected become'} prohibited on a fixed future date, so this is a date to finish work against rather than an instruction to stop today.`
          : '',
        complete.length
          ? `Every limb of ${complete.length === 1 ? 'that definition is' : 'those definitions are'} met on your answers, and no exception the provision states applies.`
          : '',
        outstanding.length
          ? `${outstanding.length === 1 ? 'One practice has' : `${outstanding.length} practices have`} limbs still unanswered, so ${outstanding.length === 1 ? 'it stays' : 'they stay'} unresolved rather than cleared. Each says which limb is outstanding.`
          : '',
        cleared.length
          ? `${cleared.length === 1 ? 'One practice you flagged is' : `${cleared.length} practices you flagged are`} not engaged on your answers, and the result says which limb took ${cleared.length === 1 ? 'it' : 'them'} out.`
          : '',
        // §7.6's user-facing rule, and it appears on every engaged path rather
        // than on the incomplete one only. Even a complete path is a reading of
        // answers the user gave about their own system, several of which are
        // judgements a court would take evidence on.
        complete.length
          ? 'We record this as **potentially prohibited** rather than as a conclusion: these are your own answers about your own system, and limbs like "material distortion" and "significant harm" are judgements a court would take evidence on.'
          : 'We record this as **potentially prohibited** rather than as a conclusion, because the path through the definition is not complete.',
        'Take legal advice on this before continuing. It is the one result in this tool that warrants a call today rather than a plan.',
      ]
        .filter(Boolean)
        .join(' ')
    : [
        `You flagged ${cleared.length === 1 ? 'a practice' : `${cleared.length} practices`} on the Article 5 screen, and on your answers ${cleared.length === 1 ? 'it is not' : 'none of them is'} engaged: a limb of ${cleared.length === 1 ? 'the definition' : 'each definition'} is not made out, or an exception the provision itself states applies.`,
        'That is a conclusion about the answers you gave. If any of them changes — a different use, a different setting, a safeguard that lapses — this is the first thing to re-run.',
      ].join(' ')

  return {
    engaged,
    cleared,
    uncertain: false,
    explanation,
    triggeringAnswerIds: [
      ...new Set(evaluated.flatMap((item) => item.triggeringAnswerIds)),
    ],
    missingAnswerIds: [...new Set(engaged.flatMap((item) => item.missingAnswerIds))],
  }
}

/** Does the screen engage anything that would take the headline? */
export function article5Engaged(evaluation: Article5Evaluation): boolean {
  return evaluation.engaged.length > 0
}

/** Whether any engaged practice is prohibited *today* rather than from a date. */
export function article5EngagedNow(evaluation: Article5Evaluation): boolean {
  return evaluation.engaged.some((item) => !item.futureDated)
}

export { PRACTICE_BY_VALUE }
export const PROHIBITED_SCREEN_HAS_SELECTION = (answers: AnswerRecordV2): boolean =>
  includesAny(answers, 'prohibited_screen', [...PRACTICE_BY_VALUE.keys()])
