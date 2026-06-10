import { describe, expect, it } from 'vitest'
import { evaluateRuleLibrary } from './ai-act-rules'
import type { AssessmentAnswers } from './ai-act-assessment'

/**
 * Regression net over the AI Act triage engine. These cases lock in the
 * engine's current decisions for the canonical classification routes —
 * a change to any rule constant or to pickClassification should make at
 * least one of them fail loudly.
 */

const inScopeBase: AssessmentAnswers = {
  eu_scope: ['eu-org'],
  origin: 'third-party',
}

function fired(answers: AssessmentAnswers): string[] {
  return evaluateRuleLibrary(answers).firedRules.map((rule) => rule.id)
}

describe('territorial scope (Article 2)', () => {
  it('classifies a no-EU-connection profile as out of scope', () => {
    const result = evaluateRuleLibrary({ eu_scope: ['none'], origin: 'third-party' })
    expect(result.classification).toBe('Out of EU scope')
    expect(fired({ eu_scope: ['none'] })).toContain('scope-no-eu-connection')
  })

  it('out-of-scope short-circuits content rules — even a prohibited red flag', () => {
    const result = evaluateRuleLibrary({
      eu_scope: ['none'],
      prohibited_screen: ['social-scoring'],
    })
    // The prohibited rule still fires (its findings surface as signals)…
    expect(result.firedRules.map((rule) => rule.id)).toContain('prohibited-social-scoring')
    // …but the headline classification stays out of scope.
    expect(result.classification).toBe('Out of EU scope')
  })

  it('does not treat "none" as out of scope when other EU connections are also selected', () => {
    const result = evaluateRuleLibrary({ eu_scope: ['none', 'eu-users'] })
    expect(result.classification).not.toBe('Out of EU scope')
  })

  it('missing or not-sure scope lowers confidence and flags a missing fact', () => {
    const result = evaluateRuleLibrary({ eu_scope: ['not-sure'] })
    expect(result.classification).toBe('Uncertain')
    expect(result.confidence).not.toBe('High')
    expect(result.missingFacts.length).toBeGreaterThan(0)
  })
})

describe('prohibited practices (Article 5)', () => {
  const flags: Array<[string, string]> = [
    ['social-scoring', 'prohibited-social-scoring'],
    ['manipulation', 'prohibited-manipulation-vulnerability'],
    ['workplace-emotion', 'prohibited-workplace-education-emotion'],
    ['public-biometric-id', 'prohibited-public-biometric-id'],
    ['facial-scraping', 'prohibited-facial-scraping'],
  ]

  it.each(flags)('flag %s classifies as Prohibited practice via %s', (flag, ruleId) => {
    const result = evaluateRuleLibrary({ ...inScopeBase, prohibited_screen: [flag] })
    expect(result.classification).toBe('Prohibited practice')
    expect(result.firedRules.map((rule) => rule.id)).toContain(ruleId)
    expect(result.obligations.join(' ')).toMatch(/Stop or pause/i)
  })

  it('prohibited outranks a simultaneous Annex III high-risk trigger', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      prohibited_screen: ['social-scoring'],
      sensitive_domains: ['employment'],
    })
    expect(result.classification).toBe('Prohibited practice')
  })
})

describe('Annex III high-risk default', () => {
  it('a sensitive-domain selection defaults to likely high-risk', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      sensitive_domains: ['employment'],
    })
    expect(result.classification).toBe('Likely high-risk')
    expect(result.firedRules.map((rule) => rule.id)).toContain('annex-iii-sensitive-domain')
    expect(result.role).toBe('Deployer')
  })

  it('an Annex III primary use fires the fallback rule when no domain box is ticked', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      primary_use: 'employment',
      sensitive_domains: ['none'],
    })
    expect(result.classification).toBe('Likely high-risk')
    const ids = result.firedRules.map((rule) => rule.id)
    expect(ids).toContain('annex-iii-primary-use')
    expect(ids).not.toContain('annex-iii-sensitive-domain')
  })

  it('the fallback rule stays silent when the sensitive-domain rule already fired', () => {
    const ids = fired({
      ...inScopeBase,
      primary_use: 'employment',
      sensitive_domains: ['employment'],
    })
    expect(ids).toContain('annex-iii-sensitive-domain')
    expect(ids).not.toContain('annex-iii-primary-use')
  })
})

