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
// Sweeps rebuilt after fact-checks r2 and r3. Each new or changed sweep was run
// against the engine at d6b74d4d and failed there (R3-1, R3-3, R3-4) before the
// fix made it pass; the r2 sweeps also failed at fe51d989 (R2-1, R2-2, R2-5).
// ---------------------------------------------------------------------------

type Value = AnswerValue | { state: AnswerState }
const subsets = <T,>(items: T[]): T[][] => items.reduce<T[][]>((all, item) => all.concat(all.map((set) => [...set, item])), [[]])
const optionValues = (id: string) => EXPOSURE_QUESTIONS.find((q) => q.id === id)!.options!.map((o) => o.value)
const POSITIVE = ['placed_on_eu_market', 'put_into_service_eu', 'output_used_in_eu', 'used_from_eu_establishment']
const ESTABLISHMENTS: Value[] = [...optionValues('organisation_establishment'), unknown]
// 19: None, "not sure", the 15 positive sets, and None plus a positive (the UI forbids it; kept to match the checker)
const CONNECTIONS: Value[] = [['none'], unknown, ...subsets(POSITIVE).filter((set) => set.length > 0), ['none', 'placed_on_eu_market'], ['none', 'output_used_in_eu']]
const ACTIVITIES: Value[] = [unknown, ...subsets(optionValues('organisation_activity')).filter((set) => set.length > 0)]
// 18: "not sure", every single use, and two combinations
const USES_WIDE: Value[] = [unknown, ...optionValues('intended_use_family').map((value) => [value]), ['employment', 'gpai_model'], ['regulated_product', 'synthetic_content']]
const isUnknown = (value: Value) => typeof value === 'object' && value !== null && !Array.isArray(value) && 'state' in value
const asList = (value: Value) => (Array.isArray(value) ? (value as string[]) : [])

/*
 * Independent statements of the law, written from the Act's structure and not
 * from the engine's code. The flat-duty rule enumerates every way the reader's
 * connections could belong to its ticked activities (the answers do not say
 * which system each connection belongs to) and requires Article 4's addressees
 * to be reached in all of them.
 */
const ACT = {
  // Article 3(3): builds, or has built, and places on the market or puts into service under its own name.
  provider: new Set(['built_or_commissioned', 'supplied_under_own_name']),
  // Article 3(4): uses an AI system under its authority.
  deployer: new Set(['used_internally_or_for_customers', 'integrated_or_configured']),
  // Article 2(1)(a), (c): a provider's system placed on the market, put into service, or whose output is used, in the Union.
  reachesProvider: new Set(['placed_on_eu_market', 'put_into_service_eu', 'output_used_in_eu', 'used_from_eu_establishment']),
  // Article 2(1)(b), (c): a deployer located in the Union (its own use from an EU establishment), or whose
  // system's output is used there. Placing on the market (Art 3(9)) and putting into service (Art 3(11), "the
  // supply of an AI system for first use") are the supplier's acts, so neither reaches a deployer (r4, R4-1).
  reachesDeployer: new Set(['output_used_in_eu', 'used_from_eu_establishment']),
}

function article4ReachesInEveryAssignment(establishment: Value, connection: Value, activity: Value): boolean {
  const acts = asList(activity)
  if (establishment === 'eu_eea' && acts.some((a) => ACT.deployer.has(a))) return true // Article 2(1)(b)
  const connected = asList(connection).filter((c) => c !== 'none')
  if (!acts.length || !connected.length) return false
  // Every assignment of a ticked activity to each connection.
  let assignments: string[][] = [[]]
  for (let i = 0; i < connected.length; i++) assignments = assignments.flatMap((prefix) => acts.map((a) => [...prefix, a]))
  return assignments.every((assigned) =>
    connected.some((c, i) => (ACT.provider.has(assigned[i]) && ACT.reachesProvider.has(c)) || (ACT.deployer.has(assigned[i]) && ACT.reachesDeployer.has(c))),
  )
}

