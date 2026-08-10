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
      prohibited_screen: ['art5-c'],
    })
    // The prohibited rule still fires (its findings surface as signals)…
    expect(result.firedRules.map((rule) => rule.id)).toContain('prohibited-art5-c')
    // …but the headline classification stays out of scope.
    expect(result.classification).toBe('Out of EU scope')
  })

  it('out-of-scope also short-circuits a future-dated prohibition', () => {
    const result = evaluateRuleLibrary({
      eu_scope: ['none'],
      prohibited_screen: ['art5-ba'],
    })
    expect(result.firedRules.map((rule) => rule.id)).toContain('prohibited-art5-ba')
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
  // The eight points that have applied since 2 February 2025.
  const presentTense = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  // The two inserted by Regulation (EU) 2026/1744, applying 2 December 2026.
  const futureDated = ['ba', 'bb']

  it.each(presentTense)('point (%s) classifies as Prohibited practice today', (point) => {
    const result = evaluateRuleLibrary({ ...inScopeBase, prohibited_screen: [`art5-${point}`] })
    expect(result.classification).toBe('Prohibited practice')
    expect(result.firedRules.map((rule) => rule.id)).toContain(`prohibited-art5-${point}`)
    expect(result.obligations.join(' ')).toMatch(/Stop or pause/i)
  })

  it.each(futureDated)('point (%s) classifies as prohibited from 2 December 2026, not today', (point) => {
    const result = evaluateRuleLibrary({ ...inScopeBase, prohibited_screen: [`art5-${point}`] })
    expect(result.classification).toBe('Prohibited from 2 December 2026')
    expect(result.firedRules.map((rule) => rule.id)).toContain(`prohibited-art5-${point}`)
    // Must not order an immediate halt over a prohibition that does not yet exist.
    expect(result.obligations.join(' ')).not.toMatch(/Stop or pause/i)
    expect(result.obligations.join(' ')).toMatch(/2 December 2026/)
  })

  it.each(futureDated)('point (%s) cites the amending Regulation, not the Service Desk', (point) => {
    const result = evaluateRuleLibrary({ ...inScopeBase, prohibited_screen: [`art5-${point}`] })
    const fired = result.firedRules.find((rule) => rule.id === `prohibited-art5-${point}`)
    expect(fired?.source.url).toContain('2026/1744')
    expect(fired?.source.article).toBe(`Article 5(1)(${point})`)
  })

  it('every one of the ten Article 5(1) points has a rule', () => {
    const points = ['a', 'b', 'ba', 'bb', 'c', 'd', 'e', 'f', 'g', 'h']
    for (const point of points) {
      const ids = fired({ ...inScopeBase, prohibited_screen: [`art5-${point}`] })
      expect(ids).toContain(`prohibited-art5-${point}`)
    }
  })

  it('a present-tense prohibition outranks a simultaneous future-dated one', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      prohibited_screen: ['art5-ba', 'art5-c'],
    })
    expect(result.classification).toBe('Prohibited practice')
  })

  it('prohibited outranks a simultaneous Annex III high-risk trigger', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      prohibited_screen: ['art5-c'],
      sensitive_domains: ['employment'],
    })
    expect(result.classification).toBe('Prohibited practice')
  })

  it('a future-dated prohibition still outranks high-risk', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      prohibited_screen: ['art5-ba'],
      sensitive_domains: ['employment'],
    })
    expect(result.classification).toBe('Prohibited from 2 December 2026')
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

