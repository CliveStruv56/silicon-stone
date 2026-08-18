import { assessmentQuestions, type AssessmentAnswers } from '@/lib/ai-act-assessment'
import {
  CURRENT_CHECKER_SCHEMA_VERSION,
  parseCheckerSchemaVersion,
  type CheckerSchemaVersion,
} from '@/lib/checker-version'

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
  /**
   * Which answer-record schema this session is written in. A record stored
   * before this field existed reads back as 1, which is what it is — see
   * `parseCheckerSchemaVersion`, and §15.4 of the v2 spec on why an old record
   * is never defaulted forward.
   */
  schemaVersion: CheckerSchemaVersion
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
    // A session already in the store keeps the version it was written at; a
    // new one takes the version this build writes. Nothing reads this yet —
    // it exists so that when v2 starts writing records, the ones already in
    // Upstash identify themselves rather than having to be guessed at.
    schemaVersion:
      source.schemaVersion === undefined
        ? CURRENT_CHECKER_SCHEMA_VERSION
        : parseCheckerSchemaVersion(source.schemaVersion),
    answers: sanitiseAnswers(source.answers),
    step,
    showResult: source.showResult === true,
  }
}
