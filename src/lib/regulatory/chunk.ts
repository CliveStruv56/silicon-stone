/**
 * Turn parsed provisions into embeddable chunks.
 *
 * Deliberately NOT src/lib/evidence.ts's chunkEvidenceText. That chunker is
 * paragraph-greedy at 6,000 chars with no overlap and an ordinal locator
 * ("chunk:7"). On consolidated regulation it merges the tail of one Article
 * into the head of the next, splits a chapeau from the lettered points that
 * carry its substance, and produces chunks that cannot be cited. All three are
 * disqualifying here.
 *
 * The load-bearing decision: a citation header is prepended to the text that is
 * BOTH embedded AND stored. There is therefore no code path in which a quotation
 * reaches the drafting model separated from its locator. It also supplies the
 * lexical anchors the statutory body lacks — Article 6's text never contains the
 * words "AI Act", so a query naming the Act would otherwise match nothing in it.
 */

import * as crypto from 'node:crypto'
import type {
  InstrumentMeta,
  ParsedProvision,
  RegulatoryChunkMetadata,
  RegulatoryChunkRecord,
} from './types'

export const REGULATORY_CHUNK_TARGET_CHARACTERS = 1800
export const REGULATORY_CHUNK_MAX_CHARACTERS = 3000
export const REGULATORY_CHUNK_MIN_CHARACTERS = 400
export const REGULATORY_SENTENCE_OVERLAP_CHARS = 240

/**
 * Longest chapeau worth repeating onto every continuation of a split provision.
 * Above this it is content in its own right, and copying it into each part both
 * duplicates text in the index and starves the points of room.
 */
export const CHAPEAU_REPEAT_MAX_CHARACTERS = 1_000

/** Pinecone's per-record metadata ceiling. Chunk sizes are set well inside it. */
export const PINECONE_METADATA_LIMIT_BYTES = 40_000

/** "(a) …", "(i) …" — a lettered or roman point, marker joined to its text. */
const POINT_LINE = /^\((?:[a-z]{1,2}|[ivx]{1,5})\)\s/i

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

/** "EU AI Act, Article 6(3)" / "EU AI Act, Annex III". */
export function buildCitation(meta: InstrumentMeta, p: ParsedProvision): string {
  if (p.unit === 'annex') return `${meta.shortName}, Annex ${p.number}`
  const para = p.paragraph ? `(${p.paragraph})` : ''
  return `${meta.shortName}, Article ${p.number}${para}`
}

/**
 * The header prepended to every chunk's embedded text. Separated from the body
 * by a rule so the model can tell citation from statute.
 */
export function buildHeader(meta: InstrumentMeta, p: ParsedProvision, citation: string): string {
  const lines = [
    `${citation} — ${meta.instrument}`,
    `Consolidated text as at ${meta.consolidatedAs}. Source: ${meta.citationUrl}`,
  ]
  if (p.heading) lines.splice(1, 0, p.heading)
  return lines.join('\n')
}

/** Last complete sentence of a block, for carry-forward overlap. */
function trailingSentence(text: string): string {
  const trimmed = text.trimEnd()
  const boundary = Math.max(trimmed.lastIndexOf('. '), trimmed.lastIndexOf('; '))
  if (boundary < 0) return ''
  const sentence = trimmed.slice(boundary + 2).trim()
  return sentence.length <= REGULATORY_SENTENCE_OVERLAP_CHARS ? sentence : ''
}

/**
 * Split one oversize provision at point boundaries, never mid-sentence, and
 * carry the chapeau onto every continuation. In EU drafting the operative verb
 * lives in the chapeau ("shall be considered high-risk where both of the
 * following conditions are fulfilled:") and the substance in the points; split
 * them apart and both halves are useless.
 */
function splitOversize(text: string): string[] {
  const blocks = text.split('\n\n')
  const chapeauBlocks: string[] = []
  let i = 0
  while (i < blocks.length && !POINT_LINE.test(blocks[i])) {
    chapeauBlocks.push(blocks[i])
    i += 1
  }
  const chapeau = chapeauBlocks.join('\n\n')
  const points = blocks.slice(i)

  // No point structure to split on — fall back to sentence-boundary slicing.
  if (points.length === 0) return splitOnSentences(text)

  // Repeating the chapeau only pays when it is short enough to read as context
  // rather than content. Chips Act Annex I opens with 2.2KB of narrative before
  // its first point; repeating that onto every continuation stored the same
  // text sixteen times and left the points themselves fighting for room. When
  // the chapeau is long it becomes its own leading chunk instead.
  const repeated = chapeau.length <= CHAPEAU_REPEAT_MAX_CHARACTERS ? chapeau : ''
  const lead = repeated || !chapeau ? [] : splitOnSentences(chapeau)

  const parts: string[] = []
  let current: string[] = []
  const currentLength = (): number =>
    (repeated ? repeated.length + 2 : 0) + current.join('\n\n').length

  for (const point of points) {
    if (current.length > 0 && currentLength() + point.length + 2 > REGULATORY_CHUNK_MAX_CHARACTERS) {
      parts.push([repeated, ...current].filter(Boolean).join('\n\n'))
      const carry = trailingSentence(current[current.length - 1])
      current = carry ? [`(…continued) ${carry}`] : []
    }
    current.push(point)
  }
  if (current.length > 0) parts.push([repeated, ...current].filter(Boolean).join('\n\n'))

  // A single point can still exceed the cap on its own. Split the POINT, not the
  // whole part: running the splitter over "chapeau + point" makes its first
  // slice the chapeau alone, so every oversize point emits a byte-identical
  // chunk and the index fills with duplicates.
  return [
    ...lead,
    ...parts.flatMap((part) => {
      if (part.length <= REGULATORY_CHUNK_MAX_CHARACTERS) return part

      const prefixed = Boolean(repeated) && part.startsWith(repeated)
      const body = prefixed ? part.slice(repeated.length).trimStart() : part
      const room = REGULATORY_CHUNK_MAX_CHARACTERS - (prefixed ? repeated.length + 2 : 0)
      if (room < REGULATORY_CHUNK_MIN_CHARACTERS) return splitOnSentences(part)

      return splitOnSentences(body, room).map((piece) =>
        prefixed ? `${repeated}\n\n${piece}` : piece,
      )
    }),
  ]
}

