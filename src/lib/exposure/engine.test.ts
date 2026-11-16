import { describe, expect, it } from 'vitest'

import type { AnswerRecordV2, AnswerState, AnswerValue } from '@/lib/compliance-v2/types'
import { makeAnswer } from '@/lib/compliance-v2/flow'
import { CORE_QUESTIONS, validateCatalogue } from '@/lib/compliance-v2/questions'
import { getRulePack, RULE_PACK } from '@/lib/rulepack'
import { parsePackDate } from '@/lib/ai-act-deadlines'
import { DECISIVE_IDS, OUTSIDE_EU, evaluateExposure, milestone, packDateInWords, VERDICT_EVENT, type ExposureResult } from './engine'
import { milestoneLine } from './report'
import { EXPOSURE_QUESTIONS } from './questions'
import { EXTRACTS } from './extracts'

const pack = getRulePack('2026-11-16')
const today = new Date('2026-11-16T12:00:00Z')

type Spec = Record<string, AnswerValue | { state: AnswerState }>

function answers(spec: Spec): AnswerRecordV2 {
  const record: AnswerRecordV2 = {}
  for (const [id, value] of Object.entries(spec)) {
    record[id] =
      value && typeof value === 'object' && !Array.isArray(value) && 'state' in value
        ? makeAnswer(id, value.state)
        : makeAnswer(id, 'answered', value as AnswerValue)
  }
  return record
}

const unknown = { state: 'unknown' as AnswerState }

const base: Spec = {
  organisation_establishment: 'uk',
  ai_market_connection: ['output_used_in_eu'],
  organisation_activity: ['used_internally_or_for_customers'],
  intended_use_family: ['chatbot_interaction'],
  employee_band: '10_49',
  system_count: '2_5',
  ai_inventory: 'no',
  ai_literacy_measures: 'no',
}

const run = (spec: Spec) => evaluateExposure(answers(spec), pack, today)
const ids = (result: ExposureResult) => result.areas.map((area) => area.id)
const area = (result: ExposureResult, id: string) => result.areas.find((item) => item.id === id)
const findOutIds = (result: ExposureResult) => result.findOut.map((item) => item.questionId)

/** Every string the result can put on screen. */
function strings(result: ExposureResult): string[] {
  return [
    result.scope.explanation,
    result.meaning,
    result.limits,
    ...result.confidenceReasons,
    ...result.roles,
    ...result.areas.flatMap((item) => [item.title, item.summary]),
    ...result.readiness,
    ...result.findOut.flatMap((item) => [item.ask, item.whom, item.effect]),
    ...result.revisitIf,
    result.focus?.reason ?? '',
    result.diagnosticReason ?? '',
  ]
}

describe('Exposure Check questions', () => {
  it('pass the v2 catalogue validator', () => {
    expect(validateCatalogue(EXPOSURE_QUESTIONS)).toEqual([])
  })

  it('keep every reused v2 question’s option values unchanged', () => {
    for (const question of EXPOSURE_QUESTIONS) {
      const original = CORE_QUESTIONS.find((item) => item.id === question.id)
      if (!original) continue
      expect(question.options?.map((option) => option.value)).toEqual(original.options?.map((option) => option.value))
    }
  })

  it('ask no free-text question, and offer "not sure" on every one', () => {
    expect(EXPOSURE_QUESTIONS.some((question) => question.answerType === 'text')).toBe(false)
    expect(EXPOSURE_QUESTIONS.every((question) => question.allowUnknown)).toBe(true)
  })

  it('are eight, which is what the page and search describe', () => {
    expect(EXPOSURE_QUESTIONS).toHaveLength(8)
  })
})