/**
 * Does the Act reach the reader, whichever thing each connection answer is about? Written
 * from Article 2(1) and 3, not from the engine. The "things" are the ticked activities and,
 * if ticked, a general-purpose AI model the reader provides. A connection about a model can
 * only be its placing on the market (Art 2(1)(a); putting into service and output use are
 * defined for AI systems only, Art 3(11), 2(1)(c)). Two answers pin themselves to the reader
 * whatever the assignment: "We use at least one from an EU establishment" is its own use in
 * the Union (Art 2(1)(b)), and "We import at least one into the EU" is its own placing (Art
 * 3(6)). An EU-established deployer is reached by Art 2(1)(b). A distributor is never reached
 * by a connection answer: Art 3(7) needs its own making available, which none of them shows.
 */
function bringsWithinInEveryAssignment(establishment: Value, connection: Value, activity: Value, use: Value): boolean {
  const acts = asList(activity)
  const connected = asList(connection).filter((c) => c !== 'none')
  if (connected.includes('used_from_eu_establishment')) return true
  if (acts.includes('imported_into_eu')) return true
  if (establishment === 'eu_eea' && acts.some((a) => ACT.deployer.has(a))) return true
  const things = [...acts, ...(asList(use).includes('gpai_model') ? ['a general-purpose AI model'] : [])]
  if (!things.length || !connected.length) return false
  const reached = (thing: string, c: string) =>
    thing === 'a general-purpose AI model'
      ? c === 'placed_on_eu_market'
      : (ACT.provider.has(thing) && ACT.reachesProvider.has(c)) || (ACT.deployer.has(thing) && ACT.reachesDeployer.has(c))
  const possible = (thing: string, c: string) => thing !== 'a general-purpose AI model' || c === 'placed_on_eu_market'
  let assignments: string[][] = [[]]
  for (const c of connected) assignments = assignments.flatMap((prefix) => things.filter((t) => possible(t, c)).map((t) => [...prefix, t]))
  // No possible assignment means a connection fits nothing ticked: nothing shows reach.
  if (!assignments.length) return false
  return assignments.every((assigned) => connected.some((c, i) => reached(assigned[i], c)))
}

describe('scope in both directions (153,216 combinations)', () => {
  it('"does not apply" only when nothing implies or leaves open an EU link; "applies" only when the reader\'s own act or establishment brings it within Art 2(1); High only with no open fact', () => {
    let runs = 0
    const counts = { out: 0, inScope: 0, likely: 0 }
    const bad: unknown[] = []
    const connectionQuestion = EXPOSURE_QUESTIONS.find((q) => q.id === 'ai_market_connection')!
    for (const organisation_establishment of ESTABLISHMENTS) {
      for (const ai_market_connection of CONNECTIONS) {
        for (const organisation_activity of ACTIVITIES) {
          for (const intended_use_family of USES_WIDE) {
            runs += 1
            const result = run({ ...base, organisation_establishment, ai_market_connection, organisation_activity, intended_use_family })
            const acts = asList(organisation_activity)
            const where = { organisation_establishment, ai_market_connection, organisation_activity, intended_use_family, outcome: result.scope.outcome, confidence: result.confidence }
            if (result.scope.outcome === 'out_of_scope') {
              counts.out += 1
              const allowed =
                asList(ai_market_connection).length === 1 &&
                asList(ai_market_connection)[0] === 'none' &&
                typeof organisation_establishment === 'string' &&
                OUTSIDE_EU.includes(organisation_establishment) &&
                !isUnknown(organisation_activity) &&
                !acts.includes('imported_into_eu') &&
                !acts.includes('distributed_or_resold')
              const modelsCovered =
                /general-purpose AI models/.test(result.scope.explanation) && /general-purpose AI models/.test(connectionQuestion.prompt)
              if (!allowed || !modelsCovered) bad.push(where)
            }
            if (result.scope.outcome === 'in_scope') {
              counts.inScope += 1
              if (!bringsWithinInEveryAssignment(organisation_establishment, ai_market_connection, organisation_activity, intended_use_family)) bad.push(where)
            }
            if (result.scope.outcome === 'likely_in_scope') {
              counts.likely += 1
              // "Likely" rests on Art 2(1)(b): EU-established, a deployer activity ticked, connection not settled.
              if (!(organisation_establishment === 'eu_eea' && acts.some((a) => ACT.deployer.has(a)) && isUnknown(ai_market_connection))) bad.push(where)
            }
            // Wording on "cannot yet tell" (R4-2, R4-3): a contradiction is claimed only where the
            // explanation names one, and "leave open whether you have a connection" never sits beside
            // a ticked connection.
            const reasons = [...result.confidenceReasons, result.focus?.reason ?? '']
            if (reasons.some((r) => /contradict/.test(r)) && !/import|do not sit together/.test(result.scope.explanation)) bad.push({ ...where, why: 'contradiction not named' })
            if (reasons.some((r) => /leave open whether you have a connection/.test(r)) && asList(ai_market_connection).some((c) => c !== 'none')) bad.push({ ...where, why: 'leave open beside a ticked connection' })
            if (result.confidence === 'high') {
              const open = [organisation_establishment, ai_market_connection, organisation_activity, intended_use_family].some(isUnknown)
              if (open || result.scope.outcome === 'scope_uncertain') bad.push({ ...where, why: 'High with an open fact' })
            }
          }
        }
      }
    }
    expect(runs).toBe(153216)
    expect(counts.out).toBeGreaterThan(0)
    expect(counts.inScope).toBeGreaterThan(0)
    expect(counts.likely).toBeGreaterThan(0)
    expect(bad.slice(0, 5)).toEqual([])
  })
})

