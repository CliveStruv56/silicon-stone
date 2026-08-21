/**
 * The knowledge-domain service — master spec §6.
 *
 * One place composes validation, normalisation, identity, deduplication,
 * reference resolution, transition guards and the repository. Route handlers,
 * the research pipeline, migrations and the eventual MCP adapter all call in
 * here; none of them re-implements any of it. That is the whole point of the
 * layer: the rule that external capture cannot arrive `ready` has to be true
 * of every entrance, and a rule enforced per-entrance is a rule that will be
 * missed at the fifth one.
 *
 * Side effects are injected. The clock and the ID generator are parameters so
 * a test can assert an exact document, and the Sanity client is a parameter so
 * a test never needs one.
 *
 * **Nothing here indexes or extracts.** Where a later wave will fire an event,
 * this returns an *intent* in the result — a record of what would have been
 * requested. Returning an intent nothing consumes is deliberate: it makes the
 * seam visible now, and it cannot accidentally start working.
 */

import { randomUUID } from 'node:crypto'

import { normalizedContentHash } from './hash'
import {
  canonicalDocumentId,
  derivedIdempotencyKey,
  keyedReference,
  keyedReferences,
  knowledgeReviewUrl,
  stableKey,
} from './ids'
import {
  createDocument,
  findDuplicate,
  getDocument,
  patchDocument,
  resolveExistingDocuments,
  type DuplicateOutcome,
  type KnowledgeClient,
} from './repository'
import {
  parseKnowledgeItemCaptureInput,
  parseResearchRunCreateInput,
  parseSourceCaptureInput,
  type KnowledgeValidationError,
} from './schema'
import { researchRunTransitions, reviewTransitions } from './transitions'
import {
  DEFAULT_CAPTURE_BRAND_TAG,
  legacySourceStatusFor,
  type KnowledgeReviewStatus,
  type ResearchRunStatus,
} from './types'

/* ------------------------------------------------------------------ *
 * Dependencies and results
 * ------------------------------------------------------------------ */

export interface KnowledgeServiceDeps {
  client: KnowledgeClient
  /** ISO timestamp source. Injected so a test can assert an exact document. */
  now?: () => string
  /** Fresh UUID source, for the same reason. */
  uuid?: () => string
}

function clock(deps: KnowledgeServiceDeps): string {
  return (deps.now ?? (() => new Date().toISOString()))()
}

function nextId(deps: KnowledgeServiceDeps, type: string): string {
  return canonicalDocumentId(type, (deps.uuid ?? randomUUID)())
}

/** What a later wave will be asked to do. Recorded, never dispatched. */
export const KNOWLEDGE_EVENT_INTENTS = [
  'extraction_requested',
  'index_evaluation_requested',
] as const
export type KnowledgeEventIntentType = (typeof KNOWLEDGE_EVENT_INTENTS)[number]

export interface KnowledgeEventIntent {
  type: KnowledgeEventIntentType
  documentId: string
  reason: string
}

export const KNOWLEDGE_ERROR_CODES = [
  'validation_failed',
  'unresolved_reference',
  'duplicate_conflict',
  'transition_refused',
  'not_found',
  'write_failed',
] as const
export type KnowledgeErrorCode = (typeof KNOWLEDGE_ERROR_CODES)[number]

export interface KnowledgeFailure {
  ok: false
  code: KnowledgeErrorCode
  message: string
  /** Field-level detail, when the failure was a parse failure. */
  errors?: KnowledgeValidationError[]
  /** The conflicting matches, when the failure was an ambiguous duplicate. */
  duplicate?: DuplicateOutcome
}

export interface KnowledgeSuccess {
  ok: true
  /** The canonical Sanity document ID. */
  documentId: string
  documentType: string
  /** The record's status after the call — a review status, or a run status. */
  status: string
  /** Whether a document was written, or an existing one returned. */
  created: boolean
  /** What deduplication found, always — including that it found nothing. */
  duplicate: DuplicateOutcome
  /** Where a human goes to review this. */
  reviewUrl: string
  /** What a later wave would be asked to do. Nothing consumes these yet. */
  events: KnowledgeEventIntent[]
}

export type KnowledgeResult = KnowledgeSuccess | KnowledgeFailure

