import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/sanity/env', () => ({
  apiVersion: '2026-01-13',
  dataset: 'test',
  projectId: 'testproj',
}))

import { parseExtractedClaims, parseVerificationResults } from './fact-check'

/**
 * These cover the failure that made claim extraction unusable on the articles
 * that most need it: the prompt asks for a sentence copied EXACTLY verbatim,
 * that sentence quotes statute, and the quotation marks inside it terminated
 * the surrounding JSON string. Every payload below carries unescaped quotes on
 * purpose — that is the point of the format, not an incidental detail.
 *
 * The first case is the real response captured from a live run on
 * 21 August 2026, which failed at character 3157 as JSON.
 */
describe('parseExtractedClaims', () => {
  it('reads a claim whose verbatim text contains its own quotation marks', () => {
    const raw = `===CLAIM===
CLAIM: Article 26(7) requires deployers who are employers to inform workers' representatives before putting a high-risk AI system into service.
LOCATION: Under Article 26(7), deployers who are employers "shall inform workers' representatives"
ORIGINAL: Under Article 26(7), deployers who are employers "shall inform workers' representatives and the affected workers that they will be subject to the use of the high-risk AI system before putting it into service."
QUERY: EU AI Act Article 26(7) deployer employer inform workers representatives`

    const claims = parseExtractedClaims(raw, 12)
    expect(claims).toHaveLength(1)
    expect(claims[0].originalText).toContain('"shall inform workers\' representatives')
    expect(claims[0].originalText.endsWith('into service."')).toBe(true)
    expect(claims[0].searchQuery).toBe(
      'EU AI Act Article 26(7) deployer employer inform workers representatives',
    )
  })

  it('keeps a verbatim sentence that wraps across lines intact', () => {
    const raw = `===CLAIM===
CLAIM: The CRA entered into force on 10 December 2024.
LOCATION: entered into force
ORIGINAL: Regulation (EU) 2024/2847 — the Cyber Resilience Act — entered into force
on 10 December 2024, and full application follows on 11 December 2027.
QUERY: Cyber Resilience Act entry into force date`

    const [claim] = parseExtractedClaims(raw, 12)
    expect(claim.originalText).toBe(
      'Regulation (EU) 2024/2847 — the Cyber Resilience Act — entered into force\non 10 December 2024, and full application follows on 11 December 2027.',
    )
  })

  it('reads several blocks and honours the cap', () => {
    const raw = ['a', 'b', 'c']
      .map((n) => `===CLAIM===\nCLAIM: claim ${n}\nLOCATION: l\nORIGINAL: o\nQUERY: q ${n}`)
      .join('\n')

    expect(parseExtractedClaims(raw, 12)).toHaveLength(3)
    expect(parseExtractedClaims(raw, 2)).toHaveLength(2)
  })

  it('drops a block with no claim or no search query rather than half-reading it', () => {
    const raw = `===CLAIM===
CLAIM: a claim with nothing to search for
LOCATION: somewhere
ORIGINAL: text
===CLAIM===
CLAIM:
QUERY: an orphan query`

    expect(parseExtractedClaims(raw, 12)).toEqual([])
  })

  it('returns nothing for a response with no blocks', () => {
    expect(parseExtractedClaims('', 12)).toEqual([])
    expect(parseExtractedClaims('There are no checkable claims here.', 12)).toEqual([])
  })
})

describe('parseVerificationResults', () => {
  it('reads a verdict whose evidence and revision quote the source', () => {
    const raw = `===RESULT===
INDEX: 0
VERDICT: needs-context
CONFIDENCE: high
EVIDENCE: The regulation says the deployer "shall inform workers' representatives", but the article presents this as applying to every deployer rather than to employers only.
SOURCE: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
REVISION: Under Article 26(7), deployers who are employers "shall inform workers' representatives and the affected workers" before putting the system into service.`

    const [row] = parseVerificationResults(raw)
    expect(row.index).toBe(0)
    expect(row.verdict).toBe('needs-context')
    expect(row.confidence).toBe('high')
    expect(row.evidence).toContain('"shall inform workers\' representatives"')
    expect(row.suggestedRevision).toContain('"shall inform workers\' representatives')
    expect(row.sourceUrls).toEqual(['https://eur-lex.europa.eu/eli/reg/2024/1689/oj'])
  })

  it('collects repeated SOURCE and CITATION lines', () => {
    const raw = `===RESULT===
INDEX: 3
VERDICT: accurate
CONFIDENCE: medium
EVIDENCE: Both sources confirm the figure.
SOURCE: https://example.org/a
SOURCE: https://example.org/b
CITATION: NIS Investments 2025 | https://enisa.europa.eu/report | ENISA
CITATION: CRA guidance | https://ec.europa.eu/cra`

    const [row] = parseVerificationResults(raw)
    expect(row.sourceUrls).toEqual(['https://example.org/a', 'https://example.org/b'])
    expect(row.suggestedCitations).toEqual([
      { title: 'NIS Investments 2025', url: 'https://enisa.europa.eu/report', publisher: 'ENISA' },
      { title: 'CRA guidance', url: 'https://ec.europa.eu/cra', publisher: undefined },
    ])
  })

  it('omits the revision when the line is absent', () => {
    const raw = `===RESULT===
INDEX: 1
VERDICT: accurate
CONFIDENCE: high
EVIDENCE: Confirmed.`

    expect(parseVerificationResults(raw)[0].suggestedRevision).toBeUndefined()
  })

  it('skips a block with no usable index rather than mapping it to claim 0', () => {
    const raw = `===RESULT===
VERDICT: accurate
CONFIDENCE: high
EVIDENCE: Confirmed.`

    expect(parseVerificationResults(raw)).toEqual([])
  })

  it('keeps results addressable by their stated index, not their order', () => {
    const raw = `===RESULT===
INDEX: 2
VERDICT: inaccurate
CONFIDENCE: low
EVIDENCE: Contradicted.
===RESULT===
INDEX: 0
VERDICT: accurate
CONFIDENCE: high
EVIDENCE: Confirmed.`

    const rows = parseVerificationResults(raw)
    expect(rows.find((r) => r.index === 2)?.verdict).toBe('inaccurate')
    expect(rows.find((r) => r.index === 0)?.verdict).toBe('accurate')
  })
})
