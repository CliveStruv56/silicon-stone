import { randomUUID } from 'node:crypto'

import { compositeHash, sha256Hex } from './hash'
import { normalizeCanonicalUrl, normalizeExternalId, normalizeText } from './normalize'
import type { KnowledgeSourceSystem, SanityReference } from './types'

/**
 * Canonical identity for knowledge documents.
 *
 * Every ID here is server-generated. Master spec §4 lists "source capture
 * requires manual IDs" as a gap to close: a human typing a kebab-case handle
 * is a step that fails silently, collides, and cannot be done at all by a
 * ChatGPT adapter.
 *
 * The `<type>.<uuid>` shape is the one the existing source route already writes
 * (`knowledgeSource.${randomUUID()}`), kept so old and new documents are not
 * distinguishable by the shape of their ID. Prefixing with the type is what
 * makes an ID legible in a log line and in the Studio URL bar.
 */

/** Sanity permits `[A-Za-z0-9._-]` in a document ID. Anything else has to go. */
const ID_SAFE = /[^A-Za-z0-9._-]/g

/** A freshly minted canonical ID for a new document. */
export function canonicalDocumentId(type: string, uuid: string = randomUUID()): string {
  return `${type}.${uuid}`
}

/**
 * A *deterministic* ID derived from a seed — the same seed always yields the
 * same ID.
 *
 * This is what makes the candidate migration rerunnable: a second dry run
 * proposes the identical document IDs, and a second write updates rather than
 * duplicates. A random UUID would make every rerun look like fresh work.
 *
 * The digest is truncated to 32 hex characters. That is 128 bits — the same
 * collision resistance a UUID offers, on a keyspace of at most a few thousand
 * legacy records.
 */
export function deterministicDocumentId(type: string, seed: string): string {
  return `${type}.${sha256Hex(seed).slice(0, 32)}`
}

/** Splits a canonical ID back into its parts, or `null` if it is not one.
 * Tolerates the `drafts.` prefix Sanity puts on unpublished documents. */
export function parseCanonicalDocumentId(
  id: unknown,
): { type: string; localId: string; isDraft: boolean } | null {
  if (typeof id !== 'string' || !id) return null
  const isDraft = id.startsWith('drafts.')
  const bare = isDraft ? id.slice('drafts.'.length) : id
  const dot = bare.indexOf('.')
  if (dot <= 0 || dot === bare.length - 1) return null
  return { type: bare.slice(0, dot), localId: bare.slice(dot + 1), isDraft }
}

/** The published ID for a document that may be a draft. */
export function publishedId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

/**
 * The stable key for "this record, in that system".
 *
 * Both halves are needed: an external ID is only unique within the system that
 * issued it, and two adapters can easily both call something `1`.
 */
export function externalReferenceKey(
  sourceSystem: KnowledgeSourceSystem,
  externalId: unknown,
): string | null {
  const id = normalizeExternalId(externalId)
  if (!id) return null
  return `${sourceSystem}:${id}`
}

/**
 * Derives an idempotency key when the caller did not supply one.
 *
 * A supplied key always wins — the caller knows better than we do which two
 * requests are the same request. This fallback is for adapters that cannot
 * generate one, and it is deliberately built from *content* identity: the
 * document type, the source system, the external reference, the canonical URL
 * and the normalised body. Two captures that agree on all five are the same
 * capture by any definition worth having.
 */
export function derivedIdempotencyKey(input: {
  documentType: string
  sourceSystem?: KnowledgeSourceSystem
  externalId?: string | null
  url?: string | null
  content?: string | null
}): string {
  return compositeHash([
    input.documentType,
    input.sourceSystem ?? 'unknown',
    normalizeExternalId(input.externalId ?? ''),
    normalizeCanonicalUrl(input.url ?? '') ?? '',
    normalizeText(input.content ?? ''),
  ])
}

/** A Sanity reference to a document. */
export function reference(id: string): SanityReference {
  return { _type: 'reference', _ref: publishedId(id) }
}

/**
 * A reference for use inside an array.
 *
 * `_key` is derived from the target ID rather than randomly generated, so
 * writing the same set of references twice produces byte-identical arrays.
 * Random keys make every rerun of a migration look like a change, which is how
 * an idempotent script stops being idempotent in practice.
 */
export function keyedReference(id: string, salt = ''): SanityReference {
  const target = publishedId(id)
  return {
    _type: 'reference',
    _ref: target,
    _key: sha256Hex(`${target}${salt}`).slice(0, 12),
  }
}

/**
 * References for an array, de-duplicated, order preserved.
 *
 * The index is folded into the key only where a target genuinely repeats,
 * which cannot happen after de-duplication — so in practice the keys depend on
 * the targets alone, and reordering the array does not rewrite them.
 */
export function keyedReferences(ids: readonly string[]): SanityReference[] {
  const seen = new Set<string>()
  const out: SanityReference[] = []
  for (const id of ids) {
    const target = publishedId(id)
    if (!target || seen.has(target)) continue
    seen.add(target)
    out.push(keyedReference(target))
  }
  return out
}

/**
 * A legacy kebab-case handle, sanitised into something usable as an ID
 * fragment. Used only where an old string ID has to survive into a new
 * document; nothing new generates one.
 */
export function sanitiseIdFragment(value: string): string {
  return value.replace(ID_SAFE, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')
}

/**
 * Where a human goes to review a record: the document itself, open in Studio.
 *
 * This used to return `/knowledge?record=<id>`. That page never read the
 * `record` parameter and does not list knowledge items at all — it is the
 * pre-foundation capture workspace — so every capture handed the user a link
 * that landed somewhere real and useless. The wave-4 cockpit that would have
 * read it does not exist.
 *
 * Two things make the Studio **intent** URL the right target rather than a
 * structure path:
 *
 *  - A structure path has to name a pane, and the obvious one
 *    (`knowledge;inbox;itemsAwaitingReview;<id>`) is a *filtered* list. The
 *    link would break the moment the record left the inbox — which is exactly
 *    what the person following it went there to do.
 *  - An intent resolves by type at navigation time, so it survives the
 *    structure being retitled, and falls back to a standalone editor rather
 *    than an empty pane if resolution ever fails.
 *
 * The type is derived from the ID's own `<type>.<uuid>` shape, so no caller
 * has to pass it. Legacy IDs predate that shape; for those we keep the old
 * admin-gated path, which is at least somewhere the reviewer can act.
 */
export function knowledgeReviewUrl(documentId: string, documentType?: string): string {
  const id = publishedId(documentId)
  const type = documentType ?? parseCanonicalDocumentId(id)?.type
  if (!type) {
    return `/knowledge?record=${encodeURIComponent(id)}`
  }
  return `/studio/intent/edit/id=${encodeURIComponent(id)};type=${encodeURIComponent(type)}`
}
