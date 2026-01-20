import Link from 'next/link'
import Image from 'next/image'

import { Header, Footer } from '@/components/layout'
import { DeadlineCountdown, ToolsGrid, SubscribeCTA } from '@/components/home'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { sanityFetch } from '@/sanity/lib/live'
import { FEATURED_ARTICLES_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

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
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default async function Home() {
  const { data: articles } = await sanityFetch({ query: FEATURED_ARTICLES_QUERY })

  const featuredArticle = articles?.[0]
  const recentArticles = articles?.slice(1, 4) || []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-deep">
          <div className="absolute inset-0 bg-gradient-to-br from-stone-charcoal/50 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-32">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                Forensic Technopolitics
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                Analysis from the{' '}
                <span className="text-silicon-amber">Edge</span>
              </h1>
              <p className="mt-6 text-lg text-text-muted">
                Navigating the collision of Silicon speed and Stone reality.
                Forensic analysis of US, European, and Asian technopolitics for decision-makers
                and digital citizens alike, delivered from the Atlantic Edge.
              </p>
              <div className="mt-8 flex gap-4">
                <Link href="/analysis">
                  <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
                    Start Reading
                  </Button>
                </Link>
                <Link href="/tools">
                  <Button variant="outline" className="border-stone-teal text-stone-teal hover:bg-stone-teal/10">
                    Explore Tools
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - Bento Grid */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Featured Articles */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Latest Analysis</h2>
                <Link href="/analysis" className="text-sm text-stone-teal hover:text-silicon-amber">
                  View all &rarr;
                </Link>
              </div>

              {/* Featured Article - Large */}
              {featuredArticle ? (
                <Card className="bg-stone-charcoal border-border-subtle overflow-hidden">
                  {featuredArticle.mainImage?.asset ? (
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={urlFor(featuredArticle.mainImage).width(800).height(450).url()}
                        alt={featuredArticle.mainImage.alt || featuredArticle.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-surface-elevated to-stone-charcoal" />
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {featuredArticle.categories?.[0] && (
                        <Badge variant="secondary" className="bg-silicon-amber/20 text-silicon-amber">
                          {featuredArticle.categories[0].title}
                        </Badge>
                      )}
                      {featuredArticle.contentType && (
                        <Badge variant="outline" className="text-text-muted border-text-muted/30">
                          {featuredArticle.contentType === 'deepdive' ? 'Deep Dive' :
                            featuredArticle.contentType === 'signal' ? 'Signal' : 'Guide'}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-semibold text-text-primary hover:text-silicon-amber transition-colors">
                      <Link href={`/analysis/${featuredArticle.slug}`}>
                        {featuredArticle.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {featuredArticle.excerpt && (
                      <p className="text-text-muted">{featuredArticle.excerpt}</p>
                    )}
                    {featuredArticle.publishedAt && (
                      <p className="text-xs text-text-muted mt-4">
                        {formatDate(featuredArticle.publishedAt)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-stone-charcoal border-border-subtle overflow-hidden">
                  <div className="aspect-[16/9] bg-gradient-to-br from-surface-elevated to-stone-charcoal" />
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-text-primary">
                      Coming Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-muted">
                      Analysis on AI regulation, semiconductors, and digital sovereignty.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Recent Articles - Grid */}
              {recentArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentArticles.map((article: Article) => (
                    <Card key={article._id} className="bg-stone-charcoal border-border-subtle">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-2">
                          {article.categories?.[0] && (
                            <Badge variant="secondary" className="bg-stone-teal/20 text-stone-teal text-xs">
                              {article.categories[0].title}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-medium text-text-primary hover:text-stone-teal transition-colors">
                          <Link href={`/analysis/${article.slug}`}>{article.title}</Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {article.excerpt && (
                          <p className="text-sm text-text-muted line-clamp-2">{article.excerpt}</p>
                        )}
                        {article.publishedAt && (
                          <p className="text-xs text-text-muted mt-3">
                            {formatShortDate(article.publishedAt)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Widgets */}
            <div className="space-y-6">
              {/* Deadline Countdown */}
              <DeadlineCountdown />

              {/* Subscribe CTA */}
              <SubscribeCTA />
            </div>
          </div>

          {/* Tools Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Interactive Tools</h2>
              <Link href="/tools" className="text-sm text-stone-teal hover:text-silicon-amber">
                View all tools &rarr;
              </Link>
            </div>
            <ToolsGrid />
          </div>
        </section>

        {/* Methodology Teaser */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="text-center max-w-2xl mx-auto">
              <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber">
                Methodology
              </Badge>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Forensic Technopolitics
              </h2>
              <p className="text-text-muted mb-6">
                Our analysis framework combines Supply Chain Forensics, Comparative Policy
                Stress-Testing, Scenario-Based Drift Modeling, and Experience-Led Signal Filtering.
              </p>
              <Link href="/methodology">
                <Button variant="outline" className="border-stone-teal text-stone-teal hover:bg-stone-teal/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