describe('"not sure" is never firmer than a concrete answer in the same slot', () => {
  const rank = { scope_uncertain: 0, likely_in_scope: 1, in_scope: 2, out_of_scope: 2 } as const
  const confidenceRank = { low: 0, medium: 1, high: 2 } as const
  const oneOrTwo = (values: string[]) => subsets(values).filter((set) => set.length === 1 || set.length === 2)
  const slots: Array<[string, Value[]]> = [
    ['organisation_establishment', optionValues('organisation_establishment')],
    ['ai_market_connection', oneOrTwo(optionValues('ai_market_connection'))],
    ['organisation_activity', oneOrTwo(optionValues('organisation_activity'))],
    ['intended_use_family', oneOrTwo(optionValues('intended_use_family'))],
    ['employee_band', optionValues('employee_band')],
    ['system_count', optionValues('system_count')],
    ['ai_inventory', optionValues('ai_inventory')],
    ['ai_literacy_measures', optionValues('ai_literacy_measures')],
  ]
  // 4,032 bases: 7 establishments × 6 connection answers × 8 activity answers × 6 uses × 2 literacy answers.
  const bases: Spec[] = []
  for (const organisation_establishment of ESTABLISHMENTS) {
    for (const ai_market_connection of [['none'], unknown, ...POSITIVE.map((value) => [value])] as Value[]) {
      for (const organisation_activity of [unknown, ...optionValues('organisation_activity').map((value) => [value]), ['distributed_or_resold', 'used_internally_or_for_customers']] as Value[]) {
        for (const intended_use_family of [unknown, ['something_else'], ['gpai_model'], ['employment'], ['regulated_product'], ['chatbot_interaction']] as Value[]) {
          for (const ai_literacy_measures of ['no', unknown] as Value[]) {
            bases.push({ ...base, organisation_establishment, ai_market_connection, organisation_activity, intended_use_family, ai_literacy_measures })
          }
        }
      }
    }
  }

  it('across every base and every slot: verdict no firmer, opposite verdict never, confidence no higher', () => {
    expect(bases).toHaveLength(4032)
    const bad: unknown[] = []
    let checks = 0
    let excepted = 0
    for (const spec of bases) {
      for (const [id, concretes] of slots) {
        const withUnknown = run({ ...spec, [id]: unknown })
        for (const concrete of concretes) {
          // The one named exception (ruled in fact-check r3, §4): EU-established, a deployer
          // activity ticked, "None of these". That pair cannot both be true, so it gives
          // "cannot yet tell"; "not sure" leaves Art 2(1)(b) standing and gives "likely".
          if (
            id === 'ai_market_connection' &&
            spec.organisation_establishment === 'eu_eea' &&
            asList(concrete as Value).length === 1 &&
            asList(concrete as Value)[0] === 'none' &&
            asList(spec.organisation_activity as Value).some((a) => ACT.deployer.has(a))
          ) {
            excepted += 1
            continue
          }
          checks += 1
          const withConcrete = run({ ...spec, [id]: concrete })
          const u = withUnknown.scope.outcome
          const c = withConcrete.scope.outcome
          const firmer = rank[u] > rank[c] || (rank[u] === 2 && rank[c] === 2 && u !== c)
          const surer = confidenceRank[withUnknown.confidence] > confidenceRank[withConcrete.confidence]
          if (firmer || surer) bad.push({ id, concrete, spec: { ...spec, [id]: 'varied' }, unknownGives: u, concreteGives: c })
        }
      }
    }
    expect(checks).toBeGreaterThan(400000)
    expect(excepted).toBeGreaterThan(0)
    expect(bad.slice(0, 5)).toEqual([])
  }, 120_000)
})

