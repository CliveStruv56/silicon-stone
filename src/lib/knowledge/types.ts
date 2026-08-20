/**
 * Shared vocabulary for the central knowledge system.
 *
 * Every controlled value the knowledge lane uses is declared here once, as an
 * `as const` array, and the TypeScript union is derived from it. Runtime
 * validation and the type system therefore cannot disagree: a Sanity schema
 * option list, a parser's membership test and a function signature are all
 * reading the same array.
 *
 * Nothing in this file imports `server-only`, touches `process.env`, or reaches
 * for a client. It is the one module in `src/lib/knowledge/` that both server
 * code and (if it ever needs to) a Studio schema definition can import.
 *
 * See `docs/siliconstone-knowledge-llm-master-spec.md` §5 for the record
 * semantics these values serve.
 */

/* ------------------------------------------------------------------ *
 * Review lifecycle
 * ------------------------------------------------------------------ */

/**
 * The single review lifecycle shared by `knowledgeSource` and `knowledgeItem`.
 *
 * `inbox` is the only entry state. Master spec §3.10: external capture is
 * untrusted by default, so nothing may be created directly as `ready`.
 */
export const KNOWLEDGE_REVIEW_STATUSES = [
  'inbox',
  'ready',
  'rejected',
  'superseded',
] as const
export type KnowledgeReviewStatus = (typeof KNOWLEDGE_REVIEW_STATUSES)[number]

/**
 * Review states that make a record eligible for general editorial memory
 * (master spec §7). Retrieval filters read this rather than re-deriving the
 * rule, so "reviewed" means one thing everywhere.
 */
export const RETRIEVAL_ELIGIBLE_REVIEW_STATUSES = ['ready'] as const

/* ------------------------------------------------------------------ *
 * knowledgeItem
 * ------------------------------------------------------------------ */

/**
 * Derived thinking — what SiliconStone or a model produced, as opposed to
 * evidence someone else authored. Master spec §5.2 fixes this initial list.
 */
export const KNOWLEDGE_ITEM_KINDS = [
  'idea',
  'observation',
  'conversation_extract',
  'article_foundation',
  'outline',
  'synthesis',
  'claim',
  'question',
  'note',
] as const
export type KnowledgeItemKind = (typeof KNOWLEDGE_ITEM_KINDS)[number]

/**
 * What the item is *for*. Editorial signal, not an access control: a record
 * marked `reference_only` is still reviewable, it simply should not be mined
 * for a draft.
 */
export const KNOWLEDGE_INTENDED_USES = [
  'article_seed',
  'research_input',
  'reference_only',
  'internal_only',
] as const
export type KnowledgeIntendedUse = (typeof KNOWLEDGE_INTENDED_USES)[number]

/**
 * Retrieval policy, not a security boundary. `private` and `confidential`
 * records are ineligible for editorial memory under master spec §7; the
 * enforcement lives in the eligibility calculation, not in the label.
 */
export const KNOWLEDGE_SENSITIVITIES = [
  'normal',
  'private',
  'confidential',
] as const
export type KnowledgeSensitivity = (typeof KNOWLEDGE_SENSITIVITIES)[number]

/**
 * Categorical, never a percentage — the same discipline the compliance
 * checker holds itself to. A number here would imply a calibration nothing
 * in this system performs.
 */
export const KNOWLEDGE_CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const
export type KnowledgeConfidence = (typeof KNOWLEDGE_CONFIDENCE_LEVELS)[number]

/* ------------------------------------------------------------------ *
 * knowledgeSource
 * ------------------------------------------------------------------ */

/**
 * What kind of artefact the source is. The first five values are the legacy
 * `knowledgeSource.sourceType` list and keep their exact spelling, so existing
 * documents stay valid; the rest are additions this wave.
 */
export const KNOWLEDGE_SOURCE_KINDS = [
  'url',
  'pdf',
  'image',
  'note',
  'published_article',
  'report',
  'transcript',
  'dataset',
  'document',
] as const
export type KnowledgeSourceKind = (typeof KNOWLEDGE_SOURCE_KINDS)[number]

/**
 * What the source *is*, editorially — the basis on which a reader would weigh
 * it. Distinct from `trustTier`, which is how far we have verified it.
 *
 * `primary_statute` is present so a captured statute can be *labelled*
 * honestly. It does not make the record authoritative for the compliance
 * checker: verified statutory text lives in Git and the regulatory index, and
 * master spec §3.4 keeps those lanes apart.
 */
