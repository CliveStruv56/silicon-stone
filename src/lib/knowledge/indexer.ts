import 'server-only'

/**
 * Editorial memory's writer — wave 3.
 *
 * Takes one knowledge record and makes the index agree with it: embed and
 * upsert if it should be there, remove it if it should not, and move the state
 * machine either way so the document itself says what happened.
 *
 * Three properties this has to hold, all of them decisions rather than details:
 *
 * - **Indexing never costs a reviewer their verdict.** `indexRecord` is called
 *   after the review transition has already been written. It returns an outcome
 *   and throws nothing; a failure leaves the record `pending` or `error` with a
 *   message, and `knowledge:sync` repairs it later.
 * - **Nothing is silently truncated.** `generateEmbedding` caps its input at
 *   `MAX_EMBEDDING_CHARS` and slices, which is right for articles and wrong
 *   here — a source stored as its first 24,000 characters is a document the
 *   corpus misrepresents with nothing on the record to show for it. Over the
 *   budget is an `error` naming the limit, and chunking earns its own brief
 *   when a real oversized source appears.
 * - **Every move is a real move.** The machine refuses `pending → pending` and
 *   `indexed → indexed`, so re-indexing changed content goes through `pending`
 *   and a caller that wants a self-transition has not decided whether anything
 *   changed.
 */

import { EMBEDDING_MODEL, MAX_EMBEDDING_CHARS, generateEmbedding } from '../embeddings'
import { getKnowledgePineconeIndex, knowledgeIndexConfigured } from '../pinecone'
import {
  canonicalIndexHash,
  embeddableText,
  indexEligibility,
  type IndexCandidate,
} from './eligibility'
import { getDocument } from './repository'
import { applyIndexTransition, type KnowledgeServiceDeps } from './service'

/**
 * Bumped when the metadata shape or the text composition changes in a way that
 * makes existing vectors wrong rather than merely old. Reconciliation compares
 * it, so a bump is how a re-index of everything is asked for.
 */
export const KNOWLEDGE_INDEX_VERSION = '2026-08-21'

export type IndexOutcome =
  | { action: 'indexed'; documentId: string }
  | { action: 'removed'; documentId: string; reason: string }
  | { action: 'unchanged'; documentId: string; reason: string }
  | { action: 'failed'; documentId: string; reason: string }

/** Everything the lane needs to read back without a second Sanity round trip.
 * Small on purpose: Pinecone caps metadata at 40 KB, and the full text lives in
 * the document, which is the thing a reviewer should be reading anyway. */
const SNIPPET_CHARS = 400

function metadataFor(doc: IndexCandidate, text: string): Record<string, string> {
  return {
    documentId: String(doc._id ?? ''),
    documentType: String(doc._type ?? ''),
    title: (doc.title ?? '').slice(0, 200),
    ...(doc.publisher ? { publisher: doc.publisher.slice(0, 200) } : {}),
    snippet: text.slice(0, SNIPPET_CHARS),
    indexVersion: KNOWLEDGE_INDEX_VERSION,
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export interface IndexRecordInput {
  documentId: string
  /** Pass the document when the caller already has it, to save a read. */
  document?: IndexCandidate & { indexState?: { status?: string; indexedHash?: string } | null }
}

/**
 * Reconcile one record with the index.
 *
 * Returns rather than throws — every caller is mid-something-else and has
 * nothing useful to do with an exception.
 */
export async function indexRecord(
  deps: KnowledgeServiceDeps,
  input: IndexRecordInput,
): Promise<IndexOutcome> {
  const { documentId } = input

  if (!knowledgeIndexConfigured()) {
    return {
      action: 'unchanged',
      documentId,
      reason: 'PINECONE_KNOWLEDGE_INDEX_NAME is not set — editorial memory has no store.',
    }
  }

  const doc =
    input.document ??
    (await getDocument<IndexCandidate & { indexState?: { status?: string; indexedHash?: string } }>(
      deps.client,
      documentId,
    ))
  if (!doc) return { action: 'failed', documentId, reason: 'The document does not exist.' }

  const current = doc.indexState?.status ?? 'not_eligible'
  const verdict = indexEligibility(doc)

  // ---- not eligible: make sure the index does not hold it -----------------
  if (!verdict.eligible) {
    if (current === 'not_eligible') {
      return { action: 'unchanged', documentId, reason: verdict.reason }
    }
    try {
      await getKnowledgePineconeIndex().deleteOne({ id: documentId })
    } catch (error) {
      // Deleting an id that was never there is a no-op, so a real failure here
      // is the store being unreachable. Say so and leave the state alone: a
      // record marked not_eligible while its vector survives is worse than one
      // that still says indexed.
      return { action: 'failed', documentId, reason: `Could not remove the vector: ${errorText(error)}` }
    }
    await applyIndexTransition(deps, { documentId, to: 'not_eligible' })
    return { action: 'removed', documentId, reason: verdict.reason }
  }

  // ---- eligible: index it if the index does not already agree -------------
  const text = embeddableText(doc)
  const canonicalHash = canonicalIndexHash(doc)

  if (current === 'indexed' && doc.indexState?.indexedHash === canonicalHash) {
    return { action: 'unchanged', documentId, reason: 'The index already holds this text.' }
  }

  if (current !== 'pending') {
    const opened = await applyIndexTransition(deps, { documentId, to: 'pending', canonicalHash })
    if (!opened.ok) {
      return { action: 'failed', documentId, reason: `${opened.code}: ${opened.message}` }
    }
  }

  // Checked BEFORE embedding, because generateEmbedding would slice silently.
  if (text.length > MAX_EMBEDDING_CHARS) {
    const reason =
      `The text is ${text.length.toLocaleString()} characters; the limit for a single ` +
      `vector is ${MAX_EMBEDDING_CHARS.toLocaleString()}. Editorial memory stores one ` +
      `vector per record and will not index part of a document as though it were all ` +
      `of it. Shorten the record, or chunking has to be built.`
    await applyIndexTransition(deps, { documentId, to: 'error', lastError: reason, canonicalHash })
    return { action: 'failed', documentId, reason }
  }

  try {
    const values = await generateEmbedding(text)
    // `{ records }`, not a bare array — the same call shape the evidence lane
    // and /api/vectorize use, and the same one whose bare-array twin broke the
    // test teardown for weeks before anyone noticed.
    await getKnowledgePineconeIndex().upsert({
      records: [{ id: documentId, values, metadata: metadataFor(doc, text) }],
    })
  } catch (error) {
    const reason = errorText(error)
    await applyIndexTransition(deps, { documentId, to: 'error', lastError: reason, canonicalHash })
    return { action: 'failed', documentId, reason }
  }

  const done = await applyIndexTransition(deps, {
    documentId,
    to: 'indexed',
    canonicalHash,
    indexedHash: canonicalHash,
    embeddingModel: EMBEDDING_MODEL,
    indexVersion: KNOWLEDGE_INDEX_VERSION,
  })
  if (!done.ok) {
    // The vector is in the index and the document does not say so. That is
    // exactly what reconciliation exists to find, so report and leave it.
    return { action: 'failed', documentId, reason: `${done.code}: ${done.message}` }
  }

  return { action: 'indexed', documentId }
}
