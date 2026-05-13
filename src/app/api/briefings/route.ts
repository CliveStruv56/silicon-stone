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

function getBackendApiUrl() {
  const value = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
  return value.replace(/\/$/, '')
}

async function fetchRailwayBriefings() {
  const backendApiUrl = getBackendApiUrl()
  if (!backendApiUrl) return null

  try {
    const response = await fetch(`${backendApiUrl}/v1/briefings`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Railway briefings proxy error:', response.status, await response.text())
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Railway briefings proxy failed:', error)
    return null
  }
}

export async function GET() {
  const railwayData = await fetchRailwayBriefings()
  if (railwayData) {
    return NextResponse.json(railwayData)
  }

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
