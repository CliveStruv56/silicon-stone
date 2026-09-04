import { defineQuery } from 'next-sanity'

// Articles
export const ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current)] | order(coalesce(publishedAt, _updatedAt) desc) [0...10] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    contentType,
    intelligenceTier,
    impactScore,
    stoneTruth,
    methodologyPillars,
    mainImage,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    },
    personas,
    author->{
      _id,
      name,
      "slug": slug.current,
      image
    }
  }
`)

export const FEATURED_ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current)] | order(coalesce(publishedAt, _updatedAt) desc) [0...7] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    contentType,
    intelligenceTier,
    impactScore,
    stoneTruth,
    mainImage,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
`)

// Single article. `categories[].defaultGateMode` feeds the `auto` gate's
// no-product fallback — see `resolveCategoryGateFallback` in src/lib/gate.ts.
export const ARTICLE_QUERY = defineQuery(`
  *[_type == "article" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    updatedAt,
    contentType,
    intelligenceTier,
    impactScore,
    stoneTruth,
    methodologyPillars,
    actionableInsights,
    mainImage,
    body[]{
      ...,
      markDefs[]{
        ...,
        _type == "glossaryTerm" => {
          "term": term->{
            _id,
            name,
            "slug": slug.current,
            acronym,
            fullName,
            kind,
            definition
          }
        }
      }
    },
    categories[]->{
      _id,
      title,
      "slug": slug.current,
      defaultGateMode
    },
    personas,
    author->{
      _id,
      name,
      "slug": slug.current,
      image,
      bio,
      role,
      sameAs
    },
    relatedArticles[]->{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      contentType
    },
    // Every series this article is a part of, each carrying its FULL ordered
    // entry list. The part number and the prev/next pair are computed from that
    // list in TypeScript (src/lib/series.ts), not in GROQ -- the whole array is
    // needed to render either way, and nested parent-scope escapes in GROQ break
    // silently.
    //
    // references() is the reference-index-accelerated form and the idiom already
    // used in content/actions.ts and scripts/test-cleanup.ts. It matches a ref in
    // ANY field, which is safe only because entries is the one field on series
    // that can hold an ARTICLE id (categories points at category). If series ever
    // gains a second article-typed reference field, switch this to the explicit
    // form: ^._id in entries[]._ref
    //
    // NOTE: no backticks in comments inside these template literals -- one
    // terminates the string and the whole file stops parsing.
    "series": *[_type == "series" && defined(slug.current) && references(^._id)]{
      _id,
      title,
      "slug": slug.current,
      status,
      "parts": entries[]{
        _key,
        "ref": _ref,
        "article": @->{ _id, title, "slug": slug.current, intelligenceTier }
      }
    },
    citations[]{
      title,
      url,
      publisher
    },
    seo {
      metaTitle,
      metaDescription
    },
    inReadCapture,
    gate {
      mode,
      href,
      headline,
      body,
      ctaLabel,
      product->{
        name,
        "slug": slug.current,
        kind,
        priceLabel,
        blurb,
        productPath,
        checkoutUrl,
        deliveryModel,
        badge,
        isDefault,
        "topics": topics[]->slug.current
      }
    }
  }
`)

// Products for the contextual upsell mapping (P3-3). Small set; resolved
// against an article's categories on the server. `topics` are category slugs.
//
// The ordering is load-bearing, not cosmetic. `resolveUpsellProduct` takes the
// FIRST product whose topics intersect the article's categories, so an article
// tagged with topics belonging to two products would otherwise be sold whichever
// one the dataset happened to return first. Flagship (`isDefault`) wins, then
// alphabetical — so a match never falls to "Sector Reports", which has no
// product to sell yet.
export const UPSELL_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product"] | order(isDefault desc, name asc) {
    name,
    "slug": slug.current,
    kind,
    priceLabel,
    blurb,
    productPath,
    checkoutUrl,
    deliveryModel,
    badge,
    isDefault,
    "topics": topics[]->slug.current
  }
`)

// Glossary — compact index for inline definitions and full directory content.
export const GLOSSARY_TERMS_QUERY = defineQuery(`
  *[_type == "glossaryTerm" && defined(slug.current)]
  | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    acronym,
    fullName,
    aliases,
    kind,
    definition,
    sourceUrl,
    reviewedAt,
    relatedTerms[]->{
      _id,
      name,
      "slug": slug.current,
      acronym,
      kind
    }
  }
`)

export const SEARCH_GLOSSARY_QUERY = defineQuery(`
  *[_type == "glossaryTerm" && defined(slug.current) && (
    name match $query + "*" ||
    acronym match $query + "*" ||
    fullName match $query + "*" ||
    aliases[] match $query + "*" ||
    definition match $query + "*"
  )] | order(name asc) [0...10] {
    _id,
    name,
    "slug": slug.current,
    acronym,
    kind,
    definition
  }