/** Last-resort split for prose with no point structure. Never mid-sentence unless forced. */
function splitOnSentences(text: string, limit = REGULATORY_CHUNK_MAX_CHARACTERS): string[] {
  const parts: string[] = []
  let rest = text
  while (rest.length > limit) {
    const window = rest.slice(0, limit)
    let cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('; '))
    // Only accept the boundary if it is not pathologically early.
    if (cut < limit * 0.6) cut = window.lastIndexOf(' ')
    if (cut <= 0) cut = limit
    else cut += 1
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

/**
 * Widen a paragraph label to cover a merged range: (null, "1") -> "1",
 * ("1", "2") -> "1-2", ("1-2", "3") -> "1-3". Returning null here would let a
 * merged block share a locator with the article chapeau.
 */
function mergeParagraphLabels(previous: string | null, next: string | null): string | null {
  if (!previous && !next) return null
  if (!previous) return next
  if (!next) return previous
  const start = previous.split('-')[0]
  return start === next ? start : `${start}-${next}`
}

/**
 * Merge genuinely tiny adjacent provisions of the SAME article — cross-reference
 * stubs and one-line definitions that are useless retrieved alone. The threshold
 * is deliberately low: a well-formed 500-character paragraph is left as its own
 * chunk, because "EU AI Act, Article 19(1)" is a more precise citation than
 * "Article 19(1)-(2)", and citation precision is the point of this lane.
 * Never merges across an article boundary — asserted in the check script.
 */
function mergeShortSiblings(provisions: ParsedProvision[]): ParsedProvision[] {
  const merged: ParsedProvision[] = []

  for (const provision of provisions) {
    const previous = merged[merged.length - 1]
    const sameArticle =
      previous && previous.unit === provision.unit && previous.number === provision.number
    const bothShort =
      sameArticle &&
      previous.text.length < REGULATORY_CHUNK_MIN_CHARACTERS &&
      previous.text.length + provision.text.length < REGULATORY_CHUNK_TARGET_CHARACTERS

    if (bothShort) {
      // Keep the paragraph numbers visible inside the merged body, and widen the
      // label to the range the chunk now covers. The label MUST stay distinct:
      // collapsing it to null would make a merged block collide with the
      // article's own chapeau, which shares that locator.
      const previousLabel = previous.paragraph ? `${previous.paragraph}. ` : ''
      const provisionLabel = provision.paragraph ? `${provision.paragraph}. ` : ''
      merged[merged.length - 1] = {
        ...previous,
        paragraph: mergeParagraphLabels(previous.paragraph, provision.paragraph),
        text: `${previousLabel}${previous.text}\n\n${provisionLabel}${provision.text}`,
      }
      continue
    }

    merged.push(provision)
  }

  return merged
}

export function buildRegulatoryChunkRecords(
  provisions: ParsedProvision[],
  meta: InstrumentMeta,
): RegulatoryChunkRecord[] {
  const records: RegulatoryChunkRecord[] = []

  for (const provision of mergeShortSiblings(provisions)) {
    const citation = buildCitation(meta, provision)
    const header = buildHeader(meta, provision, citation)
    const prefix = `${provision.unit === 'annex' ? 'anx' : 'art'}:${provision.number}`
    const parentId = `${meta.corpusId}:${prefix}`
    const baseLocator = provision.paragraph ? `${prefix}:para:${provision.paragraph}` : prefix

    const bodies =
      provision.text.length > REGULATORY_CHUNK_MAX_CHARACTERS
        ? splitOversize(provision.text)
        : [provision.text]

    bodies.forEach((body, partIndex) => {
      const locator = bodies.length > 1 ? `${baseLocator}:part:${partIndex + 1}` : baseLocator
      const text = `${header}\n---\n${body}`

      const metadata: RegulatoryChunkMetadata = {
        corpusId: meta.corpusId,
        instrument: meta.instrument,
        shortName: meta.shortName,
        jurisdiction: meta.jurisdiction,
        instrumentType: meta.instrumentType,
        applicationNote: meta.applicationNote ?? '',
        celex: meta.celex,
        eli: meta.eli,
        unit: provision.unit,
        articleNumber: provision.number,
        paragraph: provision.paragraph ?? '',
        heading: provision.heading,
        citation,
        locator,
        parentId,
        url: meta.citationUrl,
        consolidatedAs: meta.consolidatedAs,
        corpusVersion: meta.version,
        coverage: meta.coverage,
        contentHash: sha256(text),
        text,
        chars: text.length,
        authority: 'editorial-only',
      }

      records.push({ id: `${meta.corpusId}:${locator}`, metadata })
    })
  }

  return records
}
