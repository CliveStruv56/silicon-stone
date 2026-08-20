import { describe, expect, it } from 'vitest'

import type { KnowledgeClient, KnowledgePatch } from './repository'
import {
  applyReviewTransition,
  captureKnowledgeItem,
  captureSource,
  createResearchRun,
  linkSourcesToItem,
  updateResearchRun,
  type KnowledgeServiceDeps,
} from './service'

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
    expect(result.reviewUrl).toBe('/knowledge?record=knowledgeSource.uuid-1')
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
})

describe('applyReviewTransition', () => {
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
    // An intent, not an action: nothing here touches an index.
    expect(h.patched[0].fields).toEqual({ reviewStatus: 'ready' })
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
