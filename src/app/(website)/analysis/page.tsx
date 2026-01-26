import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sanityFetch } from '@/sanity/lib/live'
import { ARTICLES_QUERY, CATEGORIES_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
                    <Card
                      key={article._id}
                      className="bg-stone-charcoal border-border-subtle overflow-hidden hover:border-stone-teal/50 transition-colors"
                    >
                      {article.mainImage?.asset && (
                        <div className="relative aspect-[16/9]">
                          <Image
                            src={urlFor(article.mainImage).width(600).height(338).url()}
                            alt={article.mainImage.alt || article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {article.categories?.slice(0, 2).map((category: Category) => (
                            <Badge
                              key={category._id}
                              variant="secondary"
                              className="bg-stone-teal/20 text-stone-teal text-xs"
                            >
                              {category.title}
                            </Badge>
                          ))}
                          {article.contentType && (
                            <Badge
                              variant="outline"
                              className="text-text-muted border-text-muted/30 text-xs"
                            >
                              {article.contentType === 'deepdive' ? 'Deep Dive' :
                                article.contentType === 'signal' ? 'Signal' : 'Guide'}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg font-semibold text-text-primary hover:text-silicon-amber transition-colors">
                          <Link href={`/analysis/${article.slug}`}>{article.title}</Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {article.excerpt && (
                          <p className="text-sm text-text-muted line-clamp-2 mb-3">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          {article.author && <span>{article.author.name}</span>}
                          {article.publishedAt && (
                            <>
                              <span className="text-border-subtle">|</span>
                              <time dateTime={article.publishedAt}>
                                {formatDate(article.publishedAt)}
                              </time>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
