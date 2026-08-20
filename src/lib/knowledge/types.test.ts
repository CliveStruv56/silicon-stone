import { describe, expect, it } from 'vitest'

import {
  KNOWLEDGE_ITEM_KINDS,
  KNOWLEDGE_REVIEW_STATUSES,
  KNOWLEDGE_SOURCE_KINDS,
  LEGACY_SOURCE_STATUSES,
  LEGACY_SOURCE_STATUS_REVIEW_MAP,
  effectiveSourceReviewStatus,
  isKnowledgeItemKind,
  isKnowledgeReviewStatus,
  isPostFoundationSource,
  optionList,
  type KnowledgeItemKind,
  type KnowledgeReviewStatus,
} from './types'

describe('controlled values', () => {
  it('rejects a value outside the union at compile time', () => {
    // @ts-expect-error 'approved' is not a review status — if this line ever
    // stops erroring, the union has been widened to a bare string.
    const bad: KnowledgeReviewStatus = 'approved'
    // @ts-expect-error 'summary' is not an item kind.
    const alsoBad: KnowledgeItemKind = 'summary'
    expect([bad, alsoBad]).toHaveLength(2)
  })

  it('agrees with its runtime guard', () => {
    for (const status of KNOWLEDGE_REVIEW_STATUSES) {
      expect(isKnowledgeReviewStatus(status)).toBe(true)
    }
    for (const kind of KNOWLEDGE_ITEM_KINDS) {
      expect(isKnowledgeItemKind(kind)).toBe(true)
    }
    for (const value of ['approved', '', 'INBOX', null, undefined, 3, {}]) {
      expect(isKnowledgeReviewStatus(value)).toBe(false)
    }
  })

  it('keeps the legacy sourceType values spelled exactly as they are stored', () => {
    // Existing knowledgeSource documents carry these five. Renaming one would
    // invalidate every record written before this wave.
    expect(KNOWLEDGE_SOURCE_KINDS.slice(0, 5)).toEqual([
      'url',
      'pdf',
      'image',
      'note',
      'published_article',
    ])
  })

  it('enters at inbox and nowhere else', () => {
    expect(KNOWLEDGE_REVIEW_STATUSES[0]).toBe('inbox')
  })
})

describe('legacy source status', () => {
  it('maps every legacy value', () => {
    for (const status of LEGACY_SOURCE_STATUSES) {
      expect(LEGACY_SOURCE_STATUS_REVIEW_MAP[status]).toBeDefined()
    }
  })

  it('does not turn a capture failure into an editorial verdict', () => {
    // Legacy `error` meant the capture or extraction broke. Reading it as
    // `rejected` would discard records nobody has judged.
    expect(LEGACY_SOURCE_STATUS_REVIEW_MAP.error).toBe('requires_review')
    expect(effectiveSourceReviewStatus({ status: 'error' })).toBe('requires_review')
  })

  it('prefers the new field when a document carries both', () => {
    expect(
      effectiveSourceReviewStatus({ reviewStatus: 'rejected', status: 'processed' }),
    ).toBe('rejected')
  })

  it('reads a pre-migration document through the legacy field', () => {
    expect(effectiveSourceReviewStatus({ status: 'pending' })).toBe('inbox')
    expect(effectiveSourceReviewStatus({ status: 'processed' })).toBe('ready')
  })

  it('says unknown rather than guessing', () => {
    expect(effectiveSourceReviewStatus({})).toBe('unknown')
    expect(effectiveSourceReviewStatus({ status: 'nonsense' })).toBe('unknown')
  })
})

describe('optionList', () => {
  it('derives a Sanity option list from the value array', () => {
    expect(optionList(['not_required', 'queued'] as const)).toEqual([
      { value: 'not_required', title: 'Not required' },
      { value: 'queued', title: 'Queued' },
    ])
  })

  it('takes an override for the titles prose would get wrong', () => {
    expect(optionList(['url', 'pdf'] as const, { url: 'URL', pdf: 'PDF' })).toEqual([
      { value: 'url', title: 'URL' },
      { value: 'pdf', title: 'PDF' },
    ])
  })
})

describe('isPostFoundationSource', () => {
  it('reads a legacy source — no reviewStatus, no provenance — as pre-foundation', () => {
    // The shape of the one real legacy record in the dataset.
    expect(
      isPostFoundationSource({
        sourceId: 'mittr-2026-05-14-ai-sovereignty',
        status: 'processed',
        manifestId: 'mittr-2026-05-14-ai-sovereignty',
      } as Parameters<typeof isPostFoundationSource>[0]),
    ).toBe(false)
  })

  it('reads a captured record as post-foundation, from provenance alone', () => {
    expect(isPostFoundationSource({ provenance: { sourceSystem: 'api' } })).toBe(true)
  })

  it('reads a Studio-created record as post-foundation, from reviewStatus alone', () => {
    // `reviewStatus` has initialValue 'inbox', so a hand-created source has it
    // before anyone types anything. That is what keeps the Studio path from
    // being treated as legacy.
    expect(isPostFoundationSource({ reviewStatus: 'inbox' })).toBe(true)
  })

  it('is not fooled by an empty string or a missing document', () => {
    expect(isPostFoundationSource({ reviewStatus: '' })).toBe(false)
    expect(isPostFoundationSource({ provenance: { sourceSystem: '' } })).toBe(false)
    expect(isPostFoundationSource({ provenance: null })).toBe(false)
    expect(isPostFoundationSource({})).toBe(false)
    expect(isPostFoundationSource(null)).toBe(false)
    expect(isPostFoundationSource(undefined)).toBe(false)
  })

  it('does not treat a non-string reviewStatus as a marker', () => {
    expect(
      isPostFoundationSource({ reviewStatus: 1 } as Parameters<typeof isPostFoundationSource>[0]),
    ).toBe(false)
  })
})
