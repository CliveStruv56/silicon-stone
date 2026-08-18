import type {
  AnswerRecordV2,
  AnswerState,
  AnswerValue,
  AssessmentAnswerV2,
  AssessmentQuestionV2,
} from './types'
import { isComplete } from './conditions'
import { QUESTION_CATALOGUE, isRequired, visibleQuestions } from './questions'

/**
 * Questionnaire navigation, as pure functions.
 *
 * The UI is a Client Component and `vitest.config.ts` collects only
 * `src/**\/*.test.ts`, so anything defined inside the component is untestable.
 * The rules that matter here — what happens to an answer when the branch that
 * asked for it closes, whether an unknown can dead-end the flow — are exactly
 * the rules that must not drift, so they live in a `.ts` module and the
 * component renders what they return.
 *
 * The central decision is what to do with an answer stranded by a changed
 * upstream response. Phase 4's exit criterion says hidden stale answers cannot
 * affect evaluation; §15.2 permits retaining them "as historical answers". Both
 * are satisfied by keeping two buckets: `answers` is what the engine sees and
 * contains only questions on the live path, and `historical` holds the rest.
 * A user who changes their mind and changes it back gets their answers returned
 * rather than re-asked, and the engine never sees a stranded one.
 */

export interface FlowState {
  /** On the current path. The only thing an evaluator is ever given. */
  answers: AnswerRecordV2
  /** Stranded by a changed upstream answer. Restored if the branch reopens. */
  historical: AnswerRecordV2
  /** Index into the visible-question list. */
  index: number
}

export const EMPTY_FLOW: FlowState = { answers: {}, historical: {}, index: 0 }

export function makeAnswer(
  questionId: string,
  state: AnswerState,
  value: AnswerValue = null,
  source: AssessmentAnswerV2['source'] = 'manual'
): AssessmentAnswerV2 {
  return { questionId, state, value: state === 'answered' ? value : null, source }
}

/**
 * Record an answer and re-settle the flow around it.
 *
 * Order matters. The answer is applied first, then visibility is recomputed
 * against the *new* record, then answers move between the two buckets. Doing it
 * the other way round would prune against the old path and strand the wrong
 * ones.
 */
export function applyAnswer(
  state: FlowState,
  questionId: string,
  answer: AssessmentAnswerV2,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): FlowState {
  const next: AnswerRecordV2 = { ...state.answers, [questionId]: answer }
  const historical = { ...state.historical }

  // Restore anything the change brought back into view before pruning, so a
  // question that reopens is not re-asked.
  for (const question of visibleQuestions(next, catalogue)) {
    if (!next[question.id] && historical[question.id]) {
      next[question.id] = historical[question.id]
      delete historical[question.id]
    }
  }

  // Then strand anything the change closed. Repeated until stable, because
  // restoring an answer can itself open or close a further branch.
  for (let pass = 0; pass < catalogue.length; pass += 1) {
    const visible = new Set(visibleQuestions(next, catalogue).map((item) => item.id))
    const stranded = Object.keys(next).filter((id) => !visible.has(id))
    if (!stranded.length) break
    for (const id of stranded) {
      historical[id] = next[id]
      delete next[id]
    }
  }

  return { answers: next, historical, index: state.index }
}

export interface FlowSection {
  title: string
  questionIds: string[]
  answeredCount: number
  /** True for the section holding the current question. */
  current: boolean
  complete: boolean
}

/**
 * Sections, with how much of each is done.
 *
 * §7.1 forbids "a misleading fixed question count when branching is dynamic",
 * and it is right to: this catalogue can ask anywhere from about twelve
 * questions to about thirty depending on the path, so "question 9 of 14" would
 * be a number that moves under the reader. Sections do not move — the set of
 * sections is stable even as the questions inside them appear and disappear.
 */
export function flowSections(
  state: FlowState,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): FlowSection[] {
  const visible = visibleQuestions(state.answers, catalogue)
  const currentId = visible[Math.min(state.index, visible.length - 1)]?.id
  const order: string[] = []
  const grouped = new Map<string, string[]>()

  for (const question of visible) {
    if (!grouped.has(question.section)) {
      grouped.set(question.section, [])
      order.push(question.section)
    }
    grouped.get(question.section)!.push(question.id)
  }

  return order.map((title) => {
    const questionIds = grouped.get(title)!
    const answeredCount = questionIds.filter((id) => isComplete(state.answers[id])).length
    return {
      title,
      questionIds,
      answeredCount,
      current: questionIds.includes(currentId ?? ''),
      complete: answeredCount === questionIds.length,
    }
  })
}

