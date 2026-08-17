import { describe, expect, it } from 'vitest'
import { ANNEX_III_APPLIES_FROM, evaluateRuleLibrary, type ResultItem } from './ai-act-rules'
import { RULE_PACK } from './rulepack'
import { articleNumberFrom } from './report/verify'

import type { AssessmentAnswers } from './ai-act-assessment'

/**
 * Items carry their Article in a field now, so prose assertions search `.text`
 * and citation assertions read `.article`. Asserting the field is strictly
 * better: a regex over prose passed whether the anchor was data or decoration.
 */
function text(items: ResultItem[]): string {
  return items.map((item) => item.text).join(' ')
}

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
    expect(text(result.actions)).toMatch(/Stop or pause/i)
  })

  it.each(futureDated)('point (%s) classifies as prohibited from 2 December 2026, not today', (point) => {
    const result = evaluateRuleLibrary({ ...inScopeBase, prohibited_screen: [`art5-${point}`] })
    expect(result.classification).toBe('Prohibited from 2 December 2026')
    expect(result.firedRules.map((rule) => rule.id)).toContain(`prohibited-art5-${point}`)
    // Must not order an immediate halt over a prohibition that does not yet exist.
    expect(text(result.actions)).not.toMatch(/Stop or pause/i)
    expect(text(result.actions)).toMatch(/2 December 2026/)
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
    expect(text(result.actions)).toMatch(/not available|unavailable/i)
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
    expect(result.vendorQuestions.join(' ')).toMatch(/Article 6\(4\) — Has your vendor documented/)
    expect(text(result.actions)).not.toMatch(/Register yourself/)
  })

  it('attributes the duties to the user where they build the product', () => {
    const result = evaluateRuleLibrary({ ...annexIIINoProfiling, origin: 'own-product' })
    expect(text(result.actions)).toMatch(/Register yourself and the system in the EU database/)
  })

  it('cites Art 26(6) for deployer retention, not Article 12', () => {
    const result = evaluateRuleLibrary(annexIIINoProfiling)
    const retention = result.actions.find((item) => /at least six months/.test(item.text))
    expect(retention?.article).toBe('Article 26(6)')
  })

  it('cites Art 19(1) for provider retention', () => {
    const result = evaluateRuleLibrary({ ...annexIIINoProfiling, origin: 'own-product' })
    const retention = result.actions.find((item) => /at least six months/.test(item.text))
    expect(retention?.article).toBe('Article 19(1)')
  })

  it('describes Article 12 as the logging capability, never the retention period', () => {
    const result = evaluateRuleLibrary(annexIIINoProfiling)
    const article12 = result.actions.filter((item) => item.article === 'Article 12')
    expect(article12.length).toBe(1)
    for (const item of article12) {
      expect(`${item.text} ${item.basis}`).toMatch(/capabilit/)
      expect(item.text).not.toMatch(/six months/)
    }
  })
})

