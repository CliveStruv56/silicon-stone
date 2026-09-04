import Link from 'next/link'
import { Layers } from 'lucide-react'
import { seriesHref, type SeriesRef } from '@/lib/series'

type Props = {
  series: SeriesRef
  partNumber: number
  totalParts: number
}

/**
 * The line that tells a reader where they are in a reading path.
 *
 * Rendered on the article page ABOVE the body and deliberately OUTSIDE the
 * `hasIntelligenceFields` conditional that gates <PulseHeader>. An article with
 * no intelligence tier is still a legitimate part of a series, and nesting this
 * inside that conditional would hide series context on exactly the hand-made
 * articles that once published into invisibility for the same class of reason.
 */
export function SeriesStrip({ series, partNumber, totalParts }: Props) {
  return (
    <Link
      href={seriesHref(series.slug)}
      className="group mb-6 flex items-center gap-3 rounded-lg border border-stone-teal/25 bg-stone-teal/5 px-4 py-3 transition-colors hover:border-stone-teal/50 hover:bg-stone-teal/10"
    >
      <Layers className="h-4 w-4 shrink-0 text-stone-teal" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-sm">
        <span className="font-ui-mono text-xs uppercase tracking-wider text-text-muted">
          Part {partNumber} of {totalParts} ·{' '}
        </span>
        <span className="font-semibold text-text-primary transition-colors group-hover:text-stone-teal">
          {series.title}
        </span>
      </span>
      <span className="hidden shrink-0 font-ui-mono text-xs text-text-muted sm:inline">
        View series
      </span>
    </Link>
  )
}