const NO_DUPLICATE: DuplicateOutcome = { duplicate: false, ambiguous: false, matches: [] }

/**
 * Drops keys whose value is `undefined`.
 *
 * Provenance objects are assembled from optional fields, and writing an
 * explicit `undefined` into a Sanity document leaves a key that reads as "we
 * looked and found nothing" rather than "we did not look". The distinction is
 * the whole point of a provenance record.
 */
function definedOnly<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== null),
  )
}

function fail(
  code: KnowledgeErrorCode,
  message: string,
  extra: Partial<KnowledgeFailure> = {},
): KnowledgeFailure {
  return { ok: false, code, message, ...extra }
}

/* ------------------------------------------------------------------ *
 * Reference resolution
 * ------------------------------------------------------------------ */

interface ReferenceRequest {
  field: string
  ids: readonly string[]
  expectedType: string
}

/**
 * Confirms every referenced document exists and is of the type the field
 * expects, before anything is written.
 *
 * A reference to a missing document is not an error Sanity will raise — it
 * stores the reference and the graph is quietly wrong. Checking the *type* as
 * well matters for the same reason: `sourceIds: ['knowledgeTopic.x']` would
 * otherwise create a source reference pointing at a topic.
 */
async function resolveReferences(
  client: KnowledgeClient,
  requests: readonly ReferenceRequest[],
): Promise<KnowledgeFailure | null> {
  const all = requests.flatMap((request) => request.ids)
  if (all.length === 0) return null

  const found = await resolveExistingDocuments(client, all)
  const problems: string[] = []

  for (const request of requests) {
    for (const id of request.ids) {
      const type = found.get(id)
      if (!type) {
        problems.push(`${request.field}: ${id} does not exist`)
      } else if (type !== request.expectedType) {
        problems.push(
          `${request.field}: ${id} is a ${type}, not a ${request.expectedType}`,
        )
      }
    }
  }

  if (problems.length === 0) return null
  return fail('unresolved_reference', problems.join('; '))
}

/* ------------------------------------------------------------------ *
 * Source capture
 * ------------------------------------------------------------------ */

/**
 * Captures a source into the inbox.
 *
 * A duplicate is returned, not rewritten. The existing record may have been
 * reviewed, edited, classified or superseded since; overwriting it with a
 * fresh capture would discard that work, and the caller asked to save
 * something, not to replace something.
 */