describe('every flat duty requires that the Act reaches the reader in a role the cited article binds', () => {
  const BINDS: Record<string, (e: Value, c: Value, a: Value) => boolean> = { '4': article4ReachesInEveryAssignment }
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
          const literacyDuty = result.areas.some((a) => a.id === 'ai-literacy' && a.kind === 'duty')
          if (result.readiness.some((step) => /Article 4 on AI literacy has applied since/.test(step)) && !literacyDuty) {
            bad.push({ readiness: 'flat literacy line without a flat duty', organisation_establishment, ai_market_connection, organisation_activity })
          }
          if (result.focus?.target === 'ai-literacy' && !literacyDuty) {
            bad.push({ focus: 'literacy start-here without a flat duty', organisation_establishment, ai_market_connection, organisation_activity })
          }
        }
      }
    }
    expect(duties).toBeGreaterThan(0)
    expect(bad.slice(0, 5)).toEqual([])
  })

  it('the literacy find-out says "applies to you either way" only when the Act reaches a provider or deployer', () => {
    for (const ai_market_connection of [['placed_on_eu_market'], ['output_used_in_eu'], ['placed_on_eu_market', 'output_used_in_eu']]) {
      for (const organisation_activity of subsets(optionValues('organisation_activity')).filter((set) => set.length > 0 && set.length <= 2)) {
        const result = run({ ...base, ai_market_connection, organisation_activity, ai_literacy_measures: unknown })
        const says = result.findOut.some((item) => /applies to you either way/.test(item.effect))
        expect(says).toBe(result.scope.outcome === 'in_scope' && article4ReachesInEveryAssignment('uk', ai_market_connection, organisation_activity))
      }
    }
  })
})

describe('readiness lines show only under their own answers (13,440 combinations)', () => {
  it('inventory, literacy, count and size lines', () => {
    const scopeBases: Spec[] = [
      base,
      { ...base, ai_market_connection: ['none'] },
      { ...base, ai_market_connection: unknown },
      { ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['used_from_eu_establishment'] },
      { ...base, ai_market_connection: ['placed_on_eu_market'] },
      { ...base, organisation_establishment: 'multiple', ai_market_connection: ['none'] },
    ]
    const activities: Value[] = [['used_internally_or_for_customers'], ['built_or_commissioned'], ['distributed_or_resold'], unknown]
    const bands: Value[] = [...optionValues('employee_band'), unknown, { state: 'declined' }]
    const counts: Value[] = [...optionValues('system_count'), unknown]
    const inventories: Value[] = [...optionValues('ai_inventory'), unknown]
    const literacies: Value[] = [...optionValues('ai_literacy_measures'), unknown]
    let n = 0
    const bad: unknown[] = []
    for (const spec of scopeBases) for (const organisation_activity of activities) for (const employee_band of bands) for (const system_count of counts) for (const ai_inventory of inventories) for (const ai_literacy_measures of literacies) {
      n += 1
      const result = run({ ...spec, organisation_activity, employee_band, system_count, ai_inventory, ai_literacy_measures })
      const lines = [...result.readiness, result.diagnosticReason ?? '', result.focus?.reason ?? '']
      const check = (re: RegExp, ok: boolean, what: string) => {
        if (lines.some((line) => re.test(line)) && !ok) bad.push({ what, spec: { ...spec, organisation_activity, employee_band, system_count, ai_inventory, ai_literacy_measures } })
      }
      check(/do not keep a list/, ai_inventory === 'no', 'inventory no')
      check(/partial or out of date/, ai_inventory === 'partly', 'inventory partly')
      check(/have not had training|not in place/, ai_literacy_measures === 'no', 'literacy no')
      check(/only some staff|only partly in place/, ai_literacy_measures === 'partly', 'literacy partly')
      check(/more than 20 AI systems/, system_count === '20_plus', 'count 20+')
      check(/between 6 and 20/, system_count === '6_20', 'count 6-20')
      check(/Knowing which AI systems you have is the first job/, isUnknown(ai_inventory) || isUnknown(system_count), 'diagnostic unknown')
      const size = result.areas.find((a) => a.id === 'size-relief')
      if (size && !['1_9', '10_49', '50_249', '250_749'].includes(String(employee_band))) bad.push({ what: 'size card without a small band', employee_band })
      if (size?.extracts?.includes('article-99-6a') && employee_band !== '250_749') bad.push({ what: 'SMC line without 250-749', employee_band })
      if (result.readiness.some((l) => /has applied since/.test(l)) && !result.areas.some((a) => a.id === 'ai-literacy' && a.kind === 'duty')) bad.push({ what: 'flat literacy line without duty' })
    }
    expect(n).toBe(13440)
    expect(bad.slice(0, 5)).toEqual([])
  })
})