describe('golden scenarios', () => {
  it('UK firm whose EU-facing chatbot output is used in the EU', () => {
    const result = run(base)
    expect(result.scope.outcome).toBe('in_scope')
    expect(result.confidence).toBe('high')
    expect(ids(result)).toEqual(['ai-literacy', 'prohibited-practices', 'transparency', 'size-relief'])
    expect(area(result, 'ai-literacy')?.kind).toBe('duty')
    expect(area(result, 'ai-literacy')?.milestoneStatus).toBe('in-force')
    expect(result.readiness).toHaveLength(2)
    expect(result.findOut).toEqual([])
    expect(result.focus?.target).toBe('ai-literacy')
    expect(result.scope.explanation).toMatch(/Being established outside the EU does not change that\.$/)
  })

  it('UK HR-screening deployer: a signal to check, never a classification', () => {
    const result = run({ ...base, intended_use_family: ['employment'], ai_literacy_measures: 'yes' })
    const flagged = area(result, 'possible-high-risk')
    expect(flagged?.kind).toBe('signal')
    expect(flagged?.checkFamilies).toEqual(['employment'])
    expect(flagged?.milestoneStatus).toBe('upcoming')
    expect(ids(result)).not.toContain('authorised-representative')
    expect(result.focus?.target).toBe('possible-high-risk')
  })

  it('US provider selling an employment tool into the EU is shown the representative', () => {
    const result = run({
      ...base,
      organisation_establishment: 'us',
      ai_market_connection: ['placed_on_eu_market'],
      organisation_activity: ['supplied_under_own_name'],
      intended_use_family: ['employment'],
    })
    const rep = area(result, 'authorised-representative')
    expect(rep?.kind).toBe('conditional')
    expect(rep?.extracts).toEqual(['article-22-1'])
    expect(rep?.becauseOpen).toBeUndefined()
    expect(rep?.summary).toMatch(/and you make it available on the EU market\.$/)
    expect(rep?.summary).not.toMatch(/Section B/)
    expect(result.roles[0]).toMatch(/^Provider/)
  })

  it('a provider of AI only in regulated products is told Article 2(2) may take Article 22 away', () => {
    const result = run({
      ...base,
      organisation_establishment: 'us',
      organisation_activity: ['built_or_commissioned'],
      intended_use_family: ['regulated_product'],
    })
    expect(area(result, 'authorised-representative')?.summary).toMatch(/Section B of Annex I/)
    expect(area(result, 'authorised-representative')?.milestone?.label).toMatch(/^Embedded/)
  })

  it('an EU-established provider is not shown the representative', () => {
    const result = run({
      ...base,
      organisation_establishment: 'eu_eea',
      ai_market_connection: ['placed_on_eu_market'],
      organisation_activity: ['built_or_commissioned'],
      intended_use_family: ['employment'],
    })
    expect(ids(result)).not.toContain('authorised-representative')
    expect(result.scope.explanation).not.toMatch(/outside the EU/)
  })

  it('UK firm with no EU connection: no obligation of any kind', () => {
    const result = run({ ...base, ai_market_connection: ['none'] })
    expect(result.scope.outcome).toBe('out_of_scope')
    expect(result.areas).toEqual([])
    expect(result.readiness).toEqual([])
    expect(result.focus).toBeNull()
    expect(result.diagnosticReason).toBeNull()
    expect(result.revisitIf.length).toBeGreaterThan(0)
    expect(result.scope.explanation).not.toMatch(/the system/)
  })

  it('names UK law only to a reader established in the UK', () => {
    expect(run({ ...base, ai_market_connection: ['none'] }).meaning).toMatch(/including UK law/)
    expect(run({ ...base, organisation_establishment: 'us', ai_market_connection: ['none'] }).meaning).not.toMatch(/UK/)
  })

  it('EU-established firm answering "none": uncertain, the conflict named, nothing owed', () => {
    const result = run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['none'] })
    expect(result.scope.outcome).toBe('scope_uncertain')
    expect(result.scope.explanation).toMatch(/do not sit together/)
    expect(result.confidence).toBe('low')
    expect(result.confidenceReasons[0]).toMatch(/contradict/)
    expect(result.areas.some((item) => item.kind === 'duty')).toBe(false)
    expect(result.focus?.target).toBe('verdict')
  })

  it('large organisations get no size relief', () => {
    expect(ids(run({ ...base, employee_band: '750_plus' }))).not.toContain('size-relief')
  })

  it('a small mid-cap is quoted Article 99(6a), not the SME paragraph', () => {
    const relief = area(run({ ...base, employee_band: '250_749' }), 'size-relief')
    expect(relief?.extracts).toEqual(['article-99-6a'])
    expect(relief?.kind).toBe('concession')
    expect(relief?.summary).not.toMatch(/\*/)
  })
})

