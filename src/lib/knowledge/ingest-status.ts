import type { KnowledgeErrorCode } from './service'

/**
 * How a domain outcome becomes an HTTP status.
 *
 * One table, in one place, typed `satisfies Record<KnowledgeErrorCode, number>`
 * — so adding a seventh error code to the domain fails `tsc` here rather than
 * silently falling through to a 500 somewhere.
 */
export const KNOWLEDGE_ERROR_STATUS = {
  /** The caller's payload was wrong, and the field errors say how. */
  validation_failed: 400,
  /** The payload was well-formed but pointed at documents that do not exist,
   * or at the wrong type. 422 rather than 400: the syntax was fine. */
  unresolved_reference: 422,
  /** Two or more existing records match. A human must reconcile them; retrying
   * cannot help. */
  duplicate_conflict: 409,
  transition_refused: 409,
  not_found: 404,
  /**
   * Sanity refused the write. 502 rather than 500 because the failure is
   * upstream of us — and see `SAFE_WRITE_FAILURE_MESSAGE` for why the
   * underlying message must not travel with it.
   */
  write_failed: 502,
} satisfies Record<KnowledgeErrorCode, number>

/**
 * What a caller is told when a write fails.
 *
 * The real message is `error.message` from the Sanity client, which can name
 * the project, the dataset, and which permission the token lacks. That belongs
 * in the server log, not in a response to an external client. Every route
 * returns this fixed sentence instead.
 */
export const SAFE_WRITE_FAILURE_MESSAGE =
  'The record could not be saved. This has been logged; please try again shortly.'

/**
 * Failures that happen before the domain is reached — the envelope itself was
 * wrong. All 400: the caller sent something we will not act on, and none of
 * them is a server or upstream problem.
 */
export const INGEST_ENVELOPE_ERROR_STATUS = {
  /** Not an object, or missing `kind`/`payload`. */
  malformed_envelope: 400,
  /** A `version` this build does not speak. */
  unsupported_version: 400,
  /** A `kind` outside the supported set. */
  unsupported_kind: 400,
  /** Extraction was requested. Refused rather than queued — see `ingest.ts`. */
  extraction_unsupported: 400,
} as const

export type IngestEnvelopeErrorCode = keyof typeof INGEST_ENVELOPE_ERROR_STATUS

/** Everything a caller can be told went wrong. */
export type IngestErrorCode = KnowledgeErrorCode | IngestEnvelopeErrorCode

/** The status for a domain failure. */
export function statusForKnowledgeError(code: KnowledgeErrorCode): number {
  return KNOWLEDGE_ERROR_STATUS[code]
}

/** The status for any ingestion failure, envelope or domain. */
export function statusForIngestError(code: IngestErrorCode): number {
  return code in INGEST_ENVELOPE_ERROR_STATUS
    ? INGEST_ENVELOPE_ERROR_STATUS[code as IngestEnvelopeErrorCode]
    : KNOWLEDGE_ERROR_STATUS[code as KnowledgeErrorCode]
}

/**
 * The status for a success. A duplicate returns the record that already
 * existed, which is a 200 — nothing was created, and answering 201 would tell
 * the caller it had made something it had not.
 */
export function statusForKnowledgeSuccess(created: boolean): number {
  return created ? 201 : 200
}
