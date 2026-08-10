import { assessmentQuestions, type AssessmentAnswers } from '@/lib/ai-act-assessment'

/**
 * Shape and validation for a saved Compliance Checker run.
 *
 * Split out from `checker-session.ts` — which is `server-only` because it talks
 * to Upstash — so the validation that guards an unauthenticated write endpoint
 * can be unit-tested directly. This is the whole trust boundary for that route.
 */

export const CHECKER_SESSION_COOKIE = 'sas-checker-session'
export const CHECKER_SESSION_TTL_SECONDS = 60 * 60 * 24

/** Hard ceilings so a malformed or hostile payload cannot fill the store. */
const MAX_VALUES_PER_QUESTION = 24
const MAX_VALUE_LENGTH = 500

export interface CheckerSession {
  answers: AssessmentAnswers
  /** Index into the visible-question list the user had reached. */
  step: number
  /** Whether they had already generated the result. */
  showResult: boolean
}

const questionIds = new Set(assessmentQuestions.map((question) => question.id))

/**
 * Accept only answers the question set actually defines, with bounded values.
 * Unknown keys are dropped rather than rejected — a stale client mid-deploy
 * should lose the retired answer, not its whole session.
 */
export function sanitiseAnswers(input: unknown): AssessmentAnswers {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}

  const answers: AssessmentAnswers = {}
  for (const [id, value] of Object.entries(input as Record<string, unknown>)) {
    if (!questionIds.has(id)) continue

    if (typeof value === 'string') {
      answers[id] = value.slice(0, MAX_VALUE_LENGTH)
      continue
    }

    if (Array.isArray(value)) {
      answers[id] = value
        .filter((item): item is string => typeof item === 'string')
        .slice(0, MAX_VALUES_PER_QUESTION)
        .map((item) => item.slice(0, MAX_VALUE_LENGTH))
    }
  }

  return answers
}

export function sanitiseSession(input: unknown): CheckerSession {
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const step = typeof source.step === 'number' && Number.isFinite(source.step)
    ? Math.max(0, Math.min(Math.floor(source.step), assessmentQuestions.length))
    : 0

  return {
    answers: sanitiseAnswers(source.answers),
    step,
    showResult: source.showResult === true,
  }
}
