import Link from 'next/link'
import Image from 'next/image'

import { Header, Footer } from '@/components/layout'
import { DeadlineCountdown, ToolsGrid, SubscribeCTA, HeroSection } from '@/components/home'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { sanityFetch } from '@/sanity/lib/live'
import { FEATURED_ARTICLES_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'

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
  // Parallel fetching
  const [articlesRes, settingsRes] = await Promise.all([
    sanityFetch({ query: FEATURED_ARTICLES_QUERY }),
    sanityFetch({ query: SITE_SETTINGS_QUERY })
  ])

  const articles = articlesRes.data
  const siteSettings = settingsRes.data

  const featuredArticle = articles?.[0]
  const recentArticles = articles?.slice(1, 7) || []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection settings={siteSettings} />

        {/* Status Bar */}
        {/* Status Bar */}
        <section className="bg-stone-charcoal z-10 relative">
          <div className="mx-auto max-w-7xl">
            <DeadlineCountdown />
          </div>
        </section>

        {/* Strategies & Analysis */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Intelligence Stream</h2>
            <Link href="/analysis" className="text-sm font-medium text-stone-teal hover:text-silicon-amber transition-colors font-ui-mono">
              View content archive &rarr;
            </Link>
          </div>

          <StaggerContainer className="space-y-12">
            {/* Featured Article - Cinematic Layout */}
            {featuredArticle && (
              <StaggerItem className="group relative grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-8 relative aspect-video rounded-lg overflow-hidden bg-stone-charcoal border border-border-subtle tech-corners">
                  {featuredArticle.mainImage?.asset ? (
                    <Image
                      src={urlFor(featuredArticle.mainImage).width(1200).height(675).url()}
                      alt={featuredArticle.mainImage.alt || featuredArticle.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <Image
                      src="/intelligence-stream-bg.png"
                      alt="Intelligence Stream - Forensic Technopolitics"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                    />
                  )}
                  {/* Scanline overlay for featured */}
                  <div className="scanlines absolute inset-0 opacity-10 pointer-events-none" />
                </div>

                <div className="lg:col-span-4 flex flex-col justify-center h-full space-y-4">
                  <div className="flex items-center gap-3">
                    {featuredArticle.categories?.[0] && (
                      <Badge variant="secondary" className="bg-silicon-amber/10 text-silicon-amber border border-silicon-amber/20 hover:bg-silicon-amber/20">
                        {featuredArticle.categories[0].title}
                      </Badge>
                    )}
                    {featuredArticle.contentType && (
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                        {featuredArticle.contentType === 'deepdive' ? 'Deep Dive' :
                          featuredArticle.contentType === 'signal' ? 'Signal' : 'Guide'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-bold text-text-primary leading-tight group-hover:text-stone-teal transition-colors">
                    <Link href={`/analysis/${featuredArticle.slug}`}>
                      {featuredArticle.title}
                    </Link>
                  </h3>

                  {featuredArticle.excerpt && (
                    <p className="text-text-muted text-lg leading-relaxed">
                      {featuredArticle.excerpt}
                    </p>
                  )}

                  {featuredArticle.publishedAt && (
                    <div className="text-sm text-border-subtle font-mono pt-2 border-t border-border-subtle/30 mt-4 w-full">
                      {formatDate(featuredArticle.publishedAt)}
                    </div>
                  )}
                </div>
              </StaggerItem>
            )}

            {/* Recent Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 border-t border-border-subtle pt-12">
              {recentArticles.map((article: Article) => (
                <StaggerItem key={article._id}>
                  <article className="flex flex-col group h-full grid-hover p-4 -m-4 rounded-xl transition-colors hover:bg-white/[0.02]">
                    {article.mainImage?.asset && (
                      <div className="relative aspect-[3/2] rounded-md overflow-hidden bg-stone-charcoal mb-4 border border-border-subtle/50 group-hover:border-stone-teal/50 transition-colors">
                        <Image
                          src={urlFor(article.mainImage).width(600).height(400).url()}
                          alt={article.mainImage.alt || article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      {article.categories?.[0] && (
                        <span className="text-xs font-bold text-stone-teal uppercase tracking-wide font-ui-mono">
                          {article.categories[0].title}
                        </span>
                      )}
                      <span className="text-border-subtle text-xs">•</span>
                      {article.publishedAt && (
                        <span className="text-xs text-text-muted font-mono">
                          {formatShortDate(article.publishedAt)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-text-primary leading-snug mb-2 group-hover:text-stone-teal transition-colors">
                      <Link href={`/analysis/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    {article.excerpt && (
                      <p className="text-sm text-text-muted line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </article>
                </StaggerItem>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <Link href="/analysis">
                <Button variant="outline" className="min-w-[200px] border-border-subtle hover:bg-surface-elevated text-text-primary relative overflow-hidden group">
                  <span className="relative z-10">View All Analysis &rarr;</span>
                  <div className="absolute inset-0 bg-stone-teal/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </StaggerContainer>
        </section>

        {/* Tools Section */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <StaggerContainer delay={0.2}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">Interactive Tools</h2>
              <Link href="/tools" className="text-sm font-medium text-stone-teal hover:text-silicon-amber transition-colors font-ui-mono">
                Access toolbox &rarr;
              </Link>
            </div>
            <ToolsGrid />
          </StaggerContainer>
        </section>



        {/* Subscribe Band */}
        <section className="bg-surface-elevated border-y border-border-subtle relative">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="max-w-2xl">
              <SubscribeCTA />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
