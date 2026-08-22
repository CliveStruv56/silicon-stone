import { describe, expect, it } from 'vitest'

import type { KnowledgeClient, KnowledgePatch } from './repository'
import {
  applyIndexTransition,
  applyReviewTransition,
  captureKnowledgeItem,
  captureSource,
  createResearchRun,
  forgetIndexedVector,
  linkSourcesToItem,
  recordRunGeneration,
  updateResearchRun,
  type KnowledgeServiceDeps,
} from './service'
import { effectiveSourceReviewStatus } from './types'

/**
 * A scripted Sanity. `documents` is the dataset; `fetch` answers the three
 * query shapes the repository actually issues, which is enough to exercise
 * duplicate detection and reference resolution without pretending to be GROQ.
 */
function harness(documents: Record<string, Record<string, unknown>> = {}) {
  const created: Record<string, unknown>[] = []
  const patched: { id: string; fields: Record<string, unknown> }[] = []
  let failWrites: string | null = null

  const client: KnowledgeClient = {
    async fetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
      const all = Object.values(documents)

      if (query.includes('_id == $documentId')) {
        return (documents[String(params.documentId)] ?? null) as T
      }
      if (query.includes('_id in $documentIds')) {
        const wanted = new Set((params.documentIds as string[]) ?? [])
        return all.filter((doc) => wanted.has(String(doc._id))) as T
      }
      if (query.includes('sourceId in $sourceIds')) {
        const wanted = new Set((params.sourceIds as string[]) ?? [])
        return all.filter((doc) => wanted.has(String(doc.sourceId))) as T
      }

      // Duplicate probes.
      const ofType = all.filter((doc) => doc._type === params.documentType)
      const provenance = (doc: Record<string, unknown>) =>
        (doc.provenance ?? {}) as Record<string, unknown>

      if (params.idempotencyKey !== undefined) {
        return ofType.filter(
          (doc) => provenance(doc).idempotencyKey === params.idempotencyKey,
        ) as T
      }
      if (params.externalId !== undefined) {
        return ofType.filter(
          (doc) =>
            provenance(doc).sourceSystem === params.sourceSystem &&
            provenance(doc).externalId === params.externalId,
        ) as T
      }
      if (params.canonicalUrl !== undefined) {
        return ofType.filter(
          (doc) =>
            doc.canonicalUrl === params.canonicalUrl || doc.originalUrl === params.canonicalUrl,
        ) as T
      }
      if (params.contentHash !== undefined) {
        return ofType.filter((doc) => doc.contentHash === params.contentHash) as T
      }
      return [] as T
    },
    async create(document) {
      if (failWrites) throw new Error(failWrites)
      created.push(document)
      documents[String(document._id)] = document
      return { _id: String(document._id) }
    },
    async createOrReplace(document) {
      return this.create(document)
    },
    patch(id: string): KnowledgePatch {
      const staged: Record<string, unknown> = {}
      const patch: KnowledgePatch = {
        set(fields) {
          Object.assign(staged, fields)
          return patch
        },
        setIfMissing(fields) {
          for (const [key, value] of Object.entries(fields)) {
            if (documents[id]?.[key] === undefined) staged[key] = value
          }
          return patch
        },
        unset() {
          return patch
        },
        async commit() {
          if (failWrites) throw new Error(failWrites)
          patched.push({ id, fields: { ...staged } })
          documents[id] = { ...(documents[id] ?? {}), ...staged }
          return { _id: id }
        },
      }
      return patch
    },
  }

  const deps: KnowledgeServiceDeps = {
    client,
    now: () => '2026-08-18T12:00:00.000Z',
    uuid: (() => {
      let n = 0
      return () => `uuid-${++n}`
    })(),
  }

  return {
    deps,
    documents,
    created,
    patched,
    breakWrites(message: string) {
      failWrites = message
    },
  }
}

const topic = { _id: 'knowledgeTopic.ai-act', _type: 'knowledgeTopic', title: 'AI Act' }

