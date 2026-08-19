/**
 * Typed parsing and validation for knowledge-domain input.
 *
 * No validation library, deliberately (master spec §6): this wave centralises
 * explicit parsers first, and a dependency added now would be chosen against
 * the needs of trusted, first-party callers rather than the untrusted external
 * ingestion the later wave has to survive. That is the wave that gets to make
 * the choice.
 *
 * Everything returns a result rather than throwing. A parse failure is an
 * expected outcome of accepting input, and a route adapter needs the whole list
 * of what was wrong, not the first thing that tripped.
 */

import { normalizeCanonicalUrl, normalizeTags, normalizeTitle } from './normalize'
import {
  isKnowledgeConfidence,
  isKnowledgeIntendedUse,
  isKnowledgeItemKind,
  isKnowledgeSensitivity,
  isKnowledgeSourceClass,
  isKnowledgeSourceKind,
  isKnowledgeSourceSystem,
  isKnowledgeTrustTier,
  isResearchRunMode,
  isResearchRunProvider,
  type KnowledgeConfidence,
  type KnowledgeIntendedUse,
  type KnowledgeItemKind,
  type KnowledgeSensitivity,
  type KnowledgeSourceClass,
  type KnowledgeSourceKind,
  type KnowledgeSourceSystem,
  type KnowledgeTrustTier,
  type ResearchRunMode,
  type ResearchRunProvider,
} from './types'

/* ------------------------------------------------------------------ *
 * Result shape
 * ------------------------------------------------------------------ */

export const KNOWLEDGE_VALIDATION_CODES = [
  'required',
  'invalid_type',
  'invalid_value',
  'invalid_url',
  'invalid_reference',
  'too_long',
  'too_many',
  'not_permitted',
] as const
export type KnowledgeValidationCode = (typeof KNOWLEDGE_VALIDATION_CODES)[number]

export interface KnowledgeValidationError {
  field: string
  code: KnowledgeValidationCode
  message: string
}

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: KnowledgeValidationError[] }

/**
 * Domain limits. Generous rather than tight: these exist to stop a runaway
 * payload becoming a runaway Sanity document, not to police editorial length.
 * The external ingestion wave adds transport-level size limits on top; this is
 * not a substitute for those.
 */
export const KNOWLEDGE_LIMITS = {
  title: 300,
  summary: 2_000,
  body: 500_000,
  extractedText: 2_000_000,
  query: 2_000,
  brief: 20_000,
  shortField: 300,
  editorNotes: 10_000,
  idempotencyKey: 200,
  maxTopics: 50,
  maxSources: 200,
  maxTags: 50,
  maxKeywords: 100,
} as const

/* ------------------------------------------------------------------ *
 * Primitive readers
 * ------------------------------------------------------------------ */

class Collector {
  readonly errors: KnowledgeValidationError[] = []

  fail(field: string, code: KnowledgeValidationCode, message: string): void {
    this.errors.push({ field, code, message })
  }

  /** A required non-empty string within its limit. */
  requiredString(value: unknown, field: string, max: number): string {
    if (value === undefined || value === null) {
      this.fail(field, 'required', `${field} is required.`)
      return ''
    }
    if (typeof value !== 'string') {
      this.fail(field, 'invalid_type', `${field} must be a string.`)
      return ''
    }
    const trimmed = value.trim()
    if (!trimmed) {
      this.fail(field, 'required', `${field} is required.`)
      return ''
    }
    if (trimmed.length > max) {
      this.fail(field, 'too_long', `${field} must be ${max} characters or fewer.`)
      return trimmed.slice(0, max)
    }
    return trimmed
  }

  /** An optional string; absent and empty are the same answer. */
  optionalString(value: unknown, field: string, max: number): string | undefined {
    if (value === undefined || value === null || value === '') return undefined
    if (typeof value !== 'string') {
      this.fail(field, 'invalid_type', `${field} must be a string.`)
      return undefined
    }
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (trimmed.length > max) {
      this.fail(field, 'too_long', `${field} must be ${max} characters or fewer.`)
      return trimmed.slice(0, max)
    }
    return trimmed
  }

  /** A member of a controlled value set, or an error naming the field. */
  enumValue<T extends string>(
    value: unknown,
    field: string,
    guard: (v: unknown) => v is T,
    { required = false }: { required?: boolean } = {},
  ): T | undefined {
    if (value === undefined || value === null || value === '') {
      if (required) this.fail(field, 'required', `${field} is required.`)
      return undefined
    }
    if (!guard(value)) {
      this.fail(field, 'invalid_value', `${field} is not a recognised value.`)
      return undefined
    }
    return value
  }

