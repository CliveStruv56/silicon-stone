import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeriesPartList } from '@/components/series/SeriesPartList'
import { SeriesResumeButton } from '@/components/series/SeriesResumeButton'
import { sanityFetch } from '@/sanity/lib/live'
import { SERIES_QUERY, SERIES_SLUGS_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { buildSeriesSchema, buildSeriesBreadcrumbSchema, cleanDescription } from '@/lib/seo'
import { publishedParts, totalParts, type SeriesPart } from '@/lib/series'

type Props = { params: Promise<{ slug: string }> }

// Hand-maintained, like every other GROQ result type here — this repo has no
// Sanity TypeGen, so `npm run check` is what catches drift between these and
// the projections in queries.ts.
type SeriesCategory = { _id: string; title: string; slug: string }

type SeriesSlugRow = { slug: string | null; _updatedAt?: string }

export async function generateStaticParams() {
  const { data } = await sanityFetch({
    query: SERIES_SLUGS_QUERY,
    perspective: 'published',
    stega: false,
  })
  return ((data ?? []) as SeriesSlugRow[])
    .filter((entry): entry is SeriesSlugRow & { slug: string } => Boolean(entry?.slug))
    .map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: series } = await sanityFetch({ query: SERIES_QUERY, params: { slug }, stega: false })
  if (!series) return { title: 'Series not found' }

  const path = `/intelligence/series/${slug}`
  const description = cleanDescription(series.seo?.metaDescription || series.standfirst)

  return {
    title: series.seo?.metaTitle || `${series.title} | Series | Silicon and Stone`,
    description,
    // The parent layout hard-codes a title, a description AND a canonical
    // pointing at /intelligence. Next overwrites metadata field-by-field from
    // the nearest ancestor that sets it, so inherited, every series page would
    // be titled "Intelligence" and canonicalised onto the feed — deindexing all
    // of them. Each page sets its own, the same fix the rule-pack provisions
    // pages carry.
    alternates: { canonical: path },
    openGraph: {
      title: series.title,
      description,
      url: path,
      type: 'website',
    },
  }
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params
  const { data: series } = await sanityFetch({ query: SERIES_QUERY, params: { slug } })
  if (!series) notFound()

  const parts = (series.parts ?? []) as SeriesPart[]
  const total = totalParts(parts)
  const published = publishedParts(parts)
  const cover = series.coverImage ? urlFor(series.coverImage).width(1600).height(900).url() : null

  // Only the slots that resolve become hasPart, but each keeps its REAL part
  // number rather than its index among the published ones — the position is the
  // number, and filtering must not renumber.
  const schemaParts = parts
    .map((part, index) => ({ part, position: index + 1 }))
    .filter(({ part }) => Boolean(part.article))
    .map(({ part, position }) => ({
      title: part.article!.title,
      slug: part.article!.slug,
      position,
    }))

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={buildSeriesSchema({
          title: series.title,
          slug,
          description: series.standfirst,
          imageUrl: cover,
          _updatedAt: series._updatedAt,
          parts: schemaParts,
        })}
      />
      <JsonLd data={buildSeriesBreadcrumbSchema({ title: series.title, slug })} />
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-6 font-ui-mono text-xs text-text-muted">
          <Link href="/intelligence" className="hover:text-stone-teal">
            Intelligence
          </Link>
          <span className="mx-2">/</span>
          <Link href="/intelligence/series" className="hover:text-stone-teal">
            Series
          </Link>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-ui-mono text-xs uppercase tracking-wider text-stone-teal">
              {total} {total === 1 ? 'part' : 'parts'}
              {published < total ? ` · ${published} published` : ''}
            </span>
            {series.status !== 'complete' && (
              <Badge variant="outline" className="text-[11px] text-text-muted border-text-muted/30">
                In progress
              </Badge>
            )}
          </div>

          <h1 className="font-statement text-3xl text-text-primary sm:text-4xl">{series.title}</h1>

          {series.standfirst && (
            <p className="mt-4 font-serif text-lg italic text-text-muted">{series.standfirst}</p>
          )}

          {series.categories && series.categories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {(series.categories as SeriesCategory[]).map((category) => (
                <Link key={category._id} href={`/analysis/category/${category.slug}`}>
                  <Badge
                    variant="secondary"
                    className="bg-stone-teal/20 text-stone-teal hover:bg-stone-teal/30"
                  >
                    {category.title}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {cover && (
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-lg">
              <Image
                src={cover}
                alt=""
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="mt-8">
            <SeriesResumeButton seriesSlug={slug} parts={parts} />
          </div>
        </header>

        <section>
          <h2 className="mb-5 font-ui-mono text-sm uppercase tracking-wider text-text-muted">
            In this series
          </h2>
          <SeriesPartList seriesSlug={slug} parts={parts} />
        </section>
      </main>

      <Footer />
    </div>
  )
}