describe('16 Nov 2026 fact-check r3 fixes', () => {
  it('R3-1: a non-EU deployer or distributor whose only connection is the supplier\'s placing is not told the Act applies', () => {
    const others = [...subsets(['used_internally_or_for_customers', 'integrated_or_configured', 'distributed_or_resold']).filter((set) => set.length > 0), unknown]
    for (const organisation_activity of others as Value[]) {
      const result = run({ ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity })
      expect(result.scope.outcome).toBe('scope_uncertain')
      expect(result.scope.explanation).toMatch(/^You told us at least one of your AI systems is placed on, or offered in, the EU market/)
    }
    // Round 4 (R4-1b): with "use" also ticked, "placed" may be the vendor's system, so a GPAI model no longer settles it.
    expect(run({ ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['used_internally_or_for_customers'], intended_use_family: ['gpai_model'] }).scope.outcome).toBe('scope_uncertain')
    expect(run({ ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['built_or_commissioned'], intended_use_family: ['gpai_model'] }).scope.outcome).toBe('in_scope')
    expect(run({ ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['built_or_commissioned'] }).scope.outcome).toBe('in_scope')
    expect(run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['used_internally_or_for_customers'] }).scope.outcome).toBe('in_scope')
  })

  it('R3-2: "contradict" only where the answers cannot both be true', () => {
    const builder = run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['none'], organisation_activity: ['built_or_commissioned'] })
    expect(builder.scope.explanation).toMatch(/^You said your organisation is established in the EU/)
    expect(builder.confidenceReasons[0]).toBe('Your answers leave open whether you have a connection to the EU.')
    const user = run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['none'], organisation_activity: ['used_internally_or_for_customers'] })
    expect(user.scope.explanation).toMatch(/^These two answers do not sit together/)
    expect(user.confidenceReasons[0]).toMatch(/contradict/)
  })

  it('R3-3: "likely" only for an EU-established deployer', () => {
    const builder = run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: unknown, organisation_activity: ['built_or_commissioned'] })
    expect(builder.scope.outcome).toBe('scope_uncertain')
    expect(builder.scope.explanation).toMatch(/You have not told us that you use or configure an AI system/)
    expect(builder.findOut[0].effect).toMatch(/verdict stays “cannot yet tell”/)
    const user = run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: unknown, organisation_activity: ['used_internally_or_for_customers'] })
    expect(user.scope.outcome).toBe('likely_in_scope')
    expect(user.findOut[0].effect).toMatch(/we say the Act likely applies/)
  })

  it('R3-4: flat literacy only when some connection reaches every ticked activity', () => {
    const reseller = run({ ...base, organisation_activity: ['distributed_or_resold', 'used_internally_or_for_customers'] })
    expect(area(reseller, 'ai-literacy')?.kind).toBe('conditional')
    const builderUser = run({ ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['built_or_commissioned', 'used_internally_or_for_customers'] })
    expect(area(builderUser, 'ai-literacy')?.kind).toBe('conditional')
    expect(area(run(base), 'ai-literacy')?.kind).toBe('duty')
  })

  it('R3-5: the Art 50(4) exception carries both of its conditions', () => {
    expect(area(run({ ...base, intended_use_family: ['synthetic_content'] }), 'transparency')?.summary).toContain(
      'unless it has had human review or editorial control and a natural or legal person holds editorial responsibility for its publication (Article 50(4))',
    )
  })

  it('R3-6: an out-of-scope page does not point at an areas section', () => {
    const result = run({ ...base, ai_market_connection: ['none'], intended_use_family: unknown })
    expect(result.scope.outcome).toBe('out_of_scope')
    expect(result.findOut[0].effect).toBe('Confidence is medium at most. It does not change this verdict, but it decides which areas would apply if your connection to the EU changes.')
  })

  it('R3-7: every date-bearing sentence follows the date it is run on, before and after each milestone', () => {
    const spec = { ...base, organisation_activity: ['supplied_under_own_name'], intended_use_family: ['synthetic_content', 'gpai_model'] }
    const at = (iso: string) => evaluateExposure(answers(spec), pack, new Date(`${iso}T12:00:00Z`))
    const text = (r: ExposureResult) => r.areas.map((a) => a.summary).join(' ')
    const before = (d: string) => new Date(parsePackDate(d).getTime() - 86_400_000).toISOString().slice(0, 10)
    const on = (d: string) => parsePackDate(d).toISOString().slice(0, 10)
    const marking = milestone(pack, /^New prohibitions/i).date
    expect(text(at(before(marking)))).toContain(`have until ${marking}`)
    expect(text(at(before(marking)))).toContain(`apply from ${marking}`)
    expect(text(at(on(marking)))).toContain(`had until ${marking}`)
    expect(text(at(on(marking)))).toContain(`have applied since ${marking}`)
    const gpaiDate = milestone(pack, /^GPAI/).date
    expect(text(at(before(gpaiDate)))).toContain(`models apply from ${gpaiDate}`)
    expect(text(at(on(gpaiDate)))).toContain(`models have applied since ${gpaiDate}`)
    const literacyDate = milestone(pack, /literacy/i).date
    expect(text(at(before(literacyDate)))).toContain(`An AI literacy duty applies from ${literacyDate}`)
    expect(text(at(on(literacyDate)))).toContain(`An AI literacy duty has applied since ${literacyDate}`)
    // Every milestone line flips on its own date.
    for (const entry of pack.timeline) {
      for (const item of at(before(entry.date)).areas.filter((a) => a.milestone === entry)) expect(milestoneLine(item)).toMatch(/^Applies from /)
      for (const item of at(on(entry.date)).areas.filter((a) => a.milestone === entry)) expect(milestoneLine(item)).toMatch(/^Has applied since /)
    }
  })
})

