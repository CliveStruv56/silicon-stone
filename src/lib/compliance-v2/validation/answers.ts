import type { AnswerRecordV2, AnswerState, AssessmentAnswerV2, AssessmentQuestionV2 } from '../types'
import { isComplete } from '../conditions'
import { QUESTION_CATALOGUE, isRequired, visibleQuestions } from '../questions'

/**
 * Answer validation (§15.2) and the error vocabulary (§15.3).
 *
 * The v2 session endpoint is unauthenticated, exactly as v1's is, so this is a
 * trust boundary before it is a correctness check. It differs from v1's
 * `sanitiseAnswers` in one important way: v1 *drops* anything it does not
 * recognise, on the reasoning that a stale client mid-deploy should lose one
 * answer rather than its whole session. §15.2 requires v2 to **reject** instead.
 *
 * Both are defensible, and the difference is not an oversight. A dropped answer
 * in v1 costs the user a question. A dropped answer in v2 could silently remove
 * the fact a classification rested on — and §4.1 requires every conclusion to
 * name the answers it depends on, which cannot be true of an answer that was
 * quietly discarded on the way in.
 */

export const ANSWER_ERROR_CODES = [
  'INVALID_ANSWER',
  'INCOMPLETE_MINIMUM_FACTS',
  'STALE_QUESTION_VERSION',
  'STALE_RULEPACK_VERSION',
  'REPORT_GENERATION_FAILED',
  'LEGAL_VERIFICATION_FAILED',
  'SESSION_EXPIRED',
] as const

export type AnswerErrorCode = (typeof ANSWER_ERROR_CODES)[number]

export interface AnswerError {
  code: AnswerErrorCode
  questionId?: string
  /** User-safe. §15.3: never a prompt, a provider error, a secret or a stack. */
  message: string
}

export interface ValidationOptions {
  /**
   * Keep answers to questions the current path no longer shows. §15.2 permits
   * this only where they are "explicitly retained as historical answers after a
   * user changes an earlier response" — so it is opt-in, and the retained
   * answers are reported separately rather than mixed back into the active set.
   */
  retainHistorical?: boolean
  /**
   * The catalogue to validate against. Defaults to the live one; tests pass a
   * small catalogue so a branch condition can be exercised before Phase 2 adds
   * any real branches.
   */
  catalogue?: AssessmentQuestionV2[]
}

export interface ValidationResult {
  ok: boolean
  /** Answers on the active path, safe to evaluate. */
  answers: AnswerRecordV2
  /** Answered, but no longer on the path. Empty unless `retainHistorical`. */
  historical: AnswerRecordV2
  errors: AnswerError[]
}

const ANSWER_STATES: AnswerState[] = ['answered', 'unknown', 'not_applicable', 'declined']
const MAX_TEXT_LENGTH = 1_000
const MAX_SELECTIONS = 24

function invalid(questionId: string, message: string): AnswerError {
  return { code: 'INVALID_ANSWER', questionId, message }
}

/**
 * Check one answer against its question.
 *
 * The order matters. State is checked first, and a state other than `answered`
 * short-circuits every value check — because "not sure" has no value to
 * validate, and validating one would be the first step towards inventing one.
 */
