import { describe, expect, it } from 'vitest'
import {
  assessmentQuestions,
  evaluateAssessment,
  getVisibleQuestions,
} from './ai-act-assessment'

describe('evaluateAssessment', () => {
  it('names the tool in the summary and passes the engine result through', () => {
    const result = evaluateAssessment({
      tool_name: 'Acme HR Screener',
      eu_scope: ['eu-org'],
      origin: 'third-party',
      sensitive_domains: ['employment'],
    })
    expect(result.summary).toContain('Acme HR Screener')
    expect(result.classification).toBe('Likely high-risk')
    expect(result.firedRules.length).toBeGreaterThan(0)
  })

  it('falls back to a generic name when tool_name is blank', () => {
    const result = evaluateAssessment({
      tool_name: '   ',
      eu_scope: ['eu-org'],
    })
    expect(result.summary).toContain('this AI system')
  })

  it('uses the dedicated out-of-scope summary wording', () => {
    const result = evaluateAssessment({
      tool_name: 'OffshoreBot',
      eu_scope: ['none'],
    })
    expect(result.classification).toBe('Out of EU scope')
    expect(result.summary).toMatch(/outside EU AI Act territorial scope/i)
  })
})

describe('getVisibleQuestions', () => {
  it('hides conditional questions on an empty answer set', () => {
    const visible = getVisibleQuestions({})
    const conditional = assessmentQuestions.filter((question) => question.showIf)
    expect(conditional.length).toBeGreaterThan(0)
    expect(visible.length).toBe(assessmentQuestions.length - conditional.length)
    expect(visible.map((question) => question.id)).not.toContain('profiling_confirm')
  })

  it('reveals the profiling confirmation once the answers suggest profiling', () => {
    const visible = getVisibleQuestions({
      affected_people: ['applicants'],
      decision_impact: 'ranking',
    })
    expect(visible.map((question) => question.id)).toContain('profiling_confirm')
  })

  it('places the profiling confirmation immediately after the decision-impact step', () => {
    const ids = getVisibleQuestions({
      affected_people: ['applicants'],
      decision_impact: 'ranking',
    }).map((question) => question.id)
    expect(ids.indexOf('profiling_confirm')).toBe(ids.indexOf('decision_impact') + 1)
  })

  it('all question ids are unique', () => {
    const ids = assessmentQuestions.map((question) => question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
