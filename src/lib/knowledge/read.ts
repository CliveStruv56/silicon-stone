import type { KnowledgeClient } from './repository'

/**
 * Reads for external clients.
 *
 * Everything here hands records to a third-party model, which is retrieval by
 * any honest definition — so master spec §7's eligibility rules apply, not just
 * the ones about indexing. Three consequences are built in rather than left to
 * each caller:
 *
 *  - **Sensitive records never leave.** Anything marked `private` or
 *    `confidential` is excluded at the query, not filtered afterwards.
 *  - **Projections are explicit, never `*`.** A field added to a schema later
 *    must not start flowing to an external client because nobody revisited a
 *    projection.
 *  - **Limits are capped server-side.** A caller asking for 10,000 records gets
 *    the ceiling, not the request.
 *
 * `repository.ts` has no search, so `searchKnowledge` is genuinely new here
 * rather than a wrapper.
 */

export const KNOWLEDGE_READ_DEFAULT_LIMIT = 20
export const KNOWLEDGE_READ_MAX_LIMIT = 50
/** Long enough for a real phrase, short enough not to be a payload. */
export const KNOWLEDGE_SEARCH_MAX_QUERY_LENGTH = 200

/**
 * Excluded from every external read.
 *
 * `sensitivity` only exists on `knowledgeItem`; on a source the field is
 * undefined and the clause is simply true, which is the intended behaviour.
 */
const SENSITIVITY_CLAUSE = '!(sensitivity in ["private", "confidential"])'
const NOT_DRAFT = '!(_id in path("drafts.**"))'

/** What a list row shows. Deliberately no `body` — a list is for choosing. */
const SUMMARY_PROJECTION = `{
  _id,
  _type,
  _createdAt,
  title,
  reviewStatus,
  "kind": coalesce(kind, sourceType),
  summary,
  "sourceSystem": provenance.sourceSystem
}`

/** One record in full, including its body. */
const RECORD_PROJECTION = `{
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  reviewStatus,
  "kind": coalesce(kind, sourceType),
  summary,
  "body": coalesce(body, extractedText),
  editorNotes,
  intendedUse,
  confidence,
  "sourceSystem": provenance.sourceSystem,
  "topics": topics[]->{ _id, title, "slug": slug.current },
  originalUrl,
  publisher,
  publishedDate
}`

export interface KnowledgeSummaryRow {
  _id: string
  _type: string
  _createdAt?: string
  title?: string
  reviewStatus?: string
  kind?: string
  summary?: string
  sourceSystem?: string
}

function clampLimit(limit: unknown): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return KNOWLEDGE_READ_DEFAULT_LIMIT
  }
  return Math.min(KNOWLEDGE_READ_MAX_LIMIT, Math.max(1, Math.floor(limit)))
}

/**
 * Everything awaiting review, newest first.
 *
 * A source captured before the foundation wave has no `reviewStatus`, only the
 * legacy `status`, so the filter asks both questions — the same rule the Studio
 * lists follow. Without it the inbox looks empty of exactly the records that
 * have been waiting longest.
 */
export async function listKnowledgeInbox(
  client: KnowledgeClient,
  options: { limit?: number } = {},
): Promise<KnowledgeSummaryRow[]> {
  const limit = clampLimit(options.limit)
  const rows = await client.fetch<KnowledgeSummaryRow[] | null>(
    `*[_type in ["knowledgeItem", "knowledgeSource"]
        && ${NOT_DRAFT}
        && ${SENSITIVITY_CLAUSE}
        && (reviewStatus == "inbox" || (!defined(reviewStatus) && status == "pending"))
      ] | order(_createdAt desc) ${SUMMARY_PROJECTION}[0...$limit]`,
    { limit },
  )
  return rows ?? []
}

/** One record by canonical ID, or null. */
export async function getKnowledgeRecord(
  client: KnowledgeClient,
  documentId: string,
): Promise<Record<string, unknown> | null> {
  if (typeof documentId !== 'string' || !/^[A-Za-z0-9._-]+$/.test(documentId)) return null
  const row = await client.fetch<Record<string, unknown> | null>(
    `*[_id == $documentId
        && _type in ["knowledgeItem", "knowledgeSource"]
        && ${SENSITIVITY_CLAUSE}
      ][0] ${RECORD_PROJECTION}`,
    { documentId },
  )
  return row ?? null
}

/**
 * Text search across the knowledge lane.
 *
 * GROQ `match`, not vectors: editorial memory is not indexed until a later
 * wave, and describing this as semantic search would misrepresent what a caller
 * gets back. The query is passed as a parameter and capped; it is never
 * concatenated into the GROQ.
 */
export async function searchKnowledge(
  client: KnowledgeClient,
  options: { query: string; limit?: number },
): Promise<KnowledgeSummaryRow[]> {
  const query = normaliseSearchQuery(options.query)
  if (!query) return []
  const limit = clampLimit(options.limit)

  const rows = await client.fetch<KnowledgeSummaryRow[] | null>(
    `*[_type in ["knowledgeItem", "knowledgeSource"]
        && ${NOT_DRAFT}
        && ${SENSITIVITY_CLAUSE}
        && ([title, summary, body, extractedText] match $query)
      ] | order(_createdAt desc) ${SUMMARY_PROJECTION}[0...$limit]`,
    { query, limit },
  )
  return rows ?? []
}

/**
 * Trims, caps, and strips the characters GROQ's `match` treats specially.
 *
 * `*` is a wildcard: a bare `*` would match everything, which is a way to
 * exfiltrate the whole lane through a search box.
 */
export function normaliseSearchQuery(input: unknown): string {
  if (typeof input !== 'string') return ''
  const cleaned = input
    .replace(/[*?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, KNOWLEDGE_SEARCH_MAX_QUERY_LENGTH)
  return cleaned
}
