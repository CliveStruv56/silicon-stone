/**
 * Constants the three /api/knowledge routes and the /knowledge page share.
 *
 * This is the pre-foundation module and stays where it is: `sourceId`, the
 * brand tags and the five legacy source types are what existing documents and
 * the existing UI are built on.
 *
 * New work belongs in `src/lib/knowledge/` — the canonical types, transition
 * guards, normalisation, hashing, identity, parsers, repository and domain
 * service. `KNOWLEDGE_SOURCE_TYPES` below is the legacy subset of
 * `KNOWLEDGE_SOURCE_KINDS` there, and `scripts/knowledge-inbox-checks.ts`
 * asserts it stays a subset so the two lists cannot drift apart.
 */
export const KNOWLEDGE_SOURCE_TYPES = [
  'url',
  'pdf',
  'image',
  'note',
  'published_article',
] as const

export const KNOWLEDGE_BRAND_TAGS = [
  'silicon-and-stone',
  'waymark-path',
  'shared',
] as const

export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number]
export type KnowledgeBrandTag = (typeof KNOWLEDGE_BRAND_TAGS)[number]

export function assertValidSourceId(sourceId: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceId)) {
    throw new Error(`Invalid sourceId: ${sourceId}. Expected lower-case kebab-case.`)
  }
}
