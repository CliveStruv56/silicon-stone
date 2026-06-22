import Link from 'next/link'
import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sanityFetch } from '@/sanity/lib/live'
import { SEARCH_ARTICLES_QUERY, SEARCH_GLOSSARY_QUERY } from '@/sanity/lib/queries'
import SearchForm from './SearchForm'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Search | Silicon and Stone',
  description: 'Search our archive of forensic technopolitics analysis.',
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

type GlossarySearchResult = {
  _id: string
  name: string
  slug: string
  acronym?: string
  kind: string
  definition: string
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = typeof q === 'string' ? q : ''

  const [{ data: articleData }, { data: glossaryData }] = await Promise.all([
    sanityFetch({
      query: SEARCH_ARTICLES_QUERY,
      // @ts-expect-error - defineQuery doesn't properly infer $query parameter type
      params: { query },
    }),
    sanityFetch({
      query: SEARCH_GLOSSARY_QUERY,
      // @ts-expect-error - defineQuery doesn't properly infer $query parameter type
      params: { query },
    }),
  ])
  const results = articleData ?? []
  const glossaryResults = (glossaryData ?? []) as GlossarySearchResult[]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
            <h1 className="text-3xl font-bold text-text-primary text-center mb-8">
              Search the Archive
            </h1>
            <SearchForm />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          {query ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-text-muted mb-4">
                Found {results.length + glossaryResults.length} results for <span className="text-text-primary font-semibold">&ldquo;{query}&rdquo;</span>
              </div>

              {glossaryResults.length > 0 && (
                <section aria-labelledby="glossary-results-heading">
                  <div className="mb-3 flex items-center gap-3">
                    <h2 id="glossary-results-heading" className="font-statement text-lg font-semibold text-text-primary">
                      Glossary
                    </h2>
                    <Badge variant="outline" className="font-mono text-xs text-text-muted">
                      {glossaryResults.length}
                    </Badge>
                  </div>
                  <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-stone-charcoal">
                    {glossaryResults.map((term) => (
                      <Link
                        key={term._id}
                        href={`/glossary#${term.slug}`}
                        className="grid gap-1 px-5 py-4 transition-colors hover:bg-surface-elevated sm:grid-cols-[12rem_1fr] sm:gap-6"
                      >
                        <div className="font-semibold text-stone-teal">
                          {term.acronym || term.name}
                          {term.acronym && <span className="block text-xs font-normal text-text-muted">{term.name}</span>}
                        </div>
                        <p className="text-sm leading-relaxed text-text-muted">{term.definition}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.length > 0 && (
                <section aria-labelledby="analysis-results-heading" className="space-y-4">
                  <h2 id="analysis-results-heading" className="font-statement text-lg font-semibold text-text-primary">
                    Analysis
                  </h2>
                  {results.map((article: SearchResult) => (
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
                              <Badge variant="outline" className="text-[12px] text-text-muted border-text-muted/30">
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
                  ))}
                </section>
              )}

              {results.length === 0 && glossaryResults.length === 0 && (
                <div className="text-center py-10 bg-stone-charcoal/30 rounded-lg border border-border-subtle border-dashed">
                  <p className="text-text-muted">No analysis or glossary terms matched your search.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-14 text-text-muted">
              Type above to begin searching...
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
