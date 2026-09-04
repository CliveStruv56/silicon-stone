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
  ReadingProgress,
  TableOfContents,
  TextSizeStepper,
  Gate,
  InReadCapture,
} from '@/components/article'
import { buildToc, MIN_TOC_ENTRIES } from '@/lib/article-toc'
import { SaveButton, type SavePayload } from '@/components/article/SaveButton'
import { RelatedArticles } from '@/components/article/RelatedArticles'
import { SeriesStrip } from '@/components/series/SeriesStrip'
import { SeriesNav } from '@/components/series/SeriesNav'
import { SeriesProgressTracker } from '@/components/series/SeriesProgressTracker'
import { GlossaryToggle } from '@/components/glossary'
import { JsonLd } from '@/components/seo/JsonLd'
import { sanityFetch } from '@/sanity/lib/live'
import { ARTICLE_QUERY, ARTICLE_SLUGS_QUERY, UPSELL_PRODUCTS_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { getPersonaLabel, getDynamicCTA } from '@/lib/personas'
import {
  resolveGate,
  resolveUpsellProduct,
  findDefaultProduct,
  resolveCategoryGateFallback,
  type GateProduct,
} from '@/lib/gate'
import { formatDate } from '@/lib/format'
import {
  neighboursFor,
  partNumberFor,
  resolveSeriesContext,
  totalParts,
  type SeriesPart,
  type SeriesRef,
} from '@/lib/series'
import { absoluteUrl } from '@/lib/site'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  cleanDescription,
  completeSentence,
} from '@/lib/seo'

type Props = {
  params: Promise<{ slug: string }>
}

type Category = {
  _id: string
  title: string
  slug: string
  /** `category.defaultGateMode` — the `auto` gate's fallback when no product maps. */
  defaultGateMode?: string | null
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
  style?: string
  children?: Array<{ text?: string }>
  markDefs?: Array<{ _type?: string }>
}

// Whether the body carries any inline glossary annotations — drives whether the
// reader-facing "Glossary highlights" toggle is shown for this article at all.
function hasGlossaryAnnotations(body: PortableTextBlock[]): boolean {
  if (!Array.isArray(body)) return false
  return body.some((block) =>
    block.markDefs?.some((def) => def?._type === 'glossaryTerm')
  )
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

// Body images the offline store must cache — same size the offline reader
// requests (see OfflinePortableTextComponents), so cache lookups hit exactly.
function collectBodyImageUrls(body: PortableTextBlock[]): string[] {
  if (!Array.isArray(body)) return []
  return (body as Array<{ _type?: string; asset?: { _ref?: string } }>)
    .filter((block) => block._type === 'image' && block.asset?._ref)
    .map((block) => urlFor(block).width(1200).height(675).url())
}

// Articles published before the write-time strip landed carry the authored
// markdown file's furniture as real body blocks: a `# Title` duplicating the
// page's own <h1>, the newsletter "Subject Line:" / "Preview Text:" lines, and an
// "Article" heading before the prose (house style, see
// .agent/rules/style/house-style.md). Drop that run from the head of the body so
// every article opens on its Executive Summary. Head only — a paragraph further
// down that happens to open "Preview text:" is left untouched.
const PREAMBLE_META = /^(subject line|preview text)\s*:/

function blockText(block: PortableTextBlock): string {
  return (block.children || []).map((child) => child.text || '').join('')
}

function normaliseHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[:\s]+$/, '')
}

function stripAuthoringPreamble(
  body: PortableTextBlock[],
  title: string
): PortableTextBlock[] {
  if (!Array.isArray(body)) return body
  const wantedTitle = normaliseHeading(title || '')
  let cut = 0

  for (const block of body) {
    if (block?._type !== 'block') break
    const style = block.style || 'normal'
    const text = normaliseHeading(blockText(block))

    // Only drop the leading h1 when it duplicates the title we already render.
    if (style === 'h1' && wantedTitle && text === wantedTitle) {
      cut++
      continue
    }
    if ((style === 'h2' || style === 'h3') && text === 'article') {
      cut++
      continue
    }
    if (style === 'normal' && PREAMBLE_META.test(text)) {
      cut++
      continue
    }

    break
  }

  return cut > 0 ? body.slice(cut) : body
}

// Many generated articles end the body with a "Sources" heading + list, which
// duplicates the structured `citations[]` rendered separately below. When we have
// citations to show, drop the trailing in-body Sources section (the heading and
// everything after it) so the page shows a single, canonical Sources list.
function stripTrailingSourcesSection(body: PortableTextBlock[]): PortableTextBlock[] {
  if (!Array.isArray(body)) return body
  let cut = -1
  body.forEach((block, i) => {
    if (block?._type === 'block' && /^h[1-4]$/.test(block.style || '')) {
      const text = (block.children || [])
        .map((c) => c.text || '')
        .join('')
        .trim()
        .toLowerCase()
        .replace(/[:\s]+$/, '')
      if (text === 'sources' || text === 'references') cut = i
    }
  })
  return cut >= 0 ? body.slice(0, cut) : body
}

