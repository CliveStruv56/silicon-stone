import {
  assessmentQuestions,
  evaluateAssessment,
  type AssessmentAnswers,
  type AssessmentQuestion,
  type AssessmentResult,
} from '@/lib/ai-act-assessment'
import { AI_ACT_TIMELINE, PENALTY_TIERS, type PenaltyTier, type TimelineEntry } from '@/lib/ai-act-timeline'
import { CHECKER_VERSION, QUESTION_CATALOGUE_VERSION } from '@/lib/checker-version'
import { sanitiseAnswers } from '@/lib/checker-session-schema'
import { RULE_PACK } from '@/lib/rulepack'

/**
 * A saved, shareable Compliance Checker result.
 *
 * The record is a **snapshot**, not a pointer. It holds the answers *and*
 * everything the result page renders — the computed result, the answer
 * transcript with the question wording of the day, the timeline and penalty
 * ceilings of the pack it was decided against — so a link opened next month
 * shows exactly what the reader saw, even after a rule-pack bump. Nothing on
 * the saved page re-runs the engine or reads the live pack.
 *
 * Free of `server-only`: the page renders it and the tests build it. The store
 * that writes it is the server-only half (`./store.ts`).
 */

/**
 * How long a saved result is kept. **Owner decision pending** (Clive, as of
 * 2026-11-16): 30 days matches the AI report link. Change it here and nowhere
 * else — the TTL, the expiry date on the page and the save-panel wording all
 * derive from this number.
 */
export const SAVED_RESULT_RETENTION_DAYS = 30
export const SAVED_RESULT_TTL_SECONDS = SAVED_RESULT_RETENTION_DAYS * 24 * 60 * 60

/** Bumped only when the stored shape changes. Readers refuse a version they do not know. */
export const SAVED_RESULT_RECORD_VERSION = 1

/**
 * The version of the save-panel wording the reader saw, stored on the record —
 * the same pattern as the report gate's `CONSENT_TEXT_VERSION`: "they agreed" is
 * not a record unless it says to what. Bump it whenever `saveConsentText()`
 * changes.
 */
export const SAVE_CONSENT_TEXT_VERSION = '2026-11-16-draft'

/** DRAFT wording, for Clive's review. */
export function saveConsentText(days = SAVED_RESULT_RETENTION_DAYS): string {
  return `We will store your answers and this result for ${days} days, then delete them automatically. Anyone with the link can view it or delete it, so share it only with people you would show the result to. No email address is needed, and the link is not listed or indexed anywhere.`
}

/** The disclaimer the Checker page carries, word for word, so the PDF and saved page carry the same one. */
export const CHECKER_DISCLAIMER =
  'This is a first-pass triage against the text of the Act, not legal advice. A high-risk or prohibited result is a reason to take advice, not a finding against you.'

/**
 * The one free-text answer in the v1 questionnaire. It is the only thing a
 * reader typed (the intake description is never stored anywhere — it goes to
 * the extraction model and is discarded), so it is the only thing the opt-in
 * governs. Kept out of the record unless the reader ticks to include it.
 */
export const FREE_TEXT_QUESTION_IDS = ['tool_name'] as const

export interface AnswerLine {
  question: string
  answer: string
}

interface SavedResultBase {
  id: string
  recordVersion: typeof SAVED_RESULT_RECORD_VERSION
  savedAt: string
  expiresAt: string
  consentTextVersion: string
  /** Whether the reader chose to keep the free-text system name on the record. */
  includesFreeText: boolean
  stamp: {
    checkerVersion: string
    questionCatalogueVersion: string
    rulepackVersion: string
    corpusCutOff: string
    celex: string
  }
}

/**
 * The v1 record. v2 will add a sibling `{ checker: 'v2', answers: AnswerRecordV2,
 * result: AssessmentResultV2, … }` to the union below rather than reshape this
 * one: the discriminant, the stamps and the snapshot-not-pointer rule carry
 * over, and v2's free text (`intended_use_description`) falls under the same
 * opt-in.
 */
