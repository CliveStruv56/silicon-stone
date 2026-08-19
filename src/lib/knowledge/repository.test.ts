import { describe, expect, it } from 'vitest'

import {
  DUPLICATE_PROBES,
  createDocument,
  findByCanonicalUrl,
  findByContentHash,
  findByExternalReference,
  findByIdempotencyKey,
  findDuplicate,
  getDocument,
  listLegacyCandidates,
  patchDocument,
  resolveExistingDocuments,
  resolveSourceIdsToDocuments,
  type KnowledgeClient,
  type KnowledgePatch,
} from './repository'

/**
 * A stub, not a Sanity emulator. It records every query and its parameters —
 * which is what the parameterisation assertions read — and answers from a
 * table the test sets up.
 */
interface Call {
  query: string
  params: Record<string, unknown>
}

function stubClient(
  answer: (call: Call) => unknown = () => [],
): KnowledgeClient & {
  calls: Call[]
  created: Record<string, unknown>[]
  patches: { id: string; fields: Record<string, unknown>; mode: string }[]
} {
  const calls: Call[] = []
  const created: Record<string, unknown>[] = []
  const patches: { id: string; fields: Record<string, unknown>; mode: string }[] = []

  return {
    calls,
    created,
    patches,
    async fetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
      const call = { query, params }
      calls.push(call)
      return answer(call) as T
    },
    async create(document) {
      created.push(document)
      return { _id: String(document._id) }
    },
    async createOrReplace(document) {
      created.push(document)
      return { _id: String(document._id) }
    },
    patch(id: string): KnowledgePatch {
      const patch: KnowledgePatch = {
        set(fields) {
          patches.push({ id, fields, mode: 'set' })
          return patch
        },
        setIfMissing(fields) {
          patches.push({ id, fields, mode: 'setIfMissing' })
          return patch
        },
        unset(fields) {
          patches.push({ id, fields: { unset: fields }, mode: 'unset' })
          return patch
        },
        async commit() {
          return { _id: id }
        },
      }
      return patch
    },
  }
}

describe('lookup primitives', () => {
  it('passes every value as a parameter rather than concatenating it', async () => {
    const client = stubClient()
    await findByIdempotencyKey(client, 'knowledgeItem', 'k-1')
    await findByExternalReference(client, 'knowledgeItem', 'chatgpt', 'conv-1')
    await findByCanonicalUrl(client, 'knowledgeSource', 'https://example.com/a')
    await findByContentHash(client, 'knowledgeSource', `sha256:${'a'.repeat(64)}`)

    for (const call of client.calls) {
      // The literal values must appear only in params, never in the query text.
      for (const value of Object.values(call.params)) {
        if (typeof value === 'string') expect(call.query).not.toContain(value)
      }
      expect(call.query).toContain('$documentType')
    }
    expect(client.calls[0].params).toEqual({
      documentType: 'knowledgeItem',
      idempotencyKey: 'k-1',
    })
  })

  it('excludes drafts from every duplicate probe', async () => {
    const client = stubClient()
    await findByIdempotencyKey(client, 'knowledgeItem', 'k-1')
    await findByExternalReference(client, 'knowledgeItem', 'chatgpt', 'conv-1')
    await findByCanonicalUrl(client, 'knowledgeSource', 'https://example.com/a')
    await findByContentHash(client, 'knowledgeSource', 'sha256:x')
    for (const call of client.calls) {
      expect(call.query).toContain('!(_id in path("drafts.**"))')
    }
  })

  it('also matches the legacy originalUrl, so a re-capture is not seen as new', async () => {
    const client = stubClient()
    await findByCanonicalUrl(client, 'knowledgeSource', 'https://example.com/a')
    expect(client.calls[0].query).toContain('canonicalUrl == $canonicalUrl')
    expect(client.calls[0].query).toContain('originalUrl == $canonicalUrl')
  })

  it('de-duplicates the IDs it returns and copes with a null result', async () => {
    const client = stubClient(() => [{ _id: 'a' }, { _id: 'a' }, { _id: 'b' }])
    expect(await findByIdempotencyKey(client, 'knowledgeItem', 'k')).toEqual(['a', 'b'])

    const empty = stubClient(() => null)
    expect(await findByIdempotencyKey(empty, 'knowledgeItem', 'k')).toEqual([])
  })
})