describe('"not sure" is a finding, never a "no"', () => {
  it('every unknown answer produces exactly one Things-to-find-out item', () => {
    for (const question of EXPOSURE_QUESTIONS) {
      const result = run({ ...base, [question.id]: unknown })
      expect(findOutIds(result)).toEqual([question.id])
    }
  })

  it('an unknown on any decisive answer caps confidence at low and says so', () => {
    for (const id of DECISIVE_IDS) {
      const result = run({ ...base, [id]: unknown })
      expect(result.confidence).toBe('low')
      expect(result.findOut[0].effect.startsWith('Confidence is low')).toBe(true)
      // Under "Confidence: Low" the reasons do not repeat the label.
      expect(result.confidenceReasons.some((reason) => reason.startsWith('Confidence is'))).toBe(false)
      expect(result.focus?.target).toBe('find-out')
    }
  })

  it('an unknown use caps confidence at medium and names the areas it could hide', () => {
    const result = run({ ...base, intended_use_family: unknown })
    expect(result.confidence).toBe('medium')
    expect(result.findOut[0].effect).toMatch(/does not mean they do not apply/)
  })

  it('an unknown EU connection keeps every duty conditional', () => {
    const result = run({ ...base, ai_market_connection: unknown })
    expect(result.scope.outcome).toBe('scope_uncertain')
    expect(result.areas.some((item) => item.kind === 'duty')).toBe(false)
    expect(area(result, 'ai-literacy')?.summary).toMatch(/^If the Act reaches you as a provider or deployer of an AI system, Article 4 applies to you\./)
  })

  it('EU-established with an unknown connection: likely, but still nothing shown as owed', () => {
    const result = run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: unknown })
    expect(result.scope.outcome).toBe('likely_in_scope')
    expect(result.areas.some((item) => item.kind === 'duty')).toBe(false)
    expect(result.findOut[0].effect).toMatch(/likely applies/)
  })

  it('"none" with an unknown establishment is held at "cannot yet tell", never out of scope', () => {
    const result = run({ ...base, organisation_establishment: unknown, ai_market_connection: ['none'] })
    expect(result.scope.outcome).toBe('scope_uncertain')
    expect(result.scope.explanation).toMatch(/not sure where your organisation is established/)
    expect(result.areas.length).toBeGreaterThan(0)
  })

  it('keeps the representative in view when establishment, activity or use is unknown rather than no', () => {
    const provider = {
      ...base,
      organisation_establishment: 'us',
      organisation_activity: ['supplied_under_own_name'],
      intended_use_family: ['employment'],
    }
    for (const id of ['organisation_establishment', 'organisation_activity', 'intended_use_family']) {
      const rep = area(run({ ...provider, [id]: unknown }), 'authorised-representative')
      expect(rep?.kind).toBe('conditional')
      expect(rep?.becauseOpen).toEqual([id])
      expect(rep?.summary).toMatch(/leave at least one of those facts open/)
    }
  })

  it('but drops it on a real "no": EU establishment, deployer only, or no flagged use', () => {
    const provider = {
      ...base,
      organisation_establishment: 'us',
      organisation_activity: ['supplied_under_own_name'],
      intended_use_family: ['employment'],
    }
    expect(ids(run({ ...provider, organisation_establishment: 'eu_eea' }))).not.toContain('authorised-representative')
    expect(ids(run({ ...provider, organisation_activity: ['used_internally_or_for_customers'] }))).not.toContain('authorised-representative')
    expect(ids(run({ ...provider, intended_use_family: ['chatbot_interaction'] }))).not.toContain('authorised-representative')
  })

  it('an unknown inventory or literacy answer is a thing to find out, not a "you told us no" step', () => {
    const result = run({ ...base, ai_inventory: unknown, ai_literacy_measures: unknown })
    expect(result.readiness.some((step) => /You told us/.test(step))).toBe(false)
    expect(findOutIds(result)).toEqual(['ai_inventory', 'ai_literacy_measures'])
    expect(result.diagnosticReason).toMatch(/^Knowing which AI systems you have is the first job/)
  })
})

