import { describe, expect, it } from 'vitest'

import {
  KNOWLEDGE_LIMITS,
  failedFields,
  parseKnowledgeItemCaptureInput,
  parseResearchRunCreateInput,
  parseSourceCaptureInput,
  type KnowledgeValidationError,
  type ParseResult,
} from './schema'

function errorsOf<T>(result: ParseResult<T>): KnowledgeValidationError[] {
  return result.ok ? [] : result.errors
}

function codeFor<T>(result: ParseResult<T>, field: string): string | undefined {
  return errorsOf(result).find((error) => error.field === field)?.code
}

const validNote = {
  title: 'A note about the AI Act',
  sourceKind: 'note',
  text: 'The transparency duties bite from August 2026.',
}

describe('parseSourceCaptureInput', () => {
  it('accepts a plain note with no URL', () => {
    const result = parseSourceCaptureInput(validNote)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.title).toBe('A note about the AI Act')
    expect(result.value.sourceKind).toBe('note')
    expect(result.value.url).toBeUndefined()
    expect(result.value.provenance.sourceSystem).toBe('unknown')
  })

  it('normalises the URL it stores', () => {
    const result = parseSourceCaptureInput({
      title: 'A page',
      sourceKind: 'url',
      url: 'HTTPS://Example.com/a?utm_source=x#frag',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.url).toBe('https://example.com/a')
  })

  it('accepts the legacy field names the existing route already sends', () => {
    const result = parseSourceCaptureInput({
      title: 'A page',
      sourceType: 'url',
      originalUrl: 'https://example.com/a',
      extractedText: 'text',
      topicTags: [' AI Act ', 'ai act'],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.sourceKind).toBe('url')
    expect(result.value.tags).toEqual(['ai act'])
  })

  it('requires a title, and a recognised kind', () => {
    const result = parseSourceCaptureInput({ text: 'body' })
    expect(result.ok).toBe(false)
    expect(codeFor(result, 'title')).toBe('required')
    expect(codeFor(result, 'sourceKind')).toBe('required')
  })

  it('refuses an unrecognised kind rather than storing it', () => {
    const result = parseSourceCaptureInput({ ...validNote, sourceKind: 'podcast' })
    expect(codeFor(result, 'sourceKind')).toBe('invalid_value')
  })

  it('refuses a URL that is not http or https', () => {
    for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'not a url', 'mailto:a@b.c']) {
      const result = parseSourceCaptureInput({ title: 'x', sourceKind: 'url', url })
      expect(codeFor(result, 'url')).toBe('invalid_url')
    }
  })

  it('refuses a source that is neither located nor holds text', () => {
    const result = parseSourceCaptureInput({ title: 'x', sourceKind: 'note' })
    expect(codeFor(result, '_')).toBe('required')
  })

  it('lets extraction stand in for text, but only with somewhere to extract from', () => {
    const withUrl = parseSourceCaptureInput({
      title: 'x',
      sourceKind: 'url',
      url: 'https://example.com/a',
      extractionExpected: true,
    })
    expect(withUrl.ok).toBe(true)
    if (withUrl.ok) expect(withUrl.value.extractionExpected).toBe(true)

    const withoutUrl = parseSourceCaptureInput({
      title: 'x',
      sourceKind: 'pdf',
      extractionExpected: true,
    })
    expect(codeFor(withoutUrl, 'url')).toBe('required')
  })

  it('refuses to let capture declare itself reviewed', () => {
    // Ignoring the field would be equally safe and much worse: the caller
    // would believe it had been honoured.
    for (const status of ['ready', 'rejected', 'superseded', 'processed']) {
      const result = parseSourceCaptureInput({ ...validNote, reviewStatus: status })
      expect(codeFor(result, 'reviewStatus')).toBe('not_permitted')
    }
    expect(parseSourceCaptureInput({ ...validNote, reviewStatus: 'inbox' }).ok).toBe(true)
  })

  it('refuses over-long fields at the domain limit', () => {
    const result = parseSourceCaptureInput({
      ...validNote,
      title: 'a'.repeat(KNOWLEDGE_LIMITS.title + 1),
    })
    expect(codeFor(result, 'title')).toBe('too_long')
  })

  it('refuses an empty title made only of whitespace', () => {
    expect(codeFor(parseSourceCaptureInput({ ...validNote, title: '   ' }), 'title')).toBe(
      'required',
    )
  })

  it('refuses a malformed or draft topic reference', () => {
    expect(codeFor(parseSourceCaptureInput({ ...validNote, topicIds: [''] }), 'topicIds')).toBe(
      'invalid_reference',
    )
    expect(
      codeFor(
        parseSourceCaptureInput({ ...validNote, topicIds: ['drafts.knowledgeTopic.x'] }),
        'topicIds',
      ),
    ).toBe('invalid_reference')
    expect(
      codeFor(parseSourceCaptureInput({ ...validNote, topicIds: ['a b/c'] }), 'topicIds'),
    ).toBe('invalid_reference')
  })

  it('refuses more references than the limit allows', () => {
    const many = Array.from({ length: KNOWLEDGE_LIMITS.maxTopics + 1 }, (_, i) => `topic.${i}`)
    expect(codeFor(parseSourceCaptureInput({ ...validNote, topicIds: many }), 'topicIds')).toBe(
      'too_many',
    )
  })

  it('de-duplicates references while keeping order', () => {
    const result = parseSourceCaptureInput({
      ...validNote,
      topicIds: ['knowledgeTopic.b', 'knowledgeTopic.a', 'knowledgeTopic.b'],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.topicIds).toEqual(['knowledgeTopic.b', 'knowledgeTopic.a'])
  })

  it('reads provenance nested or flat', () => {
    const nested = parseSourceCaptureInput({
      ...validNote,
      provenance: { sourceSystem: 'chatgpt', externalId: 'conv-1' },
    })
    const flat = parseSourceCaptureInput({
      ...validNote,
      sourceSystem: 'chatgpt',
      externalId: 'conv-1',
    })
    expect(nested.ok && flat.ok).toBe(true)
    if (nested.ok && flat.ok) expect(nested.value.provenance).toEqual(flat.value.provenance)
  })

  it('refuses a source system it does not recognise', () => {
    const result = parseSourceCaptureInput({ ...validNote, sourceSystem: 'some-crm' })
    expect(codeFor(result, 'provenance.sourceSystem')).toBe('invalid_value')
  })

  it('refuses input that is not an object', () => {
    for (const input of [null, undefined, 'a string', 42, ['array']]) {
      const result = parseSourceCaptureInput(input)
      expect(result.ok).toBe(false)
      expect(codeFor(result, '_')).toBe('invalid_type')
    }
  })

  it('reports every problem, not just the first', () => {
    const result = parseSourceCaptureInput({ sourceKind: 'podcast' })
    expect(failedFields(errorsOf(result)).sort()).toEqual(['_', 'sourceKind', 'title'])
  })
})

