import { z } from 'zod'

/** Public preview fields only. Never add the full report or download URLs here. */
export const sectorReportSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string().min(1),
  highlights: z.array(z.string()).min(1),
  audiences: z.array(z.object({ title: z.string(), description: z.string() })),
  relatedArticleSlugs: z.array(z.string()).default([]),
  edition: z.object({
    label: z.string().min(1),
    number: z.number().int().positive(),
    evidenceCutoff: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    pageCount: z.number().int().positive().nullish(),
    thesis: z.string().min(1),
    summaryOpening: z.string().min(1),
    evidenceNote: z.string(),
    nextEditionNote: z.string().nullish(),
    changes: z.array(z.string()).nullish(),
    contents: z.array(z.object({
      title: z.string().min(1),
      entries: z.array(z.object({ title: z.string().min(1), depth: z.union([z.literal(0), z.literal(1)]) })),
    })).min(1),
  }),
})

export type SectorReport = z.infer<typeof sectorReportSchema>

export const REPORT_UPDATE_TERM = 'Current report and monthly updates for 12 months'
export const REPORT_PURCHASE_TERMS =
  'One payment covers one named reader, with emailed links to the current PDF and all monthly editions released during the next 12 months. Renewal is optional; there is no automatic renewal.'

export function sectorReportPath(slug: string): string {
  return `/products/sector-reports/${slug}`
}

export function reportDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`))
}

/** Explicit editorial placement only; broad AI categories do not imply manufacturing. */
export function reportForArticle(reports: SectorReport[], articleSlug: string): SectorReport | undefined {
  return reports.find(report => report.relatedArticleSlugs.includes(articleSlug))
}