describe('every templated sentence holds only when its data does', () => {
  it('readiness steps quote the answer they rest on', () => {
    expect(run({ ...base, ai_inventory: 'yes', ai_literacy_measures: 'yes' }).readiness).toEqual([])
    expect(run({ ...base, ai_inventory: 'partly', ai_literacy_measures: 'yes' }).readiness[0]).toMatch(/partial or out of date/)
    expect(run({ ...base, ai_inventory: 'no', ai_literacy_measures: 'yes' }).readiness[0]).toMatch(/do not keep a list/)
    expect(run({ ...base, ai_inventory: 'yes', ai_literacy_measures: 'partly' }).readiness[0]).toMatch(/only some staff/)
    expect(run({ ...base, ai_inventory: 'yes', ai_literacy_measures: 'no' }).readiness[0]).toMatch(/have not had training/)
  })

  it('"has applied since" is said only when the scope is settled, a provider or deployer, and the date has passed', () => {
    const literacyDate = milestone(pack, /literacy/i).date
    expect(run({ ...base, ai_inventory: 'yes' }).readiness[0]).toContain(`has applied since ${literacyDate}`)
    expect(run({ ...base, ai_inventory: 'yes', organisation_activity: ['distributed_or_resold'] }).readiness[0]).toMatch(
      /If the Act reaches you as a provider or deployer of an AI system, Article 4 on AI literacy already applies to you/,
    )
    const unsettled = run({ ...base, ai_inventory: 'yes', ai_market_connection: unknown }).readiness[0]
    expect(unsettled).not.toContain('has applied since')
    expect(unsettled).toMatch(/^You told us .* If the Act reaches you as a provider or deployer/)
    const beforeDate = evaluateExposure(answers({ ...base, ai_inventory: 'yes' }), pack, new Date('2025-01-01T00:00:00Z'))
    expect(beforeDate.readiness[0]).not.toContain('has applied since')
  })

  it('the transparency summary describes only the kinds of system ticked', () => {
    const chat = area(run(base), 'transparency')
    expect(chat?.summary).toMatch(/interact directly/)
    expect(chat?.summary).not.toMatch(/machine-readable/)
    expect(chat?.extracts).toEqual(['article-50-1'])
    const gen = area(run({ ...base, intended_use_family: ['synthetic_content'] }), 'transparency')
    expect(gen?.summary).toMatch(/machine-readable/)
    expect(gen?.summary).not.toMatch(/interact directly/)
    expect(gen?.extracts).toEqual(['article-50-2'])
  })

  it('the "outside the EU" sentence appears only for an answered non-EU establishment', () => {
    expect(run(base).scope.explanation).toMatch(/outside the EU/)
    expect(run({ ...base, organisation_establishment: 'eu_eea' }).scope.explanation).not.toMatch(/outside the EU/)
  })

  it('the Diagnostic reason names the answer that triggered it', () => {
    expect(run({ ...base, ai_inventory: 'yes' }).diagnosticReason).toBeNull()
    expect(run({ ...base, ai_inventory: 'yes', system_count: '6_20' }).diagnosticReason).toMatch(/between 6 and 20/)
    expect(run({ ...base, ai_inventory: 'yes', system_count: '20_plus' }).diagnosticReason).toMatch(/more than 20/)
    expect(run({ ...base, ai_inventory: 'no' }).diagnosticReason).toMatch(/do not keep a list/)
  })

  it('a "start here" on literacy says what the reader told us', () => {
    expect(run({ ...base, ai_literacy_measures: 'partly' }).focus?.reason).toMatch(/only partly in place/)
    expect(run({ ...base, ai_literacy_measures: 'no' }).focus?.reason).toMatch(/not in place/)
    expect(run({ ...base, ai_literacy_measures: 'yes', intended_use_family: ['something_else'] }).focus?.reason).toMatch(
      /applies whatever your systems do/,
    )
  })
})

