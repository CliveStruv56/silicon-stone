import { getEvidencePineconeIndex } from './pinecone'
import {
  buildEvidenceChunkRecords,
  type EvidenceChunkMetadata,
  type EvidenceSource,
} from './evidence'
import { generateEmbedding } from './embeddings'

export async function replaceEvidenceSource(source: EvidenceSource) {
  const index = getEvidencePineconeIndex()
  const records = buildEvidenceChunkRecords(source)

  try {
    await index.deleteMany({
      filter: { sourceId: { $eq: source.sourceId } },
    })
  } catch (error) {
    // A new serverless index has no default namespace until its first upsert.
    // Pinecone reports that initial state as PineconeNotFoundError.
    if (!(error instanceof Error && error.name === 'PineconeNotFoundError')) {
      throw error
    }
  }

  if (records.length === 0) return { deleted: true, upserted: 0 }

  const embeddedRecords = await Promise.all(
    records.map(async ({ id, metadata }) => ({
      id,
      values: await generateEmbedding(metadata.text),
      metadata,
    })),
  )

  await index.upsert({ records: embeddedRecords })
  return { deleted: true, upserted: embeddedRecords.length }
}

export async function searchEvidence(
  vector: number[],
  topK: number,
  filter?: Record<string, unknown>,
): Promise<Array<{ id: string; score: number; metadata: EvidenceChunkMetadata }>> {
  const result = await getEvidencePineconeIndex().query({
    vector,
    topK,
    filter,
    includeMetadata: true,
    includeValues: false,
  })

  return (result.matches ?? []).map((match) => ({
    id: match.id,
    score: match.score ?? 0,
    metadata: match.metadata as EvidenceChunkMetadata,
  }))
}
