import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { partHref, seriesHref, type SeriesNeighbour, type SeriesRef } from '@/lib/series'

type Props = {
  series: SeriesRef
  prev: SeriesNeighbour | null
  next: SeriesNeighbour | null
}

/**
 * Previous / next within a series.
 *
 * Sits ABOVE the end-of-article <Gate> on purpose: a reader part-way through a
 * reading path should not meet a commerce or newsletter ask before they are
 * offered the next part.
 *
 * Kept structurally distinct from <RelatedArticles>, which sits below and is
 * machine-generated semantic neighbours from the vectorize webhook. These two
 * answer different questions — one is the author's argued order, the other is
 * "what else is like this" — and merging them would lose that.
 */
export function SeriesNav({ series, prev, next }: Props) {
  if (!prev && !next) return null

  return (
    <nav
      aria-label={`${series.title} — series navigation`}
      // mb-10 is load-bearing, not rhythm: <Gate> carries no top margin of its
      // own, so without it the commerce card butts flush against the "next
      // part" card and the upsell reads as the last item of the series nav.
      // Found in a browser walk-through, not by the suite.
      className="mt-10 mb-10 border-t border-border-subtle pt-8"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-ui-mono text-sm uppercase tracking-wider text-text-muted">
          Continue the series
        </h2>
        <Link
          href={seriesHref(series.slug)}
          className="shrink-0 font-ui-mono text-xs text-stone-teal hover:underline"
        >
          All parts
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {prev ? (
          <Link
            href={partHref(prev.article.slug)}
            className="group flex flex-col rounded-lg border border-border-subtle bg-stone-charcoal/50 p-4 transition-colors hover:border-stone-teal/30 hover:bg-stone-charcoal"
          >
            <span className="mb-2 flex items-center gap-1.5 font-ui-mono text-xs uppercase tracking-wider text-text-muted">
              <ArrowLeft className="h-3 w-3" aria-hidden="true" />
              Part {prev.partNumber}
            </span>
            <span className="text-sm font-semibold text-text-primary transition-colors group-hover:text-stone-teal">
              {prev.article.title}
            </span>
          </Link>
        ) : (
          // Keeps the next card in the right-hand column rather than letting it
          // slide left and read as a "previous".
          <div className="hidden sm:block" aria-hidden="true" />
        )}

        {next && (
          <Link
            href={partHref(next.article.slug)}
            className="group flex flex-col rounded-lg border border-stone-teal/30 bg-stone-teal/5 p-4 text-right transition-colors hover:border-stone-teal/60 hover:bg-stone-teal/10"
          >
            <span className="mb-2 flex items-center justify-end gap-1.5 font-ui-mono text-xs uppercase tracking-wider text-text-muted">
              Part {next.partNumber}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-text-primary transition-colors group-hover:text-stone-teal">
              {next.article.title}
            </span>
          </Link>
        )}
      </div>
    </nav>
  )
}
