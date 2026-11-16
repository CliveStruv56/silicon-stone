import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

import type { AnswerRecordV2, AnswerState, AnswerValue } from '@/lib/compliance-v2/types'
import { makeAnswer } from '@/lib/compliance-v2/flow'
import { getRulePack } from '@/lib/rulepack'
import { SITE_PAGES } from '@/lib/search/site-pages'
import { TOOL_JOURNEYS } from '@/lib/tool-journeys'
import { evaluateExposure } from './engine'
import { EXTRACTS } from './extracts'
import { EXPOSURE_QUESTIONS } from './questions'
import { exposureMarkdown, footerText, playback, scopeExtracts } from './report'

const pack = getRulePack('2026-11-16')
const today = new Date('2026-11-16T12:00:00Z')

function answers(spec: Record<string, AnswerValue | { state: AnswerState }>): AnswerRecordV2 {
  const record: AnswerRecordV2 = {}
  for (const [id, value] of Object.entries(spec)) {
    record[id] =
      value && typeof value === 'object' && !Array.isArray(value) && 'state' in value
        ? makeAnswer(id, value.state)
        : makeAnswer(id, 'answered', value as AnswerValue)
  }
  return record
}

const usProvider = answers({
  organisation_establishment: 'us',
  ai_market_connection: ['placed_on_eu_market'],
  organisation_activity: ['supplied_under_own_name'],
  intended_use_family: ['employment', 'chatbot_interaction'],
  employee_band: { state: 'unknown' },
  system_count: '6_20',
  ai_inventory: 'partly',
  ai_literacy_measures: { state: 'unknown' },
})

describe('playback', () => {
  it('plays back every question in the options’ own words, and marks "not sure"', () => {
    const rows = playback(usProvider)
    expect(rows).toHaveLength(EXPOSURE_QUESTIONS.length)
    expect(rows.find((row) => row.id === 'organisation_establishment')?.answer).toBe('The United States')
    expect(rows.find((row) => row.id === 'intended_use_family')?.answer).toContain('; ')
    expect(rows.filter((row) => row.unknown).map((row) => row.id)).toEqual(['employee_band', 'ai_literacy_measures'])
  })
})

describe('scope extracts', () => {
  it('quote Article 2(1)(a) only to a provider, and nothing to an EU-established reader', () => {
    const result = evaluateExposure(usProvider, pack, today)
    expect(scopeExtracts(result, usProvider)).toEqual(['article-2-1-a', 'article-2-1-c'])
    const deployer = answers({ ...Object.fromEntries(Object.entries(usProvider).map(([k, v]) => [k, v.state === 'answered' ? v.value : { state: v.state }])), organisation_activity: ['used_internally_or_for_customers'] })
    expect(scopeExtracts(evaluateExposure(deployer, pack, today), deployer)).toEqual(['article-2-1-c'])
    const eu = answers({ organisation_establishment: 'eu_eea', ai_market_connection: ['used_from_eu_establishment'] })
    expect(scopeExtracts(evaluateExposure(eu, pack, today), eu)).toEqual([])
  })
})

describe('Markdown export', () => {
  const result = evaluateExposure(usProvider, pack, today)
  const md = exposureMarkdown(result, usProvider, pack, today)

  it('carries the page’s sections in the page’s order', () => {
    const order = ['## What you told us', '## Verdict', '## Your likely roles', '**Start here:', '## Where the Act reaches you', '## First steps', '## Things to find out']
    const positions = order.map((heading) => md.indexOf(heading))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('quotes every extract the result rests on, verbatim', () => {
    for (const item of result.areas) for (const id of item.extracts ?? []) expect(md).toContain(EXTRACTS[id].text)
  })

  it('says plainly that no lawyer has reviewed it, with the pack dates in words', () => {
    expect(md).toContain('This check has not been reviewed by a lawyer.')
    expect(md).toContain('Rule pack version 2026-11-16, built from the consolidated text of 27 July 2026 (CELEX 02024R1689-20260727), which was the current consolidated text when we last checked it on 16 November 2026.')
    expect(md).toContain('Generated 2026-11-16')
    expect(md).not.toMatch(/In force since/)
  })

  it('states the pack and that nothing is stored, and never a percentage', () => {
    expect(md).toContain(`Rule pack version ${pack.manifest.version}`)
    expect(md).toContain('your answers are not stored')
    expect(md).not.toMatch(/%/)
  })
})

describe('footer', () => {
  it('reads both dates from the manifest', () => {
    expect(footerText(pack)).toContain(`Rule pack version ${pack.manifest.version}, built from`)
  })
})

describe('site plumbing', () => {
  it('the page and search describe the question count that exists', () => {
    const page = fs.readFileSync('src/app/(website)/tools/exposure-check/page.tsx', 'utf8')
    const entry = SITE_PAGES.find((item) => item.path === '/tools/exposure-check')
    const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
    const word = words[EXPOSURE_QUESTIONS.length]
    expect(entry?.description.startsWith(`${word} questions`)).toBe(true)
    expect(page).toContain(entry?.description)
  })

  it('leads the tool journeys, with the Advisory Briefing as its follow-on', () => {
    expect(Object.keys(TOOL_JOURNEYS)[0]).toBe('exposure-check')
    expect(TOOL_JOURNEYS['exposure-check'].offering.id).toBe('advisory-briefing')
  })
})
