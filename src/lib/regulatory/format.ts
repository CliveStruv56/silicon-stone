/**
 * Render retrieved provisions into the block handed to the drafting model.
 *
 * Grouped by instrument, then by article, so the writer can see that paragraphs
 * (3) and (5) belong to the same Article and are not consecutive — without
 * spending 5,000 characters on the paragraphs nobody asked for.
 */

import type { RegulatoryHit } from './types'

export const REGULATORY_BLOCK_MAX_CHARACTERS = 12_000

/** Chunks per article, so one long article cannot monopolise the block. */
export const MAX_CHUNKS_PER_ARTICLE = 3

/**
 * Below this cosine score the best hit is not really about the query. A weak
 * match is worse than no match: the model uses whatever it is given.
 */
export const REGULATORY_SCORE_FLOOR = 0.3

/**
 * Cap hits per parent article, preserving score order. Article 5 alone is
 * ~13KB across many prohibitions; without this it would fill the whole block.
 */
export function diversifyByArticle(hits: RegulatoryHit[], limit: number): RegulatoryHit[] {
  const perArticle = new Map<string, number>()
  const kept: RegulatoryHit[] = []

  for (const hit of hits) {
    const seen = perArticle.get(hit.metadata.parentId) ?? 0
    if (seen >= MAX_CHUNKS_PER_ARTICLE) continue
    perArticle.set(hit.metadata.parentId, seen + 1)
    kept.push(hit)
    if (kept.length >= limit) break
  }

  return kept
}

/**
 * Build the prompt block. Returns null when there is nothing worth showing, so
 * callers can omit the section entirely rather than emitting an empty heading.
 */
export function formatRegulatoryBlock(hits: RegulatoryHit[]): string | null {
  if (hits.length === 0) return null

  const byInstrument = new Map<string, RegulatoryHit[]>()
  for (const hit of hits) {
    const bucket = byInstrument.get(hit.metadata.corpusId)
    if (bucket) bucket.push(hit)
    else byInstrument.set(hit.metadata.corpusId, [hit])
  }

  const sections: string[] = []

  for (const group of byInstrument.values()) {
    const { instrument, consolidatedAs, url, celex, coverage } = group[0].metadata
    const provenance = [
      `Source: ${url}`,
      celex ? `CELEX ${celex}` : null,
      `Coverage: ${coverage}`,
    ]
      .filter(Boolean)
      .join('. ')

    const lines = [
      `## ${instrument}`,
      `Consolidated text as at ${consolidatedAs}. ${provenance}.`,
    ]

    // Group by article, keeping the best-scoring article first.
    const byArticle = new Map<string, RegulatoryHit[]>()
    for (const hit of group) {
      const bucket = byArticle.get(hit.metadata.parentId)
      if (bucket) bucket.push(hit)
      else byArticle.set(hit.metadata.parentId, [hit])
    }

    for (const articleHits of byArticle.values()) {
      const first = articleHits[0].metadata
      const label =
        first.unit === 'annex' ? `Annex ${first.articleNumber}` : `Article ${first.articleNumber}`
      lines.push('', `### ${label}${first.heading ? ` — ${first.heading}` : ''}`)

      for (const hit of articleHits) {
        // Strip the stored header: its provenance is already in the section
        // heading above, and the [cite as:] line below states the locator the
        // model must print.
        const body = hit.metadata.text.split('\n---\n').slice(1).join('\n---\n').trim()
        lines.push('', `[cite as: ${hit.metadata.citation}]`, body || hit.metadata.text)
      }
    }

    sections.push(lines.join('\n'))
  }

  let block = sections.join('\n\n')

  if (block.length > REGULATORY_BLOCK_MAX_CHARACTERS) {
    // Truncate on a whole-passage boundary so no quotation is ever cut mid-sentence.
    const passages = block.split('\n\n')
    const kept: string[] = []
    let length = 0
    for (const passage of passages) {
      if (length + passage.length + 2 > REGULATORY_BLOCK_MAX_CHARACTERS) break
      kept.push(passage)
      length += passage.length + 2
    }
    block = `${kept.join('\n\n')}\n\n[Further provisions omitted for length.]`
  }

  return block.trim() || null
}