export async function captureSource(
  deps: KnowledgeServiceDeps,
  input: unknown,
): Promise<KnowledgeResult> {
  const parsed = parseSourceCaptureInput(input)
  if (!parsed.ok) {
    return fail('validation_failed', 'The source could not be captured.', {
      errors: parsed.errors,
    })
  }
  const value = parsed.value

  const referenceFailure = await resolveReferences(deps.client, [
    { field: 'topicIds', ids: value.topicIds, expectedType: 'knowledgeTopic' },
  ])
  if (referenceFailure) return referenceFailure

  const contentHash = value.text ? normalizedContentHash(value.text) : undefined
  const idempotencyKey =
    value.provenance.idempotencyKey ??
    derivedIdempotencyKey({
      documentType: 'knowledgeSource',
      sourceSystem: value.provenance.sourceSystem,
      externalId: value.provenance.externalId,
      url: value.url,
      content: value.text,
    })

  const duplicate = await findDuplicate(deps.client, {
    documentType: 'knowledgeSource',
    idempotencyKey,
    sourceSystem: value.provenance.sourceSystem,
    externalId: value.provenance.externalId,
    canonicalUrl: value.url,
    contentHash,
  })

  if (duplicate.ambiguous) {
    return fail(
      'duplicate_conflict',
      'This capture matches more than one existing source; a human needs to reconcile them.',
      { duplicate },
    )
  }
  if (duplicate.duplicate && duplicate.documentId) {
    return {
      ok: true,
      documentId: duplicate.documentId,
      documentType: 'knowledgeSource',
      status: 'existing',
      created: false,
      duplicate,
      reviewUrl: knowledgeReviewUrl(duplicate.documentId),
      events: [],
    }
  }

  const capturedAt = clock(deps)
  const documentId = nextId(deps, 'knowledgeSource')
  const extractionStatus = value.extractionExpected ? 'queued' : 'not_required'

  // Two pre-foundation fields that are `required` on the schema and that no
  // capture input supplies. Without them every externally captured source
  // landed in the inbox failing Studio validation — an API write never gets a
  // field's `initialValue`, which only fires when Studio creates a document.
  const captureReviewStatus = 'inbox' satisfies KnowledgeReviewStatus
  const legacyStatus = legacySourceStatusFor(captureReviewStatus)

  const document: Record<string, unknown> & { _id: string; _type: string } = {
    _id: documentId,
    _type: 'knowledgeSource',
    title: value.title,
    sourceType: value.sourceKind,
    capturedAt,
    // `inbox`, always. There is no parameter that changes this.
    reviewStatus: captureReviewStatus,
    // Derived from the verdict above rather than written as a literal, so the
    // legacy field and the new one cannot drift apart.
    ...(legacyStatus ? { status: legacyStatus } : {}),
    // A default, not a determination: which brand's inbox this landed in, not
    // a decision that the material belongs to that brand.
    brandTags: [DEFAULT_CAPTURE_BRAND_TAG],
    extractionState: { status: extractionStatus },
    indexState: { status: 'not_eligible' },
    provenance: {
      sourceSystem: value.provenance.sourceSystem,
      ...(value.provenance.externalId ? { externalId: value.provenance.externalId } : {}),
      ...(value.provenance.conversationId
        ? { conversationId: value.provenance.conversationId }
        : {}),
      ...(value.provenance.capturedBy ? { capturedBy: value.provenance.capturedBy } : {}),
      idempotencyKey,
    },
    ...(value.url ? { originalUrl: value.url, canonicalUrl: value.url } : {}),
    ...(value.text ? { extractedText: value.text } : {}),
    ...(contentHash ? { contentHash } : {}),
    ...(value.publisher ? { publisher: value.publisher } : {}),
    ...(value.author ? { author: value.author } : {}),
    ...(value.publishedDate ? { publishedDate: value.publishedDate } : {}),
    ...(value.language ? { language: value.language } : {}),
    ...(value.sourceClass ? { sourceClass: value.sourceClass } : {}),
    ...(value.trustTier ? { trustTier: value.trustTier } : {}),
    ...(value.topicIds.length ? { topics: keyedReferences(value.topicIds) } : {}),
    ...(value.tags.length ? { topicTags: value.tags } : {}),
  }

  return write(deps, document, {
    duplicate,
    status: 'inbox',
    events: value.extractionExpected
      ? [
          {
            type: 'extraction_requested',
            documentId,
            reason: 'Capture declared that the text will be extracted from the URL.',
          },
        ]
      : [],
  })
}

/* ------------------------------------------------------------------ *
 * Knowledge item capture
 * ------------------------------------------------------------------ */