describe('invariants across every combination of answers', () => {
  // Every option of every question, plus "not sure", one question varied at a
  // time across a spread of bases. Multi-selects also try a pair.
  const variants = (questionId: string): Array<AnswerValue | { state: AnswerState }> => {
    const question = EXPOSURE_QUESTIONS.find((item) => item.id === questionId)!
    const values = (question.options ?? []).map((option) => option.value)
    const multi = question.answerType === 'multi'
    const out: Array<AnswerValue | { state: AnswerState }> = values.map((value) => (multi ? [value] : value))
    if (multi && values.length > 2) out.push(values.slice(0, 2).filter((value) => value !== 'none'))
    out.push(unknown)
    if (question.allowNotApplicable) out.push({ state: 'declined' })
    return out
  }
  const bases: Spec[] = [
    base,
    { ...base, organisation_establishment: 'us', organisation_activity: ['built_or_commissioned'], intended_use_family: ['biometrics', 'gpai_model'] },
    { ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['used_from_eu_establishment'], intended_use_family: ['regulated_product', 'synthetic_content'] },
    { ...base, ai_market_connection: ['none'] },
    { ...base, organisation_establishment: unknown, ai_market_connection: unknown, organisation_activity: unknown, intended_use_family: unknown },
  ]
  const scenarios: Spec[] = bases.flatMap((spec) =>
    EXPOSURE_QUESTIONS.flatMap((question) => variants(question.id).map((value) => ({ ...spec, [question.id]: value }))),
  )
  const results = scenarios.map((spec) => ({ spec, result: run(spec), record: answers(spec) }))

  it('covers a real spread of cases', () => {
    expect(results.length).toBeGreaterThan(200)
    expect(new Set(results.map(({ result }) => result.scope.outcome)).size).toBe(4)
  })

  it('no number is ever turned into a score', () => {
    for (const { result } of results) {
      for (const text of strings(result)) expect(text).not.toMatch(/%|\bscore\b|\/ ?100/i)
    }
  })

  it('out of scope carries nothing owed and nothing to do', () => {
    for (const { result } of results.filter(({ result }) => result.scope.outcome === 'out_of_scope')) {
      expect(result.areas).toEqual([])
      expect(result.readiness).toEqual([])
      expect(result.focus).toBeNull()
    }
  })

  it('only a settled scope shows a flat duty', () => {
    for (const { result } of results) {
      if (result.scope.outcome !== 'in_scope') expect(result.areas.some((item) => item.kind === 'duty')).toBe(false)
    }
  })

  it('a "not sure" on a decisive answer never leaves confidence high', () => {
    for (const { result, record } of results) {
      if (DECISIVE_IDS.some((id) => record[id]?.state === 'unknown')) expect(result.confidence).toBe('low')
      expect(result.confidenceReasons.length).toBeGreaterThan(0)
    }
  })

  it('every unknown answer is listed to find out, and nothing else is', () => {
    for (const { result, record } of results) {
      const unknowns = EXPOSURE_QUESTIONS.map((question) => question.id).filter((id) => record[id]?.state === 'unknown')
      expect(findOutIds(result)).toEqual(unknowns)
    }
  })

  it('"You told us" sentences appear only beside the answer they quote', () => {
    for (const { result, record } of results) {
      const said = (id: string) => (record[id]?.state === 'answered' ? record[id].value : undefined)
      for (const text of [...result.readiness, result.focus?.reason ?? '', result.diagnosticReason ?? '']) {
        if (/do not keep a list/.test(text)) expect(said('ai_inventory')).toBe('no')
        if (/partial or out of date/.test(text)) expect(said('ai_inventory')).toBe('partly')
        if (/have not had training|not in place/.test(text)) expect(said('ai_literacy_measures')).toBe('no')
        if (/only some staff|only partly in place/.test(text)) expect(said('ai_literacy_measures')).toBe('partly')
        if (/more than 20 AI systems/.test(text)) expect(said('system_count')).toBe('20_plus')
        if (/between 6 and 20/.test(text)) expect(said('system_count')).toBe('6_20')
      }
      for (const item of result.areas) {
        if (/You told us you use AI in at least one area/.test(item.summary)) expect(item.checkFamilies?.length).toBeGreaterThan(0)
        if (/You told us you provide a general-purpose AI model/.test(item.summary)) {
          expect(said('intended_use_family')).toContain('gpai_model')
        }
      }
    }
  })

  it('a find-out item mentions the representative only when the representative is shown', () => {
    let mentioned = 0
    for (const { result } of results) {
      const says = result.findOut.some((item) => /authorised representative/.test(item.effect))
      if (says) {
        mentioned += 1
        expect(ids(result)).toContain('authorised-representative')
      }
      const rep = area(result, 'authorised-representative')
      if (rep?.becauseOpen?.some((id) => DECISIVE_IDS.includes(id) && result.findOut.some((item) => item.questionId === id))) expect(says).toBe(true)
    }
    expect(mentioned).toBeGreaterThan(0)
  })

  it('the focus always points at something on the page, with a reason', () => {
    for (const { result } of results) {
      if (!result.focus) continue
      const targets = ['find-out', 'verdict', ...result.areas.map((item) => item.id)]
      expect(targets).toContain(result.focus.target)
      if (result.focus.target === 'find-out') expect(result.findOut.length).toBeGreaterThan(0)
      expect(result.focus.reason.length).toBeGreaterThan(10)
    }
  })

  it('size relief is never a duty, and a signal never claims to be one', () => {
    for (const { result } of results) {
      expect(area(result, 'size-relief')?.kind ?? 'concession').toBe('concession')
      expect(area(result, 'possible-high-risk')?.kind ?? 'signal').toBe('signal')
      expect(area(result, 'authorised-representative')?.kind ?? 'conditional').toBe('conditional')
    }
  })

  it('every dated area resolves to a milestone in the pack, and every extract exists', () => {
    for (const { result } of results) {
      for (const item of result.areas) {
        if (item.milestone) expect(pack.timeline).toContain(item.milestone)
        for (const id of item.extracts ?? []) expect(EXTRACTS[id]).toBeDefined()
      }
    }
  })

  it('every date a string states is a pack timeline date or the pack consolidation date', () => {
    // The timeline's dates, plus the consolidation date the literacy card names (from the manifest).
    const packDates = new Set([...pack.timeline.map((entry) => entry.date), packDateInWords(pack.manifest.corpusCutOff)])
    for (const { result } of results) {
      for (const text of strings(result)) {
        for (const date of text.match(/\b\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/g) ?? []) {
          expect(packDates.has(date)).toBe(true)
        }
      }
    }
  })

  it('sends only the coarse verdict to analytics', () => {
    for (const { result } of results) {
      expect(['in-scope', 'likely-in-scope', 'uncertain', 'out-of-scope']).toContain(VERDICT_EVENT[result.scope.outcome])
    }
  })
})