/** Whole-assessment progress, for a bar. Sections are the unit, not questions. */
export function flowProgress(
  state: FlowState,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): number {
  const visible = visibleQuestions(state.answers, catalogue)
  if (!visible.length) return 0
  const done = visible.filter((question) => isComplete(state.answers[question.id])).length
  return Math.round((done / visible.length) * 100)
}

export function currentQuestion(
  state: FlowState,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): AssessmentQuestionV2 | undefined {
  const visible = visibleQuestions(state.answers, catalogue)
  return visible[Math.min(state.index, visible.length - 1)]
}

/** Can the user move on from where they are? */
export function canAdvance(
  state: FlowState,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): boolean {
  const question = currentQuestion(state, catalogue)
  if (!question) return false
  return !isRequired(question, state.answers) || isComplete(state.answers[question.id])
}

/** True when every visible question has been settled and the result can be shown. */
export function isFinished(
  state: FlowState,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): boolean {
  const visible = visibleQuestions(state.answers, catalogue)
  return (
    visible.length > 0 &&
    visible.every(
      (question) => !isRequired(question, state.answers) || isComplete(state.answers[question.id])
    )
  )
}

export function goNext(state: FlowState, catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE): FlowState {
  const visible = visibleQuestions(state.answers, catalogue)
  return { ...state, index: Math.min(state.index + 1, Math.max(visible.length - 1, 0)) }
}

export function goBack(state: FlowState): FlowState {
  return { ...state, index: Math.max(state.index - 1, 0) }
}

/** Jump to the first unsettled question, for "continue where I left off". */
export function goToFirstUnanswered(
  state: FlowState,
  catalogue: AssessmentQuestionV2[] = QUESTION_CATALOGUE
): FlowState {
  const visible = visibleQuestions(state.answers, catalogue)
  const at = visible.findIndex((question) => !isComplete(state.answers[question.id]))
  return { ...state, index: at === -1 ? Math.max(visible.length - 1, 0) : at }
}

export interface DataEntryWarning {
  questionId: string
  message: string
}

/**
 * Advisory warnings about what has been entered (Phase 4).
 *
 * Warnings, never blocks. Each one describes a combination that is *probably* a
 * mistake, and the user is better placed to know than the questionnaire is —
 * §4.6's fail-safely runs the other way here, because refusing an answer someone
 * meant is its own kind of wrong result.
 *
 * The "none of these" checks are generic because the mistake is: every multi
 * question in the catalogue carries a none-option, and ticking it alongside a
 * real selection is the most common way to produce an answer nobody meant.
 */
export function dataEntryWarnings(state: FlowState): DataEntryWarning[] {
  const warnings: DataEntryWarning[] = []
  const values = (id: string): string[] => {
    const answer = state.answers[id]
    return answer?.state === 'answered' && Array.isArray(answer.value) ? answer.value : []
  }
  const value = (id: string): string | undefined => {
    const answer = state.answers[id]
    return answer?.state === 'answered' && typeof answer.value === 'string' ? answer.value : undefined
  }

  for (const [id, answer] of Object.entries(state.answers)) {
    if (answer.state !== 'answered' || !Array.isArray(answer.value)) continue
    const selected = answer.value
    const exclusive = selected.filter((item) => item === 'none' || item === 'none_of_these')
    if (exclusive.length && selected.length > exclusive.length) {
      warnings.push({
        questionId: id,
        message: '"None of these" is selected alongside a specific answer. Only one of those can be true.',
      })
    }
  }

  if (value('organisation_establishment') === 'eu_eea' && values('ai_market_connection').includes('none')) {
    warnings.push({
      questionId: 'ai_market_connection',
      message:
        'You said the organisation is established in the EU and that none of these connections applies. An EU-established organisation using an AI system is using it from an EU establishment — worth re-reading before you continue.',
    })
  }

  const description = value('intended_use_description')
  if (value('intended_use_family') === 'something_else' && description !== undefined && description.trim().length < 25) {
    warnings.push({
      questionId: 'intended_use_description',
      message:
        'On this route your description is the only account of the system we have. A sentence saying what goes in, what comes out and what happens next will give you a better result.',
    })
  }

  return warnings
}
