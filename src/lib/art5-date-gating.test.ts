import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assessmentQuestions, evaluateAssessment, type AssessmentAnswers } from './ai-act-assessment'
import { evaluateRuleLibrary } from './ai-act-rules'
import { dayAfterPhaseOn, nextMilestoneOn, nowMoment, packDateToIso, phaseOn, timelineStatusOn } from './ai-act-dates'
import { RULE_PACK } from './rulepack'
import { runShadowComparison } from './compliance-v2/release/shadow'
import { evaluateAssessmentV2 } from './compliance-v2/engine/assemble'
import { markingVerb } from '@/components/home/DeadlineCountdown'
import { momentDay } from './ai-act-dates'
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

  it('a day moment applies from its own day, with no in-between state', () => {
    expect(phaseOn('2 December 2026', DAY_BEFORE)).toBe('not-yet')
    expect(phaseOn('2 December 2026', DAY_OF)).toBe('applies')
    expect(phaseOn('2 December 2026', DAY_AFTER)).toBe('applies')
  })

  it('timeline phase follows the date, not the status stored in the pack', () => {
    const entry = RULE_PACK.timeline.find((item) => item.date === '2 December 2026')!
    expect(entry.status).toBe('upcoming') // as cut: stale by design
    expect(timelineStatusOn(entry, DAY_BEFORE)).toBe('not-yet')
    expect(timelineStatusOn(entry, DAY_OF)).toBe('applies')
  })

  it('the next milestone moves on once its date has begun everywhere', () => {
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

describe('a date begins at different times across the Union', () => {
  // The EU spans UTC-4 (Martinique, Guadeloupe, Saint-Martin) to UTC+4 (Réunion),
  // so 2 December begins at 20:00 UTC on 1 Dec in Réunion and at 04:00 UTC on 2 Dec
  // in the UTC-4 zones. Between those, nothing may claim "not yet" or "since".
  const at = (iso: string) => nowMoment(new Date(iso))
  const answers = { ...base, tool_name: 'Studio', prohibited_screen: ['art5-ba'] }
  const v2 = scenario('article5DeepfakeNoSafeguards')

  const READERS: Array<[string, string, 'not-yet' | 'between' | 'applies']> = [
    ['Singapore (UTC+8) at 19:30 UTC on 1 Dec: 3:30 local on 2 Dec, but not begun in the EU', '2026-12-01T19:30:00Z', 'not-yet'],
    ['Auckland (UTC+13) at 19:30 UTC on 1 Dec', '2026-12-01T19:30:00Z', 'not-yet'],
    ['London at 23:30 UTC on 1 Dec', '2026-12-01T23:30:00Z', 'between'],
    ['the server at 22:30 UTC on 1 Dec', '2026-12-01T22:30:00Z', 'between'],
    ['the server at 23:30 UTC on 1 Dec', '2026-12-01T23:30:00Z', 'between'],
    ['Auckland at 17:00 UTC on 2 Dec', '2026-12-02T17:00:00Z', 'applies'],
    ['just before the UTC-4 zones begin 2 Dec (03:30 UTC)', '2026-12-02T03:30:00Z', 'between'],
    ['the UTC-4 zones begin 2 Dec (04:00 UTC)', '2026-12-02T04:00:00Z', 'applies'],
    ['just before Réunion begins 2 Dec (19:30 UTC)', '2026-12-01T19:59:00Z', 'not-yet'],
    ['Réunion begins 2 Dec (20:00 UTC)', '2026-12-01T20:00:00Z', 'between'],
  ]

  it.each(READERS)('phase: %s', (_name, iso, phase) => {
    expect(phaseOn('2 December 2026', at(iso))).toBe(phase)
  })

  it.each(READERS)('v1 verdict: %s', (_name, iso, phase) => {
    const result = evaluateAssessment(answers, at(iso))
    const text = JSON.stringify([result.summary, result.reasons, result.actions, result.vendorQuestions, result.firedRules.map((r) => r.explanation)])
    if (phase === 'not-yet') {
      expect(result.classification).toBe('Prohibited from 2 December 2026')
      expect(text).toMatch(/not prohibited today|not a prohibited practice today/)
    } else if (phase === 'applies') {
      expect(result.classification).toBe('Prohibited practice')
      expect(text).not.toMatch(NOT_YET)
    } else {
      // Neither a "not yet" claim nor a "since" claim.
      expect(result.classification).toBe('Prohibited from 2 December 2026')
      expect(text).not.toMatch(NOT_YET)
      expect(text).not.toMatch(/has done since|Stop or pause|\bbefore 2 December|today/i)
      expect(text).toContain('from 2 December 2026')
    }
  })

  it.each(READERS)('v2 finding: %s', (_name, iso, phase) => {
    const result = evaluateAssessmentV2(v2, momentDay(at(iso)), at(iso))
    const item = result.legalFindings.find((entry) => entry.id === 'article-5-ba')
    const text = JSON.stringify([item, result.classificationExplanation])
    if (phase === 'not-yet') {
      expect(item?.effectiveFrom).toBe('2 December 2026')
      expect(text).toMatch(/not today/)
    } else if (phase === 'applies') {
      expect(item?.effectiveFrom).toBeUndefined()
      expect(text).not.toMatch(/not today|becomes prohibited|fixed future date/)
    } else {
      expect(item?.effectiveFrom).toBe('2 December 2026')
      expect(text).not.toMatch(/not today|becomes prohibited|fixed future date|already apply|outright today/)
      expect(result.classificationExplanation).toContain(
        'A practice you selected is on Article 5’s list of prohibitions that apply from 2 December 2026.',
      )
    }
  })

  it.each(READERS)('timeline badge, tag and next step: %s', (_name, iso, phase) => {
    const entry = RULE_PACK.timeline.find((item) => item.date === '2 December 2026')!
    expect(timelineStatusOn(entry, at(iso))).toBe(phase)
    const next = nextMilestoneOn(RULE_PACK.timeline, at(iso))?.date
    if (phase === 'not-yet') expect(next).toBe('2 December 2026')
    if (phase === 'between') expect(next).toBeUndefined()
    if (phase === 'applies') expect(next).toBe('2 August 2027')
    const md = complianceCheckerMarkdown(evaluateAssessment(answers, at(iso)), answers, assessmentQuestions, at(iso))
    const line = md.split('\n').find((row) => row.includes('**2 December 2026**')) ?? ''
    expect(line.includes('(applies)')).toBe(phase === 'applies')
  })

  it('the countdown turns past tense only once 3 Dec has begun in the UTC-4 zones', () => {
    expect(markingVerb(at('2026-12-02T12:00:00Z'))).toBe('ends on')
    expect(markingVerb(at('2026-12-02T19:30:00Z'))).toBe('ends on') // 3 Dec not begun anywhere
    expect(markingVerb(at('2026-12-02T20:00:00Z'))).toBe('runs to') // 3 Dec begun in Réunion only
    expect(markingVerb(at('2026-12-03T03:30:00Z'))).toBe('runs to')
    expect(markingVerb(at('2026-12-03T04:00:00Z'))).toBe('ended on') // begun in every EU zone
    expect(markingVerb(null)).toBe('runs to')
    expect(dayAfterPhaseOn('2 December 2026', '2026-12-03')).toBe('applies')
  })
})

describe('after the date, (ba) and (bb) carry their Article 5(1a) limits', () => {
  const PARA_START = 'Article 5(1a) limits this point. Placing the system on the market or putting it into service is prohibited only where'
  const PARA_END = 'Whether your system is outside the point on those terms is for the review to establish in writing. It is not a reason to continue meanwhile.'
  const ONE_B = 'Under Article 5(1b), manipulation that does not increase the exposure of any depicted intimate parts or alter the nature of any depicted sexually explicit activities is not manipulation for this point.'

  const stop = (point: string) =>
    evaluateRuleLibrary({ ...base, prohibited_screen: [`art5-${point}`] }, DAY_AFTER).actions.find(
      (item) => item.id === `stop-prohibited-use-${point}`,
    )

  it('(ba) carries 5(1a) and 5(1b); (bb) carries 5(1a) only; the others neither', () => {
    expect(stop('ba')?.basis).toContain(PARA_START)
    expect(stop('ba')?.basis).toContain(PARA_END)
    expect(stop('ba')?.basis).toContain(ONE_B)
    expect(stop('bb')?.basis).toContain(PARA_START)
    expect(stop('bb')?.basis).not.toContain('Article 5(1b)')
    expect(stop('c')?.basis).not.toContain('Article 5(1a)')
  })

  it('the 5(1a) safeguards action is kept in the post-date finding', () => {
    for (const point of ['ba', 'bb']) {
      const ids = evaluateRuleLibrary({ ...base, prohibited_screen: [`art5-${point}`] }, DAY_AFTER).actions.map((item) => item.id)
      expect(ids).toContain('document-art-5-1a-safeguards')
    }
  })
})

describe('the FAQ separates the original eight prohibitions from the two new ones', () => {
  it('says "the original eight" for the practices banned since 2 February 2025', () => {
    const source = readFileSync('src/lib/ai-act-explainers/faq.ts', 'utf8')
    expect(source).toContain('Since ${chapterI} the original eight Article 5 prohibitions have applied')
  })
})

describe('wording that must not imply Article 50(2) starts on 2 December 2026', () => {
  it('the FAQ gives 2 December as a deadline for systems already on the market', () => {
    const source = readFileSync('src/lib/ai-act-explainers/faq.ts', 'utf8')
    expect(source).toContain(
      '${newProhibitions} is also the deadline for providers of generative systems already on the market before ${general} to meet the Article 50(2) duty to mark their output as artificially generated.',
    )
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
    expect(result.classificationExplanation).toContain(
      'on Article 5’s list of prohibitions that already apply.',
    )
    expect(result.classificationExplanation).not.toMatch(/outright today/)
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

describe('round-3 wording', () => {
  const faq = readFileSync('src/lib/ai-act-explainers/faq.ts', 'utf8')

  it('the FAQ marking sentence gives 2 December as a deadline, not a start', () => {
    expect(faq).toContain(
      '${newProhibitions} is the deadline for providers of generative systems already on the market before ${general} to add the marking.',
    )
    expect(faq).not.toContain('have until ${newProhibitions} to add the marking')
  })

  it('the not-yet v2 explanation uses the list wording with a curly apostrophe', () => {
    const result = evaluateAssessmentV2(scenario('article5DeepfakeNoSafeguards'), DAY_BEFORE)
    expect(result.classificationExplanation).toContain(
      'A practice you selected is on Article 5’s list of prohibitions that apply from a fixed future date, so this is',
    )
  })

  it('findings name the subject in the date suffix', () => {
    const between = evaluateAssessmentV2(scenario('article5DeepfakeNoSafeguards'), DAY_BEFORE, '2026-12-01T22:00:00Z')
    expect(JSON.stringify(between.legalFindings)).toContain(' The practice is prohibited from 2 December 2026.')
    const notYet = evaluateAssessmentV2(scenario('article5DeepfakeNoSafeguards'), DAY_BEFORE)
    expect(JSON.stringify(notYet.legalFindings)).toContain(' The practice becomes prohibited on 2 December 2026, not today.')
  })

  it('v1 between summary and basis follow the ruled wording', () => {
    const answers = { ...base, tool_name: 'Studio', prohibited_screen: ['art5-ba'] }
    const mid = evaluateAssessment(answers, '2026-12-01T22:00:00Z')
    expect(mid.summary).toBe(
      'The selected use of Studio falls under Article 5(1)(ba) or (bb) — inserted by the Digital Omnibus — and is prohibited from 2 December 2026.',
    )
    const basis = mid.actions.find((item) => item.id === 'plan-withdrawal-ba')?.basis ?? ''
    expect(basis).toContain('A prohibition admits no compliance route. Article 5(1a) limits this point.')
    expect(basis).not.toContain('nothing to build towards')
    expect(basis.indexOf('Article 5(1b)')).toBeGreaterThan(basis.indexOf('Article 5(1a) limits'))
    expect(basis.endsWith('It is not a reason to continue meanwhile.')).toBe(true)
    const before = evaluateAssessment(answers, DAY_BEFORE).actions.find((item) => item.id === 'plan-withdrawal-ba')?.basis ?? ''
    expect(before).toContain('but a prohibition admits no compliance route.')
    expect(before).not.toContain('nothing to build towards')
  })

  it('the applies basis ends on the review caveat, after 5(1b) for (ba)', () => {
    for (const point of ['ba', 'bb']) {
      const basis =
        evaluateRuleLibrary({ ...base, prohibited_screen: [`art5-${point}`] }, DAY_AFTER).actions.find(
          (item) => item.id === `stop-prohibited-use-${point}`,
        )?.basis ?? ''
      expect(basis.endsWith('It is not a reason to continue meanwhile.')).toBe(true)
    }
    const ba = evaluateRuleLibrary({ ...base, prohibited_screen: ['art5-ba'] }, DAY_AFTER).actions.find((item) => item.id === 'stop-prohibited-use-ba')?.basis ?? ''
    expect(ba.indexOf('Under Article 5(1b)')).toBeLessThan(ba.indexOf('Whether your system is outside'))
  })

  it('the counsel-referral adjacent risk survives the date for (ba) and (bb)', () => {
    const line = 'Non-consensual intimate imagery and CSAM carry criminal and platform-liability exposure independent of the AI Act; this is a matter for legal counsel.'
    for (const point of ['ba', 'bb']) {
      expect(evaluateRuleLibrary({ ...base, prohibited_screen: [`art5-${point}`] }, DAY_AFTER).adjacentRisks).toContain(line)
    }
    expect(evaluateRuleLibrary({ ...base, prohibited_screen: ['art5-c'] }, DAY_AFTER).adjacentRisks).not.toContain(line)
  })

  it('the Markdown export uses the moment it is given', () => {
    const answers = { ...base, tool_name: 'Studio', prohibited_screen: ['art5-ba'] }
    const at = '2026-12-01T22:00:00Z'
    const md = complianceCheckerMarkdown(evaluateAssessment(answers, at), answers, assessmentQuestions, at)
    expect(md).toContain('falls under Article 5(1)(ba) or (bb)')
  })
})

describe('v2 reads the moment when the result is requested', () => {
  it('a session started at 19:30Z on 1 Dec that asks at 20:10Z gets the between state', () => {
    const started = nowMoment(new Date('2026-12-01T19:30:00Z'))
    const requested = nowMoment(new Date('2026-12-01T20:10:00Z'))
    const v2 = scenario('article5DeepfakeNoSafeguards')
    expect(phaseOn('2 December 2026', started)).toBe('not-yet')
    expect(phaseOn('2 December 2026', requested)).toBe('between')
    const item = evaluateAssessmentV2(v2, momentDay(requested), requested).legalFindings.find((entry) => entry.id === 'article-5-ba')
    expect(JSON.stringify(item)).toContain('The practice is prohibited from 2 December 2026.')
  })

  it('the component takes the moment in the request handler, not on mount', () => {
    const source = readFileSync('src/components/tools/checker-v2/ComplianceCheckerV2.tsx', 'utf8')
    expect(source).toContain('setMoment(nowMoment())')
    expect(source).not.toMatch(/useState\(\(\) => nowMoment\(\)\)/)
  })
})