describe('16 Nov 2026 fact-check fixes', () => {
  it('W1: importing into the EU contradicts "none of these" and never gives "does not apply"', () => {
    const result = run({ ...base, ai_market_connection: ['none'], organisation_activity: ['imported_into_eu'] })
    expect(result.scope.outcome).toBe('scope_uncertain')
    expect(result.confidence).toBe('low')
    expect(result.scope.explanation).toMatch(/^You said you import an AI system into the EU/)
  })

  it('W1: so does distributing or reselling', () => {
    const result = run({ ...base, ai_market_connection: ['none'], organisation_activity: ['distributed_or_resold'] })
    expect(result.scope.outcome).toBe('scope_uncertain')
    expect(result.scope.explanation).toMatch(/distribute or resell/)
  })

  it('W1: the out-of-scope triggers include importing, distributing or reselling', () => {
    expect(run({ ...base, ai_market_connection: ['none'] }).revisitIf).toContain(
      'You, or a customer or reseller, start importing, distributing or reselling one of your AI systems or models in the EU.',
    )
  })

  it('W2: "more than one of these" with "none of these" is held at "cannot yet tell"', () => {
    const result = run({ ...base, organisation_establishment: 'multiple', ai_market_connection: ['none'] })
    expect(result.scope.outcome).toBe('scope_uncertain')
    expect(result.scope.explanation).toMatch(/established in more than one place/)
    expect(result.focus?.target).toBe('verdict')
  })

  it('W3: literacy is owed only when a provider or deployer activity was ticked', () => {
    expect(area(run({ ...base, organisation_activity: unknown }), 'ai-literacy')?.kind).toBe('conditional')
    const distributor = run({ ...base, organisation_activity: ['distributed_or_resold'] })
    expect(area(distributor, 'ai-literacy')?.kind).toBe('conditional')
    expect(area(distributor, 'ai-literacy')?.summary).toMatch(/^If the Act reaches you as a provider or deployer of an AI system, Article 4 applies to you\./)
    expect(distributor.focus?.reason ?? '').not.toMatch(/the one duty here/)
  })

  it('A3: the literacy card dates the quoted wording to the consolidated text', () => {
    expect(area(run(base), 'ai-literacy')?.summary).toContain(
      `The words quoted are Article 4 as it reads in the consolidated text of ${packDateInWords(pack.manifest.corpusCutOff)}`,
    )
  })

  it('W4: a group in several places is not told it is established outside the EU', () => {
    const group = run({
      ...base,
      organisation_establishment: 'multiple',
      ai_market_connection: ['placed_on_eu_market'],
      organisation_activity: ['supplied_under_own_name'],
      intended_use_family: ['employment', 'regulated_product'],
    })
    expect(group.scope.explanation).not.toMatch(/outside the EU/)
    expect(area(group, 'authorised-representative')?.becauseOpen).toEqual(['organisation_establishment'])
    for (const establishment of OUTSIDE_EU) {
      expect(run({ ...base, organisation_establishment: establishment }).scope.explanation).toMatch(/outside the EU does not change that/)
    }
  })

  it('W6: transparency is not the start-here for a chatbot user who provides nothing', () => {
    const result = run({ ...base, ai_literacy_measures: 'yes' })
    expect(result.focus?.target).not.toBe('transparency')
    const provider = run({ ...base, ai_literacy_measures: 'yes', organisation_activity: ['supplied_under_own_name'] })
    expect(provider.focus?.target).toBe('transparency')
    expect(provider.focus?.reason).toMatch(/Check whether they fall to you as provider or as deployer\.$/)
  })

  it('W8: application dates are "has applied since", never "in force"', () => {
    for (const item of run({ ...base, intended_use_family: ['employment', 'synthetic_content', 'gpai_model'] }).areas) {
      expect(milestoneLine(item) ?? '').not.toMatch(/in force/i)
    }
    expect(milestoneLine(area(run(base), 'ai-literacy')!)).toMatch(/^Has applied since /)
  })

  it('A6: a reader outside the EU is not labelled "Importer"', () => {
    const result = run({ ...base, organisation_activity: ['imported_into_eu'] })
    expect(result.roles).not.toContain('Importer')
    expect(result.roles[0]).toMatch(/Article 3\(6\)/)
    expect(run({ ...base, organisation_establishment: 'eu_eea', organisation_activity: ['imported_into_eu'] }).roles).toContain('Importer')
  })
})

// ---------------------------------------------------------------------------
// Sweeps rebuilt after fact-check r2. Each was run against the engine at
// fe51d989 and failed there (R2-1, R2-2, R2-5) before the fix made it pass.
// ---------------------------------------------------------------------------

