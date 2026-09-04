'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { getSeriesProgress, partHref, resumeTarget, type SeriesPart } from '@/lib/series'

type Props = {
  seriesSlug: string
  parts: SeriesPart[]
}

/**
 * "Start with Part 1", or "Resume at Part 4" once this device has read some of
 * the series.
 *
 * Renders the start state on the server and swaps to resume after mount —
 * progress lives in localStorage, so reading it during render would produce a
 * hydration mismatch. The start state is the honest fallback: a reader with no
 * stored progress, or with storage unavailable, gets a correct button rather
 * than an empty space.
 */
export function SeriesResumeButton({ seriesSlug, parts }: Props) {
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    setProgress(getSeriesProgress(seriesSlug))
  }, [seriesSlug])

  const target = resumeTarget(parts, progress)
  if (!target) return null

  const resuming = progress !== null && target.partNumber > 1

  return (
    <Link
      href={partHref(target.article.slug)}
      className="inline-flex items-center gap-2 rounded-lg bg-stone-teal px-5 py-3 text-sm font-semibold text-ink-on-accent transition-opacity hover:opacity-90"
    >
      {resuming ? `Resume at Part ${target.partNumber}` : `Start with Part ${target.partNumber}`}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  )
}