export const KNOWLEDGE_SOURCE_CLASSES = [
  'primary_statute',
  'regulator_guidance',
  'official_publication',
  'standards_body',
  'academic',
  'industry_report',
  'news',
  'vendor_material',
  'commentary',
  'internal_note',
  'other',
] as const
export type KnowledgeSourceClass = (typeof KNOWLEDGE_SOURCE_CLASSES)[number]

/**
 * How far the content has been verified. Deliberately four coarse tiers: a
 * finer scale would invite a false sense of measurement.
 */
export const KNOWLEDGE_TRUST_TIERS = [
  'authoritative',
  'corroborated',
  'indicative',
  'unverified',
] as const
export type KnowledgeTrustTier = (typeof KNOWLEDGE_TRUST_TIERS)[number]

/* ------------------------------------------------------------------ *
 * Provenance
 * ------------------------------------------------------------------ */

/**
 * Which system a record entered through. This is provenance, never
 * authorization — an adapter does not become trusted by naming itself.
 */
export const KNOWLEDGE_SOURCE_SYSTEMS = [
  'admin_ui',
  'chatgpt',
  'claude',
  'codex',
  'exa',
  'inoreader',
  'api',
  'migration',
  'unknown',
] as const
export type KnowledgeSourceSystem = (typeof KNOWLEDGE_SOURCE_SYSTEMS)[number]

/* ------------------------------------------------------------------ *
 * Extraction
 * ------------------------------------------------------------------ */

/**
 * Master spec §5.1. `not_required` is the honest state for a source whose text
 * arrived with it — a pasted note or an admin-UI capture — as opposed to
 * `succeeded`, which would claim an extraction that never ran.
 */
export const KNOWLEDGE_EXTRACTION_STATUSES = [
  'not_required',
  'queued',
  'processing',
  'succeeded',
  'failed',
] as const
export type KnowledgeExtractionStatus =
  (typeof KNOWLEDGE_EXTRACTION_STATUSES)[number]

/* ------------------------------------------------------------------ *
 * Indexing
 * ------------------------------------------------------------------ */

/**
 * Master spec §5.6. `not_eligible` is the default for everything: a record
 * becomes `pending` only when the eligibility calculation says so, which is
 * what stops unreviewed capture reaching editorial memory.
 */
export const KNOWLEDGE_INDEX_STATUSES = [
  'not_eligible',
  'pending',
  'indexed',
  'error',
] as const
export type KnowledgeIndexStatus = (typeof KNOWLEDGE_INDEX_STATUSES)[number]

/* ------------------------------------------------------------------ *
 * researchRun
 * ------------------------------------------------------------------ */