type Value = AnswerValue | { state: AnswerState }
const subsets = <T,>(items: T[]): T[][] => items.reduce<T[][]>((all, item) => all.concat(all.map((set) => [...set, item])), [[]])
const optionValues = (id: string) => EXPOSURE_QUESTIONS.find((q) => q.id === id)!.options!.map((o) => o.value)
const POSITIVE = ['placed_on_eu_market', 'put_into_service_eu', 'output_used_in_eu', 'used_from_eu_establishment']
const ESTABLISHMENTS: Value[] = [...optionValues('organisation_establishment'), unknown]
const CONNECTIONS: Value[] = [['none'], unknown, ...subsets(POSITIVE).filter((set) => set.length > 0)]
const ACTIVITIES: Value[] = [unknown, ...subsets(optionValues('organisation_activity')).filter((set) => set.length > 0)]
const USES: Value[] = [['something_else'], ['gpai_model'], ['regulated_product'], ['chatbot_interaction'], unknown]
const isUnknown = (value: Value) => typeof value === 'object' && value !== null && !Array.isArray(value) && 'state' in value
const asList = (value: Value) => (Array.isArray(value) ? (value as string[]) : [])

/** Independent statement of Article 2(1) reach for providers and deployers, written apart from the engine's. */
function reachesProviderOrDeployer(establishment: Value, connection: Value, activity: Value): boolean {
  const connected = asList(connection).filter((value) => value !== 'none')
  const acts = asList(activity)
  const provider = acts.includes('built_or_commissioned') || acts.includes('supplied_under_own_name')
  const deployer = acts.includes('used_internally_or_for_customers') || acts.includes('integrated_or_configured')
  return (
    (provider && connected.length > 0) ||
    (deployer && (establishment === 'eu_eea' || connected.some((value) => value !== 'placed_on_eu_market')))
  )
}

describe('"does not apply" only when no answer implies or leaves open an EU link (38,080 combinations)', () => {
  it('across every establishment, connection set, activity set and use answer', () => {
    let runs = 0
    let outOfScope = 0
    const bad: unknown[] = []
    const connectionQuestion = EXPOSURE_QUESTIONS.find((q) => q.id === 'ai_market_connection')!
    for (const organisation_establishment of ESTABLISHMENTS) {
      for (const ai_market_connection of CONNECTIONS) {
        for (const organisation_activity of ACTIVITIES) {
          for (const intended_use_family of USES) {
            runs += 1
            const result = run({ ...base, organisation_establishment, ai_market_connection, organisation_activity, intended_use_family })
            if (result.scope.outcome !== 'out_of_scope') continue
            outOfScope += 1
            const acts = asList(organisation_activity)
            const allowed =
              asList(ai_market_connection).length === 1 &&
              asList(ai_market_connection)[0] === 'none' &&
              typeof organisation_establishment === 'string' &&
              OUTSIDE_EU.includes(organisation_establishment) &&
              !isUnknown(organisation_activity) &&
              !acts.includes('imported_into_eu') &&
              !acts.includes('distributed_or_resold')
            // A provider of a GPAI model (or "not sure" what the AI is) can be out of
            // scope only because the connection question asked about models too (R2-2).
            const modelsCovered =
              /general-purpose AI models/.test(result.scope.explanation) && /general-purpose AI models/.test(connectionQuestion.prompt)
            if (!allowed || !modelsCovered) {
              bad.push({ organisation_establishment, ai_market_connection, organisation_activity, intended_use_family })
            }
          }
        }
      }
    }
    expect(runs).toBe(38080)
    expect(outOfScope).toBeGreaterThan(0)
    expect(bad.slice(0, 5)).toEqual([])
  })
})