describe('findDuplicate', () => {
  const base = {
    documentType: 'knowledgeItem',
    idempotencyKey: 'k-1',
    sourceSystem: 'chatgpt' as const,
    externalId: 'conv-1',
    canonicalUrl: 'https://example.com/a',
    contentHash: `sha256:${'a'.repeat(64)}`,
  }

  it('reports no duplicate when nothing matches', async () => {
    const outcome = await findDuplicate(stubClient(() => []), base)
    expect(outcome).toMatchObject({ duplicate: false, ambiguous: false })
    expect(outcome.documentId).toBeUndefined()
    expect(outcome.matches).toHaveLength(4)
  })

  it('runs no probe it lacks the input for', async () => {
    const client = stubClient(() => [])
    const outcome = await findDuplicate(client, { documentType: 'knowledgeItem' })
    expect(client.calls).toHaveLength(0)
    expect(outcome.matches).toEqual([])
    expect(outcome.duplicate).toBe(false)
  })

  it('needs both halves of an external reference before it will probe', async () => {
    const client = stubClient(() => [])
    await findDuplicate(client, { documentType: 'knowledgeItem', sourceSystem: 'chatgpt' })
    expect(client.calls).toHaveLength(0)
  })

  it('returns the single match and the probe that found it', async () => {
    const client = stubClient((call) =>
      call.params.canonicalUrl ? [{ _id: 'knowledgeSource.x' }] : [],
    )
    const outcome = await findDuplicate(client, { ...base, idempotencyKey: null, externalId: null })
    expect(outcome).toMatchObject({
      duplicate: true,
      ambiguous: false,
      matchedBy: 'canonical_url',
      documentId: 'knowledgeSource.x',
    })
  })

  it('prefers the probe that knows most, whatever order the inputs arrived in', async () => {
    // Every probe matches a different document. The idempotency key wins
    // because the caller asserted identity; the content hash only observed a
    // coincidence.
    const client = stubClient((call) => {
      if (call.params.idempotencyKey) return [{ _id: 'by-key' }]
      if (call.params.externalId) return [{ _id: 'by-external' }]
      if (call.params.canonicalUrl) return [{ _id: 'by-url' }]
      return [{ _id: 'by-hash' }]
    })
    const outcome = await findDuplicate(client, base)
    expect(outcome.matchedBy).toBe('idempotency_key')
  })

  it('declares a conflict rather than picking a winner', async () => {
    const client = stubClient((call) => {
      if (call.params.idempotencyKey) return [{ _id: 'by-key' }]
      if (call.params.canonicalUrl) return [{ _id: 'somewhere-else' }]
      return []
    })
    const outcome = await findDuplicate(client, { ...base, externalId: null, contentHash: null })
    expect(outcome.duplicate).toBe(true)
    expect(outcome.ambiguous).toBe(true)
    // No documentId: there is no honest single answer, and guessing would
    // merge two records a human has not looked at.
    expect(outcome.documentId).toBeUndefined()
    expect(outcome.matchedBy).toBe('idempotency_key')
  })

  it('declares a conflict when one probe matches several documents', async () => {
    const client = stubClient((call) =>
      call.params.idempotencyKey ? [{ _id: 'a' }, { _id: 'b' }] : [],
    )
    const outcome = await findDuplicate(client, {
      documentType: 'knowledgeItem',
      idempotencyKey: 'k-1',
    })
    expect(outcome).toMatchObject({ duplicate: true, ambiguous: true, matchedBy: 'idempotency_key' })
    expect(outcome.documentId).toBeUndefined()
  })

  it('is not ambiguous when every probe agrees on the same document', async () => {
    const client = stubClient(() => [{ _id: 'the-one' }])
    const outcome = await findDuplicate(client, base)
    expect(outcome).toMatchObject({
      duplicate: true,
      ambiguous: false,
      documentId: 'the-one',
      matchedBy: 'idempotency_key',
    })
  })

  it('always runs every probe it can, so a disagreement is visible', async () => {
    const client = stubClient(() => [{ _id: 'the-one' }])
    await findDuplicate(client, base)
    expect(client.calls).toHaveLength(DUPLICATE_PROBES.length)
  })
})

