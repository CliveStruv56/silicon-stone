import { describe, expect, it } from 'vitest'

import { INGEST_ENVELOPE_VERSION, ingestCapture, type IngestContext } from './ingest'
import type { KnowledgeClient, KnowledgePatch } from './repository'
import type { KnowledgeServiceDeps } from './service'

function harness(documents: Record<string, Record<string, unknown>> = {}) {
  const created: Record<string, unknown>[] = []

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
      const ofType = all.filter((doc) => doc._type === params.documentType)
      const prov = (doc: Record<string, unknown>) =>
        (doc.provenance ?? {}) as Record<string, unknown>
      if (params.idempotencyKey !== undefined) {
        return ofType.filter((d) => prov(d).idempotencyKey === params.idempotencyKey) as T
      }
      if (params.externalId !== undefined) {
        return ofType.filter(
          (d) =>
            prov(d).sourceSystem === params.sourceSystem &&
            prov(d).externalId === params.externalId,
        ) as T
      }
      if (params.canonicalUrl !== undefined) {
        return ofType.filter(
          (d) => d.canonicalUrl === params.canonicalUrl || d.originalUrl === params.canonicalUrl,
        ) as T
      }
      if (params.contentHash !== undefined) {
        return ofType.filter((d) => d.contentHash === params.contentHash) as T
      }
      return [] as T
    },
    async create(document) {
      created.push(document)
      documents[String(document._id)] = document
      return { _id: String(document._id) }
    },
    async createOrReplace(document) {
      return this.create(document)
    },
    patch(): KnowledgePatch {
      const patch: KnowledgePatch = {
        set: () => patch,
        setIfMissing: () => patch,
        unset: () => patch,
        commit: async () => ({ _id: 'unused' }),
      }
      return patch
    },
  }

  const deps: KnowledgeServiceDeps = {
    client,
    now: () => '2026-08-20T12:00:00.000Z',
    uuid: (() => {
      let n = 0
      return () => `uuid-${++n}`
    })(),
  }
  return { deps, documents, created }
}

const CONTEXT: IngestContext = { sourceSystem: 'claude', capturedBy: 'mcp' }

const ITEM = {
  version: INGEST_ENVELOPE_VERSION,
  kind: 'knowledge_item',
  payload: {
    title: 'Deployers underestimate Article 26',
    kind: 'observation',
    body: 'Three of five conversations assumed the provider carried the duty.',
  },
}

function failureOf(result: Awaited<ReturnType<typeof ingestCapture>>) {
  return result.ok ? undefined : result.failure
}

describe('the envelope', () => {
  it('accepts a well-formed item and returns an absolute review URL', async () => {
    const h = harness()
    const result = await ingestCapture(h.deps, ITEM, CONTEXT)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.record.created).toBe(true)
    expect(result.record.status).toBe('inbox')
    // Relative would be useless pasted into a chat window.
    expect(result.record.reviewUrl).toMatch(/^https?:\/\//)
    expect(result.record.reviewUrl).toContain(result.record.documentId)
  })

  it('treats an omitted version as the current one', async () => {
    const h = harness()
    const { version, ...withoutVersion } = ITEM
    expect(version).toBe(INGEST_ENVELOPE_VERSION)
    expect((await ingestCapture(h.deps, withoutVersion, CONTEXT)).ok).toBe(true)
  })

  it('refuses a version it does not speak, before looking at the payload', async () => {
    const h = harness()
    const result = await ingestCapture(
      h.deps,
      { version: 99, kind: 'knowledge_item', payload: {} },
      CONTEXT,
    )
    expect(failureOf(result)?.code).toBe('unsupported_version')
    // No field errors: the schema may not even apply to that version.
    expect(failureOf(result)?.errors).toBeUndefined()
    expect(h.created).toHaveLength(0)
  })

  it('refuses an unknown kind', async () => {
    const h = harness()
    const result = await ingestCapture(
      h.deps,
      { kind: 'article', payload: {} },
      CONTEXT,
    )
    expect(failureOf(result)?.code).toBe('unsupported_kind')
  })

  it('refuses a body that is not an object', async () => {
    const h = harness()
    for (const body of [null, undefined, 'string', 42, ['array']]) {
      expect(failureOf(await ingestCapture(h.deps, body, CONTEXT))?.code).toBe(
        'malformed_envelope',
      )
    }
    expect(
      failureOf(await ingestCapture(h.deps, { kind: 'source', payload: 'text' }, CONTEXT))?.code,
    ).toBe('malformed_envelope')
  })
})

