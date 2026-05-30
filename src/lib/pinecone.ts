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
