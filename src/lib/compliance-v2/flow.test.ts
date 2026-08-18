import { describe, expect, it } from 'vitest'
import {
  EMPTY_FLOW,
  applyAnswer,
  canAdvance,
  currentQuestion,
  dataEntryWarnings,
  flowProgress,
  flowSections,
  goBack,
  goNext,
  goToFirstUnanswered,
  isFinished,
  makeAnswer,
  type FlowState,
} from './flow'
import { QUESTION_CATALOGUE, visibleQuestions } from './questions'
import { validateAnswers } from './validation/answers'
import { classify } from './engine/classify'

/**
 * Phase 4's rules, tested where they live. The component renders what these
 * return, so a change to navigation or to answer invalidation fails here rather
 * than in a browser.
 */

const answer = (state: FlowState, id: string, value: string | string[]) =>
  applyAnswer(state, id, makeAnswer(id, 'answered', value))

const unknown = (state: FlowState, id: string) =>
  applyAnswer(state, id, makeAnswer(id, 'unknown'))

/** Answer everything visible, in order, taking the first real option each time. */
function walk(state: FlowState, choices: Record<string, string | string[]> = {}): FlowState {
  let current = state
  for (let pass = 0; pass < QUESTION_CATALOGUE.length * 2; pass += 1) {
    const next = visibleQuestions(current.answers).find((question) => !current.answers[question.id])
    if (!next) break
    if (choices[next.id] !== undefined) {
      current = answer(current, next.id, choices[next.id])
    } else if (next.answerType === 'text') {
      current = answer(current, next.id, 'A system that drafts replies for a person to check.')
    } else if (next.options?.length) {
      const first = next.options[0].value
      current = answer(current, next.id, next.answerType === 'multi' ? [first] : first)
    } else {
      current = unknown(current, next.id)
    }
  }
  return current
}

describe('answer invalidation', () => {
  /**
   * The Phase 4 exit criterion. An answer to a question the current path no
   * longer asks must not reach an evaluator — but it should not be destroyed
   * either, because the user may be exploring.
   */
  it('strands an answer when its branch closes, and keeps it out of the engine', () => {
    let state = answer(EMPTY_FLOW, 'intended_use_family', 'employment')
    state = answer(state, 'annex_iii_employment_use', ['recruitment_selection'])
    expect(state.answers.annex_iii_employment_use).toBeDefined()

    state = answer(state, 'intended_use_family', 'chatbot_interaction')
    expect(state.answers.annex_iii_employment_use).toBeUndefined()
    expect(state.historical.annex_iii_employment_use?.value).toEqual(['recruitment_selection'])

    // And the engine never sees it.
    expect(classify(state.answers).statutoryRoutes).not.toContain('Annex III, point 4(a)')
  })

  it('restores a stranded answer when the branch reopens', () => {
    let state = answer(EMPTY_FLOW, 'intended_use_family', 'employment')
    state = answer(state, 'annex_iii_employment_use', ['recruitment_selection'])
    state = answer(state, 'intended_use_family', 'chatbot_interaction')
    state = answer(state, 'intended_use_family', 'employment')

    expect(state.answers.annex_iii_employment_use?.value).toEqual(['recruitment_selection'])
    expect(state.historical.annex_iii_employment_use).toBeUndefined()
  })

  /**
   * Cascades. Closing a branch can strand an answer whose own branch then
   * closes, so the prune runs to a fixed point rather than once.
   */
  it('strands a whole chain, not just its first link', () => {
    let state = answer(EMPTY_FLOW, 'intended_use_family', 'employment')
    state = answer(state, 'annex_iii_employment_use', ['recruitment_selection'])
    state = answer(state, 'performs_profiling', 'no')
    state = answer(state, 'narrow_task_condition', ['narrow_procedural'])
    state = answer(state, 'no_significant_risk_of_harm', 'yes')
    expect(Object.keys(state.answers)).toContain('no_significant_risk_of_harm')

    // Declining every listed use closes the Annex III branch, which closes the
    // exemption questions that depended on it, which closes the risk question.
    state = answer(state, 'annex_iii_employment_use', ['none_of_these'])
    for (const id of ['performs_profiling', 'narrow_task_condition', 'no_significant_risk_of_harm']) {
      expect(state.answers[id], id).toBeUndefined()
      expect(state.historical[id], id).toBeDefined()
    }
  })

  it('the live answers always validate, whatever the user did on the way', () => {
    let state = answer(EMPTY_FLOW, 'intended_use_family', 'employment')
    state = answer(state, 'annex_iii_employment_use', ['recruitment_selection'])
    state = answer(state, 'performs_profiling', 'yes')
    state = answer(state, 'intended_use_family', 'something_else')
    state = answer(state, 'intended_use_description', 'It drafts replies to customer email.')

    expect(validateAnswers(state.answers).errors).toEqual([])
  })
})

