import { NextRequest, NextResponse } from 'next/server'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { normaliseQuery } from '@/lib/search/keyword'
import { loggableQuery } from '@/lib/search/zero-results'
import { searchByMeaning, type RelatedHit } from '@/lib/search/semantic'

/**
 * Public "search by meaning" for /search. Separate from the admin route
 * (/api/search/semantic), which reads only articles and sits behind the login.
 *
 * It never decides what the search page shows: the page renders its keyword
 * results first, and the browser asks this route for extra results afterwards.
 * Any failure here (OpenAI, Pinecone, Sanity, a limit) returns an empty list and
 * the reader simply sees no "Related by meaning" section.
 *
 * Cost controls, in order: a capped query length; queries that look like
 * personal data are never sent upstream; a per-IP limit (`publicSearch`); a CDN
 * cache on successful answers, so a repeated query costs nothing; and a global
 * daily ceiling (`publicSearchDaily`) checked only on a cache miss. When that
 * ceiling cannot be read from the shared store on Vercel, the route declines
 * rather than trust a per-instance counter.
 */

const MIN_QUERY_CHARS = 3
const NO_STORE = { 'Cache-Control': 'no-store' }

function empty(status: number, reason: string, headers: Record<string, string> = NO_STORE) {
  return NextResponse.json({ results: [], reason }, { status, headers })
}

export async function GET(req: NextRequest) {
  const query = normaliseQuery(req.nextUrl.searchParams.get('q') ?? '')
  if (query.length < MIN_QUERY_CHARS) return empty(200, 'too-short')

  // An email address or a phone number typed into a search box must not leave
  // the site, so it is never embedded.
  if (!loggableQuery(query)) return empty(200, 'not-searched')

  const perReader = await checkDurableRateLimit('publicSearch', getClientIp(req))
  if (!perReader.allowed) {
    return empty(429, 'rate-limited', { ...NO_STORE, 'Retry-After': String(perReader.retryAfter) })
  }

  const daily = await checkDurableRateLimit('publicSearchDaily', 'all')
  if (!daily.allowed || (daily.degraded && process.env.VERCEL === '1')) {
    return empty(503, 'busy')
  }

  let results: RelatedHit[]
  try {
    results = await searchByMeaning(query)
  } catch (error) {
    console.error('Public semantic search failed:', error instanceof Error ? error.message : error)
    return empty(503, 'unavailable')
  }

  return NextResponse.json(
    { results: results.map((r) => ({ ...r, score: Math.round(r.score * 1000) / 1000 })) },
    {
      headers: {
        // Same query, same answer for a day: served by the CDN without touching
        // OpenAI, Pinecone or the limiters.
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    },
  )
}
