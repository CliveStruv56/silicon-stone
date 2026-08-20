import { absoluteUrl } from '@/lib/site'

import {
  captureKnowledgeItem,
  captureSource,
  type KnowledgeServiceDeps,
} from './service'
import type { DuplicateOutcome } from './repository'
import type { KnowledgeValidationError } from './schema'
import type { IngestErrorCode } from './ingest-status'
import type { KnowledgeSourceSystem } from './types'

/**
 * The one place external capture enters the knowledge domain.
 *
 * Both the REST endpoint and the MCP server call this; neither re-implements
 * any of it. It sits above `service.ts` rather than inside it because the
 * things it owns are transport concerns — a versioned envelope, what an
 * external caller is and is not allowed to declare, and turning a relative
 * review path into a link somebody can click in a chat window.
 *
 * Deliberately free of `server-only`, `next/server` and any client: the deps
 * arrive as a parameter exactly as they do for `service.ts`, so all of this is
 * testable against a stub.
 */

/** The envelope version this build speaks. Bump only for a breaking change;
 * an external client may be pinned to it for a long time. */
export const INGEST_ENVELOPE_VERSION = 1

export const INGEST_KINDS = ['knowledge_item', 'source'] as const
export type IngestKind = (typeof INGEST_KINDS)[number]

export interface IngestContext {
  /**
   * Provenance, set by the server from the authenticated transport — never
   * from the payload.
   *
   * `sourceSystem` is half of the `external_reference` duplicate probe, so a
   * caller able to choose it can split or merge deduplication buckets. It is
   * also the field a reader uses to judge where something came from, which
   * makes it exactly the field that must not be self-declared.
   */
  sourceSystem: KnowledgeSourceSystem
  capturedBy?: string
}

export interface IngestRecord {
  documentId: string
  documentType: string
  status: string
  created: boolean
  duplicate: DuplicateOutcome
  /** Absolute, so it is clickable wherever it is rendered. */
  reviewUrl: string
}

export interface IngestFailure {
  code: IngestErrorCode
  message: string
  errors?: KnowledgeValidationError[]
  duplicate?: DuplicateOutcome
}

export type IngestResult =
  | { ok: true; record: IngestRecord }
  | { ok: false; failure: IngestFailure }

function fail(
  code: IngestErrorCode,
  message: string,
  extra: Omit<IngestFailure, 'code' | 'message'> = {},
): IngestResult {
  return { ok: false, failure: { code, message, ...extra } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Applies the server's provenance over whatever the caller sent.
 *
 * `parseProvenance` in `schema.ts` prefers a nested `provenance` object when
 * one is present, so setting it here makes any flat `sourceSystem` in the
 * payload dead text rather than a competing value.
 */
function withServerProvenance(
  payload: Record<string, unknown>,
  context: IngestContext,
  envelopeIdempotencyKey: string | undefined,
): Record<string, unknown> {
  const declared = isRecord(payload.provenance) ? payload.provenance : {}
  return {
    ...payload,
    provenance: {
      ...declared,
      sourceSystem: context.sourceSystem,
      ...(context.capturedBy ? { capturedBy: context.capturedBy } : {}),
      ...(envelopeIdempotencyKey
        ? { idempotencyKey: envelopeIdempotencyKey }
        : {}),
    },
  }
}

/**
 * Accepts one capture.
 *
 * The order of refusals matters: the envelope is checked before the payload is
 * looked at, so a caller speaking a version we do not understand is told that,
 * rather than receiving field errors about a schema that may not apply to it.
 */
export async function ingestCapture(
  deps: KnowledgeServiceDeps,
  envelope: unknown,
  context: IngestContext,
): Promise<IngestResult> {
  if (!isRecord(envelope)) {
    return fail('malformed_envelope', 'The request body must be a JSON object.')
  }

  const { version, kind, payload, idempotencyKey } = envelope

  if (version !== undefined && version !== INGEST_ENVELOPE_VERSION) {
    return fail(
      'unsupported_version',
      `Unsupported envelope version. This deployment speaks version ${INGEST_ENVELOPE_VERSION}.`,
    )
  }
  if (typeof kind !== 'string' || !(INGEST_KINDS as readonly string[]).includes(kind)) {
    return fail(
      'unsupported_kind',
      `kind must be one of: ${INGEST_KINDS.join(', ')}.`,
    )
  }
  if (!isRecord(payload)) {
    return fail('malformed_envelope', 'payload must be an object.')
  }
  if (idempotencyKey !== undefined && typeof idempotencyKey !== 'string') {
    return fail('malformed_envelope', 'idempotencyKey must be a string.')
  }

  // Refused, not queued. Accepting it would create work that nothing drains,
  // and a queue that silently accumulates reads as progress while being none.
  // Extraction is a later wave with its own security surface (SSRF, redirects,
  // MIME confusion) that has not been built.
  if (payload.extractionExpected === true) {
    return fail(
      'extraction_unsupported',
      'Fetching and extracting a URL is not supported yet. Send the text with the source.',
    )
  }

  const input = withServerProvenance(payload, context, idempotencyKey)

  const result =
    kind === 'source'
      ? await captureSource(deps, input)
      : await captureKnowledgeItem(deps, input)

  if (!result.ok) {
    return fail(result.code, result.message, {
      ...(result.errors ? { errors: result.errors } : {}),
      ...(result.duplicate ? { duplicate: result.duplicate } : {}),
    })
  }

  return {
    ok: true,
    record: {
      documentId: result.documentId,
      documentType: result.documentType,
      status: result.status,
      created: result.created,
      duplicate: result.duplicate,
      // `knowledgeReviewUrl()` returns a site-relative path, which is right for
      // the app and useless pasted into a chat window. Absolutised here rather
      // than in `ids.ts`, which is tested and used by other callers.
      reviewUrl: absoluteUrl(result.reviewUrl),
    },
  }
}