export interface SavedCheckerResultV1 extends SavedResultBase {
  checker: 'v1'
  answers: AssessmentAnswers
  result: AssessmentResult
  answerLines: AnswerLine[]
  timeline: TimelineEntry[]
  penalties: PenaltyTier[]
}

export type SavedCheckerResult = SavedCheckerResultV1

/** Drop the free-text answers unless the reader asked to keep them. */
export function redactAnswers(answers: AssessmentAnswers, includeFreeText: boolean): AssessmentAnswers {
  if (includeFreeText) return { ...answers }
  const copy = { ...answers }
  for (const id of FREE_TEXT_QUESTION_IDS) delete copy[id]
  return copy
}

/** The answer transcript in the question wording of the day, as the Markdown export writes it. */
export function answerLinesFor(answers: AssessmentAnswers, questions: AssessmentQuestion[] = assessmentQuestions): AnswerLine[] {
  const lines: AnswerLine[] = []
  for (const question of questions) {
    const value = answers[question.id]
    if (value === undefined || (Array.isArray(value) && value.length === 0)) continue
    if (typeof value === 'string' && !value.trim()) continue
    const labels = new Map(question.options?.map((option) => [option.value, option.label]) ?? [])
    const answer = Array.isArray(value)
      ? value.map((item) => labels.get(item) ?? item).join(', ')
      : labels.get(value) ?? value
    lines.push({ question: question.text, answer })
  }
  return lines
}

/**
 * Build the record from untrusted answers. The result is computed here, on the
 * server, from the redacted answers — never taken from the browser — so the
 * summary sentence cannot carry the system name the reader chose to leave out.
 */
export function buildSavedResult(input: {
  id: string
  answers: unknown
  includeFreeText: boolean
  now?: Date
}): SavedCheckerResultV1 {
  const now = input.now ?? new Date()
  const answers = redactAnswers(sanitiseAnswers(input.answers), input.includeFreeText)
  return {
    id: input.id,
    recordVersion: SAVED_RESULT_RECORD_VERSION,
    checker: 'v1',
    savedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SAVED_RESULT_TTL_SECONDS * 1000).toISOString(),
    consentTextVersion: SAVE_CONSENT_TEXT_VERSION,
    includesFreeText: input.includeFreeText,
    stamp: {
      checkerVersion: CHECKER_VERSION,
      questionCatalogueVersion: QUESTION_CATALOGUE_VERSION,
      rulepackVersion: RULE_PACK.manifest.version,
      corpusCutOff: RULE_PACK.manifest.corpusCutOff,
      celex: RULE_PACK.manifest.provenance.celex,
    },
    answers,
    result: evaluateAssessment(answers),
    answerLines: answerLinesFor(answers),
    timeline: AI_ACT_TIMELINE,
    penalties: PENALTY_TIERS,
  }
}

/** Has the record passed its own expiry? Redis TTL enforces this too; this covers the fallback store. */
export function isExpired(record: Pick<SavedResultBase, 'expiresAt'>, now = Date.now()): boolean {
  const expires = Date.parse(record.expiresAt)
  return !Number.isFinite(expires) || now >= expires
}

/** Shape check on a record read back from the store. Unknown versions are refused, not guessed at. */
export function parseSavedResult(value: unknown): SavedCheckerResult | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<SavedCheckerResultV1>
  if (record.recordVersion !== SAVED_RESULT_RECORD_VERSION) return null
  if (record.checker !== 'v1') return null
  if (typeof record.id !== 'string' || typeof record.savedAt !== 'string' || typeof record.expiresAt !== 'string') {
    return null
  }
  if (!record.result || !Array.isArray(record.answerLines) || !record.stamp) return null
  return record as SavedCheckerResultV1
}

/** "16 November 2026", UTC, the form the Checker writes dates in. */
export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** `ai-act-checker-likely-high-risk-2026-11-16` — tool, tier, date. Used as the PDF's file name. */
export function pdfFileName(classification: string, savedAt: string | Date = new Date()): string {
  const date = (typeof savedAt === 'string' ? savedAt : savedAt.toISOString()).slice(0, 10)
  const tier = classification
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `ai-act-checker-${tier}-${date}`
}
