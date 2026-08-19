/**
 * Sanity access for canonical knowledge documents.
 *
 * Every function takes the client as its first argument rather than importing
 * one. That is what lets the whole layer be tested against a stub — and, more
 * usefully, it is what keeps `server-only` out of this file, so the tests can
 * import it at all. The real client is wired in `sanity-client.ts`.
 *
 * Two rules hold throughout:
 *
 *  - **Every query is parameterised.** No caller-supplied value is ever
 *    concatenated into GROQ, including the document type.
 *  - **A duplicate lookup reports what it found, never what it decided.** The
 *    caller gets the matching IDs and the probe that matched; whether that
 *    counts as "the same record" is a domain judgement made in `service.ts`.
 */

import type { KnowledgeSourceSystem } from './types'

/* ------------------------------------------------------------------ *
 * The client this layer needs
 * ------------------------------------------------------------------ */

export interface KnowledgePatch {
  set(fields: Record<string, unknown>): KnowledgePatch
  setIfMissing(fields: Record<string, unknown>): KnowledgePatch
  unset(fields: string[]): KnowledgePatch
  commit(): Promise<{ _id: string }>
}

/**
 * The narrow slice of `@sanity/client` this layer uses. Narrow on purpose: a
 * stub implementing four methods is a believable test double, whereas a stub
 * implementing the whole client is a second implementation with its own bugs.
 */
export interface KnowledgeClient {
  fetch<T>(query: string, params?: Record<string, unknown>): Promise<T>
  create(document: Record<string, unknown>): Promise<{ _id: string }>
  createOrReplace(document: Record<string, unknown>): Promise<{ _id: string }>
  patch(id: string): KnowledgePatch
}

/* ------------------------------------------------------------------ *
 * Duplicate detection
 * ------------------------------------------------------------------ */

/**
 * The four ways a duplicate is recognised, in the order they are trusted.
 *
 * The order is a claim about how much each one knows. An idempotency key is
 * the caller stating "this is the same request"; an external reference is the
 * originating system stating "this is the same record"; a canonical URL is the
 * web stating "this is the same document"; a content hash only observes that
 * two texts happen to coincide, which is the weakest of the four and the one
 * most likely to be a coincidence worth keeping separate.
 */
export const DUPLICATE_PROBES = [
  'idempotency_key',
  'external_reference',
  'canonical_url',
  'content_hash',
] as const
export type DuplicateProbe = (typeof DUPLICATE_PROBES)[number]

export interface DuplicateProbeResult {
  probe: DuplicateProbe
  documentIds: string[]
}

export interface DuplicateOutcome {
  /** True when at least one probe matched at least one document. */
  duplicate: boolean
  /** The highest-precedence probe that matched, if any. */
  matchedBy?: DuplicateProbe
  /** The document the caller should treat as the existing record. Absent when
   * the result is ambiguous — there is no honest single answer. */
  documentId?: string
  /**
   * True when the probes cannot agree: one probe matched several documents, or
   * two probes matched different ones. The caller must not silently pick a
   * winner, because either case means the dataset holds a contradiction a
   * human should see.
   */
  ambiguous: boolean
  /** Everything every probe found, for reporting. */
  matches: DuplicateProbeResult[]
}

export interface DuplicateProbeInput {
  /** Restricts every probe to one document type. */
  documentType: string
  idempotencyKey?: string | null
  sourceSystem?: KnowledgeSourceSystem | null
  externalId?: string | null
  canonicalUrl?: string | null
  contentHash?: string | null
}

const ID_ONLY = '{ _id }'

async function ids(
  client: KnowledgeClient,
  query: string,
  params: Record<string, unknown>,
): Promise<string[]> {
  const rows = await client.fetch<{ _id: string }[] | null>(query, params)
  if (!Array.isArray(rows)) return []
  return [...new Set(rows.map((row) => row._id).filter((id): id is string => Boolean(id)))]
}

/** Documents whose provenance carries this idempotency key. */
export function findByIdempotencyKey(
  client: KnowledgeClient,
  documentType: string,
  idempotencyKey: string,
): Promise<string[]> {
  return ids(
    client,
    `*[_type == $documentType && provenance.idempotencyKey == $idempotencyKey && !(_id in path("drafts.**"))]${ID_ONLY}`,
    { documentType, idempotencyKey },
  )
}

/** Documents carrying this system's own identifier. Both halves are required:
 * an external ID is only unique within the system that issued it. */
export function findByExternalReference(
  client: KnowledgeClient,
  documentType: string,
  sourceSystem: string,
  externalId: string,
): Promise<string[]> {
  return ids(
    client,
    `*[_type == $documentType && provenance.sourceSystem == $sourceSystem && provenance.externalId == $externalId && !(_id in path("drafts.**"))]${ID_ONLY}`,
    { documentType, sourceSystem, externalId },
  )
}

/**
 * Documents at this canonical URL.
 *
 * `originalUrl` is checked as well as `canonicalUrl`, because every source
 * captured before this wave has only the former. Without that clause the first
 * re-capture of an existing page would look brand new.
 */
export function findByCanonicalUrl(
  client: KnowledgeClient,
  documentType: string,
  canonicalUrl: string,
): Promise<string[]> {
  return ids(
    client,
    `*[_type == $documentType && (canonicalUrl == $canonicalUrl || originalUrl == $canonicalUrl) && !(_id in path("drafts.**"))]${ID_ONLY}`,
    { documentType, canonicalUrl },
  )
}

/** Documents whose stored content hash matches. */
export function findByContentHash(
  client: KnowledgeClient,
  documentType: string,
  contentHash: string,
): Promise<string[]> {
  return ids(
    client,
    `*[_type == $documentType && contentHash == $contentHash && !(_id in path("drafts.**"))]${ID_ONLY}`,
    { documentType, contentHash },
  )
}

