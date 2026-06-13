import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  portableTextComponents,
  PulseHeader,
  MethodologyChecklist,
  DynamicCTA,
} from '@/components/article'
import { RelatedArticles } from '@/components/article/RelatedArticles'
import { JsonLd } from '@/components/seo/JsonLd'
import { sanityFetch } from '@/sanity/lib/live'
import { ARTICLE_QUERY, ARTICLE_SLUGS_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { getPersonaLabel } from '@/lib/personas'
import { formatDate } from '@/lib/format'
import { absoluteUrl } from '@/lib/site'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  cleanDescription,
} from '@/lib/seo'

type Props = {
  params: Promise<{ slug: string }>
}

type Category = {
  _id: string
  title: string
  slug: string
}

export async function generateStaticParams() {
  const { data } = await sanityFetch({
    query: ARTICLE_SLUGS_QUERY,
    perspective: 'published',
    stega: false,
  })

  return data?.map((article: { slug: string }) => ({
    slug: article.slug,
  })) || []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: article } = await sanityFetch({
    query: ARTICLE_QUERY,
    params: { slug },
    stega: false,
  })

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  const title = article.seo?.metaTitle || `${article.title} | Silicon and Stone`
  const description = cleanDescription(
    article.seo?.metaDescription || article.stoneTruth || article.excerpt
  )
  const canonicalPath = `/analysis/${slug}`
  const tags = article.categories?.map((category: Category) => category.title)

  // og:image / twitter:image are auto-injected from opengraph-image.tsx.
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalPath,
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article._updatedAt || article.publishedAt || undefined,
      ...(tags && tags.length ? { tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

type PortableTextBlock = {
  _type?: string
  children?: Array<{ text?: string }>
}

function getReadingTime(body: PortableTextBlock[]): number {
  if (!body) return 0

  // Rough estimate: count words in text blocks
  const text = body
    .filter((block) => block._type === 'block')
    .map((block) =>
      block.children?.map((child) => child.text || '').join(' ') || ''
    )
    .join(' ')

  const words = text.split(/\s+/).length
  return Math.ceil(words / 200) // Average reading speed
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const { data: article } = await sanityFetch({
    query: ARTICLE_QUERY,
    params: { slug },
  })

  if (!article) {
    notFound()
  }

  const readingTime = getReadingTime(article.body || [])
  const primaryPersona = article.personas?.[0]
  const hasIntelligenceFields = article.intelligenceTier || article.impactScore || article.stoneTruth

  // Show a visible "Updated" date only when an editor set updatedAt after publish.
  const updatedDate =
    article.updatedAt &&
    article.publishedAt &&
    new Date(article.updatedAt).getTime() > new Date(article.publishedAt).getTime()
      ? article.updatedAt
      : null

  const schemaInput = {
    title: article.title,
    slug: article.slug,
    description: cleanDescription(
      article.seo?.metaDescription || article.stoneTruth || article.excerpt
    ),
    publishedAt: article.publishedAt,
    // Prefer the editorial updatedAt; fall back to the system timestamp.
    _updatedAt: article.updatedAt || article._updatedAt,
    contentType: article.contentType,
    imageUrl: article.mainImage?.asset
      ? urlFor(article.mainImage).width(1200).height(630).url()
      : absoluteUrl('/homepage-redesign-2026/the-watcher.png'),
    author: article.author
      ? {
          name: article.author.name,
          slug: article.author.slug,
          sameAs: article.author.sameAs,
        }
      : null,
    categories: article.categories,
    citations: article.citations,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <JsonLd
        data={[buildArticleSchema(schemaInput), buildBreadcrumbSchema(schemaInput)]}
      />

      <main className="flex-1">
        {/* Article Header */}
        <article className="mx-auto max-w-4xl px-6 py-10 lg:px-8 lg:py-12">
          {/* Pulse Header - Intelligence Portal metadata */}
          {hasIntelligenceFields && (
            <PulseHeader
              impactScore={article.impactScore}
              stoneTruth={article.stoneTruth}
              primaryPersona={primaryPersona}
              intelligenceTier={article.intelligenceTier}
              publishedAt={article.publishedAt}
              readingTime={readingTime}
            />
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {article.categories?.map((category: Category) => (
              <Link key={category._id} href={`/analysis/category/${category.slug}`}>
                <Badge
                  variant="secondary"
                  className="bg-stone-teal/20 text-stone-teal hover:bg-stone-teal/30 cursor-pointer"
                >
                  {category.title}
                </Badge>
              </Link>
            ))}
            {article.contentType && (
              <Badge variant="outline" className="text-text-muted border-text-muted/30">
                {article.contentType === 'deepdive' ? 'Deep Dive' :
                 article.contentType === 'signal' ? 'Signal' : 'Guide'}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight mb-6">
            {article.title}
          </h1>

          {/* Byline — author + dates on every article (E-E-A-T). The PulseHeader
              already shows the published date + reading time for intelligence
              pieces, so those are only repeated here for non-intelligence ones. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted mb-8">
            {article.author && (
              <div className="flex items-center gap-2">
                {article.author.image ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={urlFor(article.author.image).width(64).height(64).url()}
                      alt={article.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-charcoal flex items-center justify-center text-xs font-semibold text-text-muted">
                    {article.author.name?.charAt(0)}
                  </div>
                )}
                <span className="text-text-primary">
                  By{' '}
                  {article.author.slug ? (
                    <Link
                      href={`/authors/${article.author.slug}`}
                      className="text-text-primary hover:text-stone-teal underline-offset-2 hover:underline"
                    >
                      {article.author.name}
                    </Link>
                  ) : (
                    article.author.name
                  )}
                </span>
              </div>
            )}
            {!hasIntelligenceFields && article.publishedAt && (
              <>
                <span className="text-border-subtle">|</span>
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt, 'long')}
                </time>
              </>
            )}
            {updatedDate && (
              <>
                <span className="text-border-subtle">|</span>
                <time dateTime={updatedDate}>
                  Updated {formatDate(updatedDate, 'long')}
                </time>
              </>
            )}
            {!hasIntelligenceFields && readingTime > 0 && (
              <>
                <span className="text-border-subtle">|</span>
                <span>{readingTime} min read</span>
              </>
            )}
          </div>

          {/* Main Image */}
          {article.mainImage?.asset && (
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-10 bg-stone-charcoal">
              <Image
                src={urlFor(article.mainImage).width(1200).height(675).url()}
                alt={article.mainImage.alt || article.title}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-text-muted leading-relaxed mb-8 font-serif italic">
              {article.excerpt}
            </p>
          )}

          {/* Methodology Checklist - if pillars are applied */}
          {article.methodologyPillars && article.methodologyPillars.length > 0 && (
            <MethodologyChecklist
              pillars={article.methodologyPillars}
              variant={article.intelligenceTier === 'audit' ? 'expanded' : 'compact'}
              className="mb-8"
            />
          )}

          {/* Actionable Insights - longer tiers only; keep a Pulse within its scan-time promise */}
          {article.intelligenceTier !== 'pulse' && article.actionableInsights && article.actionableInsights.length > 0 && (
            <div className="glass-plate tech-corners rounded-lg p-6 mb-8 border border-tier-briefing/30">
              <h2 className="font-ui-mono text-tier-briefing text-sm mb-4">Actionable Insights</h2>
              <ul className="space-y-3">
                {article.actionableInsights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-silicon-amber font-mono text-sm mt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-text-primary">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator className="mb-10 bg-border-subtle" />

          {/* Article Body — reading measure capped (~70ch) for comfortable long-form reading */}
          <div className="prose prose-lg dark:prose-invert max-w-[70ch]">
            {article.body && (
              <PortableText value={article.body} components={portableTextComponents} />
            )}
          </div>

          <Separator className="mt-10 mb-8 bg-border-subtle" />

          {/* Sources / Citations */}
          {article.citations && article.citations.length > 0 && (
            <div className="mb-8">
              <h2 className="font-ui-mono text-stone-teal text-sm mb-4">Sources</h2>
              <ol className="space-y-2 list-decimal list-outside ml-5">
                {article.citations.map(
                  (
                    citation: { title: string; url: string; publisher?: string },
                    index: number
                  ) => (
                    <li key={index} className="text-sm text-text-muted">
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-teal hover:text-silicon-amber underline underline-offset-2 transition-colors"
                      >
                        {citation.title}
                      </a>
                      {citation.publisher && <span> — {citation.publisher}</span>}
                    </li>
                  )
                )}
              </ol>
            </div>
          )}

          {/* Author Bio */}
          {article.author && (
            <div className="bg-stone-charcoal rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                {article.author.image && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={urlFor(article.author.image).width(128).height(128).url()}
                      alt={article.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {article.author.slug ? (
                      <Link
                        href={`/authors/${article.author.slug}`}
                        className="hover:text-stone-teal underline-offset-2 hover:underline"
                      >
                        {article.author.name}
                      </Link>
                    ) : (
                      article.author.name
                    )}
                  </h3>
                  {article.author.role && (
                    <p className="text-sm text-stone-teal mb-2">{article.author.role}</p>
                  )}
                  {article.author.bio && (
                    <p className="text-sm text-text-muted">{article.author.bio}</p>
                  )}
                  {article.author.slug && (
                    <Link
                      href={`/authors/${article.author.slug}`}
                      className="mt-2 inline-block text-sm text-stone-teal hover:underline"
                    >
                      More from {article.author.name} &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Personas - show relevant personas */}
          {article.personas && article.personas.length > 0 && (
            <div className="mb-8 p-4 bg-stone-charcoal/50 rounded-lg">
              <p className="text-sm text-text-muted mb-2">Relevant for:</p>
              <div className="flex flex-wrap gap-2">
                {article.personas.map((persona: string) => (
                  <Badge
                    key={persona}
                    variant="outline"
                    className="text-silicon-amber border-silicon-amber/30"
                  >
                    {getPersonaLabel(persona)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic CTA - Newsletter with persona-aware copy */}
          <DynamicCTA
            primaryPersona={primaryPersona}
            intelligenceTier={article.intelligenceTier}
          />

          {/* Related Articles - semantic similarity via Pinecone */}
          <RelatedArticles articles={article.relatedArticles} />
        </article>
      </main>

      <Footer />
    </div>
  )
}