// Split the body at a paragraph boundary near the 55% mark so the in-read
// capture (P3-2) lands after the reader has consumed the value, never as an
// entry wall. Returns null for pieces too short to carry a mid-article break.
function splitBodyForCapture(
  body: PortableTextBlock[],
): { before: PortableTextBlock[]; after: PortableTextBlock[] } | null {
  if (!Array.isArray(body) || body.length < 8) return null
  const target = Math.floor(body.length * 0.55)
  // Snap to the next normal paragraph so we never break inside a heading run.
  let cut = -1
  for (let i = target; i < body.length - 2; i++) {
    const block = body[i]
    if (block?._type === 'block' && (!block.style || block.style === 'normal')) {
      cut = i
      break
    }
  }
  if (cut < 2 || cut > body.length - 2) return null
  return { before: body.slice(0, cut), after: body.slice(cut) }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const [{ data: article }, { data: upsellProducts }] = await Promise.all([
    sanityFetch({ query: ARTICLE_QUERY, params: { slug } }),
    sanityFetch({ query: UPSELL_PRODUCTS_QUERY }),
  ])

  if (!article) {
    notFound()
  }

  const readingTime = getReadingTime(article.body || [])
  const showGlossaryToggle = hasGlossaryAnnotations(article.body || [])
  const primaryPersona = article.personas?.[0]
  const hasIntelligenceFields = article.intelligenceTier || article.impactScore || article.stoneTruth

  // The reading path this article sits in, if any. An article may belong to
  // more than one series; the first is used deterministically — see
  // resolveSeriesContext for why there is no ?series= pin.
  const series = resolveSeriesContext(article.series as SeriesRef[] | null)
  const seriesParts = (series?.parts ?? []) as SeriesPart[]
  const seriesPartNumber = series ? partNumberFor(seriesParts, article._id) : null
  const seriesNeighbours = series ? neighboursFor(seriesParts, article._id) : { prev: null, next: null }

  // End-of-article gate (P3-1/P3-3): resolve mode + copy from Sanity, mapping
  // the article's topics to a product for the commerce/auto upsell. The
  // newsletter fallback reuses the persona-aware CTA copy.
  const articleCategorySlugs: string[] = (article.categories || [])
    .map((category: Category) => category.slug)
    .filter(Boolean)
  const emailCta = getDynamicCTA(primaryPersona)
  const productList = (upsellProducts || []) as GateProduct[]
  const upsellProduct = resolveUpsellProduct(
    article.gate?.product as GateProduct | null | undefined,
    articleCategorySlugs,
    productList,
  )
  const resolvedGate = resolveGate({
    gate: article.gate,
    upsellProduct,
    defaultProduct: findDefaultProduct(productList),
    categoryFallback: resolveCategoryGateFallback(article.categories as Category[] | null),
    emailFallback: { headline: emailCta.headline, body: emailCta.subheadline },
  })

  // In-read newsletter capture (P3-2): on by default, but suppressed when the
  // end gate is already the newsletter (avoid a double email ask), and only on
  // pieces long enough to carry a mid-article break.
  const bodyWithoutPreamble = stripAuthoringPreamble(article.body || [], article.title)
  const bodyStripped: PortableTextBlock[] =
    article.citations && article.citations.length > 0
      ? stripTrailingSourcesSection(bodyWithoutPreamble)
      : bodyWithoutPreamble

  // Contents for long reads. Runs *after* the preamble/sources strips (so the
  // list matches what is actually on the page) and *before* the capture split
  // (so headings in both halves carry their anchor ids).
  const toc = buildToc(bodyStripped)
  const bodyForRender = toc.body as PortableTextBlock[]
  const showToc = toc.entries.length >= MIN_TOC_ENTRIES

  const bodySplit =
    article.inReadCapture !== false && resolvedGate.mode !== 'email'
      ? splitBodyForCapture(bodyForRender)
      : null

  // Show a visible "Updated" date only when an editor set updatedAt after publish.
  const updatedDate =
    article.updatedAt &&
    article.publishedAt &&
    new Date(article.updatedAt).getTime() > new Date(article.publishedAt).getTime()
      ? article.updatedAt
      : null

  // Offline save payload (P2-4): the rendered content model with image URLs
  // pre-resolved to cdn.sanity.io, so offline reads never touch GROQ or the
  // /_next/image optimizer.
  const mainImageUrl = article.mainImage?.asset
    ? urlFor(article.mainImage).width(1200).height(675).url()
    : null
  const authorImageUrl = article.author?.image
    ? urlFor(article.author.image).width(128).height(128).url()
    : null
  const savePayload: SavePayload = {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || null,
    stoneTruth: article.stoneTruth || null,
    impactScore: article.impactScore || null,
    intelligenceTier: article.intelligenceTier || null,
    publishedAt: article.publishedAt || null,
    readingTime,
    personas: article.personas || [],
    categories:
      article.categories?.map((category: Category) => ({
        title: category.title,
        slug: category.slug,
      })) || [],
    citations: article.citations || [],
    actionableInsights: article.actionableInsights || [],
    mainImageUrl,
    mainImageAlt: article.mainImage?.alt || null,
    author: article.author
      ? {
          name: article.author.name || null,
          role: article.author.role || null,
          bio: article.author.bio || null,
          slug: article.author.slug || null,
          imageUrl: authorImageUrl,
        }
      : null,
    body: article.body || [],
    imageUrls: [
      ...(mainImageUrl ? [mainImageUrl] : []),
      ...(authorImageUrl ? [authorImageUrl] : []),
      ...collectBodyImageUrls(article.body || []),
    ],
  }

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
    series: series ? { title: series.title, slug: series.slug } : null,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ReadingProgress />

      <JsonLd
        data={[buildArticleSchema(schemaInput), buildBreadcrumbSchema(schemaInput)]}
      />

      <main className="flex-1">
        {/* Article Header */}
        <article className="mx-auto max-w-4xl px-6 py-10 lg:px-8 lg:py-12">
          {/*
            Series context. Deliberately OUTSIDE the hasIntelligenceFields
            conditional below: an article with no tier, impact score or Stone
            Truth is still a legitimate part of a reading path, and hiding its
            place in that path would repeat — in a smaller way — the defect
            where an untiered article published into invisibility.
          */}
          {series && seriesPartNumber !== null && (
            <>
              <SeriesStrip
                series={series}
                partNumber={seriesPartNumber}
                totalParts={totalParts(seriesParts)}
              />
              <SeriesProgressTracker seriesSlug={series.slug} partNumber={seriesPartNumber} />
            </>
          )}

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

          {/* Excerpt — always rendered as a complete sentence, never mid-word. */}
          {article.excerpt && completeSentence(article.excerpt) && (
            <p className="text-xl text-text-muted leading-relaxed mb-8 font-serif italic">
              {completeSentence(article.excerpt)}
            </p>
          )}

          {/* Reader controls: save-for-later left; text size (every article)
              and the glossary toggle (annotated articles only, off by default)
              right. */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SaveButton payload={savePayload} />
            <div className="flex items-center gap-3">
              {showGlossaryToggle && <GlossaryToggle />}
              <TextSizeStepper />
            </div>
          </div>

          <Separator className="mb-10 bg-border-subtle" />

          {showToc && (
            <div className="max-w-[64ch]">
              <TableOfContents entries={toc.entries} />
            </div>
          )}

          {/* Article Body — measure capped at 66ch, 18px/1.6 body scaled by the
              reader-controlled --article-size var (P2-2; children are em-based
              so the whole piece scales). Drop the in-body "Sources" section
              when we render structured citations below. */}
          <div
            className="prose prose-lg dark:prose-invert max-w-[64ch]"
            style={{ fontSize: 'var(--article-size, 1.125rem)', lineHeight: 1.6 }}
          >
            {bodySplit ? (
              <>
                <PortableText value={bodySplit.before} components={portableTextComponents} />
                <InReadCapture />
                <PortableText value={bodySplit.after} components={portableTextComponents} />
              </>
            ) : (
              <PortableText value={bodyForRender} components={portableTextComponents} />
            )}
          </div>

          <Separator className="mt-10 mb-8 bg-border-subtle" />

          {/* Methodology Checklist - if pillars are applied. Sits below the piece
              so the reader reaches the argument before the audit trail; the
              compact variant is used on every tier for a consistent article
              shape. */}
          {article.methodologyPillars && article.methodologyPillars.length > 0 && (
            <MethodologyChecklist
              pillars={article.methodologyPillars}
              variant="compact"
              className="mb-8"
            />
          )}

          {/* What to do next - longer tiers only; keep a Pulse within its scan-time promise */}
          {article.intelligenceTier !== 'pulse' && article.actionableInsights && article.actionableInsights.length > 0 && (
            <div className="glass-plate tech-corners rounded-lg p-6 mb-8 border border-tier-briefing/30">
              <h2 className="font-ui-mono text-tier-briefing text-sm mb-4">What to do next</h2>
              <ul className="space-y-3">
                {article.actionableInsights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-silicon-amber-strong font-mono text-sm mt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-text-primary">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                        className="text-stone-teal hover:text-silicon-amber-strong underline underline-offset-2 transition-colors"
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
                    className="text-silicon-amber-strong border-silicon-amber/30"
                  >
                    {getPersonaLabel(persona)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Continue the series — ABOVE the gate on purpose. A reader part-way
              through a reading path should be offered the next part before a
              commerce or newsletter ask, not after it. */}
          {series && (
            <SeriesNav
              series={series}
              prev={seriesNeighbours.prev}
              next={seriesNeighbours.next}
            />
          )}

          {/* End-of-article gate (P3-1): newsletter, product upsell, or lead —
              mode + copy from Sanity, never blocking the body above. */}
          <Gate gate={resolvedGate} intelligenceTier={article.intelligenceTier} />

          {/* Related Articles - semantic similarity via Pinecone */}
          <RelatedArticles articles={article.relatedArticles} />
        </article>
      </main>

      <Footer />
    </div>
  )
}
