/**
 * Whether a knowledge record may enter editorial memory, and what text would be
 * embedded if it did.
 *
 * Master spec §6 puts "eligibility calculation" in the domain's list of
 * responsibilities, so this is a pure function and no route re-derives it.
 * Wave 3 brief, decision 6: only `normal` sensitivity is eligible.
 *
 * **Every verdict carries a reason, including the eligible ones.** A record
 * that is not in the corpus has to be explicable without reading this file —
 * "not indexed" is the same observation whether the policy excluded it, the
 * text was empty, or the indexer never ran, and those are three different
 * problems.
 *
 * What this deliberately does NOT decide: whether the text fits. A record too
 * large to embed is *eligible and unindexable*, which is the `error` state, not
 * `not_eligible`. Policy and mechanism are different failures and the state
 * machine already distinguishes them.
 */

import { normalizeText } from './normalize'
import { normalizedContentHash } from './hash'
import { effectiveSourceReviewStatus } from './types'

/** The two record types editorial memory can hold. Articles have their own
 * lane and their own index; research runs are deferred (brief, decision 3). */
export const INDEXABLE_TYPES = ['knowledgeItem', 'knowledgeSource'] as const
export type IndexableType = (typeof INDEXABLE_TYPES)[number]

/**
 * Extraction states that mean the text is not (yet) trustworthy.
 * `not_required` and `succeeded` are the two that mean it is.
 */
const EXTRACTION_BLOCKS = new Set(['queued', 'processing', 'failed'])

export interface IndexCandidate {
  _id?: string
  _type?: string
  reviewStatus?: string | null
  /** Legacy source status, for records written before `reviewStatus` existed. */
  status?: string | null
  extractionState?: { status?: string | null } | null
  sensitivity?: string | null
  title?: string | null
  summary?: string | null
  /** knowledgeItem. Plain text by schema decision, not Portable Text. */
  body?: string | null
  publisher?: string | null
  /** knowledgeSource. */
  extractedText?: string | null
}

export interface EligibilityVerdict {
  eligible: boolean
  /** Why, in words a reviewer can act on. Present either way. */
  reason: string
}

/**
 * The text that would be embedded, in a stable order.
 *
 * The order is fixed because the hash of this string is what "changed" means:
 * reordering the parts would make every record look stale exactly once, for no
 * editorial reason.
 */
export function embeddableText(doc: IndexCandidate): string {
  const parts =
    doc._type === 'knowledgeSource'
      ? [doc.title, doc.publisher, doc.extractedText]
      : [doc.title, doc.summary, doc.body]
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join('\n\n')
}

/**
 * The hash of what would be embedded — the canonical half of the staleness
 * pair, compared against `indexState.indexedHash`.
 *
 * Deliberately NOT `contentHash`. That one exists for duplicate detection and
 * is computed over the capture payload; this one is computed over the text the
 * index actually holds. They answer different questions, and a record can
 * legitimately change one without the other.
 */
/**
 * The record's own prose, without the title and publisher `embeddableText`
 * prepends, collapsed to one line.
 *
 * For the vector, composing title + publisher + body is right — they are signal.
 * For the snippet a reader and a drafting model see, they are noise: the block
 * already names the record, so a snippet built from the composed text opens by
 * repeating the title back, and its newlines break the one-line-per-record
 * shape the block promises. Found by looking at what the lane actually
 * produced, not by a test.
 */
export function snippetText(doc: IndexCandidate): string {
  const body = doc._type === 'knowledgeSource' ? doc.extractedText : doc.body
  return (body ?? '').replace(/\s+/g, ' ').trim()
}

export function canonicalIndexHash(doc: IndexCandidate): string {
  return normalizedContentHash(embeddableText(doc))
}

/** `ready`, reading a pre-foundation source through its legacy `status`. */
function reviewStatusOf(doc: IndexCandidate): string | null {
  if (doc._type === 'knowledgeSource') {
    return effectiveSourceReviewStatus(doc as { reviewStatus?: string; status?: string })
  }
  return doc.reviewStatus ?? null
}

export function indexEligibility(doc: IndexCandidate): EligibilityVerdict {
  const type = doc._type
  if (!type || !(INDEXABLE_TYPES as readonly string[]).includes(type)) {
    return { eligible: false, reason: `${type ?? 'an untyped document'} is not an indexable type.` }
  }

  const review = reviewStatusOf(doc)
  if (review !== 'ready') {
    return {
      eligible: false,
      reason: `Review status is ${review ?? 'unreadable'}, not ready. Only reviewed records enter editorial memory.`,
    }
  }

  // Absent means the schema's own `initialValue: 'not_required'` — text that
  // arrived with the record and needs no fetching.
  const extraction = doc.extractionState?.status ?? 'not_required'
  if (EXTRACTION_BLOCKS.has(extraction)) {
    return {
      eligible: false,
      reason: `Extraction is ${extraction}, so the text is not settled yet.`,
    }
  }

  // `sensitivity` exists on knowledgeItem only, and its schema description
  // already says the enforcement lives here rather than in the label. Absent
  // means the schema's `initialValue: 'normal'`; a source has no such field at
  // all, so no policy was ever expressed for one.
  const sensitivity = doc.sensitivity ?? 'normal'
  if (sensitivity !== 'normal') {
    return {
      eligible: false,
      reason: `Sensitivity is ${sensitivity}. Only normal records are retrievable (wave 3, decision 6).`,
    }
  }

  if (normalizeText(embeddableText(doc)).length === 0) {
    return { eligible: false, reason: 'There is no text to embed.' }
  }

  return { eligible: true, reason: 'Reviewed, normal sensitivity, and has text.' }
}
