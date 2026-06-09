import { ImageResponse } from 'next/og'
import { sanityFetch } from '@/sanity/lib/live'
import { OG_ARTICLE_QUERY } from '@/sanity/lib/queries'
import { SITE_NAME } from '@/lib/site'

/**
 * Auto-generated, branded Open Graph card for each article — title + Stone Truth
 * on the brand palette. Stronger social/AI cards than reusing mainImage, with no
 * per-article design work. Next wires the output into og:image AND twitter:image.
 */

export const alt = `${SITE_NAME} — Forensic Technopolitics`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Brand palette (mirrors globals.css)
const SLATE_DEEP = '#1a1f2e'
const STONE_CHARCOAL = '#2d3748'
const SILICON_AMBER = '#f6ad55'
const STONE_TEAL = '#4a9b9b'
const TEXT_PRIMARY = '#f7fafc'
const TEXT_MUTED = '#a0aec0'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: article } = await sanityFetch({
    query: OG_ARTICLE_QUERY,
    params: { slug },
    perspective: 'published',
    stega: false,
  })

  const title = article?.title || SITE_NAME
  const stoneTruth = article?.stoneTruth || ''
  const category = article?.category || 'Intelligence'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${SLATE_DEEP} 0%, ${STONE_CHARCOAL} 100%)`,
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: brand + category */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: TEXT_PRIMARY,
              letterSpacing: '-0.02em',
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 22,
              color: SLATE_DEEP,
              background: SILICON_AMBER,
              padding: '8px 18px',
              borderRadius: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {category}
          </div>
        </div>

        {/* Middle: title */}
        <div
          style={{
            display: 'flex',
            fontSize: title.length > 80 ? 56 : 68,
            fontWeight: 800,
            color: TEXT_PRIMARY,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        {/* Bottom: Stone Truth pull-quote */}
        <div
          style={{
            display: 'flex',
            borderLeft: `6px solid ${STONE_TEAL}`,
            paddingLeft: 24,
            fontSize: 30,
            color: TEXT_MUTED,
            fontStyle: 'italic',
            lineHeight: 1.3,
            maxWidth: 1000,
          }}
        >
          {stoneTruth || 'Forensic Technopolitics for European decision-makers.'}
        </div>
      </div>
    ),
    { ...size }
  )
}
