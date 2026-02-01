import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

const BRIEFINGS_QUERY = `
  *[_type == "article" && defined(slug.current)]
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

interface Article {
  _id: string
  title: string
  slug: string
  mainImage?: {
    asset?: { _ref: string }
    alt?: string
  }
  [key: string]: unknown
}

export async function GET() {
  try {
    const articles: Article[] = await client.fetch(BRIEFINGS_QUERY)

    // Transform articles to include proper image URLs (keeps Sanity project ID server-side)
    const articlesWithImageUrls = articles.map((article) => ({
      ...article,
      mainImageUrl: article.mainImage?.asset
        ? urlFor(article.mainImage).width(800).height(450).url()
        : null,
    }))

    return NextResponse.json({ result: articlesWithImageUrls })
  } catch (error) {
    console.error('Error fetching briefings:', error)
    return NextResponse.json({ result: [], error: 'Failed to fetch briefings' }, { status: 500 })
  }
}
