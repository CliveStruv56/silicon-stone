import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { sanityFetch } from '@/sanity/lib/live'
import { CATEGORY_QUERY, ARTICLES_BY_CATEGORY_QUERY, CATEGORIES_QUERY } from '@/sanity/lib/queries'
import { ArticleGridCard } from '@/components/article/ArticleGridCard'

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
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
              <Link href="/intelligence" className="hover:text-stone-teal">
                Intelligence
              </Link>
              <span>/</span>
              <span className="text-text-primary">{category.title}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-text-primary mb-4">{category.title}</h1>
                {category.description && (
                  <p className="text-lg text-text-muted max-w-2xl">{category.description}</p>
                )}
              </div>

              {/* Regional Indicators Logic */}
              {slug === 'us-technopolitics' && (
                <div className="flex gap-4 p-4 bg-stone-charcoal/50 border border-border-subtle rounded-lg">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Drift Score</div>
                    <div className="text-xl font-bold text-alert-red">High</div>
                  </div>
                  <div className="w-px bg-border-subtle" />
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Focus</div>
                    <div className="text-xl font-bold text-text-primary">Exec. Orders</div>
                  </div>
                </div>
              )}
              {slug === 'european-sovereignty' && (
                <div className="flex gap-4 p-4 bg-stone-charcoal/50 border border-border-subtle rounded-lg">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Compliance Load</div>
                    <div className="text-xl font-bold text-stone-teal">Extreme</div>
                  </div>
                  <div className="w-px bg-border-subtle" />
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Next Deadline</div>
                    <div className="text-xl font-bold text-text-primary">Watermarking (Dec)</div>
                  </div>
                </div>
              )}
              {slug === 'asian-innovation' && (
                <div className="flex gap-4 p-4 bg-stone-charcoal/50 border border-border-subtle rounded-lg">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Supply Risk</div>
                    <div className="text-xl font-bold text-silicon-amber">Critical</div>
                  </div>
                  <div className="w-px bg-border-subtle" />
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Hotspot</div>
                    <div className="text-xl font-bold text-text-primary">Taiwan Strait</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                  Categories
                </h2>
                <nav className="space-y-2">
                  <Link
                    href="/intelligence"
                    className="block py-2 px-3 rounded-md text-text-muted hover:text-text-primary hover:bg-stone-charcoal/50 transition-colors"
                  >
                    All Articles
                  </Link>
                  {categories?.map((cat: Category) => (
                    <Link
                      key={cat._id}
                      href={`/analysis/category/${cat.slug}`}
                      className={`block py-2 px-3 rounded-md transition-colors ${cat.slug === slug
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
                    <ArticleGridCard key={article._id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-text-muted mb-4">No articles in this category yet.</p>
                  <Link href="/intelligence" className="text-stone-teal hover:text-silicon-amber">
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