`)

export const ARTICLE_SLUGS_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current)]{
    "slug": slug.current
  }
`)

// Sitemap — published articles with last-modified for <lastmod>
export const SITEMAP_ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current) && !(_id in path("drafts.**"))]
  | order(coalesce(publishedAt, _updatedAt) desc) {
    "slug": slug.current,
    publishedAt,
    _updatedAt
  }
`)

// RSS / llms.txt — latest published articles for syndication and AI curation
export const RSS_ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current) && !(_id in path("drafts.**"))]
  | order(coalesce(publishedAt, _updatedAt) desc) [0...30] {
    title,
    "slug": slug.current,
    excerpt,
    stoneTruth,
    publishedAt,
    _updatedAt,
    "author": author->name,
    "categories": categories[]->title
  }
`)

// Open Graph card — minimal fields for the generated social image
export const OG_ARTICLE_QUERY = defineQuery(`
  *[_type == "article" && slug.current == $slug][0] {
    title,
    stoneTruth,
    excerpt,
    "category": categories[0]->title
  }
`)

// Sitemap — categories with last-modified
// === SERIES ===
//
// A series is an ordered reading path across existing articles. The POSITION of
// an entry is its part number — nothing types a number, so nothing can disagree.
//
// Both projections below use the positional form `entries[]{ ..., @->{...} }`
// rather than the collapsing `entries[]->{...}`. That is deliberate and is the
// single most important thing about these queries: the positional form returns
// ONE element per entry, with `"article": null` where the reference does not
// resolve (an entry pointing at a draft, or at a part that has been
// unpublished). The collapsing form silently drops those elements, which would
// renumber every part after the hole. Verified against the production dataset
// with a real draft-only article.
//
// `_key` is projected because it is the only stable React key available when
// `article` is null and there is no slug to fall back on.

// One series and its full ordered part list.
export const SERIES_QUERY = defineQuery(`
  *[_type == "series" && slug.current == $slug][0]{
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    standfirst,
    status,
    coverImage,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    },
    personas,
    seo {
      metaTitle,
      metaDescription
    },
    "parts": entries[]{
      _key,
      "ref": _ref,
      "article": @->{
        _id,
        title,
        "slug": slug.current,
        excerpt,
        stoneTruth,
        intelligenceTier,
        contentType,
        publishedAt,
        mainImage
      }
    }
  }
`)

// The series index. Ordered manually, NOT by date: published-at-query.test.ts
// requires every `order(...)` clause here that mentions publishedAt to use the
// exact `coalesce(publishedAt, _updatedAt)` expression, and a series has no
// publication date of its own to order by anyway.
export const SERIES_INDEX_QUERY = defineQuery(`
  *[_type == "series" && defined(slug.current)]
  | order(featured desc, coalesce(displayOrder, 999) asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    standfirst,
    status,
    coverImage,
    featured,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    },
    "partCount": count(entries),
    "publishedCount": count(entries[@-> != null])
  }
`)

// generateStaticParams + the sitemap.
export const SERIES_SLUGS_QUERY = defineQuery(`
  *[_type == "series" && defined(slug.current)]{
    "slug": slug.current,
    _updatedAt
  }
`)

export const SITEMAP_CATEGORIES_QUERY = defineQuery(`
  *[_type == "category" && defined(slug.current)] {
    "slug": slug.current,
    _updatedAt
  }
`)

// Categories
export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description
  }
`)

export const CATEGORY_QUERY = defineQuery(`
  *[_type == "category" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    description
  }
`)

export const ARTICLES_BY_CATEGORY_QUERY = defineQuery(`
  *[_type == "article" && $categoryId in categories[]._ref] | order(coalesce(publishedAt, _updatedAt) desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    contentType,
    mainImage,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
`)

// Authors
export const AUTHOR_QUERY = defineQuery(`
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    image,
    bio,
    role,
    sameAs
  }
`)

// Author bio page — author plus their published articles
export const AUTHOR_PAGE_QUERY = defineQuery(`
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    image,
    bio,
    role,
    sameAs,
    "articles": *[_type == "article" && author._ref == ^._id && defined(slug.current) && !(_id in path("drafts.**"))]
      | order(coalesce(publishedAt, _updatedAt) desc) {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        publishedAt,
        contentType,
        intelligenceTier,
        impactScore,
        stoneTruth,
        mainImage,
        categories[]->{
          _id,
          title,
          "slug": slug.current
        }
      }
  }
`)

// Author slugs — for generateStaticParams on /authors/[slug]
export const AUTHOR_SLUGS_QUERY = defineQuery(`
  *[_type == "author" && defined(slug.current)]{
    "slug": slug.current
  }
`)

// Site Settings
export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0] {
    heroImage,
    heroTitle,
    heroDescription,
    orchestrationBattleground {
      enabled,
      eyebrow,
      h2,
      subhead,
      intro,
      stance01 {
        tag,
        title,
        descriptor,
        voice,
        bullets
      },
      stance02 {
        tag,
        title,
        descriptor,
        voice,
        bullets
      },
      stoneTruth {
        label,
        body
      }
    }
  }
`)

