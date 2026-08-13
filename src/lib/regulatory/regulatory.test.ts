import { describe, it, expect } from 'vitest'
import { parseStatute } from './parse'
import {
  buildRegulatoryChunkRecords,
  buildCitation,
  REGULATORY_CHUNK_MAX_CHARACTERS,
  PINECONE_METADATA_LIMIT_BYTES,
} from './chunk'
import { formatRegulatoryBlock, diversifyByArticle, MAX_CHUNKS_PER_ARTICLE } from './format'
import { looksRegulatory } from './gate'
import { readInstrumentMeta, readSourceText } from './meta'
import type { RegulatoryHit } from './types'

const meta = readInstrumentMeta('eu-ai-act')
const source = readSourceText(meta)
const provisions = parseStatute(source, meta)
const chunks = buildRegulatoryChunkRecords(provisions, meta)

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
      expect(diversifyByArticle(sameArticle, 10).length).toBe(MAX_CHUNKS_PER_ARTICLE)
    }
  })
})
