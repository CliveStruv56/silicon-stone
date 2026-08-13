/**
 * Pinecone access for the regulatory corpus.
 *
 * EDITORIAL LANE ONLY. Nothing here may be imported by src/lib/report/,
 * src/lib/rulepack/ or the Compliance Checker route — scripts/regulatory-index-checks.ts
 * fails the build if it is.
 *
 * Deliberately never uses the integrated-text query path (`searchRecords`,
 * `query: { inputs: … }`). Our vectors come from OpenAI text-embedding-3-small;
 * letting Pinecone embed a query itself would compare across two different
 * embedding spaces and return confident nonsense.
 */

import { getRegulatoryPineconeIndex, getRegulatoryNamespace } from '../pinecone'
import { generateEmbedding } from '../embeddings'
import type { RegulatoryChunkMetadata, RegulatoryChunkRecord, RegulatoryHit } from './types'

/** Parallel embedding calls in flight. Matches the evidence lane. */
export const REGULATORY_EMBEDDING_BATCH_SIZE = 8

/**
 * Records per upsert request. Pinecone caps a request at 2MB; a 1024-float
 * vector serialises to ~20KB, so ~100 records plus metadata sits safely inside.
 * (The evidence lane upserts unbatched and will fail on a large source — see
 * src/lib/evidence-index.ts.)
 */
export const REGULATORY_UPSERT_BATCH_SIZE = 100

type EmbeddedRecord = {
  id: string
  values: number[]
  metadata: RegulatoryChunkMetadata
}

async function embedInBatches(
  records: RegulatoryChunkRecord[],
  onProgress?: (done: number, total: number) => void,
): Promise<EmbeddedRecord[]> {
  const embedded: EmbeddedRecord[] = []

  for (let i = 0; i < records.length; i += REGULATORY_EMBEDDING_BATCH_SIZE) {
    const batch = records.slice(i, i + REGULATORY_EMBEDDING_BATCH_SIZE)
    const done = await Promise.all(
      batch.map(async ({ id, metadata }) => ({
        id,
        values: await generateEmbedding(metadata.text),
        metadata,
      })),
    )
    embedded.push(...done)
    onProgress?.(embedded.length, records.length)
  }

  return embedded
}

/**
 * Replace every chunk of one instrument. Deletes by corpusId first so a
 * structural change (an amendment that renumbers paragraphs) cannot leave
 * orphaned records citing provisions that no longer exist.
 */
export async function replaceInstrument(
  corpusId: string,
  records: RegulatoryChunkRecord[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ deleted: boolean; upserted: number }> {
  const index = getRegulatoryPineconeIndex()
  const namespace = getRegulatoryNamespace()
  const target = namespace ? index.namespace(namespace) : index

  try {
    await target.deleteMany({ filter: { corpusId: { $eq: corpusId } } })
  } catch (error) {
    // A fresh serverless index/namespace does not exist until its first upsert;
    // Pinecone reports that state as PineconeNotFoundError.
    if (!(error instanceof Error && error.name === 'PineconeNotFoundError')) throw error
  }

  if (records.length === 0) return { deleted: true, upserted: 0 }

  const embedded = await embedInBatches(records, onProgress)

  for (let i = 0; i < embedded.length; i += REGULATORY_UPSERT_BATCH_SIZE) {
    await target.upsert({ records: embedded.slice(i, i + REGULATORY_UPSERT_BATCH_SIZE) })
  }

  return { deleted: true, upserted: embedded.length }
}

export async function searchRegulatory(
  vector: number[],
  topK: number,
  filter?: Record<string, unknown>,
): Promise<RegulatoryHit[]> {
  const index = getRegulatoryPineconeIndex()
  const namespace = getRegulatoryNamespace()
  const target = namespace ? index.namespace(namespace) : index

  const result = await target.query({
    vector,
    topK,
    filter,
    includeMetadata: true,
    includeValues: false,
  })

  return (result.matches ?? []).map((match) => ({
    id: match.id,
    score: match.score ?? 0,
    metadata: match.metadata as unknown as RegulatoryChunkMetadata,
  }))
}
