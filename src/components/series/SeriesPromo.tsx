import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Layers } from 'lucide-react'

import { partsLabel, seriesHref, type SeriesPromoItem } from '@/lib/series'

/**
 * The entry point to the series library, for surfaces that are not the library.
 *
 * Series shipped on 2026-09-04 reachable from exactly two places: the
 * Intelligence dropdown and the footer. `/intelligence` — the page a reader
 * actually lands on to browse — mentioned it nowhere, and neither did the
 * homepage. A reading path nobody can find is a reading path nobody reads.
 *
 * Three things this has to get right, and they are the reasons it is a
 * component rather than markup pasted into two pages:
 *
 *  1. **It renders NOTHING when there are no series.** Not a heading over an
 *     empty list — the same rule `verifyReport` follows when it drops the whole
 *     GDPR block rather than showing a heading with nothing under it. The
 *     library page can say "No series published yet" because that is what a
 *     reader navigated there to find out; a promo band on another page cannot.
 *  2. **It degrades in both directions.** There is one series today and the
 *     design must not assume that. One gets the full row; the rest are counted
 *     in a single "All N series" link, so adding the second changes the copy
 *     and not the layout.
 *  3. **The count is of slots, not of resolved articles.** `partCount` counts
 *     every entry including parts still in draft, because an entry's position
 *     is its part number — see the rule at the top of `src/lib/series.ts`.
 *     `publishedCount` is what you can read today, and is only shown when the
 *     two differ: printing the same number twice reads as a bug.
 */

type Props = {
  /** Ordered as `SERIES_INDEX_QUERY` returns them: featured first. */
  series: SeriesPromoItem[]
  eyebrow?: string
  heading?: string
  /** Pass `null` to omit — see the `compact` note below. */
  intro?: string | null
  /**
   * Tightens the header block: eyebrow and heading on one line, smaller
   * heading, no intro paragraph.
   *
   * `/intelligence` uses it because that page already spends ~1,700px on hero
   * and explainers before the first article, and the hero sentence directly
   * above the band now says what a series is. A second, fuller statement of it
   * bought 250px of height and told the reader nothing new. The homepage has no
   * such preamble, so it takes the full form.
   */
  compact?: boolean
  /** Wrapper classes, so each host controls its own rhythm and borders. */
  className?: string
}

export function SeriesPromo({
  series,
  eyebrow = 'Another way in',
  heading = 'Read a series, in the order the argument was built',
  intro = 'The feed ranks by impact — what shifted most, most recently. A series does what a feed cannot: it puts one question in sequence, so you can follow it from the first piece.',
  compact = false,
  className = '',
}: Props) {
  // No series, no band. See point 1 above.
  if (!series || series.length === 0) return null

  const [lead, ...rest] = series

  return (
    <section aria-labelledby="series-promo-heading" className={className}>
      {compact ? (
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-mono text-[12.5px] uppercase tracking-[0.14em] text-text-muted">
            {eyebrow}
          </p>
          <h2 id="series-promo-heading" className="text-lg font-semibold text-text-primary">
            {heading}
          </h2>
        </div>
      ) : (
        <div className="mb-6 max-w-3xl">
          <p className="mb-3 font-mono text-[12.5px] uppercase tracking-[0.14em] text-text-muted">
            {eyebrow}
          </p>
          <h2
            id="series-promo-heading"
            className="mb-3 text-2xl font-semibold text-text-primary"
          >
            {heading}
          </h2>
          {intro && <p className="leading-relaxed text-text-muted">{intro}</p>}
        </div>
      )}

      <Link
        href={seriesHref(lead.slug)}
        className="group flex flex-col gap-5 rounded-lg border border-stone-teal/25 bg-stone-teal/5 p-5 transition-colors hover:border-stone-teal/50 hover:bg-stone-teal/10 sm:flex-row sm:items-center"
      >
        {lead.coverImageUrl && (
          <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-md sm:aspect-[4/3] sm:w-40">
            <Image
              src={lead.coverImageUrl}
              alt=""
              fill
              sizes="(min-width: 640px) 10rem, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 shrink-0 text-stone-teal" aria-hidden="true" />
            <span className="font-ui-mono text-xs uppercase tracking-wider text-stone-teal">
              {partsLabel(lead.partCount ?? 0, lead.publishedCount ?? 0, lead.status)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary transition-colors group-hover:text-stone-teal">
            {lead.title}
          </h3>
          {lead.standfirst && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
              {lead.standfirst}
            </p>
          )}
        </div>

        <span className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-medium text-stone-teal sm:self-center">
          Start at part one
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>

      {/* The second series changes this line, not the layout above it. */}
      {rest.length > 0 && (
        <div className="mt-4">
          <Link
            href="/intelligence/series"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-teal hover:underline"
          >
            All {series.length} series
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  )
}
