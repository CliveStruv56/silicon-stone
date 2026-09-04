import { SITE_URL, absoluteUrl } from '@/lib/site'
import type { GlossaryTerm } from '@/lib/glossary'

/**
 * Schema.org builders for article pages. Pure functions over the article query
 * shape so they can be unit-tested and reused. Rendered via <JsonLd>.
 */

export type SchemaArticle = {
  title: string
  slug: string
  description?: string
  publishedAt?: string | null
  _updatedAt?: string | null
  contentType?: string | null
  imageUrl?: string | null
  author?: {
    name?: string | null
    slug?: string | null
    sameAs?: string[] | null
  } | null
  categories?: Array<{ title: string; slug: string }> | null
  citations?: Array<{
    title: string
    url: string
    publisher?: string | null
  }> | null
  /** The reading path this article is a part of, when it is part of one. */
  series?: { title: string; slug: string } | null
}

/** Strip markdown noise and clamp to a clean meta-description sentence. */
export function cleanDescription(input?: string | null, max = 160): string {
  if (!input) return ''
  const text = input
    .replace(/[*_`#>]/g, '') // markdown emphasis / heading / quote marks
    .replace(/^\s*[-•]\s+/gm, '') // leading bullet markers
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  // Clamp on a word boundary, never mid-word.
  return text.slice(0, text.lastIndexOf(' ', max) > 0 ? text.lastIndexOf(' ', max) : max).trim()
}

/**
 * Trim a possibly-truncated summary so it always ends on a complete sentence,
 * never mid-word. Strips markdown, takes the first item of a bullet list, drops
 * trailing ellipses, trims back to the last sentence terminator, and (for a lone
 * clause with no terminator) drops a dangling trailing fragment and adds a stop.
 */
export function completeSentence(input?: string | null): string {
  if (!input) return ''
  let s = input.replace(/\r/g, '').replace(/[*_`#>]/g, '').trim()
  const nl = s.indexOf('\n')
  if (nl >= 0) s = s.slice(0, nl).trim() // first bullet / line only
  s = s.replace(/^[-•*]\s+/, '').trim() // leading bullet marker
  s = s.replace(/\s*(?:…|\.{2,})\s*$/, '').trim() // trailing ellipsis
  if (!s) return ''
  if (/[.!?]["')\]]?$/.test(s)) return s // already a full sentence
  const lastTerminator = Math.max(s.lastIndexOf('.'), s.lastIndexOf('!'), s.lastIndexOf('?'))
  if (lastTerminator >= 0) return s.slice(0, lastTerminator + 1).trim()
  // No sentence terminator at all. If a dash splits the text into clauses and the
  // first is a substantial standalone clause, keep it and drop the dangling rest
  // (handles "<complete clause> — <truncated continuation>"). Otherwise keep the
  // whole clause. Either way, add a closing full stop.
  const sep = Math.max(s.lastIndexOf(' - '), s.lastIndexOf(' – '), s.lastIndexOf(' — '))
  if (sep >= 40) s = s.slice(0, sep).trim()
  s = s.replace(/[\s,;:–—-]+$/, '').trim()
  return s ? `${s}.` : ''
}

export function buildArticleSchema(a: SchemaArticle) {
  const url = absoluteUrl(`/analysis/${a.slug}`)
  // Current-affairs "signal" pieces are NewsArticle; everything else Article.
  const type = a.contentType === 'signal' ? 'NewsArticle' : 'Article'

  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: a.title,
    ...(a.description ? { description: a.description } : {}),
    ...(a.imageUrl ? { image: [a.imageUrl] } : {}),
    ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
    dateModified: a._updatedAt || a.publishedAt || undefined,
    ...(a.author?.name
      ? {
          author: {
            '@type': 'Person',
            name: a.author.name,
            ...(a.author.slug
              ? { url: absoluteUrl(`/authors/${a.author.slug}`) }
              : {}),
            ...(a.author.sameAs && a.author.sameAs.length
              ? { sameAs: a.author.sameAs }
              : {}),
            worksFor: { '@id': `${SITE_URL}/#organization` },
          },
        }
      : {}),
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(a.citations && a.citations.length
      ? {
          citation: a.citations.map((c) => ({
            '@type': 'CreativeWork',
            name: c.title,
            url: c.url,
            ...(c.publisher
              ? { publisher: { '@type': 'Organization', name: c.publisher } }
              : {}),
          })),
        }
      : {}),
    // The series is the author's argued reading order, so it is a genuine
    // CreativeWorkSeries the article is part of — not merely "related".
    // schema.org: isPartOf is the inverse of the hasPart emitted by
    // buildSeriesSchema, and the two must name the same @id to pair up.
    ...(a.series
      ? {
          isPartOf: {
            '@type': 'CreativeWorkSeries',
            '@id': absoluteUrl(`/intelligence/series/${a.series.slug}`),
            name: a.series.title,
            url: absoluteUrl(`/intelligence/series/${a.series.slug}`),
          },
        }
      : {}),
    url,
  }
}

export type SchemaSeries = {
  title: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  _updatedAt?: string | null
  /**
   * Only the parts that actually resolve to a published article. An entry held
   * for a piece still in preparation is a real slot on the page — the reader is
   * owed the shape of the series — but it is not a CreativeWork that exists, and
   * asserting one to a search engine would be a claim about a URL that 404s.
   */
  parts: Array<{ title: string; slug: string; position: number }>
}

/**
 * A series as a CreativeWorkSeries with hasPart, paired with the isPartOf that
 * buildArticleSchema puts on each member.
 *
 * `position` is passed in rather than derived from the array index here,
 * because the caller has already filtered out the unpublished slots and the
 * position must remain the part's real number in the series — not its index
 * among the published ones.
 */
export function buildSeriesSchema(s: SchemaSeries) {
  const url = absoluteUrl(`/intelligence/series/${s.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWorkSeries',
    '@id': url,
    name: s.title,
    ...(s.description ? { description: s.description } : {}),
    ...(s.imageUrl ? { image: [s.imageUrl] } : {}),
    ...(s._updatedAt ? { dateModified: s._updatedAt } : {}),
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(s.parts.length
      ? {
          hasPart: s.parts.map((part) => ({
            '@type': 'Article',
            position: part.position,
            name: part.title,
            url: absoluteUrl(`/analysis/${part.slug}`),
          })),
        }
      : {}),
    url,
  }
}

/** Intelligence → Series → this series. */
/**
 * The BreadcrumbList shape, in one place.
 *
 * There were three copies of this map by 2026-09-04 and a fourth was about to be
 * written for the advisory pages. `position` is 1-based and must stay in list
 * order — Google reads it as the hierarchy, not the array.
 */
function breadcrumbList(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function buildSeriesBreadcrumbSchema(s: { title: string; slug: string }) {
  return breadcrumbList([
    { name: 'Intelligence', path: '/intelligence' },
    { name: 'Series', path: '/intelligence/series' },
    { name: s.title, path: `/intelligence/series/${s.slug}` },
  ])
}

/**
 * Advisory → this engagement.
 *
 * The four engagement pages had no structured data at all until 2026-09-04, so
 * a search engine inferred their place from the URL rather than from the labels
 * the site uses. `name` and `path` come from `ENGAGEMENTS` in
 * `src/lib/offering.ts` at the call site — the same catalogue the header, the
 * footer and `/pricing` render — so the breadcrumb cannot name an engagement
 * something the rest of the site does not call it.
 *
 * Two levels, not three: `sitemap.ts` deliberately ranks these alongside
 * `/advisory` rather than beneath it, because each is searched for by name.
 */
export function buildEngagementBreadcrumbSchema(engagement: { name: string; path: string }) {
  return breadcrumbList([
    { name: 'Advisory', path: '/advisory' },
    { name: engagement.name, path: engagement.path },
  ])
}

export function buildBreadcrumbSchema(a: SchemaArticle) {
  const items: Array<{ name: string; url: string }> = [
    { name: 'Intelligence', url: absoluteUrl('/intelligence') },
  ]
  const category = a.categories?.[0]
  if (category) {
    items.push({
      name: category.title,
      url: absoluteUrl(`/analysis/category/${category.slug}`),
    })
  }
  items.push({ name: a.title, url: absoluteUrl(`/analysis/${a.slug}`) })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}


export function buildGlossarySchema(terms: GlossaryTerm[]) {
  const url = absoluteUrl('/glossary')
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${url}#term-set`,
    name: 'Silicon and Stone glossary',
    url,
    description: 'Plain-language definitions for technology policy, AI and semiconductor analysis.',
    hasDefinedTerm: terms.map((term) => ({
      '@type': 'DefinedTerm',
      '@id': `${url}#${term.slug}`,
      name: term.acronym || term.name,
      ...(term.acronym ? { alternateName: term.name } : {}),
      description: term.definition,
      url: `${url}#${term.slug}`,
      inDefinedTermSet: { '@id': `${url}#term-set` },
    })),
  }
}

export type SchemaAuthor = {
  name: string
  slug: string
  role?: string | null
  bio?: string | null
  imageUrl?: string | null
  sameAs?: string[] | null
}

/**
 * ProfilePage wrapping a Person for an author bio page — the single fastest
 * E-E-A-T lever. `sameAs` disambiguates the author entity across the web.
 */
export function buildPersonProfileSchema(author: SchemaAuthor) {
  const url = absoluteUrl(`/authors/${author.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': url,
    mainEntity: {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: author.name,
      url,
      ...(author.role ? { jobTitle: author.role } : {}),
      ...(author.bio ? { description: author.bio } : {}),
      ...(author.imageUrl ? { image: author.imageUrl } : {}),
      ...(author.sameAs && author.sameAs.length
        ? { sameAs: author.sameAs }
        : {}),
      worksFor: { '@id': `${SITE_URL}/#organization` },
    },
  }
}
