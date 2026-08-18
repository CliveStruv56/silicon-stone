import type { AnswerRecordV2, AssessmentAnswerV2, ConditionExpression } from './types'

/**
 * Evaluating and inspecting dependency expressions.
 *
 * Two operations, and the second is the reason the first takes data rather than
 * a closure: `collectQuestionIds` lets the build check that every branch
 * condition references a question that exists, which is Phase 1's catalogue
 * exit criterion.
 */

/**
 * Does this condition hold for these answers?
 *
 * The rule that matters: an answer in any state other than `answered` matches
 * only `{ state }`. `equals` and `includesAny` are questions about a *value*,
 * and a question answered "not sure" has no value — so they are false, never
 * "false because the value was coerced to empty". An absent answer behaves the
 * same way, so a branch never opens on a question the user has not reached.
 */
export function evaluateCondition(
  condition: ConditionExpression,
  answers: AnswerRecordV2
): boolean {
  if ('all' in condition) {
    return condition.all.every((item) => evaluateCondition(item, answers))
  }
  if ('any' in condition) {
    return condition.any.some((item) => evaluateCondition(item, answers))
  }
  if ('not' in condition) {
    return !evaluateCondition(condition.not, answers)
  }

  const answer = answers[condition.questionId]

  if ('state' in condition) {
    return answer?.state === condition.state
  }

  if (!answer || answer.state !== 'answered') return false

  if ('equals' in condition) {
    return answer.value === condition.equals
  }

  return Array.isArray(answer.value)
    ? answer.value.some((value) => condition.includesAny.includes(value))
    : condition.includesAny.includes(answer.value as string)
}

/** Every question id a condition depends on, for build-time reference checking. */
export function collectQuestionIds(condition: ConditionExpression, into = new Set<string>()) {
  if ('all' in condition) {
    condition.all.forEach((item) => collectQuestionIds(item, into))
  } else if ('any' in condition) {
    condition.any.forEach((item) => collectQuestionIds(item, into))
  } else if ('not' in condition) {
    collectQuestionIds(condition.not, into)
  } else {
    into.add(condition.questionId)
  }
  return into
}

/** An answer the user completed by saying they do not know. */
export function isUnknown(answer: AssessmentAnswerV2 | undefined): boolean {
  return answer?.state === 'unknown'
}

/**
 * Has the user completed this question in any way?
 *
 * "Not sure", "not applicable" and "prefer not to say" all count. §6.2 is
 * explicit that required means an answer *state* is present, not that the user
 * knows the substantive answer, and §4.3 makes finishing without knowing a
 * supported path rather than a degraded one.
 */
export function isComplete(answer: AssessmentAnswerV2 | undefined): boolean {
  if (!answer) return false
  if (answer.state !== 'answered') return true
  return answer.value !== null && answer.value !== '' &&
    !(Array.isArray(answer.value) && answer.value.length === 0)
}