  /**
   * A list of Sanity document IDs.
   *
   * Only the *shape* is checked here — that the IDs could name a document, and
   * that none of them names a draft. Whether the documents exist is a question
   * for the repository, which is the only layer that can answer it.
   */
  referenceIds(value: unknown, field: string, max: number): string[] {
    if (value === undefined || value === null) return []
    if (!Array.isArray(value)) {
      this.fail(field, 'invalid_type', `${field} must be an array.`)
      return []
    }
    if (value.length > max) {
      this.fail(field, 'too_many', `${field} must have ${max} entries or fewer.`)
      return []
    }
    const out: string[] = []
    for (const raw of value) {
      if (typeof raw !== 'string' || !raw.trim()) {
        this.fail(field, 'invalid_reference', `${field} contains an empty reference.`)
        continue
      }
      const id = raw.trim()
      if (id.startsWith('drafts.')) {
        this.fail(field, 'invalid_reference', `${field} may not reference a draft.`)
        continue
      }
      if (!/^[A-Za-z0-9._-]+$/.test(id)) {
        this.fail(field, 'invalid_reference', `${field} contains a malformed document ID.`)
        continue
      }
      if (!out.includes(id)) out.push(id)
    }
    return out
  }

  /** A single optional document ID, through the same shape rules. */
  referenceId(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const [id] = this.referenceIds([value], field, 1)
    return id
  }

  /** A URL we would be willing to store and, later, fetch. */
  url(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null || value === '') return undefined
    if (typeof value !== 'string') {
      this.fail(field, 'invalid_type', `${field} must be a string.`)
      return undefined
    }
    const normalised = normalizeCanonicalUrl(value)
    if (!normalised) {
      this.fail(field, 'invalid_url', `${field} must be an absolute http or https URL.`)
      return undefined
    }
    return normalised
  }

  stringArray(value: unknown, field: string, max: number): string[] {
    if (value === undefined || value === null) return []
    if (!Array.isArray(value)) {
      this.fail(field, 'invalid_type', `${field} must be an array.`)
      return []
    }
    if (value.length > max) {
      this.fail(field, 'too_many', `${field} must have ${max} entries or fewer.`)
      return []
    }
    return normalizeTags(value)
  }

  result<T>(value: T): ParseResult<T> {
    return this.errors.length ? { ok: false, errors: this.errors } : { ok: true, value }
  }
}

function asRecord(input: unknown, collector: Collector): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    collector.fail('_', 'invalid_type', 'Input must be an object.')
    return null
  }
  return input as Record<string, unknown>
}

/* ------------------------------------------------------------------ *
 * Capture inputs
 * ------------------------------------------------------------------ */

/** Provenance every capture may declare. Never authorization: an adapter
 * claiming to be `admin_ui` gains nothing by saying so. */
export interface CaptureProvenanceInput {
  sourceSystem: KnowledgeSourceSystem
  externalId?: string
  conversationId?: string
  capturedBy?: string
  idempotencyKey?: string
}

export interface SourceCaptureInput {
  title: string
  sourceKind: KnowledgeSourceKind
  /** Normalised. `undefined` when the source is text without a location. */
  url?: string
  text?: string
  publisher?: string
  author?: string
  publishedDate?: string
  language?: string
  sourceClass?: KnowledgeSourceClass
  trustTier?: KnowledgeTrustTier
  topicIds: string[]
  tags: string[]
  provenance: CaptureProvenanceInput
  /** True when the text is expected to arrive later, from extraction. */
  extractionExpected: boolean
}

function parseProvenance(
  raw: Record<string, unknown>,
  collector: Collector,
): CaptureProvenanceInput {
  const nested =
    typeof raw.provenance === 'object' && raw.provenance !== null && !Array.isArray(raw.provenance)
      ? (raw.provenance as Record<string, unknown>)
      : raw

  return {
    sourceSystem:
      collector.enumValue<KnowledgeSourceSystem>(
        nested.sourceSystem,
        'provenance.sourceSystem',
        isKnowledgeSourceSystem,
      ) ?? 'unknown',
    externalId: collector.optionalString(
      nested.externalId,
      'provenance.externalId',
      KNOWLEDGE_LIMITS.shortField,
    ),
    conversationId: collector.optionalString(
      nested.conversationId,
      'provenance.conversationId',
      KNOWLEDGE_LIMITS.shortField,
    ),
    capturedBy: collector.optionalString(
      nested.capturedBy,
      'provenance.capturedBy',
      KNOWLEDGE_LIMITS.shortField,
    ),
    idempotencyKey: collector.optionalString(
      nested.idempotencyKey,
      'provenance.idempotencyKey',
      KNOWLEDGE_LIMITS.idempotencyKey,
    ),
  }
}

