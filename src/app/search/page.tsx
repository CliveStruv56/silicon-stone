import Link from 'next/link'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sanityFetch } from '@/sanity/lib/live'
import { SEARCH_ARTICLES_QUERY } from '@/sanity/lib/queries'
import { SearchForm } from './SearchForm'

export const metadata: Metadata = {
  title: 'Search | Silicon and Stone',
  description: 'Search for analysis on AI regulation, semiconductor supply chains, and digital sovereignty.',
}

type Props = {
  searchParams: Promise<{ q?: string }>
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
  categories?: Category[]
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: searchQuery } = await searchParams

  let articles: Article[] | null = null
  if (searchQuery && searchQuery.trim()) {
    const { data } = await sanityFetch({
      query: SEARCH_ARTICLES_QUERY,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: { query: searchQuery.trim() } as any,
    })
    articles = data as Article[]
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Search</h1>
            <SearchForm initialQuery={searchQuery || ''} />
          </div>
        </section>

        {/* Results */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          {searchQuery ? (
            <>
              <p className="text-text-muted mb-6">
                {articles && articles.length > 0
                  ? `Found ${articles.length} result${articles.length === 1 ? '' : 's'} for "${searchQuery}"`
                  : `No results found for "${searchQuery}"`}
              </p>

              {articles && articles.length > 0 ? (
                <div className="space-y-4">
                  {articles.map((article: Article) => (
                    <Card
                      key={article._id}
                      className="bg-stone-charcoal border-border-subtle hover:border-stone-teal/50 transition-colors"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {article.categories?.map((category: Category) => (
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
                          <p className="text-sm text-text-muted mb-3">{article.excerpt}</p>
                        )}
                        {article.publishedAt && (
                          <time
                            dateTime={article.publishedAt}
                            className="text-xs text-text-muted"
                          >
                            {formatDate(article.publishedAt)}
                          </time>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-muted mb-4">
                    Try searching for different keywords or browse our{' '}
                    <Link href="/analysis" className="text-stone-teal hover:text-silicon-amber">
                      analysis archive
                    </Link>
                    .
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-muted">
                Enter a search term to find articles on AI regulation, semiconductors, and digital sovereignty.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
