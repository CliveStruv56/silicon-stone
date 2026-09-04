import 'server-only'

import { sanityFetch } from '@/sanity/lib/live'
import { urlFor } from '@/sanity/lib/image'
import { SERIES_INDEX_QUERY } from '@/sanity/lib/queries'
import type { SeriesPromoItem } from '@/lib/series'

/**
 * The series list, shaped for the promo band, fetched once per surface.
 *
 * Two pages render `SeriesPromo` — `/intelligence` and the homepage — and this
 * exists so neither writes its own mapping. The `urlFor` call is the reason:
 * it is a server-side transform of a Sanity image ref, and a second hand-written
 * copy of it is precisely the shape of drift this repo has paid for before.
 *
 * It reuses `SERIES_INDEX_QUERY` rather than adding a narrower one. The query
 * already orders `featured desc, displayOrder asc, title asc`, which is exactly
 * the order the band wants — the featured series leads — and one query serving
 * the library and both promos means the ordering cannot disagree between the
 * page that lists series and the pages that advertise them.
 *
 * A Sanity failure degrades to an empty list, which `SeriesPromo` renders as
 * nothing at all. That is deliberate and matches `getInitialArticles` on the
 * same page: an outage should cost the band, never the page. It is logged, not
 * swallowed silently.
 */
export async function getSeriesPromo(): Promise<SeriesPromoItem[]> {
  try {
    const { data } = await sanityFetch({ query: SERIES_INDEX_QUERY })
    const list = (data ?? []) as Array<
      Omit<SeriesPromoItem, 'coverImageUrl'> & { coverImage?: unknown }
    >

    return list.map((entry) => ({
      _id: entry._id,
      title: entry.title,
      slug: entry.slug,
      standfirst: entry.standfirst ?? null,
      status: entry.status ?? null,
      partCount: entry.partCount ?? 0,
      publishedCount: entry.publishedCount ?? 0,
      coverImageUrl: entry.coverImage
        ? urlFor(entry.coverImage).width(480).height(360).url()
        : null,
    }))
  } catch (error) {
    console.error('Error fetching series for the promo band:', error)
    return []
  }
}
