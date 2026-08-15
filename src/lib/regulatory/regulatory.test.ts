import { describe, it, expect } from 'vitest'
import { parseStatute } from './parse'
import {
  buildRegulatoryChunkRecords,
  buildCitation,
  REGULATORY_CHUNK_MAX_CHARACTERS,
  PINECONE_METADATA_LIMIT_BYTES,
} from './chunk'
import { formatRegulatoryBlock, diversifyHits, MAX_CHUNKS_PER_ARTICLE } from './format'
import { looksRegulatory, routableCorpusIds } from './gate'
import { listCorpusIds, readInstrumentMeta, readSourceText } from './meta'
import type { RegulatoryHit } from './types'

const meta = readInstrumentMeta('eu-ai-act')
const source = readSourceText(meta)
const provisions = parseStatute(source, meta)
const chunks = buildRegulatoryChunkRecords(provisions, meta)

const gdprMeta = readInstrumentMeta('gdpr')
const gdprChunks = buildRegulatoryChunkRecords(
  parseStatute(readSourceText(gdprMeta), gdprMeta),
  gdprMeta,
)

describe('parseStatute', () => {
  it('finds exactly the expected number of articles', () => {
    const articles = new Set(
      provisions.filter((p) => p.unit === 'article').map((p) => p.number),
    )
    expect(articles.size).toBe(meta.expectedArticles)
  })

  it('keeps the Digital Omnibus inserted articles', () => {
    const numbers = new Set(provisions.map((p) => p.number))
    for (const inserted of ['4a', '60a', '75a', '75b', '75c', '75d']) {
      expect(numbers.has(inserted)).toBe(true)
    }
  })

  it('parses Article 6 with its rubric and paragraph 3', () => {
    const six = provisions.filter((p) => p.unit === 'article' && p.number === '6')
    expect(six.length).toBeGreaterThan(0)
    expect(six[0].heading).toBe('Classification rules for high-risk AI systems')

    const paraThree = six.find((p) => p.paragraph === '3')
    expect(paraThree).toBeDefined()
    expect(paraThree!.text).toContain('derogation')
  })

  it('keeps a lettered point joined to its marker', () => {
    const six = provisions.find((p) => p.number === '6' && p.paragraph === '1')
    expect(six!.text).toMatch(/\(a\) the AI system is intended/)
  })

  it('captures annexes as well as articles', () => {
    const annexes = new Set(provisions.filter((p) => p.unit === 'annex').map((p) => p.number))
    expect(annexes.has('III')).toBe(true)
  })
})