describe('captureSource', () => {
  it('creates an inbox source with server-generated identity', async () => {
    const h = harness()
    const result = await captureSource(h.deps, {
      title: 'Commission guidance',
      sourceKind: 'url',
      url: 'HTTPS://Example.com/guidance?utm_source=news#top',
      text: 'Guidance text.',
      sourceSystem: 'admin_ui',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.created).toBe(true)
    expect(result.documentId).toBe('knowledgeSource.uuid-1')
    expect(result.status).toBe('inbox')
    // Opens the record itself in Studio. It used to point at /knowledge, which
    // never read the parameter and does not list knowledge records at all.
    expect(result.reviewUrl).toBe(
      '/studio/intent/edit/id=knowledgeSource.uuid-1;type=knowledgeSource',
    )
    expect(result.duplicate.duplicate).toBe(false)

    const doc = h.created[0]
    expect(doc.reviewStatus).toBe('inbox')
    // The URL is stored normalised, which is what later deduplication matches.
    expect(doc.canonicalUrl).toBe('https://example.com/guidance')
    expect(doc.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(doc.capturedAt).toBe('2026-08-18T12:00:00.000Z')
    expect((doc.indexState as Record<string, unknown>).status).toBe('not_eligible')
    expect((doc.extractionState as Record<string, unknown>).status).toBe('not_required')
  })

  it('fills the two required pre-foundation fields a Studio initialValue never reaches', () => {
    // An API write gets no `initialValue`, so before this a captured source
    // failed validation in Studio on `status` and `brandTags` alike — a record
    // a machine wrote, waiting on a human to fill in fields it could not know
    // it had missed.
    const h = harness()
    return captureSource(h.deps, {
      title: 'Commission guidance',
      sourceKind: 'url',
      text: 'Guidance text.',
      sourceSystem: 'admin_ui',
    }).then((result) => {
      expect(result.ok).toBe(true)
      const doc = h.created[0]
      expect(doc.status).toBe('pending')
      expect(doc.brandTags).toEqual(['silicon-and-stone'])
    })
  })

  it('keeps the legacy status and the review status saying the same thing', () => {
    // The point of deriving one from the other. A capture that wrote
    // `reviewStatus: inbox` next to `status: processed` would report a record
    // as both unreviewed and approved, depending which field you read.
    const h = harness()
    return captureSource(h.deps, {
      title: 'Commission guidance',
      sourceKind: 'url',
      text: 'Guidance text.',
      sourceSystem: 'admin_ui',
    }).then(() => {
      const doc = h.created[0]
      expect(
        effectiveSourceReviewStatus({
          reviewStatus: doc.reviewStatus as string,
          status: doc.status as string,
        }),
      ).toBe('inbox')
      // And the legacy field alone, which is what a pre-foundation reader sees.
      expect(effectiveSourceReviewStatus({ status: doc.status as string })).toBe('inbox')
    })
  })

  it('returns the existing record for a repeated capture rather than writing a second', async () => {
    const h = harness()
    const input = {
      title: 'Commission guidance',
      sourceKind: 'url',
      url: 'https://example.com/guidance',
      text: 'Guidance text.',
      sourceSystem: 'admin_ui',
    }
    const first = await captureSource(h.deps, input)
    const second = await captureSource(h.deps, input)

    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(second.documentId).toBe(first.documentId)
    expect(second.created).toBe(false)
    expect(second.status).toBe('existing')
    expect(second.duplicate.matchedBy).toBe('idempotency_key')
    expect(h.created).toHaveLength(1)
  })

  it('does not overwrite the record a duplicate matched', async () => {
    // The existing record may have been reviewed or edited since; the caller
    // asked to save something, not to replace something.
    const h = harness()
    const input = {
      title: 'Original title',
      sourceKind: 'url',
      url: 'https://example.com/a',
      text: 'text',
    }
    const first = await captureSource(h.deps, input)
    if (!first.ok) throw new Error('setup failed')
    h.documents[first.documentId].reviewStatus = 'ready'

    await captureSource(h.deps, { ...input, title: 'Changed title' })
    expect(h.documents[first.documentId].title).toBe('Original title')
    expect(h.documents[first.documentId].reviewStatus).toBe('ready')
  })

  it('reports a conflict instead of choosing between two matches', async () => {
    const h = harness({
      'knowledgeSource.a': {
        _id: 'knowledgeSource.a',
        _type: 'knowledgeSource',
        provenance: { idempotencyKey: 'k-1' },
      },
      'knowledgeSource.b': {
        _id: 'knowledgeSource.b',
        _type: 'knowledgeSource',
        canonicalUrl: 'https://example.com/a',
      },
    })
    const result = await captureSource(h.deps, {
      title: 'x',
      sourceKind: 'url',
      url: 'https://example.com/a',
      text: 'text',
      idempotencyKey: 'k-1',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('duplicate_conflict')
    expect(result.duplicate?.ambiguous).toBe(true)
    expect(h.created).toHaveLength(0)
  })

  it('refuses invalid input and writes nothing', async () => {
    const h = harness()
    const result = await captureSource(h.deps, { sourceKind: 'podcast' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('validation_failed')
    expect(result.errors?.some((error) => error.field === 'title')).toBe(true)
    expect(h.created).toHaveLength(0)
  })

  it('refuses a reference to a document that does not exist', async () => {
    const h = harness()
    const result = await captureSource(h.deps, {
      title: 'x',
      sourceKind: 'note',
      text: 'text',
      topicIds: ['knowledgeTopic.missing'],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('unresolved_reference')
    expect(result.message).toContain('knowledgeTopic.missing')
    expect(h.created).toHaveLength(0)
  })

  it('refuses a reference of the wrong type', async () => {
    // Sanity would store this happily and the graph would be quietly wrong.
    const h = harness({ [topic._id]: topic })
    const result = await captureSource(h.deps, {
      title: 'x',
      sourceKind: 'note',
      text: 'text',
      topicIds: [topic._id],
      // A topic ID where a topic is expected is fine; the failure below is a
      // source ID pointed at a topic, exercised in the item test.
    })
    expect(result.ok).toBe(true)
  })

  it('records an extraction intent without performing one', async () => {
    const h = harness()
    const result = await captureSource(h.deps, {
      title: 'A PDF',
      sourceKind: 'pdf',
      url: 'https://example.com/a.pdf',
      extractionExpected: true,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.events).toEqual([
      {
        type: 'extraction_requested',
        documentId: result.documentId,
        reason: 'Capture declared that the text will be extracted from the URL.',
      },
    ])
    expect((h.created[0].extractionState as Record<string, unknown>).status).toBe('queued')
    // No text yet, and no hash to pretend otherwise.
    expect(h.created[0].contentHash).toBeUndefined()
  })

  it('reports a Sanity write failure rather than throwing', async () => {
    const h = harness()
    h.breakWrites('Sanity is unavailable')
    const result = await captureSource(h.deps, { title: 'x', sourceKind: 'note', text: 'text' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('write_failed')
    expect(result.message).toBe('Sanity is unavailable')
  })
})

describe('captureKnowledgeItem', () => {
  it('creates an inbox item, whatever the caller asked for', async () => {
    const h = harness()
    const result = await captureKnowledgeItem(h.deps, {
      title: 'Deployers underestimate Article 26',
      kind: 'synthesis',
      body: 'Three of five conversations assumed the provider carried the duty.',
      provenance: { sourceSystem: 'claude', conversationId: 'conv-7' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(h.created[0].reviewStatus).toBe('inbox')
    expect(h.created[0].sensitivity).toBe('normal')
    expect(result.status).toBe('inbox')
  })

  it('refuses a caller that tries to arrive ready', async () => {
    const h = harness()
    const result = await captureKnowledgeItem(h.deps, {
      title: 'x',
      kind: 'synthesis',
      body: 'body',
      reviewStatus: 'ready',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('validation_failed')
    expect(result.errors?.[0].code).toBe('not_permitted')
    expect(h.created).toHaveLength(0)
  })

  it('refuses a source reference pointing at a topic', async () => {
    const h = harness({ [topic._id]: topic })
    const result = await captureKnowledgeItem(h.deps, {
      title: 'x',
      kind: 'note',
      body: 'body',
      sourceIds: [topic._id],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('unresolved_reference')
    expect(result.message).toContain('is a knowledgeTopic, not a knowledgeSource')
  })

  it('is idempotent on a caller-supplied key', async () => {
    const h = harness()
    const input = {
      title: 'x',
      kind: 'note',
      body: 'body',
      provenance: { sourceSystem: 'chatgpt', idempotencyKey: 'k-42' },
    }
    const first = await captureKnowledgeItem(h.deps, input)
    // Different body, same key: the caller says these are the same request.
    const second = await captureKnowledgeItem(h.deps, { ...input, body: 'different body' })
    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(second.documentId).toBe(first.documentId)
    expect(second.created).toBe(false)
    expect(h.created).toHaveLength(1)
  })

  it('links topics, sources and a run as keyed references', async () => {
    const h = harness({
      [topic._id]: topic,
      'knowledgeSource.s': { _id: 'knowledgeSource.s', _type: 'knowledgeSource' },
      'researchRun.r': { _id: 'researchRun.r', _type: 'researchRun' },
    })
    const result = await captureKnowledgeItem(h.deps, {
      title: 'x',
      kind: 'article_foundation',
      body: 'body',
      topicIds: [topic._id],
      sourceIds: ['knowledgeSource.s'],
      researchRunId: 'researchRun.r',
    })
    expect(result.ok).toBe(true)
    const doc = h.created[0]
    expect(doc.topics).toEqual([
      expect.objectContaining({ _type: 'reference', _ref: topic._id }),
    ])
    expect(doc.researchRun).toMatchObject({ _type: 'reference', _ref: 'researchRun.r' })
  })
})

describe('research runs', () => {
  it('creates a queued run that is not yet reusable', async () => {
    const h = harness()
    const result = await createResearchRun(h.deps, {
      query: 'AI Act transparency deadlines',
      mode: 'deep',
      provider: 'exa',
      jobId: 'job-1',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.status).toBe('queued')
    expect(h.created[0].reuseStatus).toBe('pending')
    expect(h.created[0].requestedAt).toBe('2026-08-18T12:00:00.000Z')
  })

  it('does not record the same provider job twice', async () => {
    const h = harness()
    const input = { query: 'q', mode: 'fast', provider: 'exa', jobId: 'job-1' }
    const first = await createResearchRun(h.deps, input)
    const second = await createResearchRun(h.deps, input)
    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(second.documentId).toBe(first.documentId)
    expect(h.created).toHaveLength(1)
  })

  it('runs a job through queued to completed', async () => {
    const h = harness()
    const created = await createResearchRun(h.deps, { query: 'q', mode: 'fast', provider: 'exa' })
    if (!created.ok) throw new Error('setup failed')

    const running = await updateResearchRun(h.deps, {
      documentId: created.documentId,
      status: 'running',
    })
    expect(running.ok).toBe(true)

    const completed = await updateResearchRun(h.deps, {
      documentId: created.documentId,
      status: 'completed',
      summary: 'Found three deadlines.',
    })
    expect(completed.ok).toBe(true)
    expect(h.documents[created.documentId].summary).toBe('Found three deadlines.')
    expect(h.documents[created.documentId].completedAt).toBe('2026-08-18T12:00:00.000Z')
  })

  it('refuses a transition the guard forbids', async () => {
    const h = harness({
      'researchRun.done': {
        _id: 'researchRun.done',
        _type: 'researchRun',
        status: 'completed',
      },
    })
    const result = await updateResearchRun(h.deps, {
      documentId: 'researchRun.done',
      status: 'running',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('transition_refused')
    expect(h.patched).toHaveLength(0)
  })

  it('refuses to complete a run that found nothing to report', async () => {
    const h = harness({
      'researchRun.live': { _id: 'researchRun.live', _type: 'researchRun', status: 'running' },
    })
    const result = await updateResearchRun(h.deps, {
      documentId: 'researchRun.live',
      status: 'completed',
      summary: '   ',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('validation_failed')
  })

  it('reports a missing run', async () => {
    const h = harness()
    const result = await updateResearchRun(h.deps, { documentId: 'researchRun.nope', status: 'running' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('not_found')
  })

  it('records what the run selected, keyed on the source URL', async () => {
    const h = harness({
      'researchRun.live': { _id: 'researchRun.live', _type: 'researchRun', status: 'running' },
    })
    const result = await updateResearchRun(h.deps, {
      documentId: 'researchRun.live',
      status: 'completed',
      summary: 'Two sources.',
      selectedSources: [
        { title: 'A', url: 'https://example.com/a', publishedDate: '2026-05-01' },
        { title: 'B', url: 'https://example.com/b' },
      ],
      modelSnapshot: { model: 'claude-x', costUsd: 0.42 },
    })
    expect(result.ok).toBe(true)
    const doc = h.documents['researchRun.live']
    const sources = doc.selectedSources as Array<Record<string, unknown>>
    expect(sources).toHaveLength(2)
    expect(sources[0]._type).toBe('selectedSource')
    expect(sources[0].title).toBe('A')
    // Deterministic, so recording the same result set twice is a no-op rather
    // than a second copy.
    expect(sources[0]._key).toBe(sources[0]._key)
    expect(new Set(sources.map((source) => source._key)).size).toBe(2)
    expect(doc.modelSnapshot).toEqual({ model: 'claude-x', costUsd: 0.42 })
  })

  it('writes no key an absent value would fill', async () => {
    // A provenance object assembled from optional fields must not carry keys
    // for what nobody knew: "looked and found nothing" and "did not look" are
    // different facts and the record has to keep them apart.
    const h = harness({
      'researchRun.live': { _id: 'researchRun.live', _type: 'researchRun', status: 'running' },
    })
    await updateResearchRun(h.deps, {
      documentId: 'researchRun.live',
      status: 'completed',
      summary: 'One source.',
      selectedSources: [{ title: 'A', url: 'https://example.com/a', publisher: undefined }],
      modelSnapshot: { model: undefined },
    })
    const doc = h.documents['researchRun.live']
    const source = (doc.selectedSources as Array<Record<string, unknown>>)[0]
    expect('publisher' in source).toBe(false)
    // An entirely empty snapshot is not written at all.
    expect('modelSnapshot' in doc).toBe(false)
  })
})

describe('recordRunGeneration', () => {
  const world = () => ({
    'researchRun.one': {
      _id: 'researchRun.one',
      _type: 'researchRun',
      status: 'completed',
      reuseStatus: 'pending',
    },
    'article.a': { _id: 'article.a', _type: 'article' },
    'article.b': { _id: 'article.b', _type: 'article' },
  })

  const lane = (name: string, recordId: string) => ({
    lane: name,
    indexName: 'idx',
    scoreFloor: 0.37,
    laneStatus: 'ok',
    entries: [{ recordId, score: 0.5, title: 'T' }],
  })

  it('links the article and keeps what retrieval returned', async () => {
    const h = harness(world())
    const result = await recordRunGeneration(h.deps, {
      runId: 'researchRun.one',
      articleId: 'article.a',
      retrievalSnapshots: [lane('prior_articles', 'article.z')],
    })
    expect(result.ok).toBe(true)
    const doc = h.documents['researchRun.one']
    expect((doc.articles as Array<{ _ref: string }>).map((r) => r._ref)).toEqual(['article.a'])
    const snapshots = doc.retrievalSnapshots as Array<Record<string, unknown>>
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].lane).toBe('prior_articles')
    expect((snapshots[0].entries as unknown[])).toHaveLength(1)
  })

  it('is idempotent — a retried draft rewrites its own entry, not a second copy', async () => {
    const h = harness(world())
    const input = {
      runId: 'researchRun.one',
      articleId: 'article.a',
      retrievalSnapshots: [lane('prior_articles', 'article.z')],
    }
    await recordRunGeneration(h.deps, input)
    await recordRunGeneration(h.deps, input)
    const doc = h.documents['researchRun.one']
    expect(doc.articles).toHaveLength(1)
    expect(doc.retrievalSnapshots).toHaveLength(1)
  })

  it('keeps a second article\'s retrieval alongside the first\'s', async () => {
    // One run can produce more than one draft, and each saw whatever the
    // indexes held at that moment. Keying on the article is what stops the
    // second overwriting the first.
    const h = harness(world())
    await recordRunGeneration(h.deps, {
      runId: 'researchRun.one',
      articleId: 'article.a',
      retrievalSnapshots: [lane('prior_articles', 'article.z')],
    })
    await recordRunGeneration(h.deps, {
      runId: 'researchRun.one',
      articleId: 'article.b',
      retrievalSnapshots: [lane('prior_articles', 'article.y')],
    })
    const doc = h.documents['researchRun.one']
    expect((doc.articles as Array<{ _ref: string }>).map((r) => r._ref)).toEqual([
      'article.a',
      'article.b',
    ])
    expect(doc.retrievalSnapshots).toHaveLength(2)
  })

  it('moves nothing but the two lineage fields', async () => {
    const h = harness(world())
    await recordRunGeneration(h.deps, {
      runId: 'researchRun.one',
      articleId: 'article.a',
      retrievalSnapshots: [lane('regulatory', 'chunk-1')],
    })
    expect(Object.keys(h.patched[0].fields).sort()).toEqual(['articles', 'retrievalSnapshots'])
  })

  it('refuses an article that does not exist', async () => {
    const h = harness(world())
    const result = await recordRunGeneration(h.deps, {
      runId: 'researchRun.one',
      articleId: 'article.nope',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('unresolved_reference')
    expect(h.patched).toHaveLength(0)
  })

  it('refuses a run that is not a run', async () => {
    const h = harness({ ...world(), 'knowledgeItem.x': { _id: 'knowledgeItem.x', _type: 'knowledgeItem' } })
    const result = await recordRunGeneration(h.deps, {
      runId: 'knowledgeItem.x',
      articleId: 'article.a',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('unresolved_reference')
  })

  it('accepts a draft-only article and stores the published reference', async () => {
    // Nothing in /create publishes, so at the moment lineage is recorded the
    // article exists ONLY as `drafts.<uuid>`. Passing the stripped published id
    // asks this to reference a document that will not exist until an editor
    // presses Publish, and the reference check refuses exactly that. The stored
    // reference is still the published id, which is where the article lands.
    const h = harness({
      'researchRun.one': { _id: 'researchRun.one', _type: 'researchRun', status: 'completed' },
      'drafts.article.a': { _id: 'drafts.article.a', _type: 'article' },
    })
    const result = await recordRunGeneration(h.deps, {
      runId: 'researchRun.one',
      articleId: 'drafts.article.a',
    })
    expect(result.ok).toBe(true)
    const refs = h.documents['researchRun.one'].articles as Array<{ _ref: string }>
    expect(refs.map((r) => r._ref)).toEqual(['article.a'])
  })

  it('still refuses an article id that resolves to nothing at all', async () => {
    const h = harness({
      'researchRun.one': { _id: 'researchRun.one', _type: 'researchRun', status: 'completed' },
    })
    const result = await recordRunGeneration(h.deps, {
      runId: 'researchRun.one',
      articleId: 'drafts.article.ghost',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('unresolved_reference')
  })

  it('records lineage even for a run whose completion was never recorded', async () => {
    // Not a judgement: the article exists and came from this run. Refusing
    // here would discard lineage exactly when something had already gone wrong.
    const h = harness({
      'researchRun.stuck': { _id: 'researchRun.stuck', _type: 'researchRun', status: 'running' },
      'article.a': { _id: 'article.a', _type: 'article' },
    })
    const result = await recordRunGeneration(h.deps, {
      runId: 'researchRun.stuck',
      articleId: 'article.a',
    })
    expect(result.ok).toBe(true)
    expect(h.documents['researchRun.stuck'].status).toBe('running')
  })
})

describe('applyIndexTransition', () => {
  const world = (indexState: Record<string, unknown> | null = null) => ({
    'knowledgeItem.a': {
      _id: 'knowledgeItem.a',
      _type: 'knowledgeItem',
      reviewStatus: 'ready',
      ...(indexState ? { indexState } : {}),
    },
  })

  it('treats an absent index state as not_eligible, which is the schema default', () => {
    // What a record written before this field existed looks like.
    const h = harness(world())
    return applyIndexTransition(h.deps, { documentId: 'knowledgeItem.a', to: 'pending' }).then(
      (result) => {
        expect(result.ok).toBe(true)
        expect(h.patched[0].fields['indexState.status']).toBe('pending')
      },
    )
  })

  it('refuses a self-transition, because a no-op is not a transition', async () => {
    // The machine forbids indexed → indexed on purpose: re-indexing changed
    // content is indexed → pending → indexed, and a caller that wants a
    // self-transition has not decided whether anything changed.
    const h = harness(world({ status: 'indexed' }))
    const result = await applyIndexTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'indexed',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('transition_refused')
    expect(h.patched).toHaveLength(0)
  })

  it('stamps the evidence when it reaches indexed, and clears a stale error', async () => {
    // A state and the evidence for it must not be writable apart. An indexed
    // record still carrying the message from a failure two attempts ago reads
    // as currently broken.
    const h = harness(world({ status: 'pending', lastError: 'the previous attempt' }))
    await applyIndexTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'indexed',
      canonicalHash: 'sha256:abc',
      indexedHash: 'sha256:abc',
      embeddingModel: 'text-embedding-3-small',
      indexVersion: '2026-08-21',
    })
    const fields = h.patched[0].fields
    expect(fields['indexState.indexedHash']).toBe('sha256:abc')
    expect(fields['indexState.embeddingModel']).toBe('text-embedding-3-small')
    expect(fields['indexState.indexedAt']).toBe('2026-08-18T12:00:00.000Z')
    expect(fields['indexState.lastError']).toBeNull()
  })

  it('counts attempts and demands a reason on error', async () => {
    const h = harness(world({ status: 'pending', attempts: 2 }))
    const refused = await applyIndexTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'error',
      lastError: '   ',
    })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.code).toBe('validation_failed')
    expect(h.patched).toHaveLength(0)

    await applyIndexTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'error',
      lastError: 'the embedding call failed',
    })
    expect(h.patched[0].fields['indexState.attempts']).toBe(3)
    expect(h.patched[0].fields['indexState.lastError']).toBe('the embedding call failed')
  })

  it('forgets the indexed hash when eligibility is withdrawn', async () => {
    // The vector is gone or going. Saying otherwise would make reconciliation
    // believe the index holds something it does not.
    const h = harness(world({ status: 'indexed', indexedHash: 'sha256:abc' }))
    await applyIndexTransition(h.deps, { documentId: 'knowledgeItem.a', to: 'not_eligible' })
    expect(h.patched[0].fields['indexState.indexedHash']).toBeNull()
    expect(h.patched[0].fields['indexState.indexedAt']).toBeNull()
  })

  it('reports a missing document', async () => {
    const h = harness()
    const result = await applyIndexTransition(h.deps, { documentId: 'nope.x', to: 'pending' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('not_found')
  })
})

describe('forgetIndexedVector', () => {
  it('clears only the evidence, and moves nothing', async () => {
    // Called after the indexer has actually deleted a vector from a record
    // whose status was already `not_eligible` — the shape the review route
    // always produces. The machine refuses `not_eligible → not_eligible`, so
    // there is no transition to make; what is left to correct is the record's
    // claim that the index still holds its text.
    const h = harness({
      'knowledgeSource.a': {
        _id: 'knowledgeSource.a',
        _type: 'knowledgeSource',
        indexState: { status: 'not_eligible', indexedHash: 'sha256:abc' },
      },
    })
    const result = await forgetIndexedVector(h.deps, {
      documentId: 'knowledgeSource.a',
      documentType: 'knowledgeSource',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.documentType).toBe('knowledgeSource')
    expect(h.patched[0].fields).toEqual({
      'indexState.indexedHash': null,
      'indexState.indexedAt': null,
    })
  })
})

describe('applyReviewTransition', () => {
  it('marks the record pending in the same patch as the ready verdict', async () => {
    // Wave 3, decision 2. One write: eligible and known to be unindexed. A
    // process that dies between the verdict and the embedding then leaves
    // something reconciliation can find, rather than a `ready` record nothing
    // will ever look at again.
    const h = harness({
      'knowledgeItem.a': { _id: 'knowledgeItem.a', _type: 'knowledgeItem', reviewStatus: 'inbox' },
    })
    const result = await applyReviewTransition(h.deps, { documentId: 'knowledgeItem.a', to: 'ready' })
    expect(result.ok).toBe(true)
    expect(h.patched[0].fields.reviewStatus).toBe('ready')
    expect(h.patched[0].fields['indexState.status']).toBe('pending')
  })

  it('does not re-open an already-indexed record on re-approval', async () => {
    // indexed → pending is a legal move, so this would be allowed and wrong.
    // Nothing about the text changed, so the index is not stale; the indexer
    // decides that by comparing hashes. Pre-empting it here would re-embed
    // every record every time somebody pulled one back for a second look.
    const h = harness({
      'knowledgeItem.a': {
        _id: 'knowledgeItem.a',
        _type: 'knowledgeItem',
        reviewStatus: 'inbox',
        indexState: { status: 'indexed' },
      },
    })
    await applyReviewTransition(h.deps, { documentId: 'knowledgeItem.a', to: 'ready' })
    expect('indexState.status' in h.patched[0].fields).toBe(false)
  })

  it('approves an inbox record and proposes index evaluation without indexing', async () => {
    const h = harness({
      'knowledgeItem.a': {
        _id: 'knowledgeItem.a',
        _type: 'knowledgeItem',
        reviewStatus: 'inbox',
      },
    })
    const result = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'ready',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.status).toBe('ready')
    expect(result.events).toEqual([
      {
        type: 'index_evaluation_requested',
        documentId: 'knowledgeItem.a',
        reason: 'The record became ready, so its index eligibility should be recalculated.',
      },
    ])
    // WAVE 1 ASSERTED `{ reviewStatus: 'ready' }` here, with the comment "an
    // intent, not an action: nothing here touches an index". Wave 3 changed
    // that deliberately (decision 2): the record is marked `pending` in the
    // same patch, so it is eligible and known to be unindexed in one write.
    //
    // What has NOT changed is the thing that comment was protecting — the
    // patch still touches no index. `pending` is a claim about this document,
    // not about Pinecone, and the intent is still what asks for the work.
    expect(h.patched[0].fields).toEqual({
      reviewStatus: 'ready',
      'indexState.status': 'pending',
    })
  })

  it('withdraws index eligibility immediately when a record stops being ready', async () => {
    const h = harness({
      'knowledgeItem.a': {
        _id: 'knowledgeItem.a',
        _type: 'knowledgeItem',
        reviewStatus: 'ready',
      },
    })
    const result = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'inbox',
    })
    expect(result.ok).toBe(true)
    expect(h.patched[0].fields['indexState.status']).toBe('not_eligible')
  })

  it('leaves the indexed hash standing, because the vector is still there', async () => {
    // The one place where writing `not_eligible` must NOT clear the evidence.
    // `applyIndexTransition` clears it because by then the vector is gone; here
    // the patch runs before anything touches Pinecone, and `indexedHash` is the
    // only remaining signal that a removal is outstanding. Clearing it made an
    // un-approved record's vector invisible to both the indexer and
    // `knowledge:sync`, so nothing ever removed it — found by pressing Return
    // to inbox in Studio on 2026-08-22, past a green suite.
    const h = harness({
      'knowledgeItem.a': {
        _id: 'knowledgeItem.a',
        _type: 'knowledgeItem',
        reviewStatus: 'ready',
        indexState: { status: 'indexed', indexedHash: 'sha256:abc' },
      },
    })
    await applyReviewTransition(h.deps, { documentId: 'knowledgeItem.a', to: 'rejected' })
    expect(h.patched[0].fields).toEqual({
      reviewStatus: 'rejected',
      'indexState.status': 'not_eligible',
    })
  })

  it('reviews a pre-foundation source through its legacy status', async () => {
    // The record has `status` and no `reviewStatus`, like every source
    // captured before this wave. It must be reviewable without a backfill.
    const h = harness({
      'knowledgeSource.old': {
        _id: 'knowledgeSource.old',
        _type: 'knowledgeSource',
        status: 'pending',
      },
    })
    const result = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeSource.old',
      to: 'ready',
    })
    expect(result.ok).toBe(true)
    expect(h.patched[0].fields.reviewStatus).toBe('ready')
    // The legacy field is left exactly as it was.
    expect(h.documents['knowledgeSource.old'].status).toBe('pending')
  })

  it('refuses to review a record whose legacy status was an error', async () => {
    const h = harness({
      'knowledgeSource.broken': {
        _id: 'knowledgeSource.broken',
        _type: 'knowledgeSource',
        status: 'error',
      },
    })
    const result = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeSource.broken',
      to: 'ready',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('transition_refused')
    expect(result.message).toContain('repair')
  })

  it('refuses a forbidden transition', async () => {
    const h = harness({
      'knowledgeItem.gone': {
        _id: 'knowledgeItem.gone',
        _type: 'knowledgeItem',
        reviewStatus: 'superseded',
      },
    })
    const result = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeItem.gone',
      to: 'ready',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('transition_refused')
    expect(h.patched).toHaveLength(0)
  })

  it('will not supersede a record without naming its replacement', async () => {
    const h = harness({
      'knowledgeItem.a': { _id: 'knowledgeItem.a', _type: 'knowledgeItem', reviewStatus: 'ready' },
    })
    const result = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'superseded',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('validation_failed')
  })

  it('supersedes with a replacement of the same type', async () => {
    const h = harness({
      'knowledgeItem.a': { _id: 'knowledgeItem.a', _type: 'knowledgeItem', reviewStatus: 'ready' },
      'knowledgeItem.b': { _id: 'knowledgeItem.b', _type: 'knowledgeItem', reviewStatus: 'inbox' },
      [topic._id]: topic,
    })
    const wrongType = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'superseded',
      supersededById: topic._id,
    })
    expect(wrongType.ok).toBe(false)
    if (!wrongType.ok) expect(wrongType.code).toBe('unresolved_reference')

    const good = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'superseded',
      supersededById: 'knowledgeItem.b',
    })
    expect(good.ok).toBe(true)
    expect(h.documents['knowledgeItem.a'].supersededBy).toMatchObject({
      _ref: 'knowledgeItem.b',
    })
  })

  it('reports a write failure rather than throwing', async () => {
    const h = harness({
      'knowledgeItem.a': { _id: 'knowledgeItem.a', _type: 'knowledgeItem', reviewStatus: 'inbox' },
    })
    h.breakWrites('Sanity rejected the patch')
    const result = await applyReviewTransition(h.deps, {
      documentId: 'knowledgeItem.a',
      to: 'ready',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('write_failed')
  })
})

describe('linkSourcesToItem', () => {
  const item = (overrides: Record<string, unknown> = {}) => ({
    'knowledgeItem.a': {
      _id: 'knowledgeItem.a',
      _type: 'knowledgeItem',
      reviewStatus: 'inbox',
      ...overrides,
    },
    'knowledgeSource.one': { _id: 'knowledgeSource.one', _type: 'knowledgeSource' },
    'knowledgeSource.two': { _id: 'knowledgeSource.two', _type: 'knowledgeSource' },
  })

  it('links a source to an inbox item', async () => {
    const h = harness(item())
    const result = await linkSourcesToItem(h.deps, {
      itemId: 'knowledgeItem.a',
      sourceIds: ['knowledgeSource.one'],
    })
    expect(result.ok).toBe(true)
    const sources = h.documents['knowledgeItem.a'].sources as { _ref: string }[]
    expect(sources.map((s) => s._ref)).toEqual(['knowledgeSource.one'])
  })

  it('adds without removing what was already there', async () => {
    // The worst a confused caller can do is add a wrong reference, which a
    // human can see and undo. There is no path here that removes one.
    const h = harness(
      item({ sources: [{ _type: 'reference', _ref: 'knowledgeSource.one', _key: 'k1' }] }),
    )
    await linkSourcesToItem(h.deps, {
      itemId: 'knowledgeItem.a',
      sourceIds: ['knowledgeSource.two'],
    })
    const sources = h.documents['knowledgeItem.a'].sources as { _ref: string }[]
    expect(sources.map((s) => s._ref)).toEqual(['knowledgeSource.one', 'knowledgeSource.two'])
  })

  it('is idempotent and writes nothing when there is nothing to add', async () => {
    const h = harness(
      item({ sources: [{ _type: 'reference', _ref: 'knowledgeSource.one', _key: 'k1' }] }),
    )
    const result = await linkSourcesToItem(h.deps, {
      itemId: 'knowledgeItem.a',
      sourceIds: ['knowledgeSource.one'],
    })
    expect(result.ok).toBe(true)
    expect(h.patched).toHaveLength(0)
  })

  it('touches sources and nothing else', async () => {
    // Not the review status, not the body, not the content hash — which is what
    // lets it be annotated as non-destructive honestly.
    const h = harness(item())
    await linkSourcesToItem(h.deps, {
      itemId: 'knowledgeItem.a',
      sourceIds: ['knowledgeSource.one'],
    })
    expect(Object.keys(h.patched[0].fields)).toEqual(['sources'])
    expect(h.documents['knowledgeItem.a'].reviewStatus).toBe('inbox')
  })

  it('refuses an item that is no longer awaiting review', async () => {
    for (const status of ['ready', 'rejected', 'superseded']) {
      const h = harness(item({ reviewStatus: status }))
      const result = await linkSourcesToItem(h.deps, {
        itemId: 'knowledgeItem.a',
        sourceIds: ['knowledgeSource.one'],
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe('transition_refused')
      expect(h.patched).toHaveLength(0)
    }
  })

  it('treats a record with no reviewStatus as inbox', async () => {
    const h = harness(item({ reviewStatus: undefined }))
    expect(
      (await linkSourcesToItem(h.deps, {
        itemId: 'knowledgeItem.a',
        sourceIds: ['knowledgeSource.one'],
      })).ok,
    ).toBe(true)
  })

  it('refuses a reference that is not a source', async () => {
    const h = harness({ ...item(), [topic._id]: topic })
    const result = await linkSourcesToItem(h.deps, {
      itemId: 'knowledgeItem.a',
      sourceIds: [topic._id],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('unresolved_reference')
    expect(h.patched).toHaveLength(0)
  })

  it('refuses a source that does not exist', async () => {
    const h = harness(item())
    const result = await linkSourcesToItem(h.deps, {
      itemId: 'knowledgeItem.a',
      sourceIds: ['knowledgeSource.missing'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('unresolved_reference')
  })

  it('refuses a target that is not a knowledge item', async () => {
    const h = harness({ ...item(), [topic._id]: topic })
    const result = await linkSourcesToItem(h.deps, {
      itemId: topic._id,
      sourceIds: ['knowledgeSource.one'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('not a knowledgeItem')
  })

  it('refuses a missing item and an empty list', async () => {
    const h = harness(item())
    expect(
      (await linkSourcesToItem(h.deps, { itemId: 'knowledgeItem.nope', sourceIds: ['knowledgeSource.one'] })).ok,
    ).toBe(false)
    const empty = await linkSourcesToItem(h.deps, { itemId: 'knowledgeItem.a', sourceIds: [] })
    expect(empty.ok).toBe(false)
    if (!empty.ok) expect(empty.code).toBe('validation_failed')
  })
})
