import type { AnswerRecordV2, AssessmentQuestionV2 } from '../types'
import { collectQuestionIds, evaluateCondition } from '../conditions'
import { CORE_QUESTIONS } from './core'

/**
 * The question catalogue, and the validation that keeps it honest.
 *
 * Phase 1's exit criteria are about this file: the catalogue must be
 * validatable at build time, and duplicate ids must fail. Branch modules
 * (§7.3–§7.8) land in Phases 2 and 3 and append here; the universal triage is
 * always first, because every branch condition depends on it.
 */

export const QUESTION_CATALOGUE: AssessmentQuestionV2[] = [...CORE_QUESTIONS]

export const QUESTION_BY_ID = new Map(QUESTION_CATALOGUE.map((item) => [item.id, item]))

/**
 * Which questions to ask, given what has been answered.
 *
 * Order is catalogue order. A question with no `visibleWhen` is always asked; a
 * question whose condition depends on an unanswered question is not asked yet,
 * because `evaluateCondition` is false for an absent answer rather than
 * defaulting it.
 */
export function visibleQuestions(
  answers: AnswerRecordV2,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): AssessmentQuestionV2[] {
  return catalogue.filter(
    (question) => !question.visibleWhen || evaluateCondition(question.visibleWhen, answers)
  )
}

/** Is this question required on the path the user is actually on? */
export function isRequired(question: AssessmentQuestionV2, answers: AnswerRecordV2): boolean {
  if (question.required) return true
  return question.requiredWhen ? evaluateCondition(question.requiredWhen, answers) : false
}

export interface CatalogueProblem {
  questionId: string
  problem: string
}

/**
 * Every structural fault in the catalogue, as a list rather than a throw.
 *
 * A list because the build script prints all of them at once: fixing one
 * duplicate id, rebuilding, and finding the next is a waste of a person's
 * afternoon.
 *
 * The forward-reference check is the least obvious and the most useful. A
 * condition may only depend on a question asked *earlier* in the catalogue —
 * otherwise a branch opens on an answer the user has not been asked for yet,
 * which in a linear questionnaire means it never opens at all, and nothing
 * fails: the branch is simply never seen.
 */
export function validateCatalogue(
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): CatalogueProblem[] {
  const problems: CatalogueProblem[] = []
  const seenIds = new Set<string>()
  const positionById = new Map<string, number>()

  catalogue.forEach((question, index) => {
    if (seenIds.has(question.id)) {
      problems.push({ questionId: question.id, problem: 'duplicate question id' })
    }
    seenIds.add(question.id)
    if (!positionById.has(question.id)) positionById.set(question.id, index)
  })

  catalogue.forEach((question, index) => {
    const at = (problem: string) => problems.push({ questionId: question.id, problem })

    if (!question.id.trim()) at('empty question id')
    if (!question.prompt.trim()) at('empty prompt')
    if (!question.help.trim()) at('empty help')
    if (!question.whyAsked.trim()) at('empty whyAsked — §7.1 requires "Why we ask"')
    if (!question.section.trim()) at('empty section — §7.1 needs it for progress')

    const needsOptions = question.answerType === 'single' || question.answerType === 'multi'
    if (needsOptions && !question.options?.length) at(`${question.answerType} question has no options`)
    if (!needsOptions && question.options?.length) at(`${question.answerType} question has options`)

    const optionValues = new Set<string>()
    for (const option of question.options ?? []) {
      if (optionValues.has(option.value)) at(`duplicate option value "${option.value}"`)
      optionValues.add(option.value)
      if (!option.label.trim()) at(`option "${option.value}" has no label`)
      // The unknown is a state (see questions/core.ts). An option that spells it
      // out puts it back into the value space, which §6.1 forbids.
      if (/^(not[_ -]?sure|unknown|dont[_ -]?know)$/i.test(option.value)) {
        at(`option "${option.value}" encodes an unknown as a value — use allowUnknown`)
      }
    }

    for (const [field, condition] of [
      ['visibleWhen', question.visibleWhen],
      ['requiredWhen', question.requiredWhen],
    ] as const) {
      if (!condition) continue
      for (const referenced of collectQuestionIds(condition)) {
        const position = positionById.get(referenced)
        if (position === undefined) {
          at(`${field} references unknown question "${referenced}"`)
        } else if (position >= index) {
          at(`${field} references "${referenced}", which is asked later or is itself`)
        }
      }
    }

    if (question.importance === 'classification_decisive' && !question.required) {
      at('a classification-decisive question must be required — §9.5 depends on it')
    }
  })

  return problems
}

/**
 * Throwing form, for the build script. §21.8 wants the checks run per phase, and
 * a catalogue fault should stop a deploy rather than reach a user as a branch
 * that silently never opens.
 */
export function assertCatalogueValid(catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE) {
  const problems = validateCatalogue(catalogue)
  if (problems.length) {
    const lines = problems.map((item) => `  ${item.questionId}: ${item.problem}`)
    throw new Error(`Compliance Checker v2 catalogue is invalid:\n${lines.join('\n')}`)
  }
}

export { CORE_QUESTIONS }
