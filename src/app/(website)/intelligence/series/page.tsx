import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { sanityFetch } from '@/sanity/lib/live'
import { SERIES_INDEX_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { seriesHref } from '@/lib/series'

/**
 * The series library.
 *
 * `alternates`, `title` and `description` are all set explicitly. Next
 * overwrites metadata field-by-field from the nearest ancestor that defines it,
 * and `intelligence/layout.tsx` hard-codes all three — inherited, every series
 * page would be titled "Intelligence" and canonicalised onto /intelligence,
 * deindexing the lot. Same trap the rule-pack provisions pages hit.
 */
export const metadata: Metadata = {
  title: 'Series | Silicon and Stone',
  description:
    'Reading paths through the intelligence archive — each one an ordered sequence of analysis on a single question, from the first piece to the latest.',
  alternates: { canonical: '/intelligence/series' },
}

type SeriesCategory = { _id: string; title: string; slug: string }

type SeriesSummary = {
  _id: string
  title: string
  slug: string
  standfirst?: string | null
  status?: string | null
  coverImage?: unknown
  featured?: boolean | null
  categories?: SeriesCategory[] | null
  partCount?: number | null
  publishedCount?: number | null
}

function partsLabel(total: number, published: number, status?: string | null): string {
  const parts = `${total} ${total === 1 ? 'part' : 'parts'}`
  // Only say "N published" when it differs — on a complete series the number
  // twice reads as an error rather than as information.
  if (published < total) return `${parts} · ${published} published`
  return status === 'complete' ? `${parts} · complete` : parts
}

export default async function SeriesIndexPage() {
  const { data } = await sanityFetch({ query: SERIES_INDEX_QUERY })
  const seriesList = (data ?? []) as SeriesSummary[]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-6 font-ui-mono text-xs text-text-muted">
          <Link href="/intelligence" className="hover:text-stone-teal">
            Intelligence
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">Series</span>
        </nav>

        <h1 className="font-statement text-3xl text-text-primary sm:text-4xl">Series</h1>
        <p className="mt-3 max-w-2xl text-base text-text-muted">
          The feed ranks by impact. A series does something the feed cannot: it puts the analysis
          in the order the argument was built, so you can follow one question from the start.
        </p>

        {seriesList.length === 0 ? (
          <p className="mt-12 rounded-lg border border-dashed border-border-subtle p-8 text-center text-sm text-text-muted">
            No series published yet.
          </p>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {seriesList.map((entry) => {
              const total = entry.partCount ?? 0
              const published = entry.publishedCount ?? 0
              const cover = entry.coverImage
                ? urlFor(entry.coverImage).width(800).height(450).url()
                : null

              return (
                <li key={entry._id}>
                  <Link
                    href={seriesHref(entry.slug)}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-stone-charcoal/50 transition-colors hover:border-stone-teal/30 hover:bg-stone-charcoal"
                  >
                    {cover && (
                      <div className="relative aspect-[16/9] w-full">
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-ui-mono text-xs uppercase tracking-wider text-stone-teal">
                          {partsLabel(total, published, entry.status)}
                        </span>
                        {entry.status !== 'complete' && (
                          <Badge variant="outline" className="text-[11px] text-text-muted border-text-muted/30">
                            In progress
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-text-primary transition-colors group-hover:text-stone-teal">
                        {entry.title}
                      </h2>
                      {entry.standfirst && (
                        <p className="mt-2 line-clamp-3 text-sm text-text-muted">{entry.standfirst}</p>
                      )}
                      {entry.categories && entry.categories.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 pt-1">
                          {entry.categories.map((category) => (
                            <Badge
                              key={category._id}
                              variant="secondary"
                              className="bg-stone-teal/20 text-stone-teal text-[11px]"
                            >
                              {category.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