const validItem = {
  title: 'Deployers underestimate Article 26',
  kind: 'observation',
  body: 'Three of five conversations this month assumed the provider carried the duty.',
}

describe('parseKnowledgeItemCaptureInput', () => {
  it('accepts a conversation extract with its provenance', () => {
    const result = parseKnowledgeItemCaptureInput({
      ...validItem,
      kind: 'conversation_extract',
      summary: 'Deployers assume the provider carries it.',
      provenance: {
        sourceSystem: 'claude',
        externalId: 'msg-42',
        conversationId: 'conv-7',
        idempotencyKey: 'k-1',
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.kind).toBe('conversation_extract')
    expect(result.value.provenance.conversationId).toBe('conv-7')
    expect(result.value.provenance.idempotencyKey).toBe('k-1')
  })

  it('requires a title, a kind and a body', () => {
    const result = parseKnowledgeItemCaptureInput({})
    expect(codeFor(result, 'title')).toBe('required')
    expect(codeFor(result, 'kind')).toBe('required')
    expect(codeFor(result, 'body')).toBe('required')
  })

  it('refuses a kind outside the fixed list', () => {
    expect(codeFor(parseKnowledgeItemCaptureInput({ ...validItem, kind: 'summary' }), 'kind')).toBe(
      'invalid_value',
    )
  })

  it('refuses to let AI-derived content arrive ready', () => {
    const result = parseKnowledgeItemCaptureInput({
      ...validItem,
      kind: 'synthesis',
      reviewStatus: 'ready',
    })
    expect(codeFor(result, 'reviewStatus')).toBe('not_permitted')
  })

  it('refuses an over-long body', () => {
    const result = parseKnowledgeItemCaptureInput({
      ...validItem,
      body: 'a'.repeat(KNOWLEDGE_LIMITS.body + 1),
    })
    expect(codeFor(result, 'body')).toBe('too_long')
  })

  it('validates the shape of relationship IDs but not their existence', () => {
    // Whether the document exists is the repository's question — this layer
    // cannot answer it and must not pretend to.
    const result = parseKnowledgeItemCaptureInput({
      ...validItem,
      sourceIds: ['knowledgeSource.does-not-exist'],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.sourceIds).toEqual(['knowledgeSource.does-not-exist'])
  })

  it('refuses a malformed relationship ID', () => {
    expect(
      codeFor(
        parseKnowledgeItemCaptureInput({ ...validItem, researchRunId: 'drafts.researchRun.x' }),
        'researchRunId',
      ),
    ).toBe('invalid_reference')
  })

  it('refuses unrecognised editorial values', () => {
    const result = parseKnowledgeItemCaptureInput({
      ...validItem,
      intendedUse: 'whatever',
      sensitivity: 'secret',
      confidence: 0.9,
    })
    expect(codeFor(result, 'intendedUse')).toBe('invalid_value')
    expect(codeFor(result, 'sensitivity')).toBe('invalid_value')
    expect(codeFor(result, 'confidence')).toBe('invalid_value')
  })
})

describe('parseResearchRunCreateInput', () => {
  const validRun = { query: 'AI Act transparency deadlines', mode: 'fast', provider: 'exa' }

  it('accepts a queued run and defaults its status', () => {
    const result = parseResearchRunCreateInput(validRun)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('queued')
  })

  it('accepts a run created as already running', () => {
    const result = parseResearchRunCreateInput({ ...validRun, status: 'running' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('running')
  })

  it('refuses a run created as completed', () => {
    // Creating a run in a terminal state records a result nothing observed.
    for (const status of ['completed', 'failed', 'cancelled']) {
      expect(codeFor(parseResearchRunCreateInput({ ...validRun, status }), 'status')).toBe(
        'invalid_value',
      )
    }
  })

  it('requires the query, mode and provider', () => {
    const result = parseResearchRunCreateInput({})
    expect(codeFor(result, 'query')).toBe('required')
    expect(codeFor(result, 'mode')).toBe('required')
    expect(codeFor(result, 'provider')).toBe('required')
  })

  it('refuses an unrecognised mode or provider', () => {
    const result = parseResearchRunCreateInput({ ...validRun, mode: 'medium', provider: 'bing' })
    expect(codeFor(result, 'mode')).toBe('invalid_value')
    expect(codeFor(result, 'provider')).toBe('invalid_value')
  })

  it('refuses a requestedAt that is not a timestamp', () => {
    expect(
      codeFor(parseResearchRunCreateInput({ ...validRun, requestedAt: 'last tuesday' }), 'requestedAt'),
    ).toBe('invalid_value')
    expect(parseResearchRunCreateInput({ ...validRun, requestedAt: '2026-08-18T10:00:00Z' }).ok).toBe(
      true,
    )
  })

  it('refuses an over-long query', () => {
    expect(
      codeFor(
        parseResearchRunCreateInput({ ...validRun, query: 'a'.repeat(KNOWLEDGE_LIMITS.query + 1) }),
        'query',
      ),
    ).toBe('too_long')
  })
})
