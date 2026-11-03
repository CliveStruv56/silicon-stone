import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { CourseCard } from '@/components/learn/CourseCard'
import { LearnEyebrow } from '@/components/learn/LearnEyebrow'
import { WaitlistForm } from '@/components/learn/WaitlistForm'
import { CHARITY_LINE } from '@/lib/learn/copy'
import { TRACK_SLUGS, formatMonth, type TrackSlug } from '@/lib/learn/model'
import { LEARN_PRICES } from '@/lib/offering'
import { resolvedCourses, totalTime, trackPath, type TrackData } from '@/lib/learn/types'
import { buildCourseListSchema, buildLearnBreadcrumbSchema, cleanDescription } from '@/lib/seo'
import { sanityFetch } from '@/sanity/lib/live'
import { TRACK_QUERY, TRACK_SLUGS_QUERY } from '@/sanity/lib/queries'

type Props = { params: Promise<{ track: string }> }
type TrackPage = TrackData & { otherTracks: Array<{ title: string; slug: string; opens?: string | null }> }

export async function generateStaticParams() {
  const { data } = await sanityFetch({ query: TRACK_SLUGS_QUERY, perspective: 'published', stega: false })
  return ((data ?? []) as Array<{ slug: string | null }>)
    .filter((row): row is { slug: string } => Boolean(row.slug))
    .map((row) => ({ track: row.slug }))
}

async function loadTrack(slug: string): Promise<TrackPage | null> {
  const { data } = await sanityFetch({ query: TRACK_QUERY, params: { slug }, stega: false })
  return (data as TrackPage | null) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track: slug } = await params
  const track = await loadTrack(slug)
  if (!track) return { title: 'Track not found' }
  const path = trackPath(slug)
  const description = cleanDescription(track.intro)
  return {
    title: `${track.title} track | Silicon & Stone Learning`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${track.title}: Silicon to Sovereignty`, description, type: 'website', url: path },
  }
}

export default async function TrackPage({ params }: Props) {
  const { track: slug } = await params
  const track = await loadTrack(slug)
  if (!track) notFound()

  const slots = track.courses ?? []
  const courses = resolvedCourses(slots)
  const price = LEARN_PRICES[track.priceKey] ?? LEARN_PRICES.electives
  const opens = formatMonth(track.opens)
  const time = totalTime(courses)
  const trackSlug = (TRACK_SLUGS as readonly string[]).includes(track.slug) ? (track.slug as TrackSlug) : undefined
  const hasFree = courses.some((c) => c.level === 0)

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd
        data={[
          buildLearnBreadcrumbSchema([{ name: track.title, path: trackPath(track.slug) }]),
          buildCourseListSchema(courses),
        ]}
      />
      <Header />
      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[3fr_2fr]">
              <div>
                <LearnEyebrow>Track · {opens ? `Opens ${opens}` : 'Not yet scheduled'}</LearnEyebrow>
                <h1 className="mb-6 text-4xl font-bold text-text-primary sm:text-5xl">{track.title}</h1>
                <p className="mb-8 text-xl leading-relaxed text-text-muted">{track.intro}</p>
                <WaitlistForm id="hero" source="track" track={trackSlug} />
              </div>
              <div className="rounded-xl border border-stone-teal bg-stone-charcoal p-8">
                <h2 className="mb-1 text-lg font-semibold text-text-primary">Track price</h2>
                <p className="font-mono text-2xl text-silicon-amber-strong">{price.standard}</p>
                {price.founding && <p className="mt-1 font-mono text-stone-teal">{price.founding}</p>}
                <p className="mt-4 text-sm text-text-muted">{price.note}</p>
                {hasFree && (
                  <p className="mt-3 text-sm text-text-muted">The Level 0 courses in this track are free for everyone.</p>
                )}
                <p className="mt-3 text-sm text-text-muted">{CHARITY_LINE}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="mb-3 text-2xl font-semibold text-text-primary">The courses, in order</h2>
          <p className="mb-8 text-text-muted">
            {slots.length} {slots.length === 1 ? 'course' : 'courses'}
            {time ? `, ${time}` : ''}.
          </p>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot, index) => (
              <li key={slot._key} className="flex gap-3">
                <span className="mt-4 w-6 shrink-0 text-right font-mono text-sm text-stone-teal">{index + 1}.</span>
                <div className="flex-1">
                  {slot.course ? (
                    <CourseCard course={slot.course} showPromise />
                  ) : (
                    <div className="rounded-lg border border-dashed border-border-subtle p-4 text-sm italic text-text-muted">
                      In preparation
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-border-subtle bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">Other tracks</h2>
            <ul className="flex flex-wrap gap-3">
              {track.otherTracks.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={trackPath(other.slug)}
                    className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-stone-charcoal px-4 py-2 text-sm text-text-primary hover:border-stone-teal"
                  >
                    {other.title}
                    {other.opens && <span className="font-mono text-xs text-text-muted">{formatMonth(other.opens)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/learn" className="mt-6 inline-block text-stone-teal hover:underline">
              ← All of Silicon to Sovereignty
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