// Search
export const SEARCH_ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && (
    title match $query + "*" ||
    excerpt match $query + "*" ||
    pt::text(body) match $query + "*"
  )] | order(coalesce(publishedAt, _updatedAt) desc) [0...20] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    contentType,
    intelligenceTier,
    impactScore,
    stoneTruth,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
`)

// Analytics dashboard — content library counts.
// Breakdowns count published (non-draft) articles to avoid double-counting the
// draft shadow of an edited-published doc. `articlesDrafts` is reported
// separately as a rough "unpublished / pending edits" indicator.
export const CONTENT_STATS_QUERY = defineQuery(`{
  "articlesPublished": count(*[_type == "article" && !(_id in path("drafts.**"))]),
  "articlesDrafts": count(*[_type == "article" && _id in path("drafts.**")]),
  "byContentType": {
    "signal": count(*[_type == "article" && !(_id in path("drafts.**")) && contentType == "signal"]),
    "deepdive": count(*[_type == "article" && !(_id in path("drafts.**")) && contentType == "deepdive"]),
    "guide": count(*[_type == "article" && !(_id in path("drafts.**")) && contentType == "guide"]),
    "youtube": count(*[_type == "article" && !(_id in path("drafts.**")) && contentType == "youtube"])
  },
  "byTier": {
    "pulse": count(*[_type == "article" && !(_id in path("drafts.**")) && intelligenceTier == "pulse"]),
    "briefing": count(*[_type == "article" && !(_id in path("drafts.**")) && intelligenceTier == "briefing"]),
    "audit": count(*[_type == "article" && !(_id in path("drafts.**")) && intelligenceTier == "audit"]),
    "untiered": count(*[_type == "article" && !(_id in path("drafts.**")) && !defined(intelligenceTier)])
  },
  "byPersona": {
    "clara": count(*[_type == "article" && !(_id in path("drafts.**")) && "clara" in personas]),
    "ian": count(*[_type == "article" && !(_id in path("drafts.**")) && "ian" in personas]),
    "sofia": count(*[_type == "article" && !(_id in path("drafts.**")) && "sofia" in personas]),
    "citizen": count(*[_type == "article" && !(_id in path("drafts.**")) && "citizen" in personas]),
    "troy": count(*[_type == "article" && !(_id in path("drafts.**")) && "troy" in personas])
  },
  "youtubeScriptsTotal": count(*[_type == "youtubeScript" && !(_id in path("drafts.**"))]),
  "youtubeByPillar": {
    "stone-briefing": count(*[_type == "youtubeScript" && !(_id in path("drafts.**")) && pillar == "stone-briefing"]),
    "silicon-move": count(*[_type == "youtubeScript" && !(_id in path("drafts.**")) && pillar == "silicon-move"]),
    "shorts": count(*[_type == "youtubeScript" && !(_id in path("drafts.**")) && pillar == "shorts"])
  },
  "youtubeByStatus": {
    "idea": count(*[_type == "youtubeScript" && !(_id in path("drafts.**")) && productionStatus == "idea"]),
    "scripted": count(*[_type == "youtubeScript" && !(_id in path("drafts.**")) && productionStatus == "scripted"]),
    "filmed": count(*[_type == "youtubeScript" && !(_id in path("drafts.**")) && productionStatus == "filmed"]),
    "edited": count(*[_type == "youtubeScript" && !(_id in path("drafts.**")) && productionStatus == "edited"]),
    "published": count(*[_type == "youtubeScript" && !(_id in path("drafts.**")) && productionStatus == "published"])
  }
}`)

// Intelligence Portal - Tiered Content
export const ARTICLES_BY_TIER_QUERY = defineQuery(`
  *[_type == "article" && !(_id in path("drafts.**")) && intelligenceTier == $tier && defined(slug.current)]
  | order(coalesce(impactScore, 5) desc, coalesce(publishedAt, _updatedAt) desc) [0...$limit] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    stoneTruth,
    impactScore,
    intelligenceTier,
    publishedAt,
    personas,
    methodologyPillars,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
`)

// Briefings — every published article for the intelligence portal, tiered or
// not. The tier drives the badge and the tier filter; it is not a condition of
// being listed. Two inline copies of this exist ((website)/intelligence/page.tsx
// and api/briefings/route.ts); change all three together.
export const BRIEFINGS_QUERY = defineQuery(`
  *[_type == "article" && !(_id in path("drafts.**")) && defined(slug.current)]
  | order(coalesce(impactScore, 5) desc, coalesce(publishedAt, _updatedAt) desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    stoneTruth,
    impactScore,
    intelligenceTier,
    publishedAt,
    personas,
    methodologyPillars,
    mainImage,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
`)