export async function captureKnowledgeItem(
  deps: KnowledgeServiceDeps,
  input: unknown,
): Promise<KnowledgeResult> {
  const parsed = parseKnowledgeItemCaptureInput(input)
  if (!parsed.ok) {
    return fail('validation_failed', 'The knowledge item could not be captured.', {
      errors: parsed.errors,
    })
  }
  const value = parsed.value

  const referenceFailure = await resolveReferences(deps.client, [
    { field: 'topicIds', ids: value.topicIds, expectedType: 'knowledgeTopic' },
    { field: 'sourceIds', ids: value.sourceIds, expectedType: 'knowledgeSource' },
    { field: 'derivedFromIds', ids: value.derivedFromIds, expectedType: 'knowledgeItem' },
    {
      field: 'researchRunId',
      ids: value.researchRunId ? [value.researchRunId] : [],
      expectedType: 'researchRun',
    },
  ])
  if (referenceFailure) return referenceFailure

  const contentHash = normalizedContentHash(value.body)
  const idempotencyKey =
    value.provenance.idempotencyKey ??
    derivedIdempotencyKey({
      documentType: 'knowledgeItem',
      sourceSystem: value.provenance.sourceSystem,
      externalId: value.provenance.externalId,
      content: value.body,
    })

  const duplicate = await findDuplicate(deps.client, {
    documentType: 'knowledgeItem',
    idempotencyKey,
    sourceSystem: value.provenance.sourceSystem,
    externalId: value.provenance.externalId,
    contentHash,
  })

  if (duplicate.ambiguous) {
    return fail(
      'duplicate_conflict',
      'This capture matches more than one existing item; a human needs to reconcile them.',
      { duplicate },
    )
  }
  if (duplicate.duplicate && duplicate.documentId) {
    return {
      ok: true,
      documentId: duplicate.documentId,
      documentType: 'knowledgeItem',
      status: 'existing',
      created: false,
      duplicate,
      reviewUrl: knowledgeReviewUrl(duplicate.documentId),
      events: [],
    }
  }

  const capturedAt = clock(deps)
  const documentId = nextId(deps, 'knowledgeItem')

  const document: Record<string, unknown> & { _id: string; _type: string } = {
    _id: documentId,
    _type: 'knowledgeItem',
    title: value.title,
    kind: value.kind,
    body: value.body,
    reviewStatus: 'inbox' satisfies KnowledgeReviewStatus,
    contentHash,
    indexState: { status: 'not_eligible' },
    sensitivity: value.sensitivity ?? 'normal',
    provenance: {
      sourceSystem: value.provenance.sourceSystem,
      ...(value.provenance.externalId ? { externalId: value.provenance.externalId } : {}),
      ...(value.provenance.conversationId
        ? { conversationId: value.provenance.conversationId }
        : {}),
      ...(value.provenance.capturedBy ? { capturedBy: value.provenance.capturedBy } : {}),
      capturedAt,
      idempotencyKey,
    },
    ...(value.summary ? { summary: value.summary } : {}),
    ...(value.topicIds.length ? { topics: keyedReferences(value.topicIds) } : {}),
    ...(value.sourceIds.length ? { sources: keyedReferences(value.sourceIds) } : {}),
    ...(value.derivedFromIds.length
      ? { derivedFrom: keyedReferences(value.derivedFromIds) }
      : {}),
    ...(value.researchRunId ? { researchRun: keyedReference(value.researchRunId) } : {}),
    ...(value.intendedUse ? { intendedUse: value.intendedUse } : {}),
    ...(value.confidence ? { confidence: value.confidence } : {}),
    ...(value.editorNotes ? { editorNotes: value.editorNotes } : {}),
  }

  return write(deps, document, { duplicate, status: 'inbox', events: [] })
}

/* ------------------------------------------------------------------ *
 * Research runs
 * ------------------------------------------------------------------ */

export async function createResearchRun(
  deps: KnowledgeServiceDeps,
  input: unknown,
): Promise<KnowledgeResult> {
  const parsed = parseResearchRunCreateInput(input)
  if (!parsed.ok) {
    return fail('validation_failed', 'The research run could not be created.', {
      errors: parsed.errors,
    })
  }
  const value = parsed.value

  const referenceFailure = await resolveReferences(deps.client, [
    { field: 'topicIds', ids: value.topicIds, expectedType: 'knowledgeTopic' },
    {
      field: 'retryOfId',
      ids: value.retryOfId ? [value.retryOfId] : [],
      expectedType: 'researchRun',
    },
  ])
  if (referenceFailure) return referenceFailure

  // A provider job ID identifies one job, so recording it twice would be
  // recording the same investigation twice.
  const duplicate = await findDuplicate(deps.client, {
    documentType: 'researchRun',
    idempotencyKey: value.jobId ?? null,
  })
  if (duplicate.duplicate && !duplicate.ambiguous && duplicate.documentId) {
    return {
      ok: true,
      documentId: duplicate.documentId,
      documentType: 'researchRun',
      status: 'existing',
      created: false,
      duplicate,
      reviewUrl: knowledgeReviewUrl(duplicate.documentId),
      events: [],
    }
  }

  const requestedAt = value.requestedAt ?? clock(deps)
  const documentId = nextId(deps, 'researchRun')

  const document: Record<string, unknown> & { _id: string; _type: string } = {
    _id: documentId,
    _type: 'researchRun',
    query: value.query,
    mode: value.mode,
    provider: value.provider,
    status: value.status,
    reuseStatus: 'pending',
    requestedAt,
    ...(value.status === 'running' ? { startedAt: requestedAt } : {}),
    ...(value.brief ? { brief: value.brief } : {}),
    ...(value.jobId ? { jobId: value.jobId, provenance: { idempotencyKey: value.jobId } } : {}),
    ...(value.topicIds.length ? { topics: keyedReferences(value.topicIds) } : {}),
    ...(value.retryOfId ? { retryOf: keyedReference(value.retryOfId) } : {}),
  }

  return write(deps, document, { duplicate, status: value.status, events: [] })
}

