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
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
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
      role
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
    role
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

// Intelligence Portal - Tiered Content
export const ARTICLES_BY_TIER_QUERY = defineQuery(`
  *[_type == "article" && intelligenceTier == $tier && defined(slug.current)]
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
  *[_type == "article" && defined(intelligenceTier) && defined(slug.current)]
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
