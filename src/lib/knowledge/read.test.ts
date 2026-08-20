import { describe, expect, it } from 'vitest'

import {
  KNOWLEDGE_READ_DEFAULT_LIMIT,
  KNOWLEDGE_READ_MAX_LIMIT,
  KNOWLEDGE_SEARCH_MAX_QUERY_LENGTH,
  getKnowledgeRecord,
  listKnowledgeInbox,
  normaliseSearchQuery,
  searchKnowledge,
} from './read'
import type { KnowledgeClient, KnowledgePatch } from './repository'

interface Call {
  query: string
  params: Record<string, unknown>
}

function stub(answer: unknown = []): KnowledgeClient & { calls: Call[] } {
  const calls: Call[] = []
  return {
    calls,
    async fetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
      calls.push({ query, params })
      return answer as T
    },
    async create() {
      throw new Error('reads must not write')
    },
    async createOrReplace() {
      throw new Error('reads must not write')
    },
    patch(): KnowledgePatch {
      throw new Error('reads must not write')
    },
  }
}

describe('every external read', () => {
  it('excludes private and confidential records', async () => {
    // These hand records to a third-party model. Master spec §7 says private
    // content is ineligible for retrieval, and this is retrieval.
    const client = stub()
    await listKnowledgeInbox(client)
    await getKnowledgeRecord(client, 'knowledgeItem.a')
    await searchKnowledge(client, { query: 'sovereignty' })
    expect(client.calls).toHaveLength(3)
    for (const call of client.calls) {
      expect(call.query).toContain('!(sensitivity in ["private", "confidential"])')
    }
  })

  it('projects explicit fields and never a bare wildcard', async () => {
    const client = stub()
    await listKnowledgeInbox(client)
    await getKnowledgeRecord(client, 'knowledgeItem.a')
    await searchKnowledge(client, { query: 'x' })
    for (const call of client.calls) {
      // No object spread (`{ ..., }`): a field added to a schema later must not
      // start flowing to an external client because nobody revisited the
      // projection. The `[0...$limit]` slice is a different three dots.
      expect(call.query).not.toMatch(/\{[^}]*\.\.\.[^}]*\}/)
      expect(call.query).toContain('_id,')
    }
  })

  it('passes user input as a parameter, never into the query text', async () => {
    const client = stub()
    await searchKnowledge(client, { query: 'selective sovereignty' })
    expect(client.calls[0].query).not.toContain('selective sovereignty')
    expect(client.calls[0].params.query).toBe('selective sovereignty')
  })

  it('restricts itself to the two knowledge types', async () => {
    const client = stub()
    await listKnowledgeInbox(client)
    await searchKnowledge(client, { query: 'x' })
    for (const call of client.calls) {
      expect(call.query).toContain('_type in ["knowledgeItem", "knowledgeSource"]')
    }
  })
})

describe('listKnowledgeInbox', () => {
  it('reads the legacy status as well as reviewStatus', async () => {
    // Sources captured before the foundation wave have only `status`. Asking
    // one question would empty the inbox of the oldest records.
    const client = stub()
    await listKnowledgeInbox(client)
    expect(client.calls[0].query).toContain('!defined(reviewStatus) && status == "pending"')
  })

  it('excludes drafts', async () => {
    const client = stub()
    await listKnowledgeInbox(client)
    expect(client.calls[0].query).toContain('!(_id in path("drafts.**"))')
  })

  it('caps the limit a caller asks for', async () => {
    const client = stub()
    await listKnowledgeInbox(client, { limit: 10_000 })
    expect(client.calls[0].params.limit).toBe(KNOWLEDGE_READ_MAX_LIMIT)
  })

  it('defaults and floors the limit', async () => {
    const client = stub()
    await listKnowledgeInbox(client)
    expect(client.calls[0].params.limit).toBe(KNOWLEDGE_READ_DEFAULT_LIMIT)
    await listKnowledgeInbox(client, { limit: 0 })
    expect(client.calls[1].params.limit).toBe(1)
    await listKnowledgeInbox(client, { limit: Number.NaN })
    expect(client.calls[2].params.limit).toBe(KNOWLEDGE_READ_DEFAULT_LIMIT)
  })

  it('copes with a null result', async () => {
    expect(await listKnowledgeInbox(stub(null))).toEqual([])
  })
})

describe('getKnowledgeRecord', () => {
  it('refuses a malformed ID without querying', async () => {
    const client = stub()
    for (const id of ['', 'a b', '../escape', '*']) {
      expect(await getKnowledgeRecord(client, id)).toBeNull()
    }
    expect(client.calls).toHaveLength(0)
  })

  it('returns null when nothing matches', async () => {
    expect(await getKnowledgeRecord(stub(null), 'knowledgeItem.a')).toBeNull()
  })

  it('includes the body, unlike the list projection', async () => {
    const client = stub()
    await getKnowledgeRecord(client, 'knowledgeItem.a')
    expect(client.calls[0].query).toContain('body')
  })
})

describe('normaliseSearchQuery', () => {
  it('strips GROQ wildcards', () => {
    // A bare `*` would match everything — a way to drain the lane through a
    // search box.
    expect(normaliseSearchQuery('*')).toBe('')
    expect(normaliseSearchQuery('sovereign*')).toBe('sovereign')
    expect(normaliseSearchQuery('a ? b')).toBe('a b')
  })

  it('collapses whitespace and trims', () => {
    expect(normaliseSearchQuery('  selective   sovereignty  ')).toBe('selective sovereignty')
  })

  it('caps the length', () => {
    const long = 'a'.repeat(KNOWLEDGE_SEARCH_MAX_QUERY_LENGTH + 100)
    expect(normaliseSearchQuery(long)).toHaveLength(KNOWLEDGE_SEARCH_MAX_QUERY_LENGTH)
  })

  it('is empty for non-strings', () => {
    for (const value of [null, undefined, 42, {}, []]) {
      expect(normaliseSearchQuery(value)).toBe('')
    }
  })
})

describe('searchKnowledge', () => {
  it('does not query at all for an empty or wildcard-only term', async () => {
    const client = stub()
    expect(await searchKnowledge(client, { query: '  *  ' })).toEqual([])
    expect(await searchKnowledge(client, { query: '' })).toEqual([])
    expect(client.calls).toHaveLength(0)
  })
})
