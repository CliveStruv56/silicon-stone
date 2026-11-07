import Link from 'next/link'
import type { Metadata } from 'next'
import { after } from 'next/server'
import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sanityFetch } from '@/sanity/lib/live'
import { SEARCH_ARTICLES_QUERY, SEARCH_GLOSSARY_QUERY, SEARCH_SITE_DOCS_QUERY } from '@/sanity/lib/queries'
import SearchForm from './SearchForm'
import { formatDate } from '@/lib/format'
import { SITE_PAGES, type SitePageKind } from '@/lib/search/site-pages'
import { normaliseQuery, searchSitePages } from '@/lib/search/keyword'
import { recordZeroResult } from '@/lib/search/zero-results'

export const metadata: Metadata = {
  title: 'Search | Silicon and Stone',
  description: 'Search our archive of forensic technopolitics analysis.',
  alternates: { canonical: '/search' },
  // Result pages are an unbounded set of thin, query-shaped URLs. Links on them
  // are still worth following; the pages themselves are not worth indexing.
  robots: { index: false, follow: true },
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

type SiteDocsResult = {
  series?: Array<{ _id: string; title: string; slug: string; standfirst?: string | null }>
  authors?: Array<{ _id: string; name: string; slug: string; role?: string | null }>
  products?: Array<{ _id: string; name: string; productPath: string; blurb?: string | null }>
}

/** One row in the "Tools & pages" group, whatever it came from. */
type PageHit = { key: string; href: string; title: string; description?: string | null; label: string }

const KIND_LABELS: Record<SitePageKind | 'author', string> = {
  tool: 'Tool',
  product: 'Product',
  advisory: 'Advisory',
  guide: 'Guide',
  page: 'Page',
  author: 'Author',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = normaliseQuery(typeof q === 'string' ? q : '')

  const [{ data: articleData }, { data: glossaryData }, { data: docsData }] = query
    ? await Promise.all([
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
        sanityFetch({
          query: SEARCH_SITE_DOCS_QUERY,
          // @ts-expect-error - defineQuery doesn't properly infer $query parameter type
          params: { query },
        }),
      ])
    : [{ data: [] }, { data: [] }, { data: {} }]

  const results = (articleData ?? []) as SearchResult[]
  const glossaryResults = (glossaryData ?? []) as GlossarySearchResult[]
  const docs = (docsData ?? {}) as SiteDocsResult
  const seriesResults = docs.series ?? []

  // Hand-built pages first (they are what people most often mean), then Sanity
  // products not already listed, then authors. Registry order breaks ties.
  const pageHits: PageHit[] = query
    ? searchSitePages(query, SITE_PAGES).map((p) => ({
        key: p.path,
        href: p.path,
        title: p.title,
        description: p.description,
        label: KIND_LABELS[p.kind],
      }))
    : []
  const shown = new Set(pageHits.map((h) => h.href))
  for (const product of docs.products ?? []) {
    if (shown.has(product.productPath)) continue
    shown.add(product.productPath)
    pageHits.push({
      key: product._id,
      href: product.productPath,
      title: product.name,
      description: product.blurb,
      label: KIND_LABELS.product,
    })
  }
  for (const author of docs.authors ?? []) {
    pageHits.push({
      key: author._id,
      href: `/authors/${author.slug}`,
      title: author.name,
      description: author.role,
      label: KIND_LABELS.author,
    })
  }

  const total = pageHits.length + seriesResults.length + results.length + glossaryResults.length

  // Record what readers looked for and did not find: the query text alone.
  // after() so the write never delays the page.
  if (query && total === 0) {
    after(() => recordZeroResult(query))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
            <h1 className="text-3xl font-bold text-text-primary text-center mb-8">
              Search the Site
            </h1>
            <SearchForm />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          {query ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-text-muted mb-4">
                Found {total} results for <span className="text-text-primary font-semibold">&ldquo;{query}&rdquo;</span>
              </div>

              {pageHits.length > 0 && (
                <section aria-labelledby="page-results-heading">
                  <div className="mb-3 flex items-center gap-3">
                    <h2 id="page-results-heading" className="font-statement text-lg font-semibold text-text-primary">
                      Tools &amp; pages
                    </h2>
                    <Badge variant="outline" className="font-mono text-xs text-text-muted">
                      {pageHits.length}
                    </Badge>
                  </div>
                  <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-stone-charcoal">
                    {pageHits.map((hit) => (
                      <Link
                        key={hit.key}
                        href={hit.href}
                        className="block px-5 py-4 transition-colors hover:bg-surface-elevated"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-stone-teal">{hit.title}</span>
                          <Badge variant="outline" className="text-[12px] text-text-muted border-text-muted/30">
                            {hit.label}
                          </Badge>
                        </div>
                        {hit.description && (
                          <p className="mt-1 text-sm leading-relaxed text-text-muted line-clamp-2">{hit.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(seriesResults.length > 0 || results.length > 0) && (
                <section aria-labelledby="analysis-results-heading" className="space-y-4">
                  <h2 id="analysis-results-heading" className="font-statement text-lg font-semibold text-text-primary">
                    Analysis
                  </h2>
                  {seriesResults.map((series) => (
                    <Card key={series._id} className="bg-stone-charcoal border-border-subtle hover:border-stone-teal/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[12px] text-text-muted border-text-muted/30">
                            Series
                          </Badge>
                        </div>
                        <CardTitle className="text-xl font-semibold text-text-primary hover:text-stone-teal transition-colors">
                          <Link href={`/intelligence/series/${series.slug}`}>{series.title}</Link>
                        </CardTitle>
                      </CardHeader>
                      {series.standfirst && (
                        <CardContent>
                          <p className="text-text-muted text-sm line-clamp-2">{series.standfirst}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
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
                        href={`/glossary/${term.slug}`}
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

              {total === 0 && (
                <div className="text-center py-10 bg-stone-charcoal/30 rounded-lg border border-border-subtle border-dashed">
                  <p className="text-text-muted">Nothing on the site matched those words.</p>
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
