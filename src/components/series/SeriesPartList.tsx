'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTierConfig } from '@/components/article/PulseHeader'
import { cn } from '@/lib/utils'
import { getSeriesProgress, partHref, type SeriesPart } from '@/lib/series'

type Props = {
  seriesSlug: string
  parts: SeriesPart[]
}

/**
 * The ordered parts of a series.
 *
 * Two things here are the whole point of the feature:
 *
 *  1. **The number is the position**, printed straight from the array index. An
 *     entry whose article is not published still occupies its slot and is shown
 *     as "in preparation" rather than skipped — so an in-progress series shows
 *     its shape, and publishing a late part never renumbers the ones after it.
 *  2. **Read marks are device-local and hydrate after mount.** Reading them
 *     during render would mismatch the server HTML, so the list renders unmarked
 *     first and fills in.
 */
export function SeriesPartList({ seriesSlug, parts }: Props) {
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    setProgress(getSeriesProgress(seriesSlug))
  }, [seriesSlug])

  return (
    <ol className="space-y-3">
      {parts.map((part, index) => {
        const partNumber = index + 1
        const article = part.article
        const tier = getTierConfig(article?.intelligenceTier)
        const read = progress !== null && partNumber <= progress

        if (!article) {
          return (
            <li
              key={part._key ?? `slot-${partNumber}`}
              className="flex gap-4 rounded-lg border border-dashed border-border-subtle p-4 opacity-60"
            >
              <span className="font-ui-mono text-sm text-text-muted tabular-nums">
                {String(partNumber).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-muted">In preparation</p>
                <p className="mt-1 text-xs text-text-muted">
                  This part is written but not yet published. Its place in the order is held.
                </p>
              </div>
            </li>
          )
        }

        return (
          <li key={part._key ?? article._id}>
            <Link
              href={partHref(article.slug)}
              className="group flex gap-4 rounded-lg border border-border-subtle bg-stone-charcoal/50 p-4 transition-colors hover:border-stone-teal/30 hover:bg-stone-charcoal"
            >
              <span
                className={cn(
                  'font-ui-mono text-sm tabular-nums transition-colors',
                  read ? 'text-stone-teal' : 'text-text-muted',
                )}
              >
                {String(partNumber).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  {tier && (
                    <Badge className={cn('font-ui-mono text-[11px]', tier.color)}>{tier.label}</Badge>
                  )}
                  {read && (
                    <span className="flex items-center gap-1 font-ui-mono text-[11px] uppercase tracking-wider text-stone-teal">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Read
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-text-primary transition-colors group-hover:text-stone-teal">
                  {article.title}
                </h3>
                {(article.stoneTruth || article.excerpt) && (
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                    {article.stoneTruth || article.excerpt}
                  </p>
                )}
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
