import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { portableTextComponents } from '@/components/article/PortableTextComponents'
import { sanityFetch } from '@/sanity/lib/live'
import { ARTICLE_QUERY, ARTICLE_SLUGS_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

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

  return {
    title: article.seo?.metaTitle || `${article.title} | Silicon and Stone`,
    description: article.seo?.metaDescription || article.excerpt,
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Article Header */}
        <article className="mx-auto max-w-4xl px-6 py-12 lg:px-8 lg:py-16">
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

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mb-8">
            {article.author && (
              <div className="flex items-center gap-2">
                {article.author.image && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={urlFor(article.author.image).width(64).height(64).url()}
                      alt={article.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="text-text-primary">{article.author.name}</span>
              </div>
            )}
            {article.publishedAt && (
              <>
                <span className="text-border-subtle">|</span>
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
              </>
            )}
            {readingTime > 0 && (
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

          <Separator className="mb-10 bg-border-subtle" />

          {/* Article Body */}
          <div className="prose prose-lg prose-invert max-w-none">
            {article.body && (
              <PortableText value={article.body} components={portableTextComponents} />
            )}
          </div>

          <Separator className="mt-10 mb-8 bg-border-subtle" />

          {/* Author Bio */}
          {article.author && (
            <div className="bg-stone-charcoal rounded-lg p-6">
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
                  <h3 className="font-semibold text-text-primary">{article.author.name}</h3>
                  {article.author.role && (
                    <p className="text-sm text-stone-teal mb-2">{article.author.role}</p>
                  )}
                  {article.author.bio && (
                    <p className="text-sm text-text-muted">{article.author.bio}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Personas */}
          {article.personas && article.personas.length > 0 && (
            <div className="mt-8 p-4 bg-stone-charcoal/50 rounded-lg">
              <p className="text-sm text-text-muted mb-2">Relevant for:</p>
              <div className="flex flex-wrap gap-2">
                {article.personas.map((persona: string) => {
                  const personaLabels: Record<string, string> = {
                    clara: 'Compliance Clara',
                    ian: 'Industrial Ian',
                    sofia: 'Sovereign Sofia',
                    robert: 'Remote Robert',
                  }
                  return (
                    <Badge
                      key={persona}
                      variant="outline"
                      className="text-silicon-amber border-silicon-amber/30"
                    >
                      {personaLabels[persona] || persona}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  )
}