describe('navigation', () => {
  it('starts on the first question and advances through the visible ones', () => {
    expect(currentQuestion(EMPTY_FLOW)?.id).toBe('organisation_establishment')
    const state = goNext(answer(EMPTY_FLOW, 'organisation_establishment', 'uk'))
    expect(currentQuestion(state)?.id).toBe('ai_market_connection')
  })

  it('goes back without losing answers — §7.1', () => {
    let state = answer(EMPTY_FLOW, 'organisation_establishment', 'uk')
    state = goNext(state)
    state = answer(state, 'ai_market_connection', ['output_used_in_eu'])
    state = goBack(state)

    expect(currentQuestion(state)?.id).toBe('organisation_establishment')
    expect(state.answers.ai_market_connection?.value).toEqual(['output_used_in_eu'])
    expect(state.answers.organisation_establishment?.value).toBe('uk')
  })

  it('will not advance past a required question that has no answer state', () => {
    expect(canAdvance(EMPTY_FLOW)).toBe(false)
    expect(canAdvance(answer(EMPTY_FLOW, 'organisation_establishment', 'uk'))).toBe(true)
  })

  /** §6.2: required means an answer *state*, not knowledge. */
  it('advances on "not sure" exactly as on a real answer', () => {
    expect(canAdvance(unknown(EMPTY_FLOW, 'organisation_establishment'))).toBe(true)
  })

  it('jumps to the first unsettled question', () => {
    let state = answer(EMPTY_FLOW, 'organisation_establishment', 'uk')
    state = answer(state, 'ai_market_connection', ['output_used_in_eu'])
    state = goToFirstUnanswered(state)
    expect(currentQuestion(state)?.id).toBe('organisation_activity')
  })
})

describe('sections and progress', () => {
  /**
   * §7.1 forbids a fixed question count when branching is dynamic, and this is
   * why: the same assessment asks materially different numbers of questions
   * depending on the path taken.
   */
  it('the visible question count really does move with the path', () => {
    const counts = ['something_else', 'employment', 'biometrics', 'regulated_product'].map(
      (family) =>
        visibleQuestions(
          walk(EMPTY_FLOW, {
            intended_use_family: family,
            organisation_activity: ['used_internally_or_for_customers'],
          }).answers
        ).length
    )
    // Not "one is bigger than another" — the point is that no single number is
    // true of the questionnaire, which is what makes "question 9 of 14"
    // misleading rather than merely imprecise.
    expect(new Set(counts).size).toBeGreaterThan(1)
  })

  it('groups visible questions into stable sections', () => {
    const state = walk(EMPTY_FLOW, { intended_use_family: 'employment' })
    const sections = flowSections(state)
    expect(sections.map((section) => section.title)).toContain('Where you operate')
    expect(sections.every((section) => section.questionIds.length > 0)).toBe(true)
    expect(sections.filter((section) => section.current).length).toBeLessThanOrEqual(1)
  })

  it('reports progress against what is actually visible', () => {
    expect(flowProgress(EMPTY_FLOW)).toBe(0)
    const done = walk(EMPTY_FLOW, { intended_use_family: 'something_else' })
    expect(flowProgress(done)).toBe(100)
    expect(isFinished(done)).toBe(true)
  })
})

describe('no dead end from an unknown answer', () => {
  /**
   * The other Phase 4 exit criterion. Answering "not sure" everywhere must reach
   * the end of the questionnaire — §4.3 makes finishing without knowing a
   * supported path, not a degraded one.
   */
  it('a user who answers "not sure" to everything still finishes', () => {
    let state = EMPTY_FLOW
    for (let pass = 0; pass < QUESTION_CATALOGUE.length * 2; pass += 1) {
      const next = visibleQuestions(state.answers).find((question) => !state.answers[question.id])
      if (!next) break
      state = next.allowUnknown
        ? unknown(state, next.id)
        : answer(state, next.id, next.options?.[0]?.value ?? 'x')
    }

    expect(isFinished(state)).toBe(true)
    expect(validateAnswers(state.answers).errors).toEqual([])
    // And it produces a result rather than an error.
    expect(classify(state.answers).classification).toBeTruthy()
  })

  it('every path through the catalogue terminates', () => {
    for (const family of ['employment', 'biometrics', 'regulated_product', 'synthetic_content', 'something_else']) {
      const state = walk(EMPTY_FLOW, { intended_use_family: family })
      expect(isFinished(state), family).toBe(true)
    }
  })
})

describe('data-entry warnings', () => {
  it('flags "none of these" ticked alongside a real answer', () => {
    const state = answer(EMPTY_FLOW, 'ai_market_connection', ['none', 'output_used_in_eu'])
    expect(dataEntryWarnings(state)[0].message).toMatch(/Only one of those can be true/)
  })

  it('flags an EU establishment claiming no EU connection', () => {
    let state = answer(EMPTY_FLOW, 'organisation_establishment', 'eu_eea')
    state = answer(state, 'ai_market_connection', ['none'])
    expect(dataEntryWarnings(state).some((item) => /established in the EU/.test(item.message))).toBe(true)
  })

  it('flags a thin description on the route where it is the only one', () => {
    let state = answer(EMPTY_FLOW, 'intended_use_family', 'something_else')
    state = answer(state, 'intended_use_description', 'AI stuff')
    expect(
      dataEntryWarnings(state).some((item) => item.questionId === 'intended_use_description')
    ).toBe(true)
  })

  it('warns rather than blocks — a warned answer still advances', () => {
    const state = answer(EMPTY_FLOW, 'organisation_establishment', 'eu_eea')
    expect(dataEntryWarnings(answer(state, 'ai_market_connection', ['none'])).length).toBeGreaterThan(0)
    expect(canAdvance(state)).toBe(true)
  })
})
