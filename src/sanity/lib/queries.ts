import { defineQuery } from 'next-sanity'

// Articles
export const ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current)] | order(publishedAt desc) [0...10] {
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
    body,
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
    citations[]{
      title,
      url,
      publisher
    },
    seo {
      metaTitle,
      metaDescription
    }
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
  *[_type == "article" && $categoryId in categories[]._ref] | order(publishedAt desc) {
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
  )] | order(publishedAt desc) [0...20] {
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
    "robert": count(*[_type == "article" && !(_id in path("drafts.**")) && "robert" in personas]),
    "citizen": count(*[_type == "article" && !(_id in path("drafts.**")) && "citizen" in personas])
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
  | order(coalesce(impactScore, 5) desc, publishedAt desc) [0...$limit] {
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

// Briefings - All tiered content for the intelligence portal
export const BRIEFINGS_QUERY = defineQuery(`
  *[_type == "article" && !(_id in path("drafts.**")) && defined(intelligenceTier) && defined(slug.current)]
  | order(coalesce(impactScore, 5) desc, publishedAt desc) {
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