/**
 * One source exactly as the search returned it, for `selectedSources`.
 *
 * A literal record, not a reference: this is what the run *found*, and it must
 * read the same in a year even if the same URL is later captured, corrected or
 * rejected as a `knowledgeSource`. `publisher` and `score` are optional because
 * the drafting path's own `ResearchSource` has neither, and an absent field is
 * honest where a guessed one is not.
 */
export interface ResearchRunSource {
  title?: string
  url?: string
  publisher?: string
  publishedDate?: string
  snippet?: string
  score?: number
}

/** What was in force when the run ran. Every field optional: a caller records
 * what it actually knows, and nothing here may be inferred. */
export interface ResearchRunModelSnapshot {
  model?: string
  embeddingModel?: string
  providerVersion?: string
  rulesVersion?: string
  promptTokens?: number
  completionTokens?: number
  costUsd?: number
}

export interface ResearchRunUpdate {
  documentId: string
  status: ResearchRunStatus
  summary?: string
  deepReport?: string
  keywords?: string[]
  error?: string
  /** What the run selected. Written once, on the call that completes the run. */
  selectedSources?: readonly ResearchRunSource[]
  modelSnapshot?: ResearchRunModelSnapshot
}

/**
 * Moves a run to its next status, through the transition guard.
 *
 * A completed run must carry what it found. The schema says so too, but a
 * schema rule only fires in Studio — this is the path a pipeline takes.
 */
export async function updateResearchRun(
  deps: KnowledgeServiceDeps,
  update: ResearchRunUpdate,
): Promise<KnowledgeResult> {
  const existing = await getDocument<{ _id: string; status?: string }>(
    deps.client,
    update.documentId,
  )
  if (!existing) {
    return fail('not_found', `No research run at ${update.documentId}.`)
  }

  const transition = researchRunTransitions.check(existing.status, update.status)
  if (!transition.allowed) {
    return fail('transition_refused', `Research run: ${transition.reason}`)
  }

  if (update.status === 'completed' && !update.summary?.trim()) {
    return fail('validation_failed', 'A completed run must record what it found.', {
      errors: [
        { field: 'summary', code: 'required', message: 'A completed run must record what it found.' },
      ],
    })
  }

  const at = clock(deps)
  const fields: Record<string, unknown> = { status: update.status }
  if (update.status === 'running') fields.startedAt = at
  if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
    fields.completedAt = at
  }
  if (update.summary) fields.summary = update.summary
  if (update.deepReport) fields.deepReport = update.deepReport
  if (update.keywords?.length) fields.keywords = update.keywords
  if (update.error) fields.error = update.error
  if (update.selectedSources?.length) {
    fields.selectedSources = update.selectedSources.map((source, index) => ({
      _type: 'selectedSource',
      // Keyed on the URL where there is one, so re-recording the same result
      // set produces a byte-identical array. Index only as a last resort, for
      // a source with no locator at all.
      _key: stableKey('selectedSource', source.url || `#${index}`),
      ...definedOnly(source),
    }))
  }
  if (update.modelSnapshot) {
    const snapshot = definedOnly(update.modelSnapshot)
    if (Object.keys(snapshot).length > 0) fields.modelSnapshot = snapshot
  }

  try {
    await patchDocument(deps.client, update.documentId, fields)
  } catch (error) {
    return fail('write_failed', writeMessage(error))
  }

  return {
    ok: true,
    documentId: update.documentId,
    documentType: 'researchRun',
    status: update.status,
    created: false,
    duplicate: NO_DUPLICATE,
    reviewUrl: knowledgeReviewUrl(update.documentId),
    events: [],
  }
}

/* ------------------------------------------------------------------ *
 * Recording what a run generated
 * ------------------------------------------------------------------ */

/** One retrieved record, mirroring `retrievalSnapshots[].entries` in the
 * schema. Structural on purpose: the drafting path's own type satisfies it
 * without the domain having to import from a `server-only` module. */