export const RESEARCH_RUN_STATUSES = [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const
export type ResearchRunStatus = (typeof RESEARCH_RUN_STATUSES)[number]

export const RESEARCH_RUN_MODES = ['fast', 'deep', 'inoreader'] as const
export type ResearchRunMode = (typeof RESEARCH_RUN_MODES)[number]

export const RESEARCH_RUN_PROVIDERS = [
  'exa',
  'inoreader',
  'manual',
  'other',
] as const
export type ResearchRunProvider = (typeof RESEARCH_RUN_PROVIDERS)[number]

/**
 * Master spec §5.3: a completed research run is not automatically reusable.
 * `pending` is where every run lands; only a human moves it to `approved`.
 */
export const RESEARCH_REUSE_STATUSES = [
  'pending',
  'approved',
  'excluded',
] as const
export type ResearchReuseStatus = (typeof RESEARCH_REUSE_STATUSES)[number]

/**
 * Which retrieval lane a snapshot came from. Master spec §7 requires the three
 * lanes to fail independently, so a snapshot has to say which one it records.
 */
export const RETRIEVAL_LANES = [
  'prior_articles',
  'editorial_memory',
  'regulatory',
] as const
export type RetrievalLane = (typeof RETRIEVAL_LANES)[number]

/* ------------------------------------------------------------------ *
 * Document types
 * ------------------------------------------------------------------ */

/**
 * The canonical Sanity document types this lane owns, plus the two legacy
 * types it must keep working. `knowledgeCandidate` is listed because the
 * migration reads it — nothing new writes one.
 */
export const KNOWLEDGE_DOCUMENT_TYPES = [
  'knowledgeSource',
  'knowledgeItem',
  'knowledgeTopic',
  'researchRun',
] as const
export type KnowledgeDocumentType = (typeof KNOWLEDGE_DOCUMENT_TYPES)[number]

export const LEGACY_KNOWLEDGE_DOCUMENT_TYPES = ['knowledgeCandidate'] as const
export type LegacyKnowledgeDocumentType =
  (typeof LEGACY_KNOWLEDGE_DOCUMENT_TYPES)[number]

/* ------------------------------------------------------------------ *
 * Legacy compatibility
 * ------------------------------------------------------------------ */

/**
 * The legacy `knowledgeSource.status` values. Retained, not rewritten: master
 * spec §5.1 and §11 both require the old field to stay readable until the
 * cutover wave has verified every consumer.
 */
export const LEGACY_SOURCE_STATUSES = ['pending', 'processed', 'error'] as const
export type LegacySourceStatus = (typeof LEGACY_SOURCE_STATUSES)[number]

/**
 * How a legacy `status` should be *read* until backfill runs. Note what this
 * map does not say: legacy `error` has no review status at all, because it
 * described a capture or extraction failure rather than an editorial verdict.
 * Collapsing it to `rejected` would silently discard records nobody judged.
 */
export const LEGACY_SOURCE_STATUS_REVIEW_MAP: Record<
  LegacySourceStatus,
  KnowledgeReviewStatus | 'requires_review'
> = {
  pending: 'inbox',
  processed: 'ready',
  error: 'requires_review',
}

/**
 * Reads the effective review status of a source document that may predate
 * `reviewStatus`. The new field wins when present; otherwise the legacy field
 * is interpreted through the map above.
 *
 * Returns `'requires_review'` — which is not a `KnowledgeReviewStatus` — for a
 * legacy `error` record, so a caller has to decide what to do with it rather
 * than receiving something that looks like a verdict.
 */
export function effectiveSourceReviewStatus(source: {
  reviewStatus?: string | null
  status?: string | null
}): KnowledgeReviewStatus | 'requires_review' | 'unknown' {
  if (isKnowledgeReviewStatus(source.reviewStatus)) return source.reviewStatus
  if (isLegacySourceStatus(source.status)) {
    return LEGACY_SOURCE_STATUS_REVIEW_MAP[source.status]
  }
  return 'unknown'
}

/**
 * Whether a source document was created after the canonical foundation wave.
 *
 * The discriminator is the presence of a field that did not exist before it:
 * `reviewStatus` (which every Studio-created record gets from its
 * `initialValue`) or `provenance.sourceSystem` (which every captured record
 * gets from the service). A record carrying neither predates the wave.
 *
 * This exists so `sourceId` can be required exactly where something still
 * depends on it. Legacy sources are referred to by that *string* — a
 * `knowledgeCandidate.sourceIds` entry is matched against it — while anything
 * created since is referred to by reference. Requiring it on a record nothing
 * looks up by string asks a reviewer to invent an identifier for a namespace
 * that no longer has readers.
 *
 * One coupling worth stating rather than discovering: when the cutover wave
 * backfills `reviewStatus` onto legacy records, this returns true for them too
 * and the requirement lifts. That is correct, not accidental — cutover is where
 * the legacy candidates and their string references are retired — but it means
 * the backfill and this rule move together.
 */
export function isPostFoundationSource(
  source:
    | {
        reviewStatus?: unknown
        provenance?: { sourceSystem?: unknown } | null
      }
    | null
    | undefined,
): boolean {
  if (!source) return false
  if (typeof source.reviewStatus === 'string' && source.reviewStatus.length > 0) return true
  const sourceSystem = source.provenance?.sourceSystem
  return typeof sourceSystem === 'string' && sourceSystem.length > 0
}

/* ------------------------------------------------------------------ *
 * Shared shapes
 * ------------------------------------------------------------------ */

/** A Sanity reference. `_key` is required inside arrays and absent outside. */
export interface SanityReference {
  _type: 'reference'
  _ref: string
  _key?: string
}

/** Master spec §5.6 — what every indexable document records about indexing. */
export interface KnowledgeIndexState {
  status: KnowledgeIndexStatus
  /** Hash of the current canonical content. */
  canonicalHash?: string
  /** Hash of the content actually in the index. Drift is `canonical !== indexed`. */
  indexedHash?: string
  indexedAt?: string
  embeddingModel?: string
  indexVersion?: string
  lastError?: string
  lastAttemptAt?: string
  attempts?: number
}

/** Master spec §5.1 — extraction progress, method and failure, kept separate
 * from both the review verdict and the index state so one cannot mask another. */
export interface KnowledgeExtractionState {
  status: KnowledgeExtractionStatus
  method?: string
  methodVersion?: string
  startedAt?: string
  completedAt?: string
  lastError?: string
  attempts?: number
}

/** Where a record came from and who/what put it there. */
export interface KnowledgeProvenance {
  sourceSystem: KnowledgeSourceSystem
  /** The originating system's own identifier, if it has one. */
  externalId?: string
  /** Conversation/thread identifier for chat-originated capture. */
  conversationId?: string
  capturedBy?: string
  capturedAt?: string
  /** Caller-supplied key that makes a repeated capture idempotent. */
  idempotencyKey?: string
}

/** One retrieval result, recorded so a generation can be explained later. */
export interface RetrievalSnapshotEntry {
  lane: RetrievalLane
  recordId: string
  score?: number
  title?: string
  locator?: string
}

/* ------------------------------------------------------------------ *
 * Guards
 * ------------------------------------------------------------------ */

function memberOf<T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && (values as readonly string[]).includes(value)
}

