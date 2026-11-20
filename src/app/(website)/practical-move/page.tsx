import Link from 'next/link'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleGridCard, type ArticleCardData } from '@/components/article/ArticleGridCard'
import { sanityFetch } from '@/sanity/lib/live'
import { PRACTICAL_MOVES_QUERY } from '@/sanity/lib/queries'
import { buildPageBreadcrumbSchema } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

/**
 * The Practical Move index: every published article stored as contentType
 * "guide", newest first. Title, description and canonical are all set
 * explicitly so nothing is inherited from a parent layout.
 */
export const metadata: Metadata = {
  title: 'Practical Move | Silicon and Stone',
  description:
    'The Friday Practical Move: what to do about it. Each edition takes one development from the week and turns it into a decision you can act on.',
  alternates: { canonical: '/practical-move' },
  openGraph: {
    title: 'Practical Move | Silicon and Stone',
    description:
      'The Friday Practical Move: what to do about it. Each edition takes one development from the week and turns it into a decision you can act on.',
    type: 'website',
    url: '/practical-move',
  },
}

export default async function PracticalMovePage() {
  const { data } = await sanityFetch({ query: PRACTICAL_MOVES_QUERY })
  const moves = (data ?? []) as unknown as ArticleCardData[]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <JsonLd
        data={[
          buildPageBreadcrumbSchema({ name: 'Practical Move', path: '/practical-move' }),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Practical Move',
            url: absoluteUrl('/practical-move'),
          },
        ]}
      />

      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
              <Link href="/intelligence" className="hover:text-stone-teal">
                Intelligence
              </Link>
              <span>/</span>
              <span className="text-text-primary">Practical Move</span>
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-4">Practical Move</h1>
            <p className="text-lg text-text-muted max-w-2xl">
              Friday: the Practical Move, what to do about it. Newest first.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          {moves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="practical-move-list">
              {moves.map((move) => (
                <ArticleGridCard key={move._id} article={move} showAuthor />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border-subtle p-10 text-center" data-testid="practical-move-empty">
              <p className="text-text-muted mb-4">No Practical Moves published yet.</p>
              <Link href="/intelligence" className="text-stone-teal hover:text-silicon-amber-strong">
                Read the latest intelligence &rarr;
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
