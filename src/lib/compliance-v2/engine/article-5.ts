import { RULE_PACK } from '@/lib/rulepack'
import type { AnswerRecordV2 } from '../types'
import { includesAny, isNo, isYes, saidUnknown, valuesOf } from './read'

/**
 * The Article 5 screen.
 *
 * §7.6: "A broad positive screen returns `potentially_prohibited` until all
 * legally material conditions and exceptions have been resolved… The user-facing
 * output must use 'potentially prohibited' unless the complete deterministic
 * rule path has been satisfied and the relevant exceptions have been excluded."
 *
 * So this deliberately does **not** conclude "prohibited". It concludes
 * "potentially prohibited" and says what would resolve it, which for every
 * practice currently means a conversation with a lawyer. That is not
 * hedging — a prohibition has no compliance route, so the only useful output is
 * an accurate statement of which practice is engaged and from what date.
 *
 * **What is not built yet, said plainly:** per-practice condition trees. §7.6
 * asks for separate conditions and exception questions for every supported
 * route; what exists is the screen, the law-enforcement authorisation exception
 * that recurs across several points, and Article 5(1a)'s safety-measures test
 * for the two future-dated prohibitions. Until the rest exist, every positive
 * screen stays unresolved — which is the safe direction and what §7.6 requires
 * of an incomplete path.
 */

export interface ProhibitedPracticeFinding {
  point: string
  summary: string
  /** Undefined where the practice is already prohibited. */
  appliesFrom?: string
  futureDated: boolean
  /** What would move this off "potentially prohibited". */
  unresolved: string[]
}

export interface Article5Evaluation {
  engaged: ProhibitedPracticeFinding[]
  /** True where the user said "not sure" rather than clearing the screen. */
  uncertain: boolean
  explanation: string
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

const PRACTICE_BY_VALUE = new Map(
  RULE_PACK.prohibitedPractices.map((practice) => [`art5_${practice.point}`, practice])
)

export function evaluateArticle5(answers: AnswerRecordV2): Article5Evaluation {
  if (saidUnknown(answers, 'prohibited_screen')) {
    return {
      engaged: [],
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
      uncertain: false,
      explanation: 'No prohibited-practice red flag was selected.',
      triggeringAnswerIds: ['prohibited_screen'],
      missingAnswerIds: [],
    }
  }

  const authorised = isYes(answers, 'law_enforcement_authorisation')
  const authorisationUnresolved =
    !authorised && !isNo(answers, 'law_enforcement_authorisation')
  const hasSafeguards = isYes(answers, 'technical_safety_measures')
  const safeguardsUnresolved =
    !hasSafeguards && !isNo(answers, 'technical_safety_measures')

  const engaged = selected.map((value) => {
    const practice = PRACTICE_BY_VALUE.get(value)
    const futureDated = Boolean(practice?.futureDated)
    const unresolved: string[] = []

    // The per-practice condition trees are not authored yet, so this is always
    // outstanding. Saying so is the point: an unresolved path must read as
    // unresolved, not as a clean bill.
    unresolved.push(
      'the specific conditions and exceptions of this prohibition, which need legal review'
    )
    if (authorisationUnresolved) {
      unresolved.push('whether a specific law enforcement authorisation applies')
    } else if (authorised) {
      unresolved.push(
        'whether the authorisation you rely on carries the safeguards the exception requires'
      )
    }
    if (futureDated && safeguardsUnresolved) {
      unresolved.push('whether reasonable and adequate technical safety measures are in place and tested')
    }

    return {
      point: practice?.point ?? value,
      summary: practice?.summary ?? value,
      appliesFrom: futureDated ? practice?.appliesFrom : undefined,
      futureDated,
      unresolved,
    }
  })

  const future = engaged.filter((item) => item.futureDated)
  const current = engaged.filter((item) => !item.futureDated)

  return {
    engaged,
    uncertain: false,
    explanation: [
      current.length
        ? `${current.length === 1 ? 'A practice you selected is' : 'Practices you selected are'} prohibited outright today. A prohibition admits no compliance route: there is no conformity assessment that satisfies it, no documentation that cures it, and no risk measure that makes it lawful.`
        : '',
      future.length
        ? `${future.length === 1 ? 'A practice you selected becomes' : 'Practices you selected become'} prohibited on a fixed future date, so this is a date to finish work against rather than an instruction to stop today.`
        : '',
      'We have said "potentially prohibited" rather than "prohibited" because the conditions and exceptions attaching to these provisions have not been worked through here. That is a matter for legal advice, and it is the one result in this tool that warrants a call today rather than a plan.',
    ]
      .filter(Boolean)
      .join(' '),
    triggeringAnswerIds: ['prohibited_screen'],
    missingAnswerIds: [
      ...(authorisationUnresolved ? ['law_enforcement_authorisation'] : []),
      ...(future.length && safeguardsUnresolved ? ['technical_safety_measures'] : []),
    ],
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
  includesAny(
    answers,
    'prohibited_screen',
    [...PRACTICE_BY_VALUE.keys()]
  )
