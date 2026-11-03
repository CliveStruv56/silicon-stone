import { ImageResponse } from 'next/og'
import { sanityFetch } from '@/sanity/lib/live'
import { COURSE_QUERY } from '@/sanity/lib/queries'
import { statusLabel, type CourseStatus } from '@/lib/learn/model'

/**
 * A branded Open Graph card for each course: code, title, promise and status,
 * on the same palette as the article cards. Next wires it into og:image and
 * twitter:image for /learn/courses/<slug>.
 */

export const alt = 'Silicon & Stone Learning: Silicon to Sovereignty'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Brand palette, as in the article card (analysis/[slug]/opengraph-image.tsx).
const SLATE_DEEP = '#1a1f2e'
const STONE_CHARCOAL = '#2d3748'
const SILICON_AMBER = '#f6ad55'
const STONE_TEAL = '#4a9b9b'
const TEXT_PRIMARY = '#f7fafc'
const TEXT_MUTED = '#a0aec0'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await sanityFetch({ query: COURSE_QUERY, params: { slug }, perspective: 'published', stega: false })
  const course = data as {
    code?: string
    title?: string
    promise?: string
    status?: CourseStatus
    statusMonth?: string | null
    levelTitle?: string
  } | null

  const title = course?.title || 'Silicon to Sovereignty'
  const badge = course?.status ? statusLabel(course.status, course.statusMonth) : 'Waitlist open'

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: '-0.02em' }}>
            Silicon & Stone Learning
          </div>
          <div
            style={{
              display: 'flex',
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
            {badge}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {course?.code && (
            <div style={{ display: 'flex', fontSize: 30, color: SILICON_AMBER, marginBottom: 12, fontFamily: 'monospace' }}>
              {`Course ${course.code}${course.levelTitle ? ` · ${course.levelTitle}` : ''}`}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 60 ? 56 : 68,
              fontWeight: 800,
              color: TEXT_PRIMARY,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: 1050,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            borderLeft: `6px solid ${STONE_TEAL}`,
            paddingLeft: 24,
            fontSize: 28,
            color: TEXT_MUTED,
            lineHeight: 1.3,
            maxWidth: 1050,
          }}
        >
          {course?.promise || 'AI, from the chip to the boardroom.'}
        </div>
      </div>
    ),
    { ...size },
  )
}
