import type { MetadataRoute } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import {
  SITEMAP_ARTICLES_QUERY,
  SITEMAP_CATEGORIES_QUERY,
  AUTHOR_SLUGS_QUERY,
} from '@/sanity/lib/queries'
import { absoluteUrl } from '@/lib/site'

/**
 * Dynamic sitemap.xml — enumerates the public site for crawlers and AI engines.
 *
 * Includes: curated static public pages, every published article, and every
 * category. Excludes the admin route group, auth, Studio, API routes, and
 * utility pages (search) — see robots.ts for the matching crawl policy.
 */

// Curated public static routes (path, change frequency, priority).
const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/intelligence', changeFrequency: 'daily', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/methodology', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/glossary', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/advisory', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/products', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/products/ai-act-toolkit', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/products/ai-audit-checklist', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/products/sector-reports', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/tools', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/tools/compliance-checker', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/tools/policy-stress-test', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/tools/scenario-modeler', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/tools/supply-chain-mapper', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/waymarkpath', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: articles }, { data: categories }, { data: authors }] =
    await Promise.all([
      sanityFetch({
        query: SITEMAP_ARTICLES_QUERY,
        perspective: 'published',
        stega: false,
      }),
      sanityFetch({
        query: SITEMAP_CATEGORIES_QUERY,
        perspective: 'published',
        stega: false,
      }),
      sanityFetch({
        query: AUTHOR_SLUGS_QUERY,
        perspective: 'published',
        stega: false,
      }),
    ])

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const articleEntries: MetadataRoute.Sitemap = (
    (articles ?? []) as Array<{
      slug: string
      publishedAt?: string | null
      _updatedAt?: string | null
    }>
  ).map((article) => ({
    url: absoluteUrl(`/analysis/${article.slug}`),
    lastModified: article._updatedAt || article.publishedAt || undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = (
    (categories ?? []) as Array<{ slug: string; _updatedAt?: string | null }>
  ).map((category) => ({
    url: absoluteUrl(`/analysis/category/${category.slug}`),
    lastModified: category._updatedAt || undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const authorEntries: MetadataRoute.Sitemap = (
    (authors ?? []) as Array<{ slug: string }>
  ).map((author) => ({
    url: absoluteUrl(`/authors/${author.slug}`),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    ...staticEntries,
    ...articleEntries,
    ...categoryEntries,
    ...authorEntries,
  ]
}
