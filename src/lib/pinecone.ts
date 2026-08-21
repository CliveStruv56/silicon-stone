import 'server-only'
import { Pinecone } from '@pinecone-database/pinecone'

let pineconeClient: Pinecone | null = null

function getClient(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    })
  }
  return pineconeClient
}

export function getPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME
  if (!indexName) throw new Error('PINECONE_INDEX_NAME is not set')
  return getClient().index(indexName)
}

export function getEvidencePineconeIndex() {
  const indexName = process.env.PINECONE_EVIDENCE_INDEX_NAME
  if (!indexName) throw new Error('PINECONE_EVIDENCE_INDEX_NAME is not set')
  return getClient().index(indexName)
}

/**
 * The regulatory retrieval corpus — primary statutory text for drafting at
 * /create. A SEPARATE index, not a namespace on the article index, for two
 * reasons: `silicon-and-stone` was created with an integrated embed config
 * (llama-text-embed-v2) that does not match the OpenAI vectors this app writes,
 * and index-level embed config is not scoped by namespace; and a separate
 * accessor is something scripts/regulatory-index-checks.ts can statically
 * assert the Compliance Checker never imports.
 *
 * EDITORIAL LANE ONLY — never an authority for anything rendered on screen by
 * the Compliance Checker. See CLAUDE.md.
 */
export function getRegulatoryPineconeIndex() {
  const indexName = process.env.PINECONE_REGULATORY_INDEX_NAME
  if (!indexName) throw new Error('PINECONE_REGULATORY_INDEX_NAME is not set')
  return getClient().index(indexName)
}

/** One corpus version is live at a time; a cutover flips this and drops the old. */
export function getRegulatoryNamespace(): string | undefined {
  return process.env.PINECONE_REGULATORY_NAMESPACE || undefined
}

/**
 * Editorial memory — reviewed knowledge items and sources, for drafting at
 * /create. Wave 3 of the knowledge programme.
 *
 * A SEPARATE index rather than a namespace on the article index, and the
 * reason is a script rather than a theory: `src/scripts/sync-pinecone.ts`
 * enumerates the article index and deletes **every id it does not find in
 * Sanity's article list**. A knowledge namespace would survive that today only
 * incidentally, because `listPaginated` on the bare index handle reads the
 * default namespace — an SDK default the script never mentions. One
 * `index.namespace(...)` added there and the editorial corpus is gone.
 *
 * The blast radius of a rebuild script must not include another lane's
 * records, and that safety has to be structural. It also keeps
 * `articles:verify-index`'s counts unambiguous; the regulatory lane already
 * learned that a shared total hides records stranded by a re-chunk.
 *
 * EDITORIAL LANE ONLY, on the same terms as the regulatory index: material here
 * is captured commentary a human approved, never an authority for anything the
 * Compliance Checker renders.
 */
export function getKnowledgePineconeIndex() {
  const indexName = process.env.PINECONE_KNOWLEDGE_INDEX_NAME
  if (!indexName) throw new Error('PINECONE_KNOWLEDGE_INDEX_NAME is not set')
  return getClient().index(indexName)
}

/** Whether editorial memory has a store at all. Callers degrade rather than
 * throw: a lane with no index is a lane that reports `skipped`. */
export function knowledgeIndexConfigured(): boolean {
  return Boolean(process.env.PINECONE_KNOWLEDGE_INDEX_NAME)
}

export type PineconeArticleMetadata = {
  title: string
  slug: string
  excerpt: string
  contentType: string
  intelligenceTier: string
  impactScore: number
  publishedAt: string
  personas: string
}

export async function searchSimilar(
  vector: number[],
  topK: number,
  excludeId?: string
): Promise<Array<{ id: string; score: number; metadata: PineconeArticleMetadata }>> {
  const index = getPineconeIndex()
  const result = await index.query({
    vector,
    topK: excludeId ? topK + 1 : topK,
    includeMetadata: true,
    includeValues: false,
  })

  return (result.matches ?? [])
    .filter((m) => m.id !== excludeId)
    .slice(0, topK)
    .map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: m.metadata as PineconeArticleMetadata,
    }))
}