describe('Article 6(3) profiling override', () => {
  // The canonical walked path: third-party HR screening tool, EU decision
  // impact, applicant shortlisting, rubber-stamp oversight.
  const hrScreening: AssessmentAnswers = {
    ...inScopeBase,
    primary_use: 'employment',
    affected_people: ['applicants'],
    decision_impact: 'ranking',
    human_oversight: 'rubber-stamp',
    sensitive_domains: ['employment'],
  }

  it('a confirmed profiling answer returns high-risk with High confidence', () => {
    const result = evaluateRuleLibrary({ ...hrScreening, profiling_confirm: 'yes' })
    expect(result.classification).toBe('Likely high-risk')
    expect(result.confidence).toBe('High')
    expect(result.firedRules.map((rule) => rule.id)).toContain('annex-iii-profiling-override')
  })

  it('suppresses the narrow-task exemption caveat, which would contradict it', () => {
    const result = evaluateRuleLibrary({ ...hrScreening, profiling_confirm: 'yes' })
    const surfaced = [...result.missingFacts, ...result.vendorQuestions].join(' ')
    expect(surfaced).not.toMatch(/narrow-task exemption \(/i)
    expect(surfaced).not.toMatch(/what Article 6\(3\) exemption analysis/i)
    expect(result.obligations.join(' ')).toMatch(/not available|unavailable/i)
  })

  it('"not sure" fires the override but holds confidence at Medium', () => {
    const result = evaluateRuleLibrary({ ...hrScreening, profiling_confirm: 'not-sure' })
    expect(result.firedRules.map((rule) => rule.id)).toContain('annex-iii-profiling-override')
    expect(result.confidence).toBe('Medium')
    expect(result.reasons.join(' ')).toMatch(/rests on an assumption/i)
  })

  it('an unanswered confirmation behaves like "not sure"', () => {
    const result = evaluateRuleLibrary(hrScreening)
    expect(result.firedRules.map((rule) => rule.id)).toContain('annex-iii-profiling-override')
    expect(result.confidence).toBe('Medium')
  })

  it('an explicit "no" does not fire the override and restores the exemption caveat', () => {
    const result = evaluateRuleLibrary({ ...hrScreening, profiling_confirm: 'no' })
    expect(result.firedRules.map((rule) => rule.id)).not.toContain('annex-iii-profiling-override')
    expect(result.missingFacts.join(' ')).toMatch(/narrow-task exemption/i)
  })

  it('never raises confidence while territorial scope is unresolved', () => {
    const result = evaluateRuleLibrary({
      ...hrScreening,
      eu_scope: ['not-sure'],
      profiling_confirm: 'yes',
    })
    expect(result.firedRules.map((rule) => rule.id)).toContain('annex-iii-profiling-override')
    expect(result.confidence).not.toBe('High')
  })

  it('never raises confidence while the user role is unresolved', () => {
    const result = evaluateRuleLibrary({
      ...hrScreening,
      origin: 'not-sure',
      profiling_confirm: 'yes',
    })
    expect(result.confidence).not.toBe('High')
  })

  it('does not fire for a drafting tool with no Annex III domain', () => {
    const ids = fired({
      ...inScopeBase,
      primary_use: 'general-productivity',
      affected_people: ['workers'],
      decision_impact: 'assistive',
      sensitive_domains: ['none'],
    })
    expect(ids).not.toContain('annex-iii-profiling-override')
  })

  it('does not fire in an Annex III domain where no person is evaluated', () => {
    const ids = fired({
      ...inScopeBase,
      primary_use: 'general-productivity',
      affected_people: ['none'],
      decision_impact: 'assistive',
      sensitive_domains: ['critical-infrastructure'],
    })
    expect(ids).not.toContain('annex-iii-profiling-override')
  })

  it('ignores a stale confirmation once the answers no longer suggest profiling', () => {
    // The user answered "yes", then went back and changed the decision impact.
    const ids = fired({
      ...inScopeBase,
      primary_use: 'general-productivity',
      affected_people: ['customers'],
      decision_impact: 'assistive',
      sensitive_domains: ['none'],
      profiling_confirm: 'yes',
    })
    expect(ids).not.toContain('annex-iii-profiling-override')
  })

  it('a prohibited practice still outranks the override', () => {
    const result = evaluateRuleLibrary({
      ...hrScreening,
      profiling_confirm: 'yes',
      prohibited_screen: ['art5-c'],
    })
    expect(result.classification).toBe('Prohibited practice')
  })
})

describe('Article 6(3) exemption duties and log retention', () => {
  const annexIIINoProfiling: AssessmentAnswers = {
    ...inScopeBase,
    sensitive_domains: ['critical-infrastructure'],
    affected_people: ['none'],
    decision_impact: 'assistive',
  }

  it('surfaces Art 6(4) and Art 49(2) where the exemption is still available', () => {
    const result = evaluateRuleLibrary(annexIIINoProfiling)
    expect(result.firedRules.map((rule) => rule.id)).toContain('annex-iii-exemption-duties')
  })

  it('withholds them where the profiling override has foreclosed the exemption', () => {
    const ids = fired({
      ...inScopeBase,
      primary_use: 'employment',
      affected_people: ['applicants'],
      decision_impact: 'ranking',
      sensitive_domains: ['employment'],
      profiling_confirm: 'yes',
    })
    expect(ids).not.toContain('annex-iii-exemption-duties')
  })

  it('frames the duties as vendor evidence for a pure deployer', () => {
    const result = evaluateRuleLibrary(annexIIINoProfiling)
    expect(result.vendorQuestions.join(' ')).toMatch(/Article 49\(2\)/)
    expect(result.obligations.join(' ')).not.toMatch(/Register yourself/)
  })

  it('attributes the duties to the user where they build the product', () => {
    const result = evaluateRuleLibrary({ ...annexIIINoProfiling, origin: 'own-product' })
    expect(result.obligations.join(' ')).toMatch(/Register yourself and the system in the EU database/)
  })

  it('cites Art 26(6) for deployer retention, not Article 12', () => {
    const result = evaluateRuleLibrary(annexIIINoProfiling)
    const retention = result.obligations.find((item) => /at least six months/.test(item))
    expect(retention).toMatch(/Article 26\(6\)/)
    expect(retention).not.toMatch(/Article 12/)
  })

  it('cites Art 19(1) for provider retention', () => {
    const result = evaluateRuleLibrary({ ...annexIIINoProfiling, origin: 'own-product' })
    const retention = result.obligations.find((item) => /at least six months/.test(item))
    expect(retention).toMatch(/Article 19\(1\)/)
  })

  it('describes Article 12 as the logging capability, never the retention period', () => {
    const result = evaluateRuleLibrary(annexIIINoProfiling)
    const article12 = result.obligations.filter((item) => /Article 12/.test(item))
    expect(article12.length).toBeGreaterThan(0)
    for (const item of article12) {
      expect(item).toMatch(/logging capability/)
      expect(item).not.toMatch(/six months/)
    }
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
