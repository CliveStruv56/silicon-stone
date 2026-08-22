import { describe, expect, it } from 'vitest'

import {
  canonicalIndexHash,
  embeddableText,
  indexEligibility,
  snippetText,
  INDEXABLE_TYPES,
  type IndexCandidate,
} from './eligibility'

const item = (overrides: Partial<IndexCandidate> = {}): IndexCandidate => ({
  _id: 'knowledgeItem.a',
  _type: 'knowledgeItem',
  reviewStatus: 'ready',
  sensitivity: 'normal',
  title: 'Selective sovereignty',
  summary: 'A summary.',
  body: 'The item in full.',
  ...overrides,
})

const source = (overrides: Partial<IndexCandidate> = {}): IndexCandidate => ({
  _id: 'knowledgeSource.a',
  _type: 'knowledgeSource',
  reviewStatus: 'ready',
  title: 'UK and Australia pact',
  publisher: 'GOV.UK',
  extractedText: 'The UK and Australia will deepen cooperation.',
  ...overrides,
})

describe('indexEligibility', () => {
  it('admits a reviewed item and a reviewed source', () => {
    expect(indexEligibility(item()).eligible).toBe(true)
    expect(indexEligibility(source()).eligible).toBe(true)
  })

  it('gives a reason either way', () => {
    // A record that is not in the corpus must be explicable without reading the
    // implementation. "Not indexed" looks identical whether policy excluded it,
    // the text was empty, or the indexer never ran.
    for (const doc of [item(), item({ reviewStatus: 'inbox' })]) {
      expect(indexEligibility(doc).reason.length).toBeGreaterThan(0)
    }
  })

  it('refuses anything not reviewed', () => {
    for (const status of ['inbox', 'rejected', 'superseded', null]) {
      const verdict = indexEligibility(item({ reviewStatus: status }))
      expect(verdict.eligible, `reviewStatus=${status}`).toBe(false)
      expect(verdict.reason).toMatch(/not ready/)
    }
  })

  it('reads a pre-foundation source through its legacy status', () => {
    // One of the two currently-eligible records in production is eligible only
    // this way: reviewStatus null, legacy status `processed`.
    const legacy = source({ reviewStatus: null, status: 'processed' })
    expect(indexEligibility(legacy).eligible).toBe(true)
    expect(indexEligibility(source({ reviewStatus: null, status: 'pending' })).eligible).toBe(false)
    expect(indexEligibility(source({ reviewStatus: null, status: null })).eligible).toBe(false)
  })

  it('refuses anything but normal sensitivity', () => {
    // Wave 3 decision 6: fail closed. Widening later is a policy change;
    // un-publishing a quote is not.
    for (const sensitivity of ['private', 'confidential']) {
      const verdict = indexEligibility(item({ sensitivity }))
      expect(verdict.eligible, sensitivity).toBe(false)
      expect(verdict.reason).toMatch(/Only normal records/)
    }
  })

  it('treats absent sensitivity as normal, because the schema declares that default', () => {
    // A source has no sensitivity field at all, so no policy was ever expressed
    // for one; an item's schema carries initialValue: 'normal'. Failing closed
    // on absence would exclude every record captured before the field existed
    // and give no reviewer a way to tell why.
    expect(indexEligibility(item({ sensitivity: undefined })).eligible).toBe(true)
    expect(indexEligibility(source({ sensitivity: undefined })).eligible).toBe(true)
  })

  it('waits for extraction to settle', () => {
    for (const status of ['queued', 'processing', 'failed']) {
      const verdict = indexEligibility(source({ extractionState: { status } }))
      expect(verdict.eligible, status).toBe(false)
      expect(verdict.reason).toMatch(/not settled/)
    }
    for (const status of ['not_required', 'succeeded']) {
      expect(indexEligibility(source({ extractionState: { status } })).eligible, status).toBe(true)
    }
  })

  it('refuses a record with nothing to embed', () => {
    const empty = item({ title: '   ', summary: null, body: '' })
    expect(indexEligibility(empty).eligible).toBe(false)
    expect(indexEligibility(empty).reason).toMatch(/no text/)
  })

  it('refuses a type that has its own lane', () => {
    // Articles are indexed by /api/vectorize into their own index; research
    // runs are deferred (decision 3).
    for (const type of ['article', 'researchRun', 'knowledgeCandidate', undefined]) {
      expect(indexEligibility(item({ _type: type })).eligible, String(type)).toBe(false)
    }
    expect([...INDEXABLE_TYPES]).toEqual(['knowledgeItem', 'knowledgeSource'])
  })

  it('does not judge size — that is the indexer’s error, not a policy verdict', () => {
    // Eligible-and-unindexable is the `error` state; ineligible is
    // `not_eligible`. Policy and mechanism are different failures.
    const huge = source({ extractedText: 'x'.repeat(5_000_000) })
    expect(indexEligibility(huge).eligible).toBe(true)
  })
})

describe('snippetText', () => {
  // Found by reading what the lane actually put in front of the model, not by a
  // test. The snippet was built from the composed embeddable text, so every
  // block entry opened by repeating the title the block had just printed, and
  // the record's newlines broke the one-line-per-record shape.
  it('leaves out the title and publisher the block already prints', () => {
    expect(snippetText(item())).toBe('The item in full.')
    expect(snippetText(source())).toBe('The UK and Australia will deepen cooperation.')
  })

  it('collapses whitespace to one line', () => {
    expect(snippetText(item({ body: 'One.\n\nTwo.\n   Three.' }))).toBe('One. Two. Three.')
  })

  it('is empty rather than undefined when there is no prose', () => {
    expect(snippetText(item({ body: null }))).toBe('')
  })

  it('is not what gets embedded', () => {
    // The vector still gets title and publisher — they are signal. Only the
    // human-facing snippet drops them.
    expect(embeddableText(source())).toContain('GOV.UK')
    expect(snippetText(source())).not.toContain('GOV.UK')
  })
})

describe('embeddableText and its hash', () => {
  it('composes each type from its own fields', () => {
    expect(embeddableText(item())).toBe('Selective sovereignty\n\nA summary.\n\nThe item in full.')
    expect(embeddableText(source())).toBe(
      'UK and Australia pact\n\nGOV.UK\n\nThe UK and Australia will deepen cooperation.',
    )
  })

  it('skips absent parts without leaving a gap', () => {
    expect(embeddableText(item({ summary: null }))).toBe(
      'Selective sovereignty\n\nThe item in full.',
    )
  })

  it('hashes what would be embedded, so a body edit is a change', () => {
    const before = canonicalIndexHash(item())
    expect(canonicalIndexHash(item())).toBe(before)
    expect(canonicalIndexHash(item({ body: 'Something else.' }))).not.toBe(before)
  })

  it('is stable under whitespace that changes nothing', () => {
    // The hash decides what "stale" means. Reformatting must not make every
    // record look stale exactly once for no editorial reason.
    expect(canonicalIndexHash(item({ body: 'The  item   in full.' }))).toBe(
      canonicalIndexHash(item({ body: 'The item in full.' })),
    )
  })

  it('is not the capture content hash', () => {
    // They answer different questions — dedupe versus staleness — and a record
    // can legitimately change one without the other.
    const hash = canonicalIndexHash(item())
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(hash).not.toBe(canonicalIndexHash(source()))
  })
})
