'use server'

import { SITE_PAGES } from '@/lib/search/site-pages'
import { normaliseQuery, searchSitePages } from '@/lib/search/keyword'
import { recordZeroResult } from '@/lib/search/zero-results'

/**
 * Called by ZeroResultReporter once a search that found nothing has settled
 * (see src/lib/search/settle.ts). It takes the query text and nothing else, and
 * reads nothing about the request.
 *
 * The caller's claim that nothing matched is checked cheaply against the page
 * registry; the Sanity half is not re-run, so the log stays advisory. Writes are
 * bounded by the global `searchZeroLog` ceiling inside recordZeroResult.
 */
export async function reportZeroResult(raw: unknown): Promise<void> {
  if (typeof raw !== 'string' || raw.length > 500) return
  const query = normaliseQuery(raw)
  if (!query) return
  if (searchSitePages(query, SITE_PAGES).length > 0) return
  await recordZeroResult(query)
}
