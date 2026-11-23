import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assessmentQuestions, evaluateAssessment, type AssessmentAnswers } from './ai-act-assessment'
import { evaluateRuleLibrary } from './ai-act-rules'
import { inForceOn, nextMilestoneOn, packDateToIso, timelineStatusOn, todayIso } from './ai-act-dates'
import { RULE_PACK } from './rulepack'
import { runShadowComparison } from './compliance-v2/release/shadow'
import { evaluateAssessmentV2 } from './compliance-v2/engine/assemble'
import { PROHIBITED_QUESTIONS } from './compliance-v2/questions/prohibited'
import { scenario } from './compliance-v2/test-fixtures/golden-scenarios'
import { complianceCheckerMarkdown } from './tools-markdown'

/**
 * The two Omnibus prohibitions, Article 5(1)(ba) and (bb), apply from
 * 2 December 2026. The checker must say "not yet" before that day and treat the
 * practice as prohibited on and after it, for the same answers, with nothing
 * but the injected assessment date changing. The clock is injected everywhere:
 * no test here reads the real one.
 */

const DAY_BEFORE = '2026-12-01'
const DAY_OF = '2026-12-02'
const DAY_AFTER = '2026-12-03'

const base: AssessmentAnswers = { eu_scope: ['eu-org'], origin: 'third-party' }
const FUTURE_POINTS = ['ba', 'bb']
const NOT_YET = /not prohibited today|not a prohibited practice today|becomes a prohibited practice|not today/i

function allText(result: ReturnType<typeof evaluateRuleLibrary>): string {
  return JSON.stringify([
    result.reasons,
    result.actions,
    result.vendorQuestions,
    result.adjacentRisks,
    result.reviewTriggers,
    result.firedRules.map((rule) => rule.explanation),
  ])
}

describe('date helpers', () => {
  it('turns the pack’s date format into an ISO day', () => {
    expect(packDateToIso('2 December 2026')).toBe('2026-12-02')
    expect(packDateToIso('2 August 2028')).toBe('2028-08-02')
    expect(() => packDateToIso('December 2026')).toThrow(/not in the form/)
  })

  it('a date applies from its own day, not the day before', () => {
    expect(inForceOn('2 December 2026', DAY_BEFORE)).toBe(false)
    expect(inForceOn('2 December 2026', DAY_OF)).toBe(true)
    expect(inForceOn('2 December 2026', DAY_AFTER)).toBe(true)
  })

  it('timeline status follows the date, not the status stored in the pack', () => {
    const entry = RULE_PACK.timeline.find((item) => item.date === '2 December 2026')!
    expect(entry.status).toBe('upcoming') // as cut: stale by design
    expect(timelineStatusOn(entry, DAY_BEFORE)).toBe('upcoming')
    expect(timelineStatusOn(entry, DAY_OF)).toBe('in-force')
  })

  it('the next milestone moves on once its date passes', () => {
    expect(nextMilestoneOn(RULE_PACK.timeline, DAY_BEFORE)?.date).toBe('2 December 2026')
    expect(nextMilestoneOn(RULE_PACK.timeline, DAY_OF)?.date).toBe('2 August 2027')
    expect(nextMilestoneOn(RULE_PACK.timeline, '2031-01-01')).toBeUndefined()
  })
})

