'use client'

import { useEffect } from 'react'
import { createSettledReporter } from '@/lib/search/settle'
import { reportZeroResult } from './actions'

/**
 * One reporter per browser tab, so a query is logged at most once however
 * often the reader comes back to it.
 */
let shared: ReturnType<typeof createSettledReporter> | null = null
function reporter() {
  if (!shared) {
    shared = createSettledReporter((q) => {
      reportZeroResult(q).catch(() => {})
    })
  }
  return shared
}

/**
 * Rendered only when a search found nothing. Reports the query to the
 * zero-result log once it has settled (src/lib/search/settle.ts); renders
 * nothing itself.
 */
export default function ZeroResultReporter({ query }: { query: string }) {
  useEffect(() => {
    const r = reporter()
    r.update(query)
    return () => r.cancel()
  }, [query])

  return null
}
