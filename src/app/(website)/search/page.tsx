import Link from 'next/link'
import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sanityFetch } from '@/sanity/lib/live'
import { SEARCH_ARTICLES_QUERY } from '@/sanity/lib/queries'
import SearchForm from './SearchForm'

export const metadata: Metadata = {
  title: 'Search | Silicon and Stone',
  description: 'Search our archive of forensic technopolitics analysis.',
}

// Helper to format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Sanity Types (Simplified)
type SearchResult = {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt?: string
  contentType?: string
  categories?: { title: string }[]
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = typeof q === 'string' ? q : ''

  const { data: results } = await sanityFetch({
    query: SEARCH_ARTICLES_QUERY,
    // @ts-expect-error - defineQuery doesn't properly infer $query parameter type
    params: { query },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h1 className="text-3xl font-bold text-text-primary text-center mb-8">
              Search the Archive
            </h1>
            <SearchForm />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          {query ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-text-muted mb-4">
                Found {results.length} results for <span className="text-text-primary font-semibold">&ldquo;{query}&rdquo;</span>
              </div>

              {results.length > 0 ? (
                results.map((article: SearchResult) => (
                  <Card key={article._id} className="bg-stone-charcoal border-border-subtle hover:border-stone-teal/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {article.categories?.[0] && (
                              <Badge variant="secondary" className="bg-stone-teal/20 text-stone-teal text-xs">
                                {article.categories[0].title}
                              </Badge>
                            )}
                            {article.contentType && (
                              <Badge variant="outline" className="text-[10px] text-text-muted border-text-muted/30">
                                {article.contentType}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl font-semibold text-text-primary hover:text-stone-teal transition-colors">
                            <Link href={`/analysis/${article.slug}`}>{article.title}</Link>
                          </CardTitle>
                        </div>
                        {article.publishedAt && (
                          <time className="text-xs text-text-muted whitespace-nowrap hidden sm:block">
                            {formatDate(article.publishedAt)}
                          </time>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {article.excerpt && (
                        <p className="text-text-muted text-sm line-clamp-2">{article.excerpt}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-stone-charcoal/30 rounded-lg border border-border-subtle border-dashed">
                  <p className="text-text-muted">No analysis found matching your criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-text-muted">
              Type above to begin searching...
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
