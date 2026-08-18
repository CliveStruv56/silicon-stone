import { describe, expect, it } from 'vitest'
import type { AssessmentAnswerV2, AssessmentQuestionV2 } from '../types'
import { minimumFactsSatisfied, validateAnswers } from './answers'

/**
 * §15.2's validation rules, and Phase 1's third exit criterion — "unknown
 * answers survive round trips without coercion", which is the one the whole
 * answer model exists to make true.
 */

const answered = (id: string, value: AssessmentAnswerV2['value']): AssessmentAnswerV2 => ({
  questionId: id,
  state: 'answered',
  value,
  source: 'manual',
})

/** A complete, valid record against the live catalogue. */
const COMPLETE = {
  organisation_establishment: answered('organisation_establishment', 'uk'),
  ai_market_connection: answered('ai_market_connection', ['output_used_in_eu']),
  organisation_activity: answered('organisation_activity', ['used_internally_or_for_customers']),
  intended_use_family: answered('intended_use_family', 'employment'),
  individual_impact: answered('individual_impact', 'recommends_ranks_scores'),
  personal_data_use: answered('personal_data_use', 'yes'),
  employee_band: answered('employee_band', '10_49'),
}

describe('validateAnswers', () => {
  it('accepts a complete record', () => {
    const result = validateAnswers(COMPLETE)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('rejects an unrecognised question', () => {
    const result = validateAnswers({ ...COMPLETE, not_a_question: answered('not_a_question', 'x') })
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toBe('Unrecognised question.')
  })

  it('rejects a value outside the option set', () => {
    const result = validateAnswers({
      ...COMPLETE,
      organisation_establishment: answered('organisation_establishment', 'mars'),
    })
    expect(result.ok).toBe(false)
    expect(result.errors[0].questionId).toBe('organisation_establishment')
  })

  it('rejects the wrong value type', () => {
    const result = validateAnswers({
      ...COMPLETE,
      organisation_establishment: answered('organisation_establishment', ['uk']),
    })
    expect(result.errors[0].message).toBe('Expected a single choice.')
  })

  it('rejects a selection list beyond its configured limit', () => {
    const result = validateAnswers({
      ...COMPLETE,
      ai_market_connection: answered('ai_market_connection', [
        'placed_on_eu_market',
        'put_into_service_eu',
        'output_used_in_eu',
        'used_from_eu_establishment',
        'none',
      ]),
    })
    expect(result.errors.some((error) => /no more than 4/.test(error.message))).toBe(true)
  })

  it('rejects free text beyond its configured limit', () => {
    const result = validateAnswers({
      ...COMPLETE,
      intended_use_description: answered('intended_use_description', 'x'.repeat(1_001)),
    })
    expect(result.errors.some((error) => /under 1000 characters/.test(error.message))).toBe(true)
  })

  it('rejects an empty multi answer, which is not the same as "not sure"', () => {
    const result = validateAnswers({
      ...COMPLETE,
      ai_market_connection: answered('ai_market_connection', []),
    })
    expect(result.errors.some((error) => /at least one option/.test(error.message))).toBe(true)
  })

  it('returns a user-safe error with no internals in it', () => {
    const result = validateAnswers({ organisation_establishment: 'not an object' })
    expect(result.errors[0].message).toBe('Malformed answer.')
    expect(JSON.stringify(result.errors)).not.toMatch(/stack|prompt|process|Error:/i)
  })
})

describe('unknown answers survive without coercion', () => {
  const withUnknown = {
    ...COMPLETE,
    personal_data_use: {
      questionId: 'personal_data_use',
      state: 'unknown' as const,
      value: null,
      source: 'manual' as const,
    },
  }

  it('keeps the unknown state through validation', () => {
    const result = validateAnswers(withUnknown)
    expect(result.ok).toBe(true)
    expect(result.answers.personal_data_use.state).toBe('unknown')
  })

  /**
   * The defect this whole model exists to prevent. In v1, "not sure" about
   * personal data produces a result byte-identical to "no personal data" —
   * defect 5. Here the unknown is never any of the values it could be mistaken
   * for.
   */
  it('never becomes false, an empty string, or an option value', () => {
    const { answers } = validateAnswers(withUnknown)
    const value = answers.personal_data_use.value
    expect(value).toBeNull()
    expect(value).not.toBe(false)
    expect(value).not.toBe('')
    expect(value).not.toBe('no')
  })

  it('round-trips unchanged through a second validation', () => {
    const once = validateAnswers(withUnknown).answers
    const twice = validateAnswers(once).answers
    expect(twice).toEqual(once)
  })

  it('rejects an unknown on a question that does not offer one', () => {
    const catalogue: AssessmentQuestionV2[] = [
      {
        id: 'strict',
        section: 'S',
        prompt: 'P?',
        help: 'H',
        whyAsked: 'W',
        answerType: 'single',
        options: [{ value: 'a', label: 'A' }],
        allowUnknown: false,
        allowNotApplicable: false,
        importance: 'context_only',
      },
    ]
    const result = validateAnswers(
      { strict: { questionId: 'strict', state: 'unknown', value: null, source: 'manual' } },
      { catalogue }
    )
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/does not offer a "not sure" answer/)
  })
})

describe('answers left behind by a changed earlier answer', () => {
  const catalogue: AssessmentQuestionV2[] = [
    {
      id: 'route',
      section: 'S',
      prompt: 'Which route?',
      help: 'H',
      whyAsked: 'W',
      answerType: 'single',
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
      allowUnknown: false,
      allowNotApplicable: false,
      importance: 'context_only',
      required: true,
    },
    {
      id: 'only_on_a',
      section: 'S',
      prompt: 'Only asked on route A?',
      help: 'H',
      whyAsked: 'W',
      answerType: 'single',
      options: [{ value: 'yes', label: 'Yes' }],
      allowUnknown: false,
      allowNotApplicable: false,
      importance: 'context_only',
      visibleWhen: { questionId: 'route', equals: 'a' },
    },
  ]

  const strandedRecord = {
    route: answered('route', 'b'),
    only_on_a: answered('only_on_a', 'yes'),
  }

  it('rejects an answer that is not on the current path', () => {
    const result = validateAnswers(strandedRecord, { catalogue })
    expect(result.ok).toBe(false)
    expect(result.errors[0].questionId).toBe('only_on_a')
    expect(result.answers.only_on_a).toBeUndefined()
  })

  /**
   * §15.2's one exemption. Retained answers are returned separately rather than
   * merged back, so an evaluator cannot reach a stranded answer by accident —
   * which is the failure mode the rule is guarding against.
   */
  it('retains it separately when asked to', () => {
    const result = validateAnswers(strandedRecord, { catalogue, retainHistorical: true })
    expect(result.ok).toBe(true)
    expect(result.answers.only_on_a).toBeUndefined()
    expect(result.historical.only_on_a?.value).toBe('yes')
  })
})

describe('minimumFactsSatisfied', () => {
  it('passes a complete record', () => {
    expect(minimumFactsSatisfied(validateAnswers(COMPLETE).answers)).toEqual([])
  })

  it('names what is missing when a required question is unanswered', () => {
    const rest = { ...COMPLETE }
    delete (rest as Partial<typeof COMPLETE>).employee_band
    const errors = minimumFactsSatisfied(validateAnswers(rest).answers)
    expect(errors[0].code).toBe('INCOMPLETE_MINIMUM_FACTS')
    expect(errors[0].message).toMatch(/employee_band/)
  })

  /**
   * §4.3 and §6.2: required means an answer *state*, not knowledge. A user who
   * answers "not sure" to everything has completed the assessment — §9.2's
   * `insufficient_information` classification is where that lands, not an error
   * that stops them finishing.
   */
  it('is satisfied by a record of nothing but "not sure"', () => {
    const allUnknown = Object.fromEntries(
      Object.keys(COMPLETE).map((id) => [
        id,
        { questionId: id, state: 'unknown' as const, value: null, source: 'manual' as const },
      ])
    )
    const { answers, ok } = validateAnswers(allUnknown)
    expect(ok).toBe(true)
    expect(minimumFactsSatisfied(answers)).toEqual([])
  })

  /**
   * The conditional requirement §7.2 asks for: a description is optional on a
   * controlled route and required once the user says their use is something
   * else, because on that path it is the only description the engine gets.
   */
  it('requires a use description only on the "something else" route', () => {
    const controlled = validateAnswers(COMPLETE).answers
    expect(minimumFactsSatisfied(controlled)).toEqual([])

    const somethingElse = validateAnswers({
      ...COMPLETE,
      intended_use_family: answered('intended_use_family', 'something_else'),
    }).answers
    const errors = minimumFactsSatisfied(somethingElse)
    expect(errors[0]?.message).toMatch(/intended_use_description/)
  })
})
