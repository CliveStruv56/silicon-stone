import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOOL_EVENTS,
  TOOL_SLUGS,
  resetToolAnalyticsForTests,
  toolResultProp,
  trackToolAction,
  trackToolComplete,
  trackToolStart,
} from './tool-analytics'

type PlausibleCall = [string, { props?: Record<string, string> } | undefined]

function fakeWindow(storage: 'working' | 'throws' = 'working') {
  const calls: PlausibleCall[] = []
  const store = new Map<string, string>()
  const sessionStorage =
    storage === 'working'
      ? {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => void store.set(key, value),
        }
      : {
          getItem: () => {
            throw new Error('blocked')
          },
          setItem: () => {
            throw new Error('blocked')
          },
        }
  vi.stubGlobal('window', {
    plausible: (event: string, options?: { props?: Record<string, string> }) => calls.push([event, options]),
    sessionStorage,
  })
  return { calls, store }
}

describe('tool funnel analytics', () => {
  beforeEach(() => resetToolAnalyticsForTests())
  afterEach(() => vi.unstubAllGlobals())

  it('uses the exact event names the Plausible goals and the Exposure Check share', () => {
    // Renaming any of these splits a funnel in two with nothing failing.
    expect(TOOL_EVENTS).toEqual({
      start: 'Tool Start',
      complete: 'Tool Complete',
      resultSaved: 'Tool Result Saved',
      pdfDownload: 'Tool PDF Download',
    })
  })

  it('fires Start once per session per tool, with only the tool slug', () => {
    const { calls } = fakeWindow()
    trackToolStart('compliance-checker')
    trackToolStart('compliance-checker')
    trackToolStart('policy-stress-test')
    expect(calls).toEqual([
      ['Tool Start', { props: { tool: 'compliance-checker' } }],
      ['Tool Start', { props: { tool: 'policy-stress-test' } }],
    ])
  })

  it('does not fire Start again after a reload in the same session', () => {
    const { calls, store } = fakeWindow()
    trackToolStart('scenario-modeler')
    resetToolAnalyticsForTests() // a reload clears memory but not sessionStorage
    trackToolStart('scenario-modeler')
    expect(calls).toHaveLength(1)
    expect([...store.keys()]).toEqual(['sas-tool-funnel:start:scenario-modeler'])
  })

  it('still fires once per page when sessionStorage throws', () => {
    const { calls } = fakeWindow('throws')
    trackToolStart('supply-chain-mapper')
    trackToolStart('supply-chain-mapper')
    expect(calls).toHaveLength(1)
  })

  it('fires Complete once with the coarse result', () => {
    const { calls } = fakeWindow()
    trackToolComplete('compliance-checker', 'Likely high-risk')
    trackToolComplete('compliance-checker', 'Likely minimal-risk')
    expect(calls).toEqual([['Tool Complete', { props: { tool: 'compliance-checker', result: 'Likely high-risk' } }]])
  })

  it('drops a result that is not a category rather than sending it', () => {
    const { calls } = fakeWindow()
    trackToolComplete('policy-stress-test', 'jane@example.com')
    expect(calls).toEqual([['Tool Complete', { props: { tool: 'policy-stress-test' } }]])
  })

  it('accepts every result category the four tools produce and refuses prose', () => {
    for (const value of [
      'Prohibited from 2 December 2026',
      'Likely high-risk',
      'Out of EU scope',
      'likely_high_risk',
      'Material friction',
      'No mapped exposure',
      'taiwan-disruption',
    ]) {
      expect(toolResultProp(value)).toBe(value)
    }
    for (const value of [
      'someone@company.eu',
      'We screen CVs for our Paris office using a vendor model and the recruiter usually agrees',
      '',
      '<script>',
      42,
      null,
    ]) {
      expect(toolResultProp(value)).toBeNull()
    }
  })

  it('sends save and PDF actions with the tool prop only, every time', () => {
    const { calls } = fakeWindow()
    trackToolAction(TOOL_EVENTS.resultSaved, 'compliance-checker')
    trackToolAction(TOOL_EVENTS.pdfDownload, 'compliance-checker')
    trackToolAction(TOOL_EVENTS.pdfDownload, 'compliance-checker')
    expect(calls).toEqual([
      ['Tool Result Saved', { props: { tool: 'compliance-checker' } }],
      ['Tool PDF Download', { props: { tool: 'compliance-checker' } }],
      ['Tool PDF Download', { props: { tool: 'compliance-checker' } }],
    ])
  })

  it('is a no-op on the server', () => {
    expect(() => trackToolStart('compliance-checker')).not.toThrow()
  })
})

/**
 * Wiring: each live tool fires both funnel events under its own slug. Read from
 * source because the pages are client components with no render harness here;
 * the slugs are the same ones `ToolSubscribeCard` already sends.
 */
describe('tool funnel wiring', () => {
  const root = path.resolve(__dirname, '..')
  const pages: Array<[file: string, slug: string]> = [
    ['app/(website)/tools/compliance-checker/page.tsx', 'compliance-checker'],
    ['components/tools/checker-v2/ComplianceCheckerV2.tsx', 'compliance-checker-v2'],
    ['app/(website)/tools/policy-stress-test/page.tsx', 'policy-stress-test'],
    ['app/(website)/tools/scenario-modeler/page.tsx', 'scenario-modeler'],
    ['app/(website)/tools/supply-chain-mapper/page.tsx', 'supply-chain-mapper'],
  ]

  it.each(pages)('%s fires Tool Start and Tool Complete as %s', (file, slug) => {
    const source = readFileSync(path.join(root, file), 'utf8')
    expect(source).toContain(`trackToolStart('${slug}')`)
    expect(source).toContain(`trackToolComplete('${slug}',`)
    expect(TOOL_SLUGS).toContain(slug)
  })

  it('sends the same tool slug as the existing subscribe event', () => {
    for (const [file, slug] of pages) {
      if (slug.endsWith('-v2')) continue
      const source = readFileSync(path.join(root, file), 'utf8')
      expect(source).toContain(`<ToolSubscribeCard tool="${slug}"`)
    }
  })
})
