import type { AnswerRecordV2, ComplianceResultV2, MaterialUnknown } from '../types'
import { QUESTION_BY_ID } from '../questions'
import { checkerVersionStamp } from '@/lib/checker-version'
import { evaluateTerritorialScope } from './scope'
import { evaluateLegalRoles } from './roles'
import { evaluateOrganisationSize } from './organisation-size'
import { classify } from './classify'
import { buildLegalFindings, buildReadinessFindings } from './findings'
import { evaluateGdprAiOverlay } from './gdpr-ai'

/**
 * The whole assessment (§9.1), assembled from deterministic inputs only.
 *
 * `assessedAt` is a parameter, not `new Date()`. §15.1 requires a result to be
 * reproducible from its stored answer record and version stamps, and a function
 * that reads the clock is reproducible only on the day it ran.
 */

export const DISCLAIMER =
  'This checker provides an automated preliminary assessment based on the information you enter and the legal sources identified in the result. It is not legal advice and does not replace advice on your particular circumstances. Where information is missing or the legal position depends on interpretation, the checker identifies that uncertainty.'

/**
 * What a reader should be told to come back for.
 *
 * Fixed prose rather than answer-derived, because a review trigger is about the
 * *future* — the change that would make this result wrong — and the answers
 * describe the present. They are kept short enough to be read.
 */
const REVIEW_TRIGGERS = [
  'The system starts being used for a different job than the one described here.',
  'A person stops reviewing its output, or stops being able to overrule it.',
  'The supplier changes the model, its terms, or what the product does.',
  'It begins affecting a new group of people, or a new kind of decision about them.',
  'A complaint is made about a decision it was involved in.',
]

export function evaluateAssessmentV2(
  answers: AnswerRecordV2,
  assessedAt: string
): ComplianceResultV2 {
  const stamp = checkerVersionStamp()
  const scope = evaluateTerritorialScope(answers)
  const roles = evaluateLegalRoles(answers)
  const size = evaluateOrganisationSize(answers)
  const classification = classify(answers, scope)

  const context = { answers, scope, roles, size, classification, assessedAt }

  return {
    schemaVersion: '2',
    checkerVersion: stamp.checkerVersion,
    rulepackVersion: stamp.rulepackVersion,
    assessedAt,
    scope,
    roles,
    classification: classification.classification,
    classificationExplanation: classification.explanation,
    statutoryRoutes: classification.statutoryRoutes,
    organisationSize: size,
    legalFindings: buildLegalFindings(context),
    readinessFindings: buildReadinessFindings(context),
    /**
     * §11, and last on purpose. The overlay is a pure function of the answers —
     * it is handed no classification, no roles and no findings, so there is no
     * path by which a data-protection answer could reach the AI Act result. That
     * is Phase 7's first exit criterion made structural rather than asserted.
     */
    gdprOverlay: evaluateGdprAiOverlay(answers),
    materialUnknowns: materialUnknowns(answers),
    reviewTriggers: REVIEW_TRIGGERS,
    disclaimer: DISCLAIMER,
  }
}

/**
 * Every fact the user said they did not know, with what it would have changed.
 *
 * §20.7: unknown facts must be visible and never silently defaulted. This is the
 * "visible" half — the engine already refuses to default them, and this makes
 * the refusal something a reader can see rather than a property of the code.
 *
 * `context_only` unknowns are dropped: an unknown that could not change anything
 * is noise, and listing it would dilute the ones that matter.
 */
export function materialUnknowns(answers: AnswerRecordV2): MaterialUnknown[] {
  const CHANGES: Record<string, string> = {
    classification_decisive: 'This could change the risk tier the result reports.',
    finding_decisive: 'This could change which duties the result lists.',
    readiness_only: 'This affects the recommendations rather than the legal position.',
    context_only: '',
  }

  return Object.values(answers)
    .filter((answer) => answer.state === 'unknown')
    .map((answer) => QUESTION_BY_ID.get(answer.questionId))
    .filter((question): question is NonNullable<typeof question> => Boolean(question))
    .filter((question) => question.importance !== 'context_only')
    .map((question) => ({
      questionId: question.id,
      question: question.shortPrompt ?? question.prompt,
      whatItWouldChange: CHANGES[question.importance],
      importance: question.importance,
    }))
}