export interface RunRetrievalEntry {
  recordId: string
  score?: number
  title?: string
  locator?: string
}

export interface RunRetrievalSnapshot {
  lane: string
  indexName?: string
  namespace?: string
  corpusVersion?: string
  scoreFloor?: number
  laneStatus?: string
  entries?: readonly RunRetrievalEntry[]
}

export interface RecordRunGenerationInput {
  runId: string
  /** The article the run produced. */
  articleId: string
  /** What each lane returned while drafting it. */
  retrievalSnapshots?: readonly RunRetrievalSnapshot[]
}

/**
 * Records that a run produced an article, and what retrieval fed it.
 *
 * The second operation in this domain that touches an existing record, and it
 * follows `linkSourcesToItem`'s shape deliberately:
 *
 *  - **Additive only.** Article references are merged, never replaced, and
 *    retrieval snapshots are merged on a key derived from the article and the
 *    lane. A retried draft therefore rewrites its own entry rather than adding
 *    a second copy of the same fact, and never disturbs another article's.
 *  - **Nothing else moves.** `articles` and `retrievalSnapshots`, and neither
 *    the run's status, its reuse verdict, nor anything it found.
 *  - **No status gate.** Unlike a review verdict, this is not a judgement — the
 *    article exists and came from this run, and that stays true even if the
 *    run's own completion was never recorded. Refusing here would discard
 *    lineage precisely when something had already gone wrong.
 *
 * Retrieval belongs to the *generation*, not to the run: one run can produce
 * more than one draft, and each sees whatever the indexes held at that moment.
 * That is why the key includes the article id.
 */
export async function recordRunGeneration(
  deps: KnowledgeServiceDeps,
  input: RecordRunGenerationInput,
): Promise<KnowledgeResult> {
  const run = await getDocument<{
    _id: string
    _type: string
    status?: string
    articles?: Array<{ _ref?: string } | null>
    retrievalSnapshots?: Array<{ _key?: string } | null>
  }>(deps.client, input.runId)

  if (!run) return fail('not_found', `No research run at ${input.runId}.`)
  if (run._type !== 'researchRun') {
    return fail('unresolved_reference', `${input.runId} is a ${run._type}, not a researchRun.`)
  }

  const referenceFailure = await resolveReferences(deps.client, [
    { field: 'articleId', ids: [input.articleId], expectedType: 'article' },
  ])
  if (referenceFailure) return referenceFailure

  const existingArticles = (run.articles ?? [])
    .map((reference) => reference?._ref)
    .filter((ref): ref is string => Boolean(ref))
  // Existing first, so the merge never reorders what was already there.
  const articles = keyedReferences([...existingArticles, input.articleId])

  const incoming = (input.retrievalSnapshots ?? []).map((snapshot) => ({
    _type: 'retrievalSnapshot',
    _key: stableKey('retrievalSnapshot', input.articleId, snapshot.lane),
    ...definedOnly({
      lane: snapshot.lane,
      indexName: snapshot.indexName,
      namespace: snapshot.namespace,
      corpusVersion: snapshot.corpusVersion,
      scoreFloor: snapshot.scoreFloor,
      laneStatus: snapshot.laneStatus,
    }),
    entries: (snapshot.entries ?? []).map((entry) => ({
      _type: 'retrievalEntry',
      _key: stableKey('retrievalEntry', entry.recordId),
      ...definedOnly(entry),
    })),
  }))

  const replaced = new Set(incoming.map((snapshot) => snapshot._key))
  const retained = (run.retrievalSnapshots ?? []).filter(
    (snapshot): snapshot is { _key?: string } =>
      Boolean(snapshot) && !replaced.has(snapshot?._key ?? ''),
  )
  const retrievalSnapshots = [...retained, ...incoming]

  const fields: Record<string, unknown> = { articles }
  if (incoming.length > 0) fields.retrievalSnapshots = retrievalSnapshots

  try {
    await patchDocument(deps.client, input.runId, fields)
  } catch (error) {
    return fail('write_failed', writeMessage(error))
  }

  return {
    ok: true,
    documentId: input.runId,
    documentType: 'researchRun',
    status: run.status ?? 'unknown',
    created: false,
    duplicate: NO_DUPLICATE,
    reviewUrl: knowledgeReviewUrl(input.runId),
    events: [],
  }
}

