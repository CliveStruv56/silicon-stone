import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import type { KnowledgeClient, KnowledgePatch } from '@/lib/knowledge/repository'
import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_INTENDED_USES,
  KNOWLEDGE_ITEM_KINDS,
  KNOWLEDGE_SOURCE_CLASSES,
  KNOWLEDGE_SOURCE_KINDS,
  KNOWLEDGE_TRUST_TIERS,
} from '@/lib/knowledge/types'

import {
  KNOWLEDGE_TOOLS,
  KNOWLEDGE_TOOL_NAMES,
  type KnowledgeToolDeps,
  type KnowledgeToolName,
} from './knowledge-tools'

function toolNamed(name: KnowledgeToolName) {
  const tool = KNOWLEDGE_TOOLS.find((t) => t.name === name)
  if (!tool) throw new Error(`no tool named ${name}`)
  return tool
}

function deps(documents: Record<string, Record<string, unknown>> = {}): KnowledgeToolDeps & {
  created: Record<string, unknown>[]
  documents: Record<string, Record<string, unknown>>
} {
  const created: Record<string, unknown>[] = []
  const client: KnowledgeClient = {
    async fetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
      const all = Object.values(documents)
      if (query.includes('_id == $documentId')) {
        return (documents[String(params.documentId)] ?? null) as T
      }
      if (query.includes('_id in $documentIds')) {
        // Reference resolution asks this. Returning [] would make every
        // reference look missing.
        const wanted = new Set((params.documentIds as string[]) ?? [])
        return all.filter((doc) => wanted.has(String(doc._id))) as T
      }
      // Duplicate probes, so a repeated capture actually finds the first.
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
      if (query.includes('match $query') || query.includes('reviewStatus == "inbox"')) {
        return all as T
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
    patch(id: string): KnowledgePatch {
      const staged: Record<string, unknown> = {}
      const p: KnowledgePatch = {
        set: (fields) => {
          Object.assign(staged, fields)
          return p
        },
        setIfMissing: () => p,
        unset: () => p,
        commit: async () => {
          documents[id] = { ...(documents[id] ?? {}), ...staged }
          return { _id: id }
        },
      }
      return p
    },
  }
  return {
    created,
    documents,
    service: { client, now: () => '2026-08-20T12:00:00.000Z', uuid: () => 'uuid-1' },
    context: { sourceSystem: 'claude', capturedBy: 'mcp' },
  }
}

/** The JSON Schema the SDK will publish for a tool. */
function shapeOf(tool: (typeof KNOWLEDGE_TOOLS)[number]): Record<string, unknown> {
  return z.toJSONSchema(tool.config.inputSchema) as Record<string, unknown>
}

describe('the tool set', () => {
  it('is exactly the declared names, with no duplicates', () => {
    expect(KNOWLEDGE_TOOLS.map((t) => t.name).sort()).toEqual([...KNOWLEDGE_TOOL_NAMES].sort())
    expect(new Set(KNOWLEDGE_TOOLS.map((t) => t.name)).size).toBe(KNOWLEDGE_TOOLS.length)
  })

  it('exposes no tool that can approve, publish or delete anything', () => {
    // Handing a model the power to move a record to `ready` would defeat the
    // invariant the whole domain layer exists to hold.
    const names = KNOWLEDGE_TOOLS.map((t) => t.name).join(' ')
    for (const forbidden of ['review', 'transition', 'approve', 'publish', 'promote', 'delete']) {
      expect(names).not.toContain(forbidden)
    }
  })

  it('gives every tool a description', () => {
    for (const tool of KNOWLEDGE_TOOLS) {
      expect(tool.config.description.length).toBeGreaterThan(40)
      expect(tool.config.annotations.openWorldHint).toBe(false)
    }
  })
})

describe('annotations', () => {
  it('marks the two write tools non-destructive, explicitly', () => {
    // destructiveHint defaults to TRUE when readOnlyHint is false. Leaving it
    // implicit would put a destructive-action warning in front of every save.
    for (const name of [
      'capture_knowledge_item',
      'capture_source',
      'link_sources_to_item',
    ] as const) {
      const annotations = toolNamed(name).config.annotations
      expect(annotations.readOnlyHint).toBe(false)
      expect(annotations.destructiveHint).toBe(false)
      expect(annotations.idempotentHint).toBe(true)
    }
  })

  it('marks every read tool read-only', () => {
    // ChatGPT treats a MISSING readOnlyHint as a write and gates it behind a
    // confirmation, so silence is not an option.
    for (const name of ['search_knowledge', 'list_knowledge_inbox', 'get_knowledge_record'] as const) {
      expect(toolNamed(name).config.annotations.readOnlyHint).toBe(true)
    }
  })

  it('says plainly in every write description that nothing is destroyed', () => {
    for (const name of ['capture_knowledge_item', 'capture_source'] as const) {
      const description = toolNamed(name).config.description
      expect(description).toMatch(/never publishes, sends, edits, overwrites or deletes/)
    }
  })
})

describe('input schemas', () => {
  it('never offers sourceSystem — the server sets it', () => {
    // sourceSystem is half of the external-reference duplicate probe. A model
    // that can choose it can split or merge deduplication buckets.
    for (const tool of KNOWLEDGE_TOOLS) {
      expect(JSON.stringify(shapeOf(tool))).not.toContain('sourceSystem')
    }
  })

  it('never offers extractionExpected — extraction is not built', () => {
    for (const tool of KNOWLEDGE_TOOLS) {
      expect(JSON.stringify(shapeOf(tool))).not.toContain('extractionExpected')
    }
  })

  it('never offers a review status', () => {
    for (const tool of KNOWLEDGE_TOOLS) {
      const json = JSON.stringify(shapeOf(tool))
      expect(json).not.toContain('reviewStatus')
    }
  })

  it('publishes the enums from the domain constants, so they cannot drift', () => {
    const item = shapeOf(toolNamed('capture_knowledge_item'))
    const source = shapeOf(toolNamed('capture_source'))
    const props = (schema: Record<string, unknown>) =>
      (schema.properties ?? {}) as Record<string, { enum?: string[] }>

    expect(props(item).kind.enum).toEqual([...KNOWLEDGE_ITEM_KINDS])
    expect(props(item).intendedUse.enum).toEqual([...KNOWLEDGE_INTENDED_USES])
    expect(props(item).confidence.enum).toEqual([...KNOWLEDGE_CONFIDENCE_LEVELS])
    expect(props(source).sourceKind.enum).toEqual([...KNOWLEDGE_SOURCE_KINDS])
    expect(props(source).sourceClass.enum).toEqual([...KNOWLEDGE_SOURCE_CLASSES])
    expect(props(source).trustTier.enum).toEqual([...KNOWLEDGE_TRUST_TIERS])
  })

  it('requires only what the domain requires', () => {
    const item = shapeOf(toolNamed('capture_knowledge_item'))
    expect(item.required).toEqual(expect.arrayContaining(['title', 'kind', 'body']))
    const source = shapeOf(toolNamed('capture_source'))
    expect(source.required).toEqual(expect.arrayContaining(['title', 'sourceKind']))
  })
})

describe('capture behaviour', () => {
  it('saves an item to the inbox and returns a clickable review URL', async () => {
    const d = deps()
    const result = await toolNamed('capture_knowledge_item').run(
      { title: 'Selective sovereignty', kind: 'observation', body: 'A body.' },
      d,
    )
    expect(result.isError).toBeUndefined()
    expect(d.created[0].reviewStatus).toBe('inbox')
    expect(result.structuredContent?.created).toBe(true)
    expect(String(result.structuredContent?.reviewUrl)).toMatch(/^https?:\/\//)
    expect(result.content[0].text).toContain('Review it here')
  })

  it('sets provenance from the server, ignoring anything the model sent', async () => {
    const d = deps()
    await toolNamed('capture_knowledge_item').run(
      { title: 'x', kind: 'note', body: 'b', sourceSystem: 'chatgpt' },
      d,
    )
    expect((d.created[0].provenance as Record<string, unknown>).sourceSystem).toBe('claude')
  })

  it('returns a correctable error rather than a protocol failure', async () => {
    // The model must be able to see what it got wrong and fix it — the single
    // most valuable property of the integration.
    const d = deps()
    const result = await toolNamed('capture_knowledge_item').run({ kind: 'note' }, d)
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('title')
    expect(result.content[0].text).toContain('title is required.')
    expect(d.created).toHaveLength(0)
  })

  it('carries the authored message for a whole-payload failure', async () => {
    // A source with no URL, no text and no declared extraction fails against
    // the payload rather than a field, so the field is `_`. Reporting only
    // `_ (required)` names nothing the model can change; the sentence does.
    const d = deps()
    const result = await toolNamed('capture_source').run({ title: 'x', sourceKind: 'article' }, d)
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain(
      'Provide a URL, the source text, or declare that extraction is expected.',
    )
    expect(result.content[0].text).not.toContain('_ (required)')
    expect(d.created).toHaveLength(0)
  })

  it('says a repeat was already captured rather than claiming a new record', async () => {
    const d = deps()
    const args = { title: 'x', kind: 'note', body: 'b' }
    await toolNamed('capture_knowledge_item').run(args, d)
    const second = await toolNamed('capture_knowledge_item').run(args, d)
    expect(second.structuredContent?.created).toBe(false)
    expect(second.content[0].text).toContain('already captured')
    expect(d.created).toHaveLength(1)
  })

  it('refuses extraction with an explanation', async () => {
    const d = deps()
    const result = await toolNamed('capture_source').run(
      { title: 'x', sourceKind: 'pdf', extractionExpected: true },
      d,
    )
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toMatch(/not supported/i)
  })
})

describe('read behaviour', () => {
  it('reports an empty inbox rather than erroring', async () => {
    const result = await toolNamed('list_knowledge_inbox').run({}, deps())
    expect(result.isError).toBeUndefined()
    expect(result.structuredContent?.records).toEqual([])
  })

  it('errors clearly for a record that is not there', async () => {
    const result = await toolNamed('get_knowledge_record').run({ documentId: 'nope.x' }, deps())
    expect(result.isError).toBe(true)
  })

  it('returns a record it can see', async () => {
    const d = deps({
      'knowledgeItem.a': { _id: 'knowledgeItem.a', _type: 'knowledgeItem', title: 'A thing' },
    })
    const result = await toolNamed('get_knowledge_record').run({ documentId: 'knowledgeItem.a' }, d)
    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toContain('A thing')
  })
})

describe('link_sources_to_item', () => {
  const world = (itemOverrides: Record<string, unknown> = {}) => ({
    'knowledgeItem.a': {
      _id: 'knowledgeItem.a',
      _type: 'knowledgeItem',
      reviewStatus: 'inbox',
      ...itemOverrides,
    },
    'knowledgeSource.one': { _id: 'knowledgeSource.one', _type: 'knowledgeSource' },
  })

  it('attaches a source and says the item is still awaiting review', async () => {
    const d = deps(world())
    const result = await toolNamed('link_sources_to_item').run(
      { itemId: 'knowledgeItem.a', sourceIds: ['knowledgeSource.one'] },
      d,
    )
    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toContain('still awaiting review')
    expect(result.structuredContent?.status).toBe('inbox')
    const sources = d.documents['knowledgeItem.a'].sources as { _ref: string }[]
    expect(sources.map((entry) => entry._ref)).toEqual(['knowledgeSource.one'])
  })

  it('refuses an item that has already been reviewed', async () => {
    const d = deps(world({ reviewStatus: 'ready' }))
    const result = await toolNamed('link_sources_to_item').run(
      { itemId: 'knowledgeItem.a', sourceIds: ['knowledgeSource.one'] },
      d,
    )
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Studio')
  })

  it('refuses a source that does not exist, correctably', async () => {
    const d = deps(world())
    const result = await toolNamed('link_sources_to_item').run(
      { itemId: 'knowledgeItem.a', sourceIds: ['knowledgeSource.nope'] },
      d,
    )
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('knowledgeSource.nope')
  })

  it('offers no way to remove a source or change a status', () => {
    const shape = JSON.stringify(shapeOf(toolNamed('link_sources_to_item')))
    for (const forbidden of ['remove', 'reviewStatus', 'status', 'delete', 'replace']) {
      expect(shape).not.toContain(forbidden)
    }
  })
})
