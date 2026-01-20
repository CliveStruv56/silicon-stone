import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sanityFetch } from '@/sanity/lib/live'
import { CATEGORY_QUERY, ARTICLES_BY_CATEGORY_QUERY, CATEGORIES_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

type Props = {
  params: Promise<{ slug: string }>
}

type Category = {
  _id: string
  title: string
  slug: string
  description?: string
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: category } = await sanityFetch({
    query: CATEGORY_QUERY,
    params: { slug },
    stega: false,
  })

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${category.title} | Analysis | Silicon and Stone`,
    description: category.description || `Articles about ${category.title}`,
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params

  const [{ data: category }, { data: categories }] = await Promise.all([
    sanityFetch({ query: CATEGORY_QUERY, params: { slug } }),
    sanityFetch({ query: CATEGORIES_QUERY }),
  ])

  if (!category) {
    notFound()
  }

  const { data: articles } = await sanityFetch({
    query: ARTICLES_BY_CATEGORY_QUERY,
    params: { categoryId: category._id },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
              <Link href="/analysis" className="hover:text-stone-teal">
                Analysis
              </Link>
              <span>/</span>
              <span className="text-text-primary">{category.title}</span>
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-4">{category.title}</h1>
            {category.description && (
              <p className="text-lg text-text-muted max-w-2xl">{category.description}</p>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                  Categories
                </h2>
                <nav className="space-y-2">
                  <Link
                    href="/analysis"
                    className="block py-2 px-3 rounded-md text-text-muted hover:text-text-primary hover:bg-stone-charcoal/50 transition-colors"
                  >
                    All Articles
                  </Link>
                  {categories?.map((cat: Category) => (
                    <Link
                      key={cat._id}
                      href={`/analysis/category/${cat.slug}`}
                      className={`block py-2 px-3 rounded-md transition-colors ${
                        cat.slug === slug
                          ? 'text-text-primary bg-stone-charcoal/50'
                          : 'text-text-muted hover:text-text-primary hover:bg-stone-charcoal/50'
                      }`}
                    >
                      {cat.title}
                    </Link>
                  ))}
                </nav>
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
                          {article.categories?.slice(0, 2).map((cat: Category) => (
                            <Badge
                              key={cat._id}
                              variant="secondary"
                              className="bg-stone-teal/20 text-stone-teal text-xs"
                            >
                              {cat.title}
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
                  <p className="text-text-muted mb-4">No articles in this category yet.</p>
                  <Link href="/analysis" className="text-stone-teal hover:text-silicon-amber">
                    &larr; View all articles
                  </Link>
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