/**
 * Runs every probe it has the inputs for and reports the result.
 *
 * All four run, even once one has matched. Skipping the rest would be faster
 * and would hide exactly the disagreement worth knowing about — an idempotency
 * key pointing at one document while the URL points at another is a dataset
 * problem, not a cache miss.
 */
export async function findDuplicate(
  client: KnowledgeClient,
  input: DuplicateProbeInput,
): Promise<DuplicateOutcome> {
  const matches: DuplicateProbeResult[] = []

  if (input.idempotencyKey) {
    matches.push({
      probe: 'idempotency_key',
      documentIds: await findByIdempotencyKey(client, input.documentType, input.idempotencyKey),
    })
  }
  if (input.sourceSystem && input.externalId) {
    matches.push({
      probe: 'external_reference',
      documentIds: await findByExternalReference(
        client,
        input.documentType,
        input.sourceSystem,
        input.externalId,
      ),
    })
  }
  if (input.canonicalUrl) {
    matches.push({
      probe: 'canonical_url',
      documentIds: await findByCanonicalUrl(client, input.documentType, input.canonicalUrl),
    })
  }
  if (input.contentHash) {
    matches.push({
      probe: 'content_hash',
      documentIds: await findByContentHash(client, input.documentType, input.contentHash),
    })
  }

  const hits = matches.filter((match) => match.documentIds.length > 0)
  if (hits.length === 0) {
    return { duplicate: false, ambiguous: false, matches }
  }

  // Precedence, not recency: the probes are consulted in the order they are
  // declared, whatever order the inputs arrived in.
  const ranked = [...hits].sort(
    (a, b) => DUPLICATE_PROBES.indexOf(a.probe) - DUPLICATE_PROBES.indexOf(b.probe),
  )
  const winner = ranked[0]

  const everyId = new Set(hits.flatMap((match) => match.documentIds))
  const ambiguous = winner.documentIds.length > 1 || everyId.size > 1

  return {
    duplicate: true,
    matchedBy: winner.probe,
    documentId: ambiguous ? undefined : winner.documentIds[0],
    ambiguous,
    matches,
  }
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

/** Which of these IDs name a document that exists, and of what type. Used to
 * resolve references before writing one, so a reference cannot be created
 * pointing at nothing. */
export async function resolveExistingDocuments(
  client: KnowledgeClient,
  documentIds: readonly string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(documentIds.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const rows = await client.fetch<{ _id: string; _type: string }[] | null>(
    `*[_id in $documentIds]{ _id, _type }`,
    { documentIds: unique },
  )
  const found = new Map<string, string>()
  for (const row of rows ?? []) {
    if (row?._id && row?._type) found.set(row._id, row._type)
  }
  return found
}

/** One document by ID, or null. */
export async function getDocument<T = Record<string, unknown>>(
  client: KnowledgeClient,
  documentId: string,
): Promise<T | null> {
  const row = await client.fetch<T | null>(`*[_id == $documentId][0]`, { documentId })
  return row ?? null
}

/** Every legacy candidate, oldest first — the migration's read side. */
export interface LegacyCandidateRow {
  _id: string
  _createdAt?: string
  _updatedAt?: string
  candidateId?: string
  title?: string
  answer?: string
  sourceIds?: string[]
  brandTags?: string[]
  createdAt?: string
  status?: string
}

export function listLegacyCandidates(
  client: KnowledgeClient,
): Promise<LegacyCandidateRow[]> {
  return client
    .fetch<LegacyCandidateRow[] | null>(
      `*[_type == "knowledgeCandidate" && !(_id in path("drafts.**"))] | order(createdAt asc, _createdAt asc) {
        _id, _createdAt, _updatedAt, candidateId, title, answer, sourceIds, brandTags, createdAt, status
      }`,
    )
    .then((rows) => rows ?? [])
}

/** Maps the legacy string source IDs onto real source documents.
 * Returns every match, so an ID matching two documents is reported rather than
 * silently resolved to the first. */
export async function resolveSourceIdsToDocuments(
  client: KnowledgeClient,
  sourceIds: readonly string[],
): Promise<Map<string, string[]>> {
  const unique = [...new Set(sourceIds.filter(Boolean))]
  const resolved = new Map<string, string[]>(unique.map((id) => [id, []]))
  if (unique.length === 0) return resolved
  const rows = await client.fetch<{ _id: string; sourceId: string }[] | null>(
    `*[_type == "knowledgeSource" && sourceId in $sourceIds && !(_id in path("drafts.**"))]{ _id, sourceId }`,
    { sourceIds: unique },
  )
  for (const row of rows ?? []) {
    if (!row?.sourceId || !row?._id) continue
    const list = resolved.get(row.sourceId)
    if (list) list.push(row._id)
  }
  return resolved
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

export interface WriteResult {
  documentId: string
  created: boolean
}

/** Creates a document at a known ID. */
export async function createDocument(
  client: KnowledgeClient,
  document: Record<string, unknown> & { _id: string; _type: string },
): Promise<WriteResult> {
  const result = await client.create(document)
  return { documentId: result?._id ?? document._id, created: true }
}

/** Patches fields onto an existing document. `setIfMissing` is offered
 * separately because a backfill must not overwrite an editor's decision. */
export async function patchDocument(
  client: KnowledgeClient,
  documentId: string,
  fields: Record<string, unknown>,
  { onlyIfMissing = false }: { onlyIfMissing?: boolean } = {},
): Promise<WriteResult> {
  const patch = client.patch(documentId)
  const applied = onlyIfMissing ? patch.setIfMissing(fields) : patch.set(fields)
  const result = await applied.commit()
  return { documentId: result?._id ?? documentId, created: false }
}
