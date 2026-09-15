import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import manufacturing from '@/content/sector-reports/ai-and-european-manufacturing.json'
import { reportForArticle, sectorReportPath, sectorReportSchema } from './sector-reports'

const report = sectorReportSchema.parse(manufacturing)

describe('manufacturing public preview', () => {
  it('contains the exact opening excerpt but none of the paid findings', () => {
    // Fingerprint checked against the source dossier and final purchaser PDF.
    // Keeping only the fingerprint means CI never needs the private full report.
    const opening = `${report.edition.thesis}\n\n${report.edition.summaryOpening}`
    expect(createHash('sha256').update(opening).digest('hex'))
      .toBe('3c5c32239749d2a53f3e7f2686ac148fbabd82cf7c2a9e9493485451df7ab51e')
    expect(JSON.stringify(manufacturing)).not.toContain('That leaves a nineteen-month period')
    expect(JSON.stringify(manufacturing)).not.toContain('cmu2cgem0054b07adq5fu1tlq')
  })

  it('includes all reader-facing source headings, including subsections and appendices', () => {
    const headings = report.edition.contents.flatMap(group => [
      ...(['Front matter', 'Closing reference sections'].includes(group.title) ? [] : [group.title]),
      ...group.entries.map(entry => entry.title),
    ])
    expect(headings).toHaveLength(112)
    expect(createHash('sha256').update(headings.join('\n')).digest('hex'))
      .toBe('053c673dad90fe4d7e940856516b88f8b377970929bd397d176e8dab2a3dbcc4')
  })

  it('promotes only explicitly selected articles and links to a permanent report URL', () => {
    expect(reportForArticle([report], 'helium-scarcity-semiconductor-production')?.slug).toBe(report.slug)
    expect(reportForArticle([report], 'us-national-ai-policy-acceleration')).toBeUndefined()
    expect(reportForArticle([report], 'not-a-real-article')).toBeUndefined()
    expect(sectorReportPath(report.slug)).toBe('/products/sector-reports/ai-and-european-manufacturing')
  })
})
