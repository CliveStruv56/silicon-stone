import Link from 'next/link'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { sanityFetch } from '@/sanity/lib/live'
import { ARTICLES_QUERY, CATEGORIES_QUERY } from '@/sanity/lib/queries'
import { ArticleGridCard } from '@/components/article/ArticleGridCard'

export const metadata: Metadata = {
  title: 'Analysis | Silicon and Stone',
  description: 'Deep analysis on AI regulation, semiconductor supply chains, and digital sovereignty.',
}

type Category = {
  _id: string
  title: string
  slug: string
}

type Article = {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt?: string
  contentType?: string
  mainImage?: {
    asset?: { _ref: string }
    alt?: string
  }
  categories?: Category[]
  author?: {
    name: string
    image?: unknown
  }
}

export default async function AnalysisPage() {
  const [{ data: articles }, { data: categories }] = await Promise.all([
    sanityFetch({ query: ARTICLES_QUERY }),
    sanityFetch({ query: CATEGORIES_QUERY }),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <h1 className="text-3xl font-bold text-text-primary mb-4">Analysis</h1>
            <p className="text-lg text-text-muted max-w-2xl">
              Deep analysis on AI regulation, semiconductor supply chains, digital sovereignty,
              and the Atlantic drift between US and EU policy.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                    Categories
                  </h2>
                  <nav className="space-y-2">
                    <Link
                      href="/analysis"
                      className="block py-2 px-3 rounded-md text-text-primary bg-stone-charcoal/50"
                    >
                      All Articles
                    </Link>
                    {categories?.map((category: Category) => (
                      <Link
                        key={category._id}
                        href={`/analysis/category/${category.slug}`}
                        className="block py-2 px-3 rounded-md text-text-muted hover:text-text-primary hover:bg-stone-charcoal/50 transition-colors"
                      >
                        {category.title}
                      </Link>
                    ))}
                  </nav>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                    Articles
                  </h2>
                  <nav className="space-y-2">
                    {articles?.slice(0, 10).map((article: Article) => (
                      <Link
                        key={article._id}
                        href={`/analysis/${article.slug}`}
                        className="block py-1.5 px-3 text-sm text-text-muted hover:text-stone-teal hover:border-l-2 hover:border-stone-teal transition-all truncate"
                      >
                        {article.title}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Articles Grid */}
            <div className="lg:col-span-3">
              {articles && articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.map((article: Article) => (
                    <ArticleGridCard key={article._id} article={article} showAuthor />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-muted mb-4">No articles published yet.</p>
                  <p className="text-sm text-text-muted">
                    Check back soon for analysis on AI regulation, semiconductors, and digital sovereignty.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