describe('Article 50 transparency', () => {
  it('a declared chatbot interaction is likely limited-risk', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      transparency: ['chatbot'],
    })
    expect(result.classification).toBe('Likely limited-risk')
    expect(result.firedRules.map((rule) => rule.id)).toContain('article-50-chatbot')
  })

  it('customer-service primary use fires the Article 50 fallback when chatbot was not ticked', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      primary_use: 'customer-service',
      transparency: ['none'],
    })
    expect(result.classification).toBe('Likely limited-risk')
    expect(result.firedRules.map((rule) => rule.id)).toContain('article-50-customer-service')
  })

  it('never emits both the chatbot rule and the customer-service fallback together', () => {
    const ids = fired({
      ...inScopeBase,
      primary_use: 'customer-service',
      transparency: ['chatbot'],
    })
    expect(ids).toContain('article-50-chatbot')
    expect(ids).not.toContain('article-50-customer-service')
  })
})

describe('GPAI route', () => {
  it('a generative AI product route classifies as GPAI-related at low scores', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      primary_use: 'gpai-product',
    })
    expect(result.classification).toBe('GPAI-related')
    expect(result.firedRules.map((rule) => rule.id)).toContain('gpai-product-route')
  })

  it('GPAI escalates to likely high-risk once risk signals push the score to 5+', () => {
    const result = evaluateRuleLibrary({
      eu_scope: ['eu-org'],
      origin: 'own-product', // +2
      primary_use: 'gpai-product',
      decision_impact: 'eligibility', // +3
    })
    expect(result.score).toBeGreaterThanOrEqual(5)
    expect(result.classification).toBe('Likely high-risk')
    expect(result.role).toBe('Provider')
  })
})

describe('minimal-risk floor and scoring', () => {
  const minimalProfile: AssessmentAnswers = {
    ...inScopeBase,
    primary_use: 'general-productivity',
    decision_impact: 'assistive',
    human_oversight: 'meaningful',
    sensitive_domains: ['none'],
    prohibited_screen: ['none'],
    data_types: ['none'],
    transparency: ['none'],
    vendor_docs: ['classification', 'instructions', 'dpa', 'logs', 'change-policy'],
  }

  it('a clean internal-productivity profile is likely minimal-risk', () => {
    const result = evaluateRuleLibrary(minimalProfile)
    expect(result.classification).toBe('Likely minimal-risk')
    expect(result.score).toBeLessThan(2)
  })

  it('score alone escalates to likely high-risk at 5+ when no explicit classification fires', () => {
    // own-product role (+2) + eligibility decisions (+3) = 5, with every
    // classification-bearing rule (scope/prohibited/annex/transparency/GPAI)
    // kept silent — exercises the bare-score branch of pickClassification.
    const result = evaluateRuleLibrary({
      eu_scope: ['eu-org'],
      origin: 'own-product',
      primary_use: 'general-productivity',
      decision_impact: 'eligibility',
      human_oversight: 'meaningful',
      sensitive_domains: ['none'],
      prohibited_screen: ['none'],
      data_types: ['none'],
      transparency: ['none'],
      vendor_docs: ['classification', 'instructions', 'dpa', 'logs', 'change-policy'],
    })
    expect(result.firedRules.every((rule) => !rule.classification)).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(5)
    expect(result.classification).toBe('Likely high-risk')
  })

  it('mid scores without an explicit classification land at likely limited-risk', () => {
    // integrated third-party (+1) + decision support (+1) = 2.
    const result = evaluateRuleLibrary({
      eu_scope: ['eu-org'],
      origin: 'integrated-third-party',
      primary_use: 'general-productivity',
      decision_impact: 'recommendation',
      human_oversight: 'meaningful',
      sensitive_domains: ['none'],
      prohibited_screen: ['none'],
      data_types: ['none'],
      transparency: ['none'],
      vendor_docs: ['classification', 'instructions', 'dpa', 'logs', 'change-policy'],
    })
    expect(result.firedRules.every((rule) => !rule.classification)).toBe(true)
    expect(result.score).toBe(2)
    expect(result.classification).toBe('Likely limited-risk')
  })

  it('weak human oversight raises the risk picture relative to the clean profile', () => {
    const clean = evaluateRuleLibrary(minimalProfile)
    const weak = evaluateRuleLibrary({ ...minimalProfile, human_oversight: 'rubber-stamp' })
    expect(weak.score).toBeGreaterThan(clean.score)
  })

  it('every fired rule carries a source reference', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      sensitive_domains: ['employment'],
      decision_impact: 'eligibility',
      transparency: ['chatbot'],
    })
    for (const rule of result.firedRules) {
      expect(rule.source.url).toMatch(/^https:\/\//)
    }
    expect(result.sourceReferences.length).toBeGreaterThan(0)
  })
})
