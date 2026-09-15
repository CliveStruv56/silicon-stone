import Link from 'next/link'
import { REPORT_PURCHASE_TERMS, REPORT_UPDATE_TERM } from '@/lib/sector-reports'

export function ReportUpdates() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold text-text-primary">{REPORT_UPDATE_TERM}</h2>
      <p className="mt-4 leading-relaxed text-text-muted">{REPORT_PURCHASE_TERMS}</p>
      <p className="mt-3 leading-relaxed text-text-muted">
        Each monthly edition revisits the evidence and includes a summary of material changes,
        so you can see what needs your attention. The first edition establishes the baseline.
      </p>
      <p className="mt-3 text-sm text-text-muted">
        Team use is priced separately.{' '}
        <Link href="/advisory#contact" className="text-stone-teal underline underline-offset-4">
          Enquire about a team licence
        </Link>.
      </p>
    </div>
  )
}