/* ------------------------------------------------------------------ *
 * Linking sources to an item
 * ------------------------------------------------------------------ */

export interface LinkSourcesInput {
  itemId: string
  sourceIds: string[]
}

/**
 * Adds source references to a knowledge item.
 *
 * This is the only operation in the domain that an external caller can use to
 * modify a record that already exists, and it is deliberately the narrowest
 * useful one. Four constraints define it, and each closes a way it could turn
 * into something else:
 *
 *  - **Additive only.** Existing references are preserved and the new ones are
 *    merged in. There is no path here that removes a reference, so the worst a
 *    confused caller can do is add a wrong one, which a human can see and undo.
 *  - **Inbox records only.** A `ready` item has been reviewed; quietly changing
 *    what it rests on would mean the thing approved is no longer the thing
 *    stored. Editing an approved record stays a human act, in Studio.
 *  - **Sources only.** Each reference must resolve to an existing
 *    `knowledgeSource`, so this cannot be used to attach arbitrary documents.
 *  - **Nothing else moves.** The patch touches `sources` and nothing besides —
 *    not the review status, not the body, not the content hash. Which is why it
 *    can honestly be annotated as non-destructive.
 *
 * It exists because the migration left real items pointing at legacy string
 * source IDs that resolve to nothing, and re-capturing a source from a
 * conversation only to switch to Studio to attach it is the kind of friction
 * that stops the system being used.
 */
export async function linkSourcesToItem(
  deps: KnowledgeServiceDeps,
  input: LinkSourcesInput,
): Promise<KnowledgeResult> {
  if (input.sourceIds.length === 0) {
    return fail('validation_failed', 'Name at least one source to link.', {
      errors: [
        { field: 'sourceIds', code: 'required', message: 'Name at least one source to link.' },
      ],
    })
  }

  const item = await getDocument<{
    _id: string
    _type: string
    reviewStatus?: string
    sources?: { _ref?: string }[]
  }>(deps.client, input.itemId)

  if (!item) return fail('not_found', `No document at ${input.itemId}.`)
  if (item._type !== 'knowledgeItem') {
    return fail(
      'unresolved_reference',
      `${input.itemId} is a ${item._type}, not a knowledgeItem.`,
    )
  }

  // `inbox` covers a record with no reviewStatus at all, which is what a
  // document written before this field existed looks like.
  const status = item.reviewStatus ?? 'inbox'
  if (status !== 'inbox') {
    return fail(
      'transition_refused',
      `${input.itemId} is ${status}, not awaiting review. Only a record still in the inbox can be edited this way; change an approved record in Studio.`,
    )
  }

  const referenceFailure = await resolveReferences(deps.client, [
    { field: 'sourceIds', ids: input.sourceIds, expectedType: 'knowledgeSource' },
  ])
  if (referenceFailure) return referenceFailure

  const existing = (item.sources ?? [])
    .map((reference) => reference?._ref)
    .filter((ref): ref is string => Boolean(ref))
  // Existing first, so the merge never reorders what was already there.
  const merged = keyedReferences([...existing, ...input.sourceIds])

  if (merged.length === existing.length) {
    return {
      ok: true,
      documentId: input.itemId,
      documentType: 'knowledgeItem',
      status,
      created: false,
      duplicate: NO_DUPLICATE,
      reviewUrl: knowledgeReviewUrl(input.itemId),
      events: [],
    }
  }

  try {
    // `sources` and nothing else.
    await patchDocument(deps.client, input.itemId, { sources: merged })
  } catch (error) {
    return fail('write_failed', writeMessage(error))
  }

  return {
    ok: true,
    documentId: input.itemId,
    documentType: 'knowledgeItem',
    status,
    created: false,
    duplicate: NO_DUPLICATE,
    reviewUrl: knowledgeReviewUrl(input.itemId),
    events: [],
  }
}

/* ------------------------------------------------------------------ *
 * Review transitions
 * ------------------------------------------------------------------ */

export interface ReviewTransitionInput {
  documentId: string
  to: KnowledgeReviewStatus
  /** Required when moving to `superseded`: the record that replaced this one. */
  supersededById?: string
}