/**
 * Refuses any attempt to declare a review status other than `inbox`.
 *
 * Master spec §3.10 and §5.2: external capture is untrusted by default and
 * AI-derived content may not enter as ready. Ignoring the field would be
 * equally safe and much worse — the caller would believe it had been honoured.
 */
function rejectPresetReviewStatus(raw: Record<string, unknown>, collector: Collector): void {
  const declared = raw.reviewStatus ?? raw.status
  if (declared === undefined || declared === null || declared === '') return
  if (declared === 'inbox') return
  collector.fail(
    'reviewStatus',
    'not_permitted',
    'Capture may not set a review status; every record enters the inbox and is reviewed there.',
  )
}

export function parseSourceCaptureInput(input: unknown): ParseResult<SourceCaptureInput> {
  const collector = new Collector()
  const raw = asRecord(input, collector)
  if (!raw) return collector.result({} as SourceCaptureInput)

  rejectPresetReviewStatus(raw, collector)

  const title = collector.requiredString(raw.title, 'title', KNOWLEDGE_LIMITS.title)
  const sourceKind = collector.enumValue<KnowledgeSourceKind>(
    raw.sourceKind ?? raw.sourceType,
    'sourceKind',
    isKnowledgeSourceKind,
    { required: true },
  )
  const url = collector.url(raw.url ?? raw.originalUrl, 'url')
  const text = collector.optionalString(
    raw.text ?? raw.extractedText,
    'text',
    KNOWLEDGE_LIMITS.extractedText,
  )
  const extractionExpected = raw.extractionExpected === true

  // A source has to be *something*: a location we can go back to, or text we
  // already hold, or a declared intention to fetch one. All three absent means
  // a record that can never be evidence for anything.
  if (!url && !text && !extractionExpected) {
    collector.fail(
      '_',
      'required',
      'Provide a URL, the source text, or declare that extraction is expected.',
    )
  }
  if (extractionExpected && !url) {
    collector.fail('url', 'required', 'Extraction needs a URL to extract from.')
  }

  return collector.result({
    title: normalizeTitle(title),
    sourceKind: sourceKind as KnowledgeSourceKind,
    url,
    text,
    publisher: collector.optionalString(raw.publisher, 'publisher', KNOWLEDGE_LIMITS.shortField),
    author: collector.optionalString(raw.author, 'author', KNOWLEDGE_LIMITS.shortField),
    publishedDate: collector.optionalString(
      raw.publishedDate,
      'publishedDate',
      KNOWLEDGE_LIMITS.shortField,
    ),
    language: collector.optionalString(raw.language, 'language', 32),
    sourceClass: collector.enumValue<KnowledgeSourceClass>(
      raw.sourceClass,
      'sourceClass',
      isKnowledgeSourceClass,
    ),
    trustTier: collector.enumValue<KnowledgeTrustTier>(
      raw.trustTier,
      'trustTier',
      isKnowledgeTrustTier,
    ),
    topicIds: collector.referenceIds(raw.topicIds, 'topicIds', KNOWLEDGE_LIMITS.maxTopics),
    tags: collector.stringArray(raw.tags ?? raw.topicTags, 'tags', KNOWLEDGE_LIMITS.maxTags),
    provenance: parseProvenance(raw, collector),
    extractionExpected,
  })
}

export interface KnowledgeItemCaptureInput {
  title: string
  kind: KnowledgeItemKind
  summary?: string
  body: string
  topicIds: string[]
  sourceIds: string[]
  derivedFromIds: string[]
  researchRunId?: string
  intendedUse?: KnowledgeIntendedUse
  sensitivity?: KnowledgeSensitivity
  confidence?: KnowledgeConfidence
  editorNotes?: string
  provenance: CaptureProvenanceInput
}