export const isKnowledgeReviewStatus = (v: unknown): v is KnowledgeReviewStatus =>
  memberOf(KNOWLEDGE_REVIEW_STATUSES, v)
export const isKnowledgeItemKind = (v: unknown): v is KnowledgeItemKind =>
  memberOf(KNOWLEDGE_ITEM_KINDS, v)
export const isKnowledgeSourceKind = (v: unknown): v is KnowledgeSourceKind =>
  memberOf(KNOWLEDGE_SOURCE_KINDS, v)
export const isKnowledgeSourceClass = (v: unknown): v is KnowledgeSourceClass =>
  memberOf(KNOWLEDGE_SOURCE_CLASSES, v)
export const isKnowledgeTrustTier = (v: unknown): v is KnowledgeTrustTier =>
  memberOf(KNOWLEDGE_TRUST_TIERS, v)
export const isKnowledgeSourceSystem = (v: unknown): v is KnowledgeSourceSystem =>
  memberOf(KNOWLEDGE_SOURCE_SYSTEMS, v)
export const isKnowledgeExtractionStatus = (
  v: unknown,
): v is KnowledgeExtractionStatus => memberOf(KNOWLEDGE_EXTRACTION_STATUSES, v)
export const isKnowledgeIndexStatus = (v: unknown): v is KnowledgeIndexStatus =>
  memberOf(KNOWLEDGE_INDEX_STATUSES, v)
export const isResearchRunStatus = (v: unknown): v is ResearchRunStatus =>
  memberOf(RESEARCH_RUN_STATUSES, v)
export const isResearchRunMode = (v: unknown): v is ResearchRunMode =>
  memberOf(RESEARCH_RUN_MODES, v)
export const isResearchRunProvider = (v: unknown): v is ResearchRunProvider =>
  memberOf(RESEARCH_RUN_PROVIDERS, v)
export const isResearchReuseStatus = (v: unknown): v is ResearchReuseStatus =>
  memberOf(RESEARCH_REUSE_STATUSES, v)
export const isKnowledgeIntendedUse = (v: unknown): v is KnowledgeIntendedUse =>
  memberOf(KNOWLEDGE_INTENDED_USES, v)
export const isKnowledgeSensitivity = (v: unknown): v is KnowledgeSensitivity =>
  memberOf(KNOWLEDGE_SENSITIVITIES, v)
export const isKnowledgeConfidence = (v: unknown): v is KnowledgeConfidence =>
  memberOf(KNOWLEDGE_CONFIDENCE_LEVELS, v)
export const isLegacySourceStatus = (v: unknown): v is LegacySourceStatus =>
  memberOf(LEGACY_SOURCE_STATUSES, v)

/**
 * Turns an `as const` value array into the `{title, value}` list a Sanity
 * `options.list` expects, so a schema can never drift from the union.
 * `title` defaults to the value with separators replaced and the first letter
 * capitalised; pass `titles` to override any of them.
 */
export function optionList<T extends readonly string[]>(
  values: T,
  titles: Partial<Record<T[number], string>> = {},
): { title: string; value: T[number] }[] {
  return values.map((value) => ({
    value: value as T[number],
    title:
      titles[value as T[number]] ??
      (value.charAt(0).toUpperCase() + value.slice(1)).replace(/[_-]/g, ' '),
  }))
}
