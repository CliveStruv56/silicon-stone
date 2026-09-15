import 'server-only'

import { cache } from 'react'
import { client } from '@/sanity/lib/client'
import manufacturing from '@/content/sector-reports/ai-and-european-manufacturing.json'
import { sectorReportSchema, type SectorReport } from './sector-reports'

// Explicit projection: no document spreads, private assets or report body.
export const SECTOR_REPORTS_QUERY = `*[
  _type == "sectorReport" && !(_id in path("drafts.**"))
] | order(title asc) {
  "slug": slug.current, previewPublished, title, description, highlights, audiences[]{title, description},
  "relatedArticleSlugs": coalesce(relatedArticles[]->slug.current, []),
  "edition": currentEdition->{
    label, number, evidenceCutoff, pageCount, thesis, summaryOpening, evidenceNote,
    nextEditionNote, changes, contents[]{title, entries[]{title, depth}}
  }
}`

const initialReport = sectorReportSchema.parse(manufacturing)

/** Published CMS editions override the checked-in preview. Failed reads retain it. */
export const getSectorReports = cache(async (): Promise<SectorReport[]> => {
  const reports = new Map([[initialReport.slug, initialReport]])
  try {
    const documents = await client.fetch<unknown[]>(SECTOR_REPORTS_QUERY, {}, {
      perspective: 'published', next: { revalidate: 300, tags: ['sector-reports'] },
    })
    for (const document of documents) {
      const visibility = document as { slug?: string; previewPublished?: boolean }
      if (visibility.previewPublished !== true) {
        if (visibility.slug) reports.delete(visibility.slug)
        continue
      }
      const parsed = sectorReportSchema.safeParse(document)
      if (parsed.success) reports.set(parsed.data.slug, parsed.data)
      else console.warn('[sector-reports] Ignoring incomplete public preview')
    }
  } catch {
    console.warn('[sector-reports] CMS unavailable; using the published preview snapshot')
  }
  return [...reports.values()]
})

export async function getSectorReport(slug: string): Promise<SectorReport | undefined> {
  return (await getSectorReports()).find(report => report.slug === slug)
}