describe('v1: Article 5(1)(ba) and (bb) across 2 December 2026', () => {
  it.each(FUTURE_POINTS)('point (%s) is not yet prohibited the day before', (point) => {
    const result = evaluateRuleLibrary({ ...base, prohibited_screen: [`art5-${point}`] }, DAY_BEFORE)
    expect(result.classification).toBe('Prohibited from 2 December 2026')
    expect(result.actions.map((item) => item.text).join(' ')).not.toMatch(/Stop or pause/i)
    expect(result.reasons.join(' ')).toMatch(/not prohibited today/i)
  })

  it.each(FUTURE_POINTS)('point (%s) is prohibited on the day, as the original eight are', (point) => {
    const result = evaluateRuleLibrary({ ...base, prohibited_screen: [`art5-${point}`] }, DAY_OF)
    expect(result.classification).toBe('Prohibited practice')
    expect(result.actions.map((item) => item.text).join(' ')).toMatch(/Stop or pause/i)
    expect(allText(result)).not.toMatch(NOT_YET)
  })

  it.each(FUTURE_POINTS)('point (%s) is prohibited the day after, with no leftover "not yet" copy', (point) => {
    const result = evaluateRuleLibrary({ ...base, prohibited_screen: [`art5-${point}`] }, DAY_AFTER)
    expect(result.classification).toBe('Prohibited practice')
    expect(allText(result)).not.toMatch(NOT_YET)
    const fired = result.firedRules.find((rule) => rule.id === `prohibited-art5-${point}`)
    expect(fired?.source.url).toContain('2026/1744')
  })

  it('the original eight do not change across the date', () => {
    for (const point of ['a', 'c', 'h']) {
      const answers = { ...base, prohibited_screen: [`art5-${point}`] }
      expect(evaluateRuleLibrary(answers, DAY_BEFORE)).toEqual(evaluateRuleLibrary(answers, DAY_AFTER))
    }
  })

  it('results without a future-dated practice are identical on both sides of the date', () => {
    const answers: AssessmentAnswers = { ...base, sensitive_domains: ['employment'], prohibited_screen: ['none'] }
    expect(evaluateRuleLibrary(answers, DAY_BEFORE)).toEqual(evaluateRuleLibrary(answers, DAY_AFTER))
  })

  it('the headline summary reads correctly on each side', () => {
    const answers = { ...base, tool_name: 'Studio', prohibited_screen: ['art5-ba'] }
    expect(evaluateAssessment(answers, DAY_BEFORE).summary).toMatch(/not a prohibited practice today/)
    const after = evaluateAssessment(answers, DAY_AFTER)
    expect(after.classification).toBe('Prohibited practice')
    expect(after.summary).not.toMatch(NOT_YET)
    expect(after.summary).toBe(
      'Studio is classified as a prohibited practice on this first-pass assessment. Stop or pause the use until the position is reviewed.',
    )
    expect(after.summary).not.toMatch(/classified as prohibited practice/)
  })

  it('a present-tense and a newly applying practice together keep the present-tense headline', () => {
    const answers = { ...base, prohibited_screen: ['art5-ba', 'art5-c'] }
    expect(evaluateRuleLibrary(answers, DAY_BEFORE).classification).toBe('Prohibited practice')
    expect(evaluateRuleLibrary(answers, DAY_AFTER).classification).toBe('Prohibited practice')
  })

  it('the Markdown download dates its timeline from the assessment date', () => {
    const answers = { ...base, tool_name: 'Studio', prohibited_screen: ['art5-ba'] }
    const md = (asOf: string) =>
      complianceCheckerMarkdown(evaluateAssessment(answers, asOf), answers, assessmentQuestions, asOf)
    const line = (text: string) => text.split('\n').find((row) => row.includes('**2 December 2026**')) ?? ''
    expect(line(md(DAY_BEFORE))).not.toContain('(applies)')
    expect(line(md(DAY_OF))).toContain('(applies)')
    const timing = md(DAY_OF).split('## Timing')[1].split('## Penalty')[0]
    expect(timing).not.toMatch(/in force/i)
  })

  it('no worked example on the checker page selects a future-dated practice', () => {
    // The page evaluates its examples once, at module load, which is build time
    // in a prerender. That is only safe while none of them depends on the date.
    const source = readFileSync(
      'src/app/(website)/tools/compliance-checker/page.tsx',
      'utf8',
    )
    const examples = source.slice(source.indexOf('EXAMPLE_SYSTEMS'), source.indexOf('EXAMPLE_RESULTS ='))
    expect(examples).not.toMatch(/art5-b[ab]/)
  })
})

