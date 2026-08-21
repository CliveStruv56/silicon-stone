import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { IntelligenceFeed, type Article } from './IntelligenceFeed'
import { getPersonaParam, getTierParam, getTopicParam } from './filters'

// Published-only feed query — mirrors /api/briefings so the server-rendered list
// matches what the client refreshes to (F13). Rendering the list (with
// /analysis/* links) in the SSR HTML makes the hub crawlable and link-bearing
// to bots and no-JS visitors, instead of an empty "Loading intelligence…" shell.
//
// It does NOT require `defined(intelligenceTier)`. It did until 2026-08-21, and
// because nothing on the hand-made Studio path sets a tier, an article could
// publish cleanly, go live at /analysis/<slug>, reach the sitemap and the RSS
// feed — and never appear where a reader browses. The tier is an optional
// editorial field (the analytics dashboard counts an "Untiered" bucket), so its
// absence must cost the badge and the tier filter, not the article. Publishing
// one now raises a preflight warning instead; see src/lib/publish-preflight.ts.
const BRIEFINGS_QUERY = `
  *[_type == "article" && !(_id in path("drafts.**")) && defined(slug.current)]
  | order(coalesce(impactScore, 5) desc, publishedAt desc) [0...20] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    stoneTruth,
    impactScore,
    intelligenceTier,
    publishedAt,
    personas,
    methodologyPillars,
    mainImage,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
`

// Reading searchParams makes this route dynamic (renders per request), so
// filtered deep links SSR with the filter already applied (P1-5). Sanity's
// API CDN keeps the per-request fetch cheap; the client still re-fetches
// /api/briefings (which includes the Railway proxy) on mount for live data.

async function getInitialArticles(): Promise<Article[]> {
  try {
    const articles: Article[] = await client.fetch(BRIEFINGS_QUERY)
    return articles.map((article) => ({
      ...article,
      mainImageUrl: article.mainImage?.asset
        ? urlFor(article.mainImage).width(800).height(450).url()
        : null,
    }))
  } catch (error) {
    console.error('Error fetching initial briefings for SSR:', error)
    return []
  }
}

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? null

  const initialArticles = await getInitialArticles()
  return (
    <IntelligenceFeed
      initialArticles={initialArticles}
      initialFilters={{
        persona: getPersonaParam(first(params.persona)),
        tier: getTierParam(first(params.tier)),
        topic: getTopicParam(first(params.topic)),
      }}
    />
  )
}