describe('16 Nov 2026 fact-check r4 fixes', () => {
  const Z: Record<string, Spec> = {
    Z1: { ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['built_or_commissioned', 'used_internally_or_for_customers'] },
    Z2: { ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['used_internally_or_for_customers'], intended_use_family: ['gpai_model', 'chatbot_interaction'] },
    Z3: { ...base, ai_market_connection: ['output_used_in_eu'], organisation_activity: ['distributed_or_resold'] },
    Z4: { ...base, ai_market_connection: ['placed_on_eu_market', 'output_used_in_eu'], organisation_activity: ['distributed_or_resold', 'used_internally_or_for_customers'] },
    Z5: { ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['distributed_or_resold'] },
    Z6: { ...base, ai_market_connection: ['output_used_in_eu'], organisation_activity: unknown },
    Z7: { ...base, ai_market_connection: ['put_into_service_eu'], organisation_activity: ['used_internally_or_for_customers'] },
    Z17: { ...base, ai_market_connection: ['output_used_in_eu'], organisation_activity: ['built_or_commissioned', 'distributed_or_resold'] },
    Z18: { ...base, organisation_establishment: 'canada', ai_market_connection: ['placed_on_eu_market', 'put_into_service_eu'] },
    Z22: { ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['placed_on_eu_market'], organisation_activity: unknown },
    Z23: { ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['built_or_commissioned', 'used_internally_or_for_customers'], ai_literacy_measures: unknown },
  }
  it('R4-1: "applies" only where a connection reaches the reader whichever system it is about', () => {
    for (const [name, spec] of Object.entries(Z)) {
      const result = run(spec)
      expect({ name, outcome: result.scope.outcome }).toEqual({ name, outcome: 'scope_uncertain' })
      expect(result.areas.some((a) => a.kind === 'duty')).toBe(false)
    }
    expect(run(Z.Z1).scope.explanation).toMatch(/^You told us at least one of your AI systems or general-purpose AI models has a connection to the EU, but your answers cover all of them together/)
    expect(run(Z.Z7).scope.explanation).toMatch(/your answers cover all of them together/)
  })

  it('R4-1: still in scope where the reader\'s own act or establishment shows it', () => {
    const keep: Record<string, Spec> = {
      P6: { ...base, organisation_establishment: 'us', ai_market_connection: ['output_used_in_eu'], organisation_activity: ['built_or_commissioned'], intended_use_family: ['employment'] },
      P9: { ...base, organisation_establishment: 'us', ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['built_or_commissioned'], intended_use_family: ['regulated_product', 'gpai_model', 'synthetic_content'] },
      X10: { ...base, ai_market_connection: ['used_from_eu_establishment'], organisation_activity: ['used_internally_or_for_customers'], intended_use_family: ['synthetic_content'] },
      Z8: { ...base, ai_market_connection: ['used_from_eu_establishment'], organisation_activity: ['distributed_or_resold'] },
      Z15: { ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['supplied_under_own_name', 'imported_into_eu'] },
      Z20: { ...base, organisation_establishment: 'other', ai_market_connection: ['output_used_in_eu'], organisation_activity: ['integrated_or_configured'], intended_use_family: ['gpai_model'] },
      base,
    }
    for (const [name, spec] of Object.entries(keep)) expect({ name, outcome: run(spec).scope.outcome }).toEqual({ name, outcome: 'in_scope' })
  })

  it('R4-1c: "put into service in the EU" alone never gives a deployer a flat literacy duty', () => {
    expect(area(run(Z.Z7), 'ai-literacy')?.kind).toBe('conditional')
    expect(area(run(Z.Z18), 'ai-literacy')?.kind).toBe('conditional')
  })

  it('R4-2: beside a ticked connection the reason is about reach, not about whether there is a connection', () => {
    const reach = 'Your answers do not show whether your connection to the EU brings your organisation within the Act.'
    for (const spec of [Z.Z1, Z.Z3, { ...base, ai_market_connection: ['placed_on_eu_market'], organisation_activity: ['distributed_or_resold'] }, { ...base, organisation_establishment: 'multiple', ai_market_connection: ['placed_on_eu_market'] }]) {
      const result = run(spec)
      expect(result.confidenceReasons[0]).toBe(reach)
      expect(result.focus?.reason).toBe(`${reach} Settle that before planning anything else.`)
    }
    expect(run({ ...base, organisation_establishment: 'multiple', ai_market_connection: ['none'] }).confidenceReasons[0]).toBe('Your answers leave open whether you have a connection to the EU.')
  })

  it('R4-3: where a contradiction is claimed for EU + None + import, the explanation names the import', () => {
    for (const organisation_activity of [['imported_into_eu'], ['imported_into_eu', 'distributed_or_resold'], ['imported_into_eu', 'built_or_commissioned']]) {
      const result = run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['none'], organisation_activity })
      expect(result.confidenceReasons[0]).toMatch(/contradict/)
      expect(result.scope.explanation).toMatch(/^You said you import an AI system into the EU/)
    }
    const user = run({ ...base, organisation_establishment: 'eu_eea', ai_market_connection: ['none'], organisation_activity: ['imported_into_eu', 'used_internally_or_for_customers'] })
    expect(user.scope.explanation).toMatch(/^These two answers do not sit together/)
  })

  it('R4-4: the establishment "not sure" effect states Art 2(1)(b) as law, not as a claim about the reader', () => {
    const result = run({ ...base, organisation_establishment: unknown, ai_market_connection: ['none'], organisation_activity: ['built_or_commissioned'] })
    expect(result.findOut[0].effect).toBe(
      'Confidence is low. An organisation established in the EU that uses an AI system is within the Act on that ground alone, so we could not conclude that it does not apply.',
    )
    expect(result.findOut[0].effect).not.toMatch(/An EU establishment would bring you within the Act/)
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
