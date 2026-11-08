import 'server-only'

import { generateEmbedding } from '@/lib/embeddings'
import { getPineconeIndex, type PineconeArticleMetadata } from '@/lib/pinecone'
import { client } from '@/sanity/lib/client'
import { SITE_PAGES } from './site-pages'
import { PUBLIC_NAMESPACES, type SiteIndexKind, type SiteIndexMetadata } from './site-index'

/**
 * Public "search by meaning": one OpenAI embedding, two Pinecone queries (the
 * published-article namespace and the site-pages namespace), merged by score.
 *
 * **Only published, public site content can come out of this.** Three layers:
 *
 * 1. Only the two namespaces in PUBLIC_NAMESPACES are queried, each named
 *    explicitly. The same index also holds an `ideas` namespace that belongs to
 *    an external editorial agent; nothing here can reach it.
 * 2. Every article and glossary hit is re-checked against Sanity's *published*
 *    perspective before it is returned, so a vector left behind by an unpublish
 *    or a deletion is dropped rather than linked.
 * 3. Every page hit must still be in SITE_PAGES, so a page removed from the
 *    registry disappears before the next re-index.
 */

/**
 * Hits scoring below this are dropped. Measured 2026-11-07 with
 * `npm run search:probe` over 32 pages, 75 glossary terms and 16 articles:
 * off-topic queries ("best pizza in glasgow", "football scores", a nonsense
 * string) topped out at 0.208; the weakest on-topic query's best match scored
 * 0.378 ("is my chatbot high risk" → Compliance Checker), and on-topic best
 * matches ran 0.378–0.649. At 0.35, short queries let in noise just above it
 * ("compliance checker" → the ECC memory glossary term at 0.371). 0.40 trades
 * that one weakest on-topic match for precision: a wrong "related" result costs
 * more trust than a missing one, and the keyword results still stand above it.
 * Re-measure as the catalogue grows.
 */
export const SEMANTIC_SCORE_FLOOR = 0.4

/** Most results shown under "Related by meaning". */
export const SEMANTIC_MAX_RESULTS = 6

export type RelatedKind = SiteIndexKind | 'article'

export type RelatedHit = {
  path: string
  title: string
  description: string
  kind: RelatedKind
  score: number
}

const PER_NAMESPACE = 8

const PUBLISHED_SLUGS_QUERY = `{
  "articles": *[_type == "article" && slug.current in $articles && !(_id in path("drafts.**"))].slug.current,
  "glossary": *[_type == "glossaryTerm" && slug.current in $glossary && !(_id in path("drafts.**"))].slug.current
}`

export async function searchByMeaning(query: string): Promise<RelatedHit[]> {
  const vector = await generateEmbedding(query)
  const index = getPineconeIndex()

  const [articleRes, pageRes] = await Promise.all([
    index.namespace(PUBLIC_NAMESPACES.articles).query({
      vector,
      topK: PER_NAMESPACE,
      includeMetadata: true,
      includeValues: false,
    }),
    index.namespace(PUBLIC_NAMESPACES.sitePages).query({
      vector,
      topK: PER_NAMESPACE,
      includeMetadata: true,
      includeValues: false,
    }),
  ])

  const articleHits = (articleRes.matches ?? [])
    .filter((m) => (m.score ?? 0) >= SEMANTIC_SCORE_FLOOR)
    .map((m) => ({ score: m.score ?? 0, meta: m.metadata as unknown as PineconeArticleMetadata }))
    .filter((h) => h.meta?.slug)

  const registry = new Set(SITE_PAGES.map((p) => p.path))
  const pageHits = (pageRes.matches ?? [])
    .filter((m) => (m.score ?? 0) >= SEMANTIC_SCORE_FLOOR)
    .map((m) => ({ score: m.score ?? 0, meta: m.metadata as unknown as SiteIndexMetadata }))
    .filter((h) => h.meta?.path && (h.meta.kind === 'glossary' || registry.has(h.meta.path)))

  const glossarySlugs = pageHits
    .filter((h) => h.meta.kind === 'glossary')
    .map((h) => h.meta.path.replace(/^\/glossary\//, ''))

  let published: { articles: string[]; glossary: string[] } = { articles: [], glossary: [] }
  if (articleHits.length > 0 || glossarySlugs.length > 0) {
    published = await client.withConfig({ perspective: 'published', useCdn: true }).fetch(
      PUBLISHED_SLUGS_QUERY,
      { articles: articleHits.map((h) => h.meta.slug), glossary: glossarySlugs },
    )
  }
  const liveArticles = new Set(published.articles ?? [])
  const liveGlossary = new Set(published.glossary ?? [])

  const hits: RelatedHit[] = [
    ...articleHits
      .filter((h) => liveArticles.has(h.meta.slug))
      .map((h) => ({
        path: `/analysis/${h.meta.slug}`,
        title: h.meta.title,
        description: h.meta.excerpt ?? '',
        kind: 'article' as const,
        score: h.score,
      })),
    ...pageHits
      .filter((h) => h.meta.kind !== 'glossary' || liveGlossary.has(h.meta.path.replace(/^\/glossary\//, '')))
      .map((h) => ({
        path: h.meta.path,
        title: h.meta.title,
        description: h.meta.description,
        kind: h.meta.kind,
        score: h.score,
      })),
  ]

  return hits.sort((a, b) => b.score - a.score).slice(0, SEMANTIC_MAX_RESULTS * 2)
}
