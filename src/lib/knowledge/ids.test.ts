import { describe, expect, it } from 'vitest'

import {
  canonicalDocumentId,
  derivedIdempotencyKey,
  deterministicDocumentId,
  externalReferenceKey,
  keyedReference,
  keyedReferences,
  knowledgeReviewUrl,
  parseCanonicalDocumentId,
  publishedId,
  reference,
  sanitiseIdFragment,
} from './ids'

const SANITY_ID_SAFE = /^[A-Za-z0-9._-]+$/

describe('canonicalDocumentId', () => {
  it('keeps the <type>.<uuid> shape the existing route already writes', () => {
    const id = canonicalDocumentId('knowledgeItem')
    expect(id.startsWith('knowledgeItem.')).toBe(true)
    expect(id).toMatch(SANITY_ID_SAFE)
  })

  it('is unique per call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => canonicalDocumentId('knowledgeItem')))
    expect(ids.size).toBe(50)
  })
})

describe('deterministicDocumentId', () => {
  it('gives the same seed the same ID every time', () => {
    // This is what makes the candidate migration rerunnable: a second run
    // proposes identical IDs, so it updates rather than duplicates.
    expect(deterministicDocumentId('knowledgeItem', 'candidate-2026-01-01-abcd1234')).toBe(
      deterministicDocumentId('knowledgeItem', 'candidate-2026-01-01-abcd1234'),
    )
  })

  it('gives different seeds different IDs', () => {
    expect(deterministicDocumentId('knowledgeItem', 'a')).not.toBe(
      deterministicDocumentId('knowledgeItem', 'b'),
    )
    expect(deterministicDocumentId('knowledgeItem', 'a')).not.toBe(
      deterministicDocumentId('knowledgeSource', 'a'),
    )
  })

  it('produces an ID Sanity will accept, whatever the seed contained', () => {
    const id = deterministicDocumentId('knowledgeItem', 'a seed with spaces/slashes & ünïcode')
    expect(id).toMatch(SANITY_ID_SAFE)
    expect(id).toMatch(/^knowledgeItem\.[a-f0-9]{32}$/)
  })
})

describe('parseCanonicalDocumentId', () => {
  it('splits a canonical ID', () => {
    expect(parseCanonicalDocumentId('knowledgeSource.abc-123')).toEqual({
      type: 'knowledgeSource',
      localId: 'abc-123',
      isDraft: false,
    })
  })

  it('sees through the drafts. prefix', () => {
    expect(parseCanonicalDocumentId('drafts.knowledgeSource.abc')).toEqual({
      type: 'knowledgeSource',
      localId: 'abc',
      isDraft: true,
    })
  })

  it('returns null for anything that is not one', () => {
    for (const id of ['', 'nodot', '.leading', 'trailing.', null, undefined, 7]) {
      expect(parseCanonicalDocumentId(id)).toBeNull()
    }
  })
})

describe('publishedId', () => {
  it('strips only the drafts prefix', () => {
    expect(publishedId('drafts.knowledgeItem.x')).toBe('knowledgeItem.x')
    expect(publishedId('knowledgeItem.x')).toBe('knowledgeItem.x')
    expect(publishedId('knowledgeItem.drafts.x')).toBe('knowledgeItem.drafts.x')
  })
})

describe('externalReferenceKey', () => {
  it('scopes the external ID to its system', () => {
    expect(externalReferenceKey('chatgpt', ' conv-1 ')).toBe('chatgpt:conv-1')
    // Two adapters can easily both call something "1".
    expect(externalReferenceKey('chatgpt', '1')).not.toBe(externalReferenceKey('claude', '1'))
  })

  it('returns null when there is no external ID', () => {
    expect(externalReferenceKey('chatgpt', '')).toBeNull()
    expect(externalReferenceKey('chatgpt', '   ')).toBeNull()
    expect(externalReferenceKey('chatgpt', undefined)).toBeNull()
  })
})

