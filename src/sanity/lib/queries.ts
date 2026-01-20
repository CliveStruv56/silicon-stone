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
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    },
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
  *[_type == "article" && defined(slug.current)] | order(publishedAt desc) [0...4] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    contentType,
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    },
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
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    },
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
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    },
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

// Search
export const SEARCH_ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && (
    title match $query + "*" ||
    excerpt match $query + "*"
  )] | order(publishedAt desc) [0...20] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    contentType,
    categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  }
`)