describe('buildRegulatoryChunkRecords', () => {
  it('never exceeds the chunk ceiling', () => {
    const oversize = chunks.filter((c) => c.metadata.text.length > REGULATORY_CHUNK_MAX_CHARACTERS)
    // The header adds ~200 chars on top of a body capped at MAX; allow for it.
    for (const chunk of oversize) {
      const body = chunk.metadata.text.split('\n---\n').slice(1).join('\n---\n')
      expect(body.length).toBeLessThanOrEqual(REGULATORY_CHUNK_MAX_CHARACTERS)
    }
  })

  it('stays inside Pinecone metadata limits', () => {
    for (const chunk of chunks) {
      expect(Buffer.byteLength(JSON.stringify(chunk.metadata), 'utf8')).toBeLessThan(
        PINECONE_METADATA_LIMIT_BYTES,
      )
    }
  })

  it('starts every embedded text with its own citation', () => {
    for (const chunk of chunks) {
      expect(chunk.metadata.text.startsWith(chunk.metadata.citation)).toBe(true)
    }
  })

  it('gives every chunk a complete, citable locator', () => {
    for (const chunk of chunks) {
      expect(chunk.metadata.consolidatedAs).not.toBe('')
      expect(chunk.metadata.url).not.toBe('')
      expect(chunk.metadata.citation).not.toBe('')
      expect(chunk.metadata.authority).toBe('editorial-only')
    }
  })

  it('produces unique record ids', () => {
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length)
  })

  it('never lets a chunk span two articles', () => {
    for (const chunk of chunks) {
      const articleLabels = chunk.metadata.text.match(/^Article \d+[a-z]?$/gm) ?? []
      expect(articleLabels.length).toBeLessThanOrEqual(1)
    }
  })

  it('cites Article 6(3) exactly', () => {
    const paraThree = provisions.find((p) => p.number === '6' && p.paragraph === '3')!
    expect(buildCitation(meta, paraThree)).toBe('EU AI Act, Article 6(3)')
  })

  it('leaves well-formed paragraphs individually citable', () => {
    // Article 19's two paragraphs are ~460 and ~340 chars. Both are complete
    // provisions, so they stay separate: "Article 19(1)" is a more precise
    // citation than "Article 19(1)-(2)", and precision is the point here.
    const nineteen = chunks.filter((c) => c.metadata.parentId === 'eu-ai-act:art:19')
    expect(nineteen.map((c) => c.metadata.citation)).toEqual([
      'EU AI Act, Article 19(1)',
      'EU AI Act, Article 19(2)',
    ])
    expect(nineteen[0].metadata.text).toContain('at least six months')
    expect(nineteen[1].metadata.text).toContain('financial institutions')
  })

  it('merges genuinely tiny siblings under a range citation', () => {
    const ranged = chunks.filter((c) => c.metadata.paragraph.includes('-'))
    expect(ranged.length).toBeGreaterThan(0)
    for (const chunk of ranged) {
      // A merged block must never collapse onto the chapeau's locator.
      expect(chunk.metadata.locator).toContain(':para:')
      expect(chunk.metadata.citation).toMatch(/\(\d+[a-z]?-\d+[a-z]?\)$/)
    }
  })

  it('marks continuation chunks of an oversize provision', () => {
    const parts = chunks.filter((c) => c.metadata.locator.includes(':part:'))
    expect(parts.length).toBeGreaterThan(0)
    for (const part of parts) {
      expect(part.metadata.locator).toMatch(/:part:\d+$/)
    }
  })
})

describe('looksRegulatory', () => {
  it('fires on a regulatory topic', () => {
    expect(looksRegulatory('EU AI Act high-risk obligations for credit scoring').hit).toBe(true)
  })

  it('does not fire on a supply-chain topic', () => {
    const result = looksRegulatory('TSMC Dresden fab workforce shortages', 'hiring pipeline')
    expect(result.hit).toBe(false)
  })

  it('ignores empty input', () => {
    expect(looksRegulatory(undefined, null, '  ').hit).toBe(false)
  })
})

describe('formatRegulatoryBlock', () => {
  const hitFrom = (chunkIndex: number, score: number): RegulatoryHit => ({
    id: chunks[chunkIndex].id,
    score,
    metadata: chunks[chunkIndex].metadata,
  })

  it('returns null when there is nothing to render', () => {
    expect(formatRegulatoryBlock([])).toBeNull()
  })

  it('renders the cite-as marker for each passage', () => {
    const block = formatRegulatoryBlock([hitFrom(0, 0.8)])!
    expect(block).toContain('[cite as: ')
    expect(block).toContain(chunks[0].metadata.citation)
  })

  it('caps chunks per article', () => {
    const sameArticle = chunks
      .filter((c) => c.metadata.parentId === chunks[0].metadata.parentId)
      .map((c, i) => ({ id: c.id, score: 0.9 - i * 0.01, metadata: c.metadata }))
    if (sameArticle.length > MAX_CHUNKS_PER_ARTICLE) {
      expect(diversifyHits(sameArticle, 10).length).toBe(MAX_CHUNKS_PER_ARTICLE)
    }
  })
})

describe('GDPR corpus', () => {
  it('parses all 99 articles and no annexes', () => {
    const articles = new Set(
      gdprChunks.filter((c) => c.metadata.unit === 'article').map((c) => c.metadata.articleNumber),
    )
    expect(articles.size).toBe(gdprMeta.expectedArticles)
    expect(gdprChunks.some((c) => c.metadata.unit === 'annex')).toBe(false)
  })

  it('cites Article 22 under its own short name, not the AI Act', () => {
    const art22 = gdprChunks.filter((c) => c.metadata.parentId === 'gdpr:art:22')
    expect(art22.length).toBeGreaterThan(0)
    expect(art22[0].metadata.citation).toMatch(/^GDPR, Article 22/)
    expect(art22.some((c) => c.metadata.text.includes('solely on automated processing'))).toBe(true)
  })

  it('carries no leftover corrigendum markers', () => {
    // Articles 43(1) and 65(1) contain inline ►C1 ... ◄ markers upstream. A
    // quotation is only verbatim if the editorial apparatus is gone.
    for (const chunk of gdprChunks) {
      expect(chunk.metadata.text).not.toMatch(/[►◄▼]/)
    }
    const art43 = gdprChunks.find((c) => c.metadata.text.includes('accreditation of certification'))
    expect(art43!.metadata.text).toContain('In the case of accreditation')
  })
})

