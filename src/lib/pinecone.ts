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
