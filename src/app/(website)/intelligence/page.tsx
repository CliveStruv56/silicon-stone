import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { IntelligenceFeed, type Article } from './IntelligenceFeed'

// Published-only feed query — mirrors /api/briefings so the server-rendered list
// matches what the client refreshes to (F13). Rendering the list (with
// /analysis/* links) in the SSR HTML makes the hub crawlable and link-bearing
// to bots and no-JS visitors, instead of an empty "Loading intelligence…" shell.
const BRIEFINGS_QUERY = `
  *[_type == "article" && !(_id in path("drafts.**")) && defined(intelligenceTier) && defined(slug.current)]
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

// Refresh the server-rendered list periodically; the client still re-fetches
// /api/briefings (which includes the Railway proxy) on mount for live data.
export const revalidate = 300

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

export default async function IntelligencePage() {
  const initialArticles = await getInitialArticles()
  return <IntelligenceFeed initialArticles={initialArticles} />
}
