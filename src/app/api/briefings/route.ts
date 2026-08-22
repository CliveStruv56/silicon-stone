import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

// Kept in step with the SSR copy in (website)/intelligence/page.tsx — the
// client refreshes to this, so a filter here that is not there makes articles
// appear on load and vanish on refresh. Neither requires a tier: see the note
// on that copy for why an untiered article must still be browsable.
const BRIEFINGS_QUERY = `
  *[_type == "article" && !(_id in path("drafts.**")) && defined(slug.current)]
  | order(coalesce(impactScore, 5) desc, coalesce(publishedAt, _updatedAt) desc) [0...20] {
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