describe('provenance is the server’s to set', () => {
  it('overrides a sourceSystem the caller declared', async () => {
    // sourceSystem is half of the external-reference duplicate probe. A caller
    // able to choose it can split or merge dedup buckets.
    const h = harness()
    const result = await ingestCapture(
      h.deps,
      { ...ITEM, payload: { ...ITEM.payload, sourceSystem: 'chatgpt' } },
      CONTEXT,
    )
    expect(result.ok).toBe(true)
    expect((h.created[0].provenance as Record<string, unknown>).sourceSystem).toBe('claude')
  })

  it('overrides a nested provenance.sourceSystem too', async () => {
    const h = harness()
    await ingestCapture(
      h.deps,
      {
        ...ITEM,
        payload: {
          ...ITEM.payload,
          provenance: { sourceSystem: 'chatgpt', conversationId: 'conv-1' },
        },
      },
      CONTEXT,
    )
    const provenance = h.created[0].provenance as Record<string, unknown>
    expect(provenance.sourceSystem).toBe('claude')
    // Everything else the caller sent survives — only the claim is replaced.
    expect(provenance.conversationId).toBe('conv-1')
  })

  it('carries an envelope idempotency key into provenance', async () => {
    const h = harness()
    await ingestCapture(h.deps, { ...ITEM, idempotencyKey: 'env-key-1' }, CONTEXT)
    expect((h.created[0].provenance as Record<string, unknown>).idempotencyKey).toBe('env-key-1')
  })

  it('refuses a non-string idempotency key', async () => {
    const h = harness()
    const result = await ingestCapture(h.deps, { ...ITEM, idempotencyKey: 7 }, CONTEXT)
    expect(failureOf(result)?.code).toBe('malformed_envelope')
  })
})

describe('extraction', () => {
  it('is refused, not queued', async () => {
    // Accepting it would create work nothing drains — a queue that silently
    // accumulates while looking like progress.
    const h = harness()
    const result = await ingestCapture(
      h.deps,
      {
        kind: 'source',
        payload: {
          title: 'A PDF',
          sourceKind: 'pdf',
          url: 'https://example.com/a.pdf',
          extractionExpected: true,
        },
      },
      CONTEXT,
    )
    expect(failureOf(result)?.code).toBe('extraction_unsupported')
    expect(h.created).toHaveLength(0)
  })

  it('accepts a source that carries its own text', async () => {
    const h = harness()
    const result = await ingestCapture(
      h.deps,
      {
        kind: 'source',
        payload: {
          title: 'Commission guidance',
          sourceKind: 'url',
          url: 'https://example.com/guidance',
          text: 'Guidance text.',
        },
      },
      CONTEXT,
    )
    expect(result.ok).toBe(true)
  })
})

describe('domain failures pass through', () => {
  it('surfaces field errors from validation', async () => {
    const h = harness()
    const result = await ingestCapture(
      h.deps,
      { kind: 'knowledge_item', payload: { kind: 'observation' } },
      CONTEXT,
    )
    const failure = failureOf(result)
    expect(failure?.code).toBe('validation_failed')
    expect(failure?.errors?.some((e) => e.field === 'title')).toBe(true)
  })

  it('refuses a caller that tries to arrive ready', async () => {
    const h = harness()
    const result = await ingestCapture(
      h.deps,
      { ...ITEM, payload: { ...ITEM.payload, reviewStatus: 'ready' } },
      CONTEXT,
    )
    expect(failureOf(result)?.errors?.[0].code).toBe('not_permitted')
    expect(h.created).toHaveLength(0)
  })

  it('returns the existing record for a repeat, without creating a second', async () => {
    const h = harness()
    const first = await ingestCapture(h.deps, ITEM, CONTEXT)
    const second = await ingestCapture(h.deps, ITEM, CONTEXT)
    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(second.record.documentId).toBe(first.record.documentId)
    expect(second.record.created).toBe(false)
    expect(h.created).toHaveLength(1)
  })

  it('reports a duplicate conflict with the conflicting matches attached', async () => {
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
    const result = await ingestCapture(
      h.deps,
      {
        kind: 'source',
        idempotencyKey: 'k-1',
        payload: {
          title: 'x',
          sourceKind: 'url',
          url: 'https://example.com/a',
          text: 'text',
        },
      },
      CONTEXT,
    )
    const failure = failureOf(result)
    expect(failure?.code).toBe('duplicate_conflict')
    expect(failure?.duplicate?.ambiguous).toBe(true)
  })
})
