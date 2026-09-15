import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { sectorReportPath, REPORT_UPDATE_TERM, type SectorReport } from '@/lib/sector-reports'
import { AMOUNTS, gbp } from '@/lib/offering'

/** A public preview invitation, separate from the article's newsletter/commerce gate. */
export function SectorReportPromotion({ report }: { report: SectorReport }) {
  return (
    <aside aria-label="Related sector report" className="my-10 rounded-lg border border-stone-teal/30 bg-stone-teal/5 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <BookOpen aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-stone-teal" />
        <div>
          <p className="text-sm text-stone-teal">Sector report preview</p>
          <h2 className="mt-2 text-xl font-semibold text-text-primary">Go deeper: {report.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">{report.description}</p>
          <p className="mt-3 text-sm font-medium text-text-primary">{gbp(AMOUNTS.sectorReport)} · {REPORT_UPDATE_TERM}</p>
          <Link href={sectorReportPath(report.slug)} className="mt-5 inline-flex items-center gap-2 font-medium text-stone-teal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">
            View contents and preview <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