describe('vendor questions and organisation size', () => {
  it('anchors every vendor question to an Article', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      sensitive_domains: ['employment'],
      affected_people: ['none'],
      decision_impact: 'assistive',
      vendor_docs: ['none'],
    })
    // The DPA question is GDPR, held deliberately outside the AI Act anchors.
    const aiActQuestions = result.vendorQuestions.filter((item) => !/DPA/.test(item))
    expect(aiActQuestions.length).toBeGreaterThan(3)
    for (const question of aiActQuestions) {
      expect(question).toMatch(/^Articles? \d+/)
    }
  })

  it('asks the Article 49 registration question on an Annex III path', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      sensitive_domains: ['employment'],
      vendor_docs: ['none'],
    })
    expect(result.vendorQuestions.join(' ')).toMatch(/Article 49 — Has this system been registered/)
  })

  it('asks it only once, even where the exemption rule also fires', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      sensitive_domains: ['critical-infrastructure'],
      affected_people: ['none'],
      decision_impact: 'assistive',
      vendor_docs: ['none'],
    })
    const matches = result.vendorQuestions.filter((item) => /registered in the EU database/.test(item))
    expect(matches.length).toBe(1)
  })

  it('drops the registration question once the reference is held', () => {
    const result = evaluateRuleLibrary({
      ...inScopeBase,
      sensitive_domains: ['employment'],
      vendor_docs: ['registration'],
    })
    expect(result.vendorQuestions.join(' ')).not.toMatch(/registration reference/)
  })

  it('surfaces SME relief across paragraphs 3, 4 and 5', () => {
    const result = evaluateRuleLibrary({ ...inScopeBase, org_size: 'small' })
    expect(result.firedRules.map((rule) => rule.id)).toContain('sme-proportionate-relief')
    expect(text(result.actions) + result.actions.map((i) => i.basis).join(' ')).toMatch(/paragraphs 3, 4 and 5/)
  })

  it('caps SMC relief at paragraphs 4 and 5, and says Article 5 fines are not capped', () => {
    const result = evaluateRuleLibrary({ ...inScopeBase, org_size: 'small-mid-cap' })
    expect(result.firedRules.map((rule) => rule.id)).toContain('smc-proportionate-relief')
    const fines = result.actions.find((item) => item.article === 'Article 99(6a)')
    expect(fines?.kind).toBe('enforcement')
    expect(`${fines?.text} ${fines?.basis}`).toMatch(/paragraphs 4 and 5/)
    expect(`${fines?.text} ${fines?.basis}`).toMatch(/not capped this way|only for paragraphs 4 and 5/)
    expect(fines?.basis).toMatch(/7 %|7%/)
  })

  it('does not confuse the two size reliefs', () => {
    const smc = fired({ ...inScopeBase, org_size: 'small-mid-cap' })
    expect(smc).not.toContain('sme-proportionate-relief')
    const sme = fired({ ...inScopeBase, org_size: 'medium' })
    expect(sme).not.toContain('smc-proportionate-relief')
  })

  it('stays silent when organisation size is not given', () => {
    const ids = fired(inScopeBase)
    expect(ids).not.toContain('sme-proportionate-relief')
    expect(ids).not.toContain('smc-proportionate-relief')
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

/**
 * Invariants over the structured result items.
 *
 * These exist because the old shape made the bug they guard impossible to see:
 * an item was a bare string, so a concession, a support measure and a genuine
 * duty were indistinguishable in the type and rendered identically on screen.
 * The kind is now data, and these assertions are what stop it drifting back.
 */
describe('result items', () => {
  /** Profiles chosen to fire every rule that emits an item. */
  const PROFILES: Record<string, AssessmentAnswers> = {
    outOfScope: { eu_scope: ['none'], origin: 'third-party' },
    smeDeployer: { ...inScopeBase, org_size: 'small' },
    smeHighRiskProvider: {
      ...inScopeBase,
      org_size: 'small',
      origin: 'own-product',
      sensitive_domains: ['employment'],
    },
    smcHighRiskProvider: {
      ...inScopeBase,
      org_size: 'small-mid-cap',
      origin: 'own-product',
      sensitive_domains: ['employment'],
    },
    annexIIIDeployer: { ...inScopeBase, sensitive_domains: ['employment'], profiling_confirm: 'no' },
    // `primary_use` is required: `performsProfiling` is gated on
    // `derivesProfiling`, so a bare confirmation is ignored without it.
    annexIIIProfiling: {
      ...inScopeBase,
      primary_use: 'employment',
      sensitive_domains: ['employment'],
      profiling_confirm: 'yes',
    },
    annexIIIByPrimaryUse: { ...inScopeBase, primary_use: 'education', profiling_confirm: 'no' },
    prohibited: { ...inScopeBase, prohibited_screen: ['art5-f'] },
    futureProhibited: { ...inScopeBase, prohibited_screen: ['art5-ba'] },
    transparency: { ...inScopeBase, transparency: ['chatbot'] },
    gpai: { ...inScopeBase, primary_use: 'gpai-product' },
    modifiedResold: { ...inScopeBase, origin: 'modified-or-resold' },
    weakOversight: { ...inScopeBase, human_oversight: 'none' },
  }

  const allItems: ResultItem[] = Object.values(PROFILES).flatMap(
    (answers) => evaluateRuleLibrary(answers).actions
  )

  /**
   * The coverage guard, and it comes first on purpose: every invariant below is
   * a statement about the items the matrix produced. A matrix that quietly
   * stopped covering a rule would make all of them pass while asserting nothing.
   */
  it('the profile matrix fires every rule that emits an item', () => {
    const EXPECTED_EMITTERS = [
      'scope-no-eu-connection',
      'role-provider-own-product',
      'role-modified-resold',
      'annex-iii-sensitive-domain',
      'annex-iii-primary-use',
      'annex-iii-profiling-override',
      'annex-iii-exemption-duties',
      'high-risk-log-retention',
      'weak-human-oversight',
      'gpai-product-route',
      'sme-proportionate-relief',
      'smc-proportionate-relief',
      'system-record-obligation',
      'prohibited-art5-f',
      'prohibited-art5-ba',
      'article-50-chatbot',
    ]
    const emitters = new Set(allItems.map((item) => item.ruleId))
    for (const id of EXPECTED_EMITTERS) {
      expect(emitters, `${id} emitted no items`).toContain(id)
    }
  })

  it('the size reliefs are never duties', () => {
    const relief = allItems.filter((item) => /-proportionate-relief$/.test(item.ruleId))
    expect(relief.length).toBeGreaterThan(0)
    for (const item of relief) {
      expect(item.kind, item.id).not.toBe('duty')
      expect(item.kind, item.id).not.toBe('conditional')
    }
  })

  it('an SME provider of a high-risk system gets exactly the four size provisions', () => {
    const items = evaluateRuleLibrary(PROFILES.smeHighRiskProvider).actions.filter(
      (item) => item.ruleId === 'sme-proportionate-relief'
    )
    expect(items.map((item) => item.kind)).toEqual([
      'concession',
      'concession',
      'support',
      'enforcement',
    ])
  })

  /**
   * The accuracy fix. Articles 11(1) and 17(2) relieve provider duties on
   * high-risk systems; an SME deployer of a limited-risk tool owes neither, so
   * being told it may simplify Annex IV documentation was misinformation.
   */
  it('withholds the Article 11 and 17 reliefs from an SME that is not a high-risk provider', () => {
    const items = evaluateRuleLibrary(PROFILES.smeDeployer).actions
    const articles = items.map((item) => item.article)
    expect(articles).not.toContain('Article 11(1)')
    expect(articles).not.toContain('Article 17(2)')
    // The two that are not tier-dependent still apply.
    expect(items.some((item) => item.kind === 'support')).toBe(true)
    expect(items.some((item) => item.article === 'Article 99(6)')).toBe(true)
  })

  it('every duty and conditional duty carries an Article', () => {
    for (const item of allItems) {
      if (item.kind === 'duty' || item.kind === 'conditional') {
        expect(item.article, `${item.id} has no article`).toMatch(/^Articles? \d/)
      }
    }
  })

  it('every conditional item states its condition', () => {
    for (const item of allItems.filter((i) => i.kind === 'conditional')) {
      expect(item.condition?.length ?? 0, `${item.id} has no condition`).toBeGreaterThan(20)
    }
  })

  it('every item explains its basis', () => {
    for (const item of allItems) {
      expect(item.basis.length, `${item.id} has a thin basis`).toBeGreaterThan(60)
    }
  })

  /**
   * The four kinds the reader is most likely to mistake for a task get a longer
   * floor: the whole complaint was that a bare sentence plus "(Article 57)"
   * explains nothing.
   */
  it('reliefs, support and enforcement items explain themselves at length', () => {
    const needsDetail = allItems.filter((item) =>
      ['concession', 'support', 'enforcement'].includes(item.kind)
    )
    expect(needsDetail.length).toBeGreaterThan(0)
    for (const item of needsDetail) {
      expect(item.basis.length, `${item.id} has a thin basis`).toBeGreaterThan(120)
    }
  })

  it('citations live in the article field, never trailing the prose', () => {
    for (const item of allItems) {
      expect(item.text, item.id).not.toMatch(/\(Articles?\s[^)]*\)\s*$/)
    }
  })

  it('every corpus link resolves to an Article the pinned pack carries', () => {
    const covered = Object.keys(RULE_PACK.manifest.corpus)
    const linked = allItems.filter((item) => item.corpusArticle)
    expect(linked.length).toBeGreaterThan(0)
    for (const item of linked) {
      expect(covered, `${item.id} links to uncovered Article ${item.corpusArticle}`).toContain(
        item.corpusArticle
      )
    }
  })

  /**
   * Catches a copy-pasted anchor: the link must point at an Article the item
   * actually cites. Labels may name several provisions ("Articles 11, 13 and
   * 72"), so every number in the label is a legitimate target — but a number
   * that appears nowhere in it is a mistake.
   */
  it('the corpus link points at an Article the item cites', () => {
    for (const item of allItems.filter((i) => i.corpusArticle && i.article)) {
      const cited = item.article!.match(/\d+[a-z]?/g) ?? []
      expect(cited, item.id).toContain(item.corpusArticle)
      // Sanity-check the shared parser agrees wherever the label is singular.
      if (!/^Articles /.test(item.article!)) {
        expect(articleNumberFrom(item.article!), item.id).toBe(item.corpusArticle)
      }
    }
  })

  /**
   * Id integrity, both directions. Two rules deliberately share an id so their
   * item collapses to one bullet — but a shared id with differing content
   * silently drops one, and two distinct ids with identical text render as two
   * identical bullets, which is what the old string dedupe used to absorb.
   */
  it('a shared id always means identical content', () => {
    const byId = new Map<string, ResultItem>()
    for (const item of allItems) {
      const seen = byId.get(item.id)
      if (seen) {
        expect(item.kind, `${item.id} kind differs`).toBe(seen.kind)
        expect(item.text, `${item.id} text differs`).toBe(seen.text)
      } else {
        byId.set(item.id, item)
      }
    }
  })

  it('distinct ids never render identical text', () => {
    const byText = new Map<string, string>()
    for (const item of allItems) {
      const seen = byText.get(item.text)
      expect(seen ?? item.id, `"${item.text}" is emitted under two ids`).toBe(item.id)
      byText.set(item.text, item.id)
    }
  })

  /**
   * Dates come from the pack, never from a literal in the engine. A pack that
   * renamed this timeline label would otherwise drop the date out of every
   * high-risk condition with nothing failing.
   */
  it('the Annex III application date resolves against the pinned pack', () => {
    expect(ANNEX_III_APPLIES_FROM).toBe('2 December 2027')
  })

  it('the high-risk duties say they are not yet in application', () => {
    const items = evaluateRuleLibrary(PROFILES.annexIIIDeployer).actions
    const retention = items.find((item) => item.article === 'Article 26(6)')
    expect(retention?.kind).toBe('conditional')
    expect(retention?.condition).toMatch(/2 December 2027/)
  })
})