function validateAnswer(
  question: AssessmentQuestionV2,
  answer: AssessmentAnswerV2
): AnswerError[] {
  const errors: AnswerError[] = []

  if (!ANSWER_STATES.includes(answer.state)) {
    return [invalid(question.id, 'Unrecognised answer state.')]
  }
  if (answer.state === 'unknown' && !question.allowUnknown) {
    errors.push(invalid(question.id, 'This question does not offer a "not sure" answer.'))
  }
  // `not_applicable` and `declined` are both escapes from giving a value, and
  // both are offered by the same flag — the UI renders them as "Not applicable"
  // and "Prefer not to say". Checking only the first left `declined` able to
  // bypass validation on any question at all, which is not a hole worth keeping
  // for the sake of a distinction the questionnaire does not draw.
  if (
    (answer.state === 'not_applicable' || answer.state === 'declined') &&
    !question.allowNotApplicable
  ) {
    errors.push(
      invalid(question.id, 'This question must be answered, or marked "not sure" where offered.')
    )
  }
  if (answer.state !== 'answered') return errors

  const { value } = answer
  const maxSelections =
    question.validate?.find((rule) => rule.kind === 'maxSelections')?.value ?? MAX_SELECTIONS
  const maxLength =
    question.validate?.find((rule) => rule.kind === 'maxLength')?.value ?? MAX_TEXT_LENGTH
  const allowed = new Set(question.options?.map((option) => option.value))

  switch (question.answerType) {
    case 'single': {
      if (typeof value !== 'string') {
        errors.push(invalid(question.id, 'Expected a single choice.'))
      } else if (!allowed.has(value)) {
        errors.push(invalid(question.id, 'That choice is not one of the options.'))
      }
      break
    }
    case 'multi': {
      if (!Array.isArray(value)) {
        errors.push(invalid(question.id, 'Expected a list of choices.'))
        break
      }
      if (value.length === 0) {
        errors.push(invalid(question.id, 'Select at least one option, or answer "not sure".'))
      }
      if (value.length > maxSelections) {
        errors.push(invalid(question.id, `Select no more than ${maxSelections} options.`))
      }
      for (const item of value) {
        if (typeof item !== 'string' || !allowed.has(item)) {
          errors.push(invalid(question.id, 'One of those choices is not an option.'))
          break
        }
      }
      break
    }
    case 'text': {
      if (typeof value !== 'string') {
        errors.push(invalid(question.id, 'Expected text.'))
      } else if (value.length > maxLength) {
        errors.push(invalid(question.id, `Keep this under ${maxLength} characters.`))
      }
      break
    }
    case 'boolean': {
      if (typeof value !== 'boolean') errors.push(invalid(question.id, 'Expected yes or no.'))
      break
    }
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push(invalid(question.id, 'Expected a number.'))
        break
      }
      const min = question.validate?.find((rule) => rule.kind === 'min')?.value
      const max = question.validate?.find((rule) => rule.kind === 'max')?.value
      if (min !== undefined && value < min) errors.push(invalid(question.id, `Must be at least ${min}.`))
      if (max !== undefined && value > max) errors.push(invalid(question.id, `Must be at most ${max}.`))
      break
    }
  }

  return errors
}

/**
 * Validate a whole record.
 *
 * Note what is *not* normalised: an answer whose state is not `answered` keeps
 * its state and is given a null value. That is the round-trip guarantee — an
 * unknown goes in and an unknown comes out, never a `false`, an empty string or
 * the first enum option.
 */
export function validateAnswers(
  input: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: AnswerError[] = []
  const answers: AnswerRecordV2 = {}
  const historical: AnswerRecordV2 = {}
  const catalogue = options.catalogue ?? QUESTION_CATALOGUE
  const byId = new Map(catalogue.map((question) => [question.id, question]))

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      ok: false,
      answers,
      historical,
      errors: [{ code: 'INVALID_ANSWER', message: 'No answers were supplied.' }],
    }
  }

  for (const [id, raw] of Object.entries(input as Record<string, unknown>)) {
    const question = byId.get(id)
    if (!question) {
      errors.push({ code: 'INVALID_ANSWER', questionId: id, message: 'Unrecognised question.' })
      continue
    }
    if (!raw || typeof raw !== 'object') {
      errors.push(invalid(id, 'Malformed answer.'))
      continue
    }

    const answer = raw as AssessmentAnswerV2
    const problems = validateAnswer(question, answer)
    if (problems.length) {
      errors.push(...problems)
      continue
    }

    answers[id] = {
      questionId: id,
      state: answer.state,
      value: answer.state === 'answered' ? answer.value : null,
      source: answer.source === 'intake_confirmed' ? 'intake_confirmed' : 'manual',
      ...(answer.answeredAt ? { answeredAt: answer.answeredAt } : {}),
    }
  }

  // Second pass: an answer is only stale relative to the *other* answers, so
  // visibility can only be judged once the whole record has been read.
  const visible = new Set(visibleQuestions(answers, catalogue).map((question) => question.id))
  for (const id of Object.keys(answers)) {
    if (visible.has(id)) continue
    if (options.retainHistorical) {
      historical[id] = answers[id]
    } else {
      errors.push(invalid(id, 'This question is not asked on the current path.'))
    }
    delete answers[id]
  }

  return { ok: errors.length === 0, answers, historical, errors }
}

/**
 * Are the minimum facts present to produce a result at all?
 *
 * §4.3: "The assessment must complete unless the minimum factual description of
 * the AI use is absent." So this asks whether every required question on the
 * active path has an answer *state* — not whether the user knew the answers.
 * A record of nothing but "not sure" passes, and §9.2's `insufficient_information`
 * classification is where that lands, not here.
 */
export function minimumFactsSatisfied(
  answers: AnswerRecordV2,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): AnswerError[] {
  const missing = visibleQuestions(answers, catalogue)
    .filter((question) => isRequired(question, answers) && !isComplete(answers[question.id]))
    .map((question) => question.id)

  return missing.length
    ? [
        {
          code: 'INCOMPLETE_MINIMUM_FACTS',
          message: `Answer these before continuing: ${missing.join(', ')}.`,
        },
      ]
    : []
}
