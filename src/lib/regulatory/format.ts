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
 * Floor for the per-instrument cap. With several instruments indexed together,
 * the highest-scoring one would otherwise take every slot on a genuinely
 * cross-cutting question — and statutory prose scores so similarly across
 * instruments that "highest-scoring" is not the same as "most relevant".
 */
export const MIN_CHUNKS_PER_INSTRUMENT = 2

/**
 * Below this cosine score the best hit is not really about the query. A weak
 * match is worse than no match: the model uses whatever it is given.
 */
export const REGULATORY_SCORE_FLOOR = 0.3

/**
 * Higher floor for a topic that reached the gate WITHOUT using any legal
 * vocabulary — matching only an instrument's subject matter ("cloud switching",
 * "semiconductor"). Weaker evidence of legal intent, so a stronger relevance
 * requirement before statute is injected.
 *
 * Calibrated 2026-08-15 against two measured cases: "cloud switching charges
 * and interoperability for data processing services" is genuinely Data Act
 * Chapter VI and scores 0.582; "TSMC Dresden fab workforce shortages and the
 * semiconductor talent pipeline" is a labour-market story that pulled 11KB of
 * Chips Act at 0.473. This floor separates them.
 */
export const REGULATORY_TOPIC_ONLY_SCORE_FLOOR = 0.55

/**
 * Cap hits per parent article AND per instrument, preserving score order.
 *
 * Article 5 alone is ~13KB across many prohibitions; without the per-article cap
 * it would fill the whole block. The per-instrument cap is the multi-corpus
 * equivalent: it is derived from how many instruments actually cleared the score
 * floor, so a query that legitimately concerns one instrument still gets the
 * full budget, while a cross-cutting one cannot come back as six passages from
 * whichever instrument happens to use the most similar vocabulary.
 */
export function diversifyHits(hits: RegulatoryHit[], limit: number): RegulatoryHit[] {
  const instruments = new Set(hits.map((hit) => hit.metadata.corpusId))
  const perInstrumentCap =
    instruments.size <= 1
      ? limit
      : Math.max(MIN_CHUNKS_PER_INSTRUMENT, Math.ceil(limit / instruments.size))

  const perArticle = new Map<string, number>()
  const perInstrument = new Map<string, number>()
  const kept: RegulatoryHit[] = []

  for (const hit of hits) {
    const articleSeen = perArticle.get(hit.metadata.parentId) ?? 0
    if (articleSeen >= MAX_CHUNKS_PER_ARTICLE) continue

    const instrumentSeen = perInstrument.get(hit.metadata.corpusId) ?? 0
    if (instrumentSeen >= perInstrumentCap) continue

    perArticle.set(hit.metadata.parentId, articleSeen + 1)
    perInstrument.set(hit.metadata.corpusId, instrumentSeen + 1)
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
    const { instrument, consolidatedAs, url, celex, coverage, instrumentType, applicationNote } =
      group[0].metadata
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

    // A Directive does not bind a company directly. Say so here rather than
    // trusting the model to know it: the quotation below will be accurate even
    // when the obligation it appears to create is addressed to a Member State.
    if (instrumentType === 'directive') {
      lines.push(
        'INSTRUMENT TYPE: Directive. It binds Member States and takes effect for ' +
          'organisations only through national transposing law, which varies by country. ' +
          'Do not write that this instrument requires something of a company — write that ' +
          'it requires Member States to impose it, or cite the national implementing law.',
      )
    }

    if (applicationNote) {
      lines.push(`APPLICATION: ${applicationNote}`)
    }

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
