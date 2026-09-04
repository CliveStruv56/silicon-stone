'use client'

import { useEffect } from 'react'
import { recordSeriesProgress } from '@/lib/series'

type Props = {
  seriesSlug: string
  partNumber: number
}

/**
 * Records that this device has reached a part of a series. Renders nothing.
 *
 * Device-local (localStorage), because the site has no user accounts — the same
 * constraint that made the Lemon Squeezy licence key device-local. It exists so
 * the series page can offer "Resume at Part 4" instead of always "Start at
 * Part 1", which is the difference between a list and a playlist.
 *
 * A separate component rather than an effect inside the page because the
 * article page is a Server Component; this is the only part that needs the
 * browser.
 */
export function SeriesProgressTracker({ seriesSlug, partNumber }: Props) {
  useEffect(() => {
    recordSeriesProgress(seriesSlug, partNumber)
  }, [seriesSlug, partNumber])

  return null
}