describe('reads', () => {
  it('resolves which document IDs exist, and their types', async () => {
    const client = stubClient(() => [
      { _id: 'knowledgeTopic.a', _type: 'knowledgeTopic' },
      { _id: 'knowledgeSource.b', _type: 'knowledgeSource' },
    ])
    const found = await resolveExistingDocuments(client, [
      'knowledgeTopic.a',
      'knowledgeSource.b',
      'knowledgeTopic.missing',
      'knowledgeTopic.a',
    ])
    expect(found.get('knowledgeTopic.a')).toBe('knowledgeTopic')
    expect(found.has('knowledgeTopic.missing')).toBe(false)
    expect(client.calls[0].params.documentIds).toEqual([
      'knowledgeTopic.a',
      'knowledgeSource.b',
      'knowledgeTopic.missing',
    ])
  })

  it('asks nothing when there is nothing to resolve', async () => {
    const client = stubClient()
    expect((await resolveExistingDocuments(client, [])).size).toBe(0)
    expect(client.calls).toHaveLength(0)
  })

  it('returns null for a document that is not there', async () => {
    expect(await getDocument(stubClient(() => null), 'missing')).toBeNull()
  })

  it('reports a legacy source ID matching more than one document', async () => {
    const client = stubClient(() => [
      { _id: 'knowledgeSource.a', sourceId: 'shared-id' },
      { _id: 'knowledgeSource.b', sourceId: 'shared-id' },
      { _id: 'knowledgeSource.c', sourceId: 'unique-id' },
    ])
    const resolved = await resolveSourceIdsToDocuments(client, [
      'shared-id',
      'unique-id',
      'absent-id',
    ])
    expect(resolved.get('shared-id')).toEqual(['knowledgeSource.a', 'knowledgeSource.b'])
    expect(resolved.get('unique-id')).toEqual(['knowledgeSource.c'])
    // Present as a key with no matches — the migration has to report it, and
    // an absent key would look like a lookup that never ran.
    expect(resolved.get('absent-id')).toEqual([])
  })

  it('lists legacy candidates oldest first and excludes drafts', async () => {
    const client = stubClient(() => null)
    expect(await listLegacyCandidates(client)).toEqual([])
    expect(client.calls[0].query).toContain('order(createdAt asc')
    expect(client.calls[0].query).toContain('!(_id in path("drafts.**"))')
  })
})

describe('writes', () => {
  it('creates at the ID it was given', async () => {
    const client = stubClient()
    const result = await createDocument(client, {
      _id: 'knowledgeItem.x',
      _type: 'knowledgeItem',
      title: 'x',
    })
    expect(result).toEqual({ documentId: 'knowledgeItem.x', created: true })
    expect(client.created[0]._type).toBe('knowledgeItem')
  })

  it('patches, and can decline to overwrite', async () => {
    const client = stubClient()
    await patchDocument(client, 'knowledgeItem.x', { title: 'new' })
    await patchDocument(client, 'knowledgeItem.x', { reviewStatus: 'inbox' }, { onlyIfMissing: true })
    expect(client.patches.map((p) => p.mode)).toEqual(['set', 'setIfMissing'])
  })

  it('lets a write failure propagate rather than swallowing it', async () => {
    const failing = stubClient()
    failing.create = async () => {
      throw new Error('Sanity is unavailable')
    }
    await expect(
      createDocument(failing, { _id: 'knowledgeItem.x', _type: 'knowledgeItem' }),
    ).rejects.toThrow('Sanity is unavailable')
  })
})
