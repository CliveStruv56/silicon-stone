import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  MAX_SELECTED_SOURCES,
  exaToSources,
  extractReportSources,
  registerSources,
  selectSources,
  type SourceCandidate,
} from './research-sources'

function catalogueOf(...urls: string[]): SourceCandidate[] {
  const catalogue: SourceCandidate[] = []
  registerSources(
    catalogue,
    urls.map((url, i) => ({ title: `Source ${i + 1}`, url, snippet: `Snippet ${i + 1}` })),
  )
  return catalogue
}

describe('exaToSources', () => {
  it('carries the URL through untouched and truncates the text', () => {
    const [source] = exaToSources([
      { title: 'Dresden fab update', url: 'https://example.eu/a?utm=1', text: 'x'.repeat(500) },
    ])
    expect(source.url).toBe('https://example.eu/a?utm=1')
    expect(source.title).toBe('Dresden fab update')
    expect(source.snippet).toHaveLength(300)
  })

  it('survives a null title without inventing one', () => {
    expect(exaToSources([{ title: null, url: 'https://example.eu/a' }])[0].title).toBe('')
  })
})

describe('registerSources', () => {
  it('numbers sources from 1 and renders them with an [S…] label', () => {
    const catalogue: SourceCandidate[] = []
    const rendered = registerSources(catalogue, [
      { title: 'First', url: 'https://a.eu', snippet: 'One' },
      { title: 'Second', url: 'https://b.eu', snippet: 'Two' },
    ])
    expect(catalogue.map((c) => c.index)).toEqual([1, 2])
    expect(rendered).toContain('[S1] First')
    expect(rendered).toContain('[S2] Second')
    expect(rendered).toContain('URL: https://a.eu')
  })

  it('deduplicates across calls, so one story reached twice is one entry', () => {
    const catalogue: SourceCandidate[] = []
    registerSources(catalogue, [{ title: 'Inoreader copy', url: 'https://a.eu', snippet: 'x' }])
    const second = registerSources(catalogue, [{ title: 'Exa copy', url: 'https://a.eu', snippet: 'y' }])
    expect(catalogue).toHaveLength(1)
    // Re-rendered under its original number so the model can still cite it.
    expect(second).toContain('[S1] Inoreader copy')
  })

  it('numbering continues across sections', () => {
    const catalogue: SourceCandidate[] = []
    registerSources(catalogue, [{ title: 'A', url: 'https://a.eu', snippet: '' }])
    const web = registerSources(catalogue, [{ title: 'B', url: 'https://b.eu', snippet: '' }])
    expect(web).toContain('[S2] B')
  })

  it('skips a result with no URL — an uncitable source is not a source', () => {
    const catalogue: SourceCandidate[] = []
    registerSources(catalogue, [{ title: 'No link', url: '', snippet: 'x' }])
    expect(catalogue).toEqual([])
  })

  it('labels an untitled source rather than leaving the line blank', () => {
    const catalogue: SourceCandidate[] = []
    expect(registerSources(catalogue, [{ title: '', url: 'https://a.eu', snippet: '' }])).toContain(
      '[S1] (untitled)',
    )
  })
})

describe('selectSources', () => {
  const catalogue = catalogueOf('https://a.eu', 'https://b.eu', 'https://c.eu')

  it('returns the chosen sources, in the order given', () => {
    expect(selectSources(catalogue, [3, 1]).map((s) => s.url)).toEqual([
      'https://c.eu',
      'https://a.eu',
    ])
  })

  it('returns the real URL, not whatever the model might have typed', () => {
    // The whole point: selection is by number, so the string cannot be mutated.
    expect(selectSources(catalogue, [2])[0]).toEqual({
      title: 'Source 2',
      url: 'https://b.eu',
      snippet: 'Snippet 2',
    })
  })

  it('drops out-of-range, zero, negative and non-numeric entries', () => {
    expect(selectSources(catalogue, [99, 0, -1, 'x', null, 2]).map((s) => s.url)).toEqual([
      'https://b.eu',
    ])
  })

  it('accepts numeric strings, which models emit routinely', () => {
    expect(selectSources(catalogue, ['2']).map((s) => s.url)).toEqual(['https://b.eu'])
  })

  it('deduplicates a repeated index', () => {
    expect(selectSources(catalogue, [1, 1, 1])).toHaveLength(1)
  })

  it('falls back to every source when the selection is unusable', () => {
    // A malformed response should cost the editorial ordering, not the sources.
    for (const bad of [[], undefined, null, 'nonsense', [99, 100], {}]) {
      expect(selectSources(catalogue, bad)).toHaveLength(3)
    }
  })

  it('an empty catalogue yields no sources rather than throwing', () => {
    expect(selectSources([], [1, 2])).toEqual([])
  })

  it('caps the selection', () => {
    const big = catalogueOf(...Array.from({ length: 40 }, (_, i) => `https://s${i}.eu`))
    const all = Array.from({ length: 40 }, (_, i) => i + 1)
    expect(selectSources(big, all)).toHaveLength(MAX_SELECTED_SOURCES)
  })

  it('strips the index from what the writer receives', () => {
    expect(Object.keys(selectSources(catalogue, [1])[0]).sort()).toEqual([
      'snippet',
      'title',
      'url',
    ])
  })
})

describe('extractReportSources', () => {
  it('takes URLs verbatim out of report prose', () => {
    const report =
      'Capacity rose sharply in 2025 (https://eur-lex.europa.eu/eli/reg/2023/1781). ' +
      'A second finding followed at https://www.tsmc.com/press/dresden.'
    const sources = extractReportSources(report)
    expect(sources.map((s) => s.url)).toEqual([
      'https://eur-lex.europa.eu/eli/reg/2023/1781',
      'https://www.tsmc.com/press/dresden',
    ])
  })

  it('strips trailing sentence punctuation but keeps path characters', () => {
    expect(extractReportSources('See https://a.eu/path-to/thing_2026.html.').map((s) => s.url)).toEqual([
      'https://a.eu/path-to/thing_2026.html',
    ])
  })

  it('titles the source with its host and does not invent one', () => {
    const [source] = extractReportSources('Reported at https://www.ft.com/content/abc')
    expect(source.title).toBe('ft.com')
  })

  it('deduplicates a URL cited repeatedly', () => {
    const report = 'First https://a.eu/x and later https://a.eu/x again.'
    expect(extractReportSources(report)).toHaveLength(1)
  })

  it('captures the surrounding prose as the snippet', () => {
    const [source] = extractReportSources('The fab reached full yield in March 2026, per https://a.eu/x')
    expect(source.snippet).toContain('full yield in March 2026')
  })

  it('returns nothing for a report with no links', () => {
    expect(extractReportSources('A report with no citations at all.')).toEqual([])
  })
})

describe('the synthesis prompt no longer asks for URLs', () => {
  // The failure this change prevents is a model retyping a URL. If the prompt
  // starts asking for a sources array again, the plumbing below is bypassed.
  const research = fs.readFileSync(path.join(process.cwd(), 'src/lib/research.ts'), 'utf8')

  it('asks for sourceIndexes', () => {
    expect(research).toMatch(/"sourceIndexes"/)
  })

  it('forbids retyping a title, URL or snippet', () => {
    expect(research).toMatch(/do not retype a\s*\n?\s*title, a URL or a snippet/)
  })

  it('builds the source list with selectSources rather than from the parsed payload', () => {
    expect(research).toMatch(/sources: selectSources\(catalogue, parsed\.sourceIndexes\)/)
    expect(research).not.toMatch(/sources: parsed\.sources/)
  })
})