describe('"not sure" is never firmer than a concrete answer in the same slot', () => {
  const rank = { scope_uncertain: 0, likely_in_scope: 1, in_scope: 2, out_of_scope: 2 } as const
  const confidenceRank = { low: 0, medium: 1, high: 2 } as const
  const slots: Array<[string, Value[]]> = [
    ['organisation_establishment', optionValues('organisation_establishment')],
    ['ai_market_connection', [['none'], ...POSITIVE.map((value) => [value])]],
    ['organisation_activity', optionValues('organisation_activity').map((value) => [value])],
    ['intended_use_family', optionValues('intended_use_family').map((value) => [value])],
    ['employee_band', optionValues('employee_band')],
    ['system_count', optionValues('system_count')],
    ['ai_inventory', optionValues('ai_inventory')],
    ['ai_literacy_measures', optionValues('ai_literacy_measures')],
  ]
  const bases: Spec[] = []
  for (const organisation_establishment of optionValues('organisation_establishment')) {
    for (const ai_market_connection of [['none'], ...POSITIVE.map((value) => [value])]) {
      for (const organisation_activity of optionValues('organisation_activity').map((value) => [value])) {
        for (const intended_use_family of [['something_else'], ['gpai_model'], ['employment']]) {
          bases.push({ ...base, organisation_establishment, ai_market_connection, organisation_activity, intended_use_family })
        }
      }
    }
  }

  it('across every base and every slot: verdict no firmer, opposite verdict never, confidence no higher', () => {
    const bad: unknown[] = []
    let checks = 0
    for (const spec of bases) {
      for (const [id, concretes] of slots) {
        const withUnknown = run({ ...spec, [id]: unknown })
        for (const concrete of concretes) {
          checks += 1
          // The one named exception: EU-established + "None of these" cannot both be true
          // (an EU establishment using AI is itself a connection), so that concrete pair
          // yields "cannot yet tell" as a contradiction, not as a firmer reading. "Not sure"
          // there gives "likely" on the establishment alone (Art 2(1)(b)), which round 1 and
          // round 2 of the fact-check verified. Any other case fails.
          if (id === 'ai_market_connection' && spec.organisation_establishment === 'eu_eea' && Array.isArray(concrete) && concrete[0] === 'none') continue
          const withConcrete = run({ ...spec, [id]: concrete })
          const u = withUnknown.scope.outcome
          const c = withConcrete.scope.outcome
          const firmer = rank[u] > rank[c] || (rank[u] === 2 && rank[c] === 2 && u !== c)
          const surer = confidenceRank[withUnknown.confidence] > confidenceRank[withConcrete.confidence]
          if (firmer || surer) bad.push({ id, concrete, spec: { ...spec, [id]: 'varied' }, unknownGives: u, concreteGives: c })
        }
      }
    }
    expect(checks).toBeGreaterThan(25000)
    expect(bad.slice(0, 5)).toEqual([])
  })
})

describe('every flat duty requires that the Act reaches the reader in a role the cited article binds', () => {
  // Article 4 binds providers and deployers; the Act reaches them per Article 2(1).
  const BINDS: Record<string, (e: Value, c: Value, a: Value) => boolean> = { '4': reachesProviderOrDeployer }
  it('across every establishment, connection set (including "placed on the EU market" alone) and activity set', () => {
    const bad: unknown[] = []
    let duties = 0
    for (const organisation_establishment of ESTABLISHMENTS) {
      for (const ai_market_connection of CONNECTIONS) {
        for (const organisation_activity of ACTIVITIES) {
          const result = run({ ...base, organisation_establishment, ai_market_connection, organisation_activity })
          for (const item of result.areas.filter((a) => a.kind === 'duty')) {
            duties += 1
            const binds = BINDS[item.article ?? '']
            if (!binds || result.scope.outcome !== 'in_scope' || !binds(organisation_establishment, ai_market_connection, organisation_activity)) {
              bad.push({ area: item.id, organisation_establishment, ai_market_connection, organisation_activity })
            }
          }
          // The literacy find-out and first-step lines follow the same predicate.
          const literacyDuty = result.areas.some((a) => a.id === 'ai-literacy' && a.kind === 'duty')
          if (result.readiness.some((step) => /Article 4 on AI literacy has applied since/.test(step)) && !literacyDuty) {
            bad.push({ readiness: 'flat literacy line without a flat duty', organisation_establishment, ai_market_connection, organisation_activity })
          }
        }
      }
    }
    expect(duties).toBeGreaterThan(0)
    expect(bad.slice(0, 5)).toEqual([])
  })

  it('the literacy find-out says "applies to you either way" only when the Act reaches a provider or deployer', () => {
    for (const ai_market_connection of [['placed_on_eu_market'], ['output_used_in_eu']]) {
      for (const organisation_activity of optionValues('organisation_activity').map((value) => [value])) {
        const result = run({ ...base, ai_market_connection, organisation_activity, ai_literacy_measures: unknown })
        const says = result.findOut.some((item) => /applies to you either way/.test(item.effect))
        expect(says).toBe(reachesProviderOrDeployer('uk', ai_market_connection, organisation_activity))
      }
    }
  })
})

describe('the pack', () => {
  it('the engine reads the pinned pack', () => {
    expect(RULE_PACK.manifest.version).toBe('2026-11-16')
  })

  it('every label the engine looks for exists', () => {
    for (const pattern of [/^Prohibited practices/i, /literacy/i, /^New prohibitions/i, /Article 50/, /^GPAI/, /^Standalone high-risk/i, /^Embedded/i]) {
      expect(() => milestone(pack, pattern)).not.toThrow()
    }
  })

  it('parsePackDate reads every date the pack carries, and nothing else', () => {
    for (const entry of pack.timeline) expect(() => parsePackDate(entry.date)).not.toThrow()
    expect(parsePackDate('2 December 2026').toISOString()).toBe('2026-12-02T00:00:00.000Z')
    expect(() => parsePackDate('2026-12-02')).toThrow()
  })
})