describe('derivedIdempotencyKey', () => {
  it('is stable across differences normalisation removes', () => {
    const a = derivedIdempotencyKey({
      documentType: 'knowledgeItem',
      sourceSystem: 'chatgpt',
      externalId: 'conv-1',
      url: 'https://example.com/a?utm_source=x#frag',
      content: 'Hello  world\r\n',
    })
    const b = derivedIdempotencyKey({
      documentType: 'knowledgeItem',
      sourceSystem: 'chatgpt',
      externalId: 'conv-1',
      url: 'https://example.com/a',
      content: 'Hello world',
    })
    expect(a).toBe(b)
  })

  it('changes when any component genuinely changes', () => {
    const base = {
      documentType: 'knowledgeItem',
      sourceSystem: 'chatgpt' as const,
      externalId: 'conv-1',
      url: 'https://example.com/a',
      content: 'body',
    }
    expect(derivedIdempotencyKey({ ...base, documentType: 'knowledgeSource' })).not.toBe(
      derivedIdempotencyKey(base),
    )
    expect(derivedIdempotencyKey({ ...base, sourceSystem: 'claude' })).not.toBe(
      derivedIdempotencyKey(base),
    )
    expect(derivedIdempotencyKey({ ...base, externalId: 'conv-2' })).not.toBe(
      derivedIdempotencyKey(base),
    )
    expect(derivedIdempotencyKey({ ...base, url: 'https://example.com/b' })).not.toBe(
      derivedIdempotencyKey(base),
    )
    expect(derivedIdempotencyKey({ ...base, content: 'other' })).not.toBe(
      derivedIdempotencyKey(base),
    )
  })

  it('copes with everything missing', () => {
    expect(derivedIdempotencyKey({ documentType: 'knowledgeItem' })).toMatch(
      /^sha256:[a-f0-9]{64}$/,
    )
  })
})

describe('references', () => {
  it('builds a plain reference and resolves drafts to the published ID', () => {
    expect(reference('drafts.knowledgeItem.x')).toEqual({
      _type: 'reference',
      _ref: 'knowledgeItem.x',
    })
  })

  it('derives _key from the target so a rewrite is byte-identical', () => {
    // Random keys make every rerun of a migration look like a change.
    expect(keyedReference('knowledgeItem.x')).toEqual(keyedReference('knowledgeItem.x'))
    expect(keyedReference('knowledgeItem.x')._key).not.toBe(
      keyedReference('knowledgeItem.y')._key,
    )
  })

  it('de-duplicates an array and keeps its order', () => {
    const refs = keyedReferences([
      'knowledgeSource.b',
      'knowledgeSource.a',
      'drafts.knowledgeSource.b',
      '',
    ])
    expect(refs.map((r) => r._ref)).toEqual(['knowledgeSource.b', 'knowledgeSource.a'])
    expect(new Set(refs.map((r) => r._key)).size).toBe(2)
  })

  it('produces the same array twice for the same input', () => {
    const ids = ['knowledgeSource.a', 'knowledgeSource.b']
    expect(keyedReferences(ids)).toEqual(keyedReferences(ids))
  })
})

describe('sanitiseIdFragment', () => {
  it('reduces anything to characters Sanity accepts in an ID', () => {
    expect(sanitiseIdFragment('a b/c?d')).toBe('a-b-c-d')
    expect(sanitiseIdFragment('--lead--and--trail--')).toBe('lead-and-trail')
    expect(sanitiseIdFragment('already-fine')).toBe('already-fine')
    expect(sanitiseIdFragment('a b/c?d')).toMatch(SANITY_ID_SAFE)
  })
})

describe('knowledgeReviewUrl', () => {
  it('opens the record itself in Studio', () => {
    expect(knowledgeReviewUrl('knowledgeItem.x')).toBe(
      '/studio/intent/edit/id=knowledgeItem.x;type=knowledgeItem',
    )
    expect(knowledgeReviewUrl('knowledgeSource.abc')).toBe(
      '/studio/intent/edit/id=knowledgeSource.abc;type=knowledgeSource',
    )
    expect(knowledgeReviewUrl('researchRun.7')).toBe(
      '/studio/intent/edit/id=researchRun.7;type=researchRun',
    )
  })

  it('resolves a draft to its published twin', () => {
    // Studio opens the draft automatically when one exists; linking to the
    // drafts.* id directly would not resolve.
    expect(knowledgeReviewUrl('drafts.knowledgeItem.x')).toBe(
      '/studio/intent/edit/id=knowledgeItem.x;type=knowledgeItem',
    )
  })

  it('accepts an explicit type', () => {
    expect(knowledgeReviewUrl('legacy-handle', 'knowledgeSource')).toBe(
      '/studio/intent/edit/id=legacy-handle;type=knowledgeSource',
    )
  })

  it('falls back to the admin page for a legacy ID with no type in it', () => {
    // Pre-foundation records predate the `<type>.<uuid>` shape. An intent
    // without a type does not resolve, so send them somewhere admin-gated and
    // real rather than somewhere broken.
    expect(knowledgeReviewUrl('mittr-2026-05-14-ai-sovereignty')).toBe(
      '/knowledge?record=mittr-2026-05-14-ai-sovereignty',
    )
  })
})
