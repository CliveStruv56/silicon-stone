import { describe, expect, it } from 'vitest'
import { sanitiseAnswers, sanitiseSession } from './checker-session-schema'
import { assessmentQuestions } from './ai-act-assessment'

/**
 * The session endpoint is unauthenticated, so everything it stores passes
 * through these two functions first. They are the whole trust boundary.
 */

describe('sanitiseAnswers', () => {
  it('keeps answers the question set defines', () => {
    const cleaned = sanitiseAnswers({
      tool_name: 'Acme HR Screener',
      sensitive_domains: ['employment', 'education'],
    })
    expect(cleaned.tool_name).toBe('Acme HR Screener')
    expect(cleaned.sensitive_domains).toEqual(['employment', 'education'])
  })

  it('drops keys that are not questions', () => {
    const cleaned = sanitiseAnswers({ tool_name: 'Acme', __proto__: 'x', evil: 'y' })
    expect(Object.keys(cleaned)).toEqual(['tool_name'])
  })

  it('drops non-string values inside a multi answer', () => {
    const cleaned = sanitiseAnswers({ sensitive_domains: ['employment', 42, null, { a: 1 }] })
    expect(cleaned.sensitive_domains).toEqual(['employment'])
  })

  it('bounds value length and array length', () => {
    const cleaned = sanitiseAnswers({
      tool_name: 'x'.repeat(5_000),
      sensitive_domains: Array.from({ length: 200 }, () => 'employment'),
    })
    expect((cleaned.tool_name as string).length).toBe(500)
    expect((cleaned.sensitive_domains as string[]).length).toBe(24)
  })

  it('returns an empty set for a non-object payload', () => {
    expect(sanitiseAnswers(null)).toEqual({})
    expect(sanitiseAnswers('nope')).toEqual({})
    expect(sanitiseAnswers([1, 2, 3])).toEqual({})
  })
})

describe('sanitiseSession', () => {
  it('clamps the step to the question count', () => {
    expect(sanitiseSession({ step: 9_999 }).step).toBe(assessmentQuestions.length)
    expect(sanitiseSession({ step: -5 }).step).toBe(0)
    expect(sanitiseSession({ step: 3.7 }).step).toBe(3)
  })

  it('defaults a missing or non-numeric step to zero', () => {
    expect(sanitiseSession({}).step).toBe(0)
    expect(sanitiseSession({ step: 'four' }).step).toBe(0)
    expect(sanitiseSession({ step: Number.NaN }).step).toBe(0)
  })

  it('treats showResult as strictly boolean', () => {
    expect(sanitiseSession({ showResult: true }).showResult).toBe(true)
    expect(sanitiseSession({ showResult: 'true' }).showResult).toBe(false)
    expect(sanitiseSession({}).showResult).toBe(false)
  })
})