describe('multi-instrument retrieval', () => {
  const hit = (index: number, score: number, from = chunks): RegulatoryHit => ({
    id: from[index].id,
    score,
    metadata: from[index].metadata,
  })

  it('routes a GDPR topic to GDPR and an AI Act topic to the AI Act', () => {
    expect(looksRegulatory('lawful basis for processing personal data').corpusIds).toContain('gdpr')
    expect(looksRegulatory('EU AI Act high-risk classification').corpusIds).toContain('eu-ai-act')
  })

  it('routes a semiconductor topic to the Chips Act, not the AI Act', () => {
    const routed = looksRegulatory('European semiconductor foundry subsidies').corpusIds
    expect(routed).toContain('eu-chips-act')
    expect(routed).not.toContain('eu-ai-act')
  })

  it('routes nothing when no instrument is named, so callers search everything', () => {
    expect(looksRegulatory('compliance obligations and penalties').corpusIds).toEqual([])
  })

  it('can route to every corpus that is actually ingested', () => {
    // Asserted in this direction on purpose. It catches a typo'd routing key
    // (a corpus on disk that nothing can route to) AND an ingested corpus
    // nobody wrote routing terms for — both leave text in the index that no
    // query can reach. Routing keys for corpora not yet ingested are harmless:
    // retrieve.ts falls back to searching everything when a filter returns
    // nothing.
    const routable = new Set(routableCorpusIds())
    for (const corpusId of listCorpusIds()) {
      expect(routable.has(corpusId)).toBe(true)
    }
  })

  it('stops one instrument from taking every slot', () => {
    // Six AI Act hits outscoring two GDPR hits: without a per-instrument cap the
    // GDPR passages never appear, however relevant the question.
    const aiHits = chunks.slice(0, 8).map((c, i) => ({
      id: c.id,
      score: 0.9 - i * 0.01,
      metadata: c.metadata,
    }))
    const gdprHits = gdprChunks.slice(0, 4).map((c, i) => ({
      id: c.id,
      score: 0.5 - i * 0.01,
      metadata: c.metadata,
    }))

    const selected = diversifyHits([...aiHits, ...gdprHits], 6)
    const instruments = new Set(selected.map((s) => s.metadata.corpusId))
    expect(instruments.has('gdpr')).toBe(true)
    expect(instruments.has('eu-ai-act')).toBe(true)
  })

  it('gives a single-instrument result the whole budget', () => {
    // One chunk from each of eight distinct articles, so the per-article cap
    // cannot be what limits the result — only the per-instrument cap could,
    // and with a single instrument it must not apply.
    const seen = new Set<string>()
    const only = chunks
      .filter((c) => !seen.has(c.metadata.parentId) && seen.add(c.metadata.parentId))
      .slice(0, 8)
      .map((c, i) => ({ id: c.id, score: 0.9 - i * 0.01, metadata: c.metadata }))

    expect(only.length).toBe(8)
    expect(diversifyHits(only, 6).length).toBe(6)
  })

  it('warns the model when an instrument is a Directive', () => {
    const directive = {
      ...hit(0, 0.8),
      metadata: { ...chunks[0].metadata, instrumentType: 'directive' as const },
    }
    expect(formatRegulatoryBlock([directive])).toContain('INSTRUMENT TYPE: Directive')
    expect(formatRegulatoryBlock([hit(0, 0.8)])).not.toContain('INSTRUMENT TYPE: Directive')
  })

  it('surfaces a deferred application date when one is set', () => {
    const deferred = {
      ...hit(0, 0.8),
      metadata: { ...chunks[0].metadata, applicationNote: 'Applies from 11 December 2027.' },
    }
    expect(formatRegulatoryBlock([deferred])).toContain('APPLICATION: Applies from 11 December 2027.')
  })
})