/**
 * Applies an editorial verdict.
 *
 * The effective current status is read through the legacy mapping, so a source
 * captured before this wave — which has `status` but no `reviewStatus` — can be
 * reviewed without being backfilled first.
 *
 * Reaching `ready` returns an index-evaluation *intent*. It does not index:
 * eligibility depends on more than review status, and nothing in this wave is
 * allowed to write to Pinecone.
 */
export async function applyReviewTransition(
  deps: KnowledgeServiceDeps,
  input: ReviewTransitionInput,
): Promise<KnowledgeResult> {
  const existing = await getDocument<{
    _id: string
    _type: string
    reviewStatus?: string
    status?: string
  }>(deps.client, input.documentId)

  if (!existing) {
    return fail('not_found', `No document at ${input.documentId}.`)
  }

  const from = effectiveReviewStatus(existing)
  if (from === null) {
    return fail(
      'transition_refused',
      `${input.documentId} has no readable review status; it needs repair before it can be reviewed.`,
    )
  }

  const transition = reviewTransitions.check(from, input.to)
  if (!transition.allowed) {
    return fail('transition_refused', `Knowledge review: ${transition.reason}`)
  }

  if (input.to === 'superseded' && !input.supersededById) {
    return fail(
      'validation_failed',
      'Superseding a record requires naming the record that replaced it.',
      {
        errors: [
          {
            field: 'supersededById',
            code: 'required',
            message: 'Name the record that replaced this one.',
          },
        ],
      },
    )
  }

  if (input.supersededById) {
    const referenceFailure = await resolveReferences(deps.client, [
      {
        field: 'supersededById',
        ids: [input.supersededById],
        expectedType: existing._type,
      },
    ])
    if (referenceFailure) return referenceFailure
  }

  const fields: Record<string, unknown> = { reviewStatus: input.to }
  if (input.supersededById) fields.supersededBy = keyedReference(input.supersededById)
  // Losing `ready` withdraws index eligibility immediately; regaining it only
  // proposes re-evaluation. The asymmetry is deliberate — removal is safe to
  // do eagerly, addition is not.
  if (input.to !== 'ready') fields['indexState.status'] = 'not_eligible'

  try {
    await patchDocument(deps.client, input.documentId, fields)
  } catch (error) {
    return fail('write_failed', writeMessage(error))
  }

  return {
    ok: true,
    documentId: input.documentId,
    documentType: existing._type,
    status: input.to,
    created: false,
    duplicate: NO_DUPLICATE,
    reviewUrl: knowledgeReviewUrl(input.documentId),
    events:
      input.to === 'ready'
        ? [
            {
              type: 'index_evaluation_requested',
              documentId: input.documentId,
              reason: 'The record became ready, so its index eligibility should be recalculated.',
            },
          ]
        : [],
  }
}

/** The current review status, reading a pre-foundation document through its
 * legacy field. Returns null where neither field gives an answer. */
function effectiveReviewStatus(document: {
  reviewStatus?: string
  status?: string
}): KnowledgeReviewStatus | null {
  if (
    document.reviewStatus === 'inbox' ||
    document.reviewStatus === 'ready' ||
    document.reviewStatus === 'rejected' ||
    document.reviewStatus === 'superseded'
  ) {
    return document.reviewStatus
  }
  if (document.status === 'pending') return 'inbox'
  if (document.status === 'processed') return 'ready'
  // Legacy `error` described a capture failure, not a verdict. It is not a
  // review state and must not be treated as one.
  return null
}

/* ------------------------------------------------------------------ *
 * Shared write path
 * ------------------------------------------------------------------ */

async function write(
  deps: KnowledgeServiceDeps,
  document: Record<string, unknown> & { _id: string; _type: string },
  context: { duplicate: DuplicateOutcome; status: string; events: KnowledgeEventIntent[] },
): Promise<KnowledgeResult> {
  try {
    const result = await createDocument(deps.client, document)
    return {
      ok: true,
      documentId: result.documentId,
      documentType: document._type,
      status: context.status,
      created: true,
      duplicate: context.duplicate,
      reviewUrl: knowledgeReviewUrl(result.documentId),
      events: context.events,
    }
  } catch (error) {
    return fail('write_failed', writeMessage(error))
  }
}

function writeMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The write to Sanity failed.'
}
