import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * robots.txt — crawler policy.
 *
 * Posture (locked 2026-06-08): ALLOW EVERYTHING, retrieval *and* training
 * crawlers, for a citation-first publication. This includes Google-Extended
 * (blocking it would drop us from Google AI Overviews grounding) and the
 * training crawlers (GPTBot, ClaudeBot). Cleanly reversible later — to opt out
 * of training while keeping live AI citations, disallow GPTBot/ClaudeBot here
 * but keep OAI-SearchBot/PerplexityBot/Claude-SearchBot allowed.
 *
 * Disallowed: the admin route group, auth, the embedded Studio, draft preview,
 * and API endpoints — none of which should ever be indexed.
 */
const DISALLOW = [
  '/api/',
  '/studio',
  '/login',
  '/admin',
  '/analytics',
  '/content',
  '/context',
  '/create',
  '/editor',
  '/import',
  '/knowledge',
  '/research',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