export function parseKnowledgeItemCaptureInput(
  input: unknown,
): ParseResult<KnowledgeItemCaptureInput> {
  const collector = new Collector()
  const raw = asRecord(input, collector)
  if (!raw) return collector.result({} as KnowledgeItemCaptureInput)

  rejectPresetReviewStatus(raw, collector)

  const title = collector.requiredString(raw.title, 'title', KNOWLEDGE_LIMITS.title)
  const kind = collector.enumValue<KnowledgeItemKind>(raw.kind, 'kind', isKnowledgeItemKind, {
    required: true,
  })
  const body = collector.requiredString(raw.body, 'body', KNOWLEDGE_LIMITS.body)

  return collector.result({
    title: normalizeTitle(title),
    kind: kind as KnowledgeItemKind,
    summary: collector.optionalString(raw.summary, 'summary', KNOWLEDGE_LIMITS.summary),
    body,
    topicIds: collector.referenceIds(raw.topicIds, 'topicIds', KNOWLEDGE_LIMITS.maxTopics),
    sourceIds: collector.referenceIds(raw.sourceIds, 'sourceIds', KNOWLEDGE_LIMITS.maxSources),
    derivedFromIds: collector.referenceIds(
      raw.derivedFromIds,
      'derivedFromIds',
      KNOWLEDGE_LIMITS.maxSources,
    ),
    researchRunId: collector.referenceId(raw.researchRunId, 'researchRunId'),
    intendedUse: collector.enumValue<KnowledgeIntendedUse>(
      raw.intendedUse,
      'intendedUse',
      isKnowledgeIntendedUse,
    ),
    sensitivity: collector.enumValue<KnowledgeSensitivity>(
      raw.sensitivity,
      'sensitivity',
      isKnowledgeSensitivity,
    ),
    confidence: collector.enumValue<KnowledgeConfidence>(
      raw.confidence,
      'confidence',
      isKnowledgeConfidence,
    ),
    editorNotes: collector.optionalString(
      raw.editorNotes,
      'editorNotes',
      KNOWLEDGE_LIMITS.editorNotes,
    ),
    provenance: parseProvenance(raw, collector),
  })
}

/**
 * Internal research-run creation. Not an external input surface in this wave:
 * runs are created by the drafting pipeline, which is first-party.
 */
export interface ResearchRunCreateInput {
  query: string
  brief?: string
  mode: ResearchRunMode
  provider: ResearchRunProvider
  jobId?: string
  /** Only the two entry states. A run cannot be *created* completed — that
   * would record a result nothing observed. */
  status: 'queued' | 'running'
  topicIds: string[]
  requestedAt?: string
  retryOfId?: string
}

export function parseResearchRunCreateInput(input: unknown): ParseResult<ResearchRunCreateInput> {
  const collector = new Collector()
  const raw = asRecord(input, collector)
  if (!raw) return collector.result({} as ResearchRunCreateInput)

  const query = collector.requiredString(raw.query, 'query', KNOWLEDGE_LIMITS.query)
  const mode = collector.enumValue<ResearchRunMode>(raw.mode, 'mode', isResearchRunMode, {
    required: true,
  })
  const provider = collector.enumValue<ResearchRunProvider>(
    raw.provider,
    'provider',
    isResearchRunProvider,
    { required: true },
  )

  let status: 'queued' | 'running' = 'queued'
  if (raw.status !== undefined && raw.status !== null && raw.status !== '') {
    if (raw.status === 'queued' || raw.status === 'running') {
      status = raw.status
    } else {
      collector.fail(
        'status',
        'invalid_value',
        'A run may only be created as queued or running.',
      )
    }
  }

  const requestedAt = collector.optionalString(raw.requestedAt, 'requestedAt', 64)
  if (requestedAt && Number.isNaN(Date.parse(requestedAt))) {
    collector.fail('requestedAt', 'invalid_value', 'requestedAt must be an ISO timestamp.')
  }

  return collector.result({
    query,
    brief: collector.optionalString(raw.brief, 'brief', KNOWLEDGE_LIMITS.brief),
    mode: mode as ResearchRunMode,
    provider: provider as ResearchRunProvider,
    jobId: collector.optionalString(raw.jobId, 'jobId', KNOWLEDGE_LIMITS.shortField),
    status,
    topicIds: collector.referenceIds(raw.topicIds, 'topicIds', KNOWLEDGE_LIMITS.maxTopics),
    requestedAt,
    retryOfId: collector.referenceId(raw.retryOfId, 'retryOfId'),
  })
}

/** Field names that failed, for a log line or a terse API response. */
export function failedFields(errors: readonly KnowledgeValidationError[]): string[] {
  return [...new Set(errors.map((error) => error.field))]
}