describe('the calendar day follows the reader’s time zone', () => {
  // 22:30 UTC on 1 December is already 2 December at UTC+2 (Athens, in winter).
  const instant = new Date('2026-12-01T22:30:00Z')
  const answers = { ...base, prohibited_screen: ['art5-ba'] }

  it('names the local calendar day for a zone', () => {
    expect(todayIso(instant, 'Europe/Athens')).toBe('2026-12-02')
    expect(todayIso(instant, 'UTC')).toBe('2026-12-01')
    expect(todayIso(instant, 'Europe/Brussels')).toBe('2026-12-01')
    expect(todayIso(new Date('2026-12-01T23:00:00Z'), 'Europe/Brussels')).toBe('2026-12-02')
  })

  it('the same instant is prohibited at UTC+2 and not yet at UTC+0', () => {
    expect(evaluateRuleLibrary(answers, todayIso(instant, 'Europe/Athens')).classification).toBe('Prohibited practice')
    expect(evaluateRuleLibrary(answers, todayIso(instant, 'UTC')).classification).toBe('Prohibited from 2 December 2026')
  })

  it('v2 follows the same day', () => {
    const v2 = scenario('article5DeepfakeNoSafeguards')
    const item = (zone: string) =>
      evaluateAssessmentV2(v2, todayIso(instant, zone)).legalFindings.find((entry) => entry.id === 'article-5-ba')
    expect(item('Europe/Athens')?.effectiveFrom).toBeUndefined()
    expect(item('UTC')?.effectiveFrom).toBe('2 December 2026')
  })

  it('the timeline status and next step follow it too', () => {
    const entry = RULE_PACK.timeline.find((item) => item.date === '2 December 2026')!
    expect(timelineStatusOn(entry, todayIso(instant, 'Europe/Athens'))).toBe('in-force')
    expect(timelineStatusOn(entry, todayIso(instant, 'UTC'))).toBe('upcoming')
    expect(nextMilestoneOn(RULE_PACK.timeline, todayIso(instant, 'Europe/Athens'))?.date).toBe('2 August 2027')
  })
})

describe('wording that must not imply Article 50(2) starts on 2 December 2026', () => {
  it('the FAQ gives 2 December as a deadline for systems already on the market', () => {
    const source = readFileSync('src/lib/ai-act-explainers/faq.ts', 'utf8')
    expect(source).toContain('have until ${newProhibitions} to meet the Article 50(2) duty')
    expect(source).not.toContain('apply, and generative systems already on the market')
  })
})

describe('v2 beta: Article 5(1)(ba) across 2 December 2026', () => {
  const answers = scenario('article5DeepfakeNoSafeguards')

  const finding = (asOf: string) => {
    const result = evaluateAssessmentV2(answers, asOf)
    return { result, item: result.legalFindings.find((entry) => entry.id === 'article-5-ba') }
  }

  it('the day before: dated, and says it is not prohibited yet', () => {
    const { result, item } = finding(DAY_BEFORE)
    expect(result.classification).toBe('potentially_prohibited')
    expect(item?.effectiveFrom).toBe('2 December 2026')
    expect(JSON.stringify(item)).toMatch(/not today/)
    expect(result.classificationExplanation).toMatch(/fixed future date/)
  })

  it.each([DAY_OF, DAY_AFTER])('on and after %s: prohibited now, no "not today" copy', (day) => {
    const { result, item } = finding(day)
    expect(result.classification).toBe('potentially_prohibited')
    expect(item).toBeDefined()
    expect(item?.effectiveFrom).toBeUndefined()
    expect(JSON.stringify(item)).not.toMatch(/not today|becomes prohibited/)
    expect(result.classificationExplanation).toMatch(/prohibited outright today/)
    expect(result.classificationExplanation).not.toMatch(/fixed future date/)
    expect(result.statutoryRoutes.join(' ')).not.toMatch(/from 2 December 2026/)
  })

  it('the question help is neutral about the date, so a built catalogue reads right on both sides', () => {
    const screen = PROHIBITED_QUESTIONS.find((question) => question.id === 'prohibited_screen')
    const help = (screen?.options ?? [])
      .filter((option) => option.value === 'art5_ba' || option.value === 'art5_bb')
      .map((option) => option.help)
    expect(help).toEqual(['Prohibited from 2 December 2026.', 'Prohibited from 2 December 2026.'])
  })
})

describe('shadow comparison stays consistent across the date', () => {
  it('v1 and v2 are run on the same assessment date', () => {
    for (const day of [DAY_BEFORE, DAY_AFTER]) {
      const rows = runShadowComparison(day)
      expect(rows.filter((row) => row.kind === 'unexplained')).toEqual([])
    }
  })
})
