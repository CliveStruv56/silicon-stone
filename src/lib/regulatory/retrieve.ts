import 'server-only'

/**
 * Retrieve primary statutory text for a draft.
 *
 * EDITORIAL LANE ONLY. This produces material for the drafting model to quote
 * and cite; it is never a verification authority. The Compliance Checker's
 * legal authority is the pinned rule pack under rulepack/versions/, and
 * scripts/regulatory-index-checks.ts fails the build if the two are wired
 * together.
 *
 * Pipeline: gate -> compose query -> embed -> query -> diversify -> score floor
 * -> format. Every stage that declines to produce a block says why in `notes`,
 * because a lane that silently never fires is indistinguishable from one that is
 * broken.
 */

import { generateEmbedding } from '../embeddings'
import { searchRegulatory } from './index-client'
import { looksRegulatory } from './gate'
import {
  formatRegulatoryBlock,
  diversifyHits,
  REGULATORY_SCORE_FLOOR,
  REGULATORY_TOPIC_ONLY_SCORE_FLOOR,
} from './format'

/** Over-fetch, then diversify and cut. */
export const REGULATORY_QUERY_TOP_K = 24
export const REGULATORY_MAX_PASSAGES = 6

/** Caps on the composed query, strongest signal first — truncation cuts the tail. */
const BRIEF_QUERY_CHARS = 400
const MAX_QUERY_CHARS = 1500

export interface RegulatoryRetrievalInput {
  topic: string
  brief?: string
  keywords?: string[]
  painPoints?: string[]
  personaRole?: string
  /** Restrict to one instrument when the author already knows which law applies. */
  corpusId?: string
}

export interface RegulatoryRetrievalResult {
  block: string | null
  notes: string[]
}

/**
 * Build the retrieval query. Deliberately excludes research.summary: it is
 * several thousand characters of journalistic prose and drowns the query in
 * news vocabulary, so a piece about the AI Act starts matching statute about
 * market surveillance because the summary mentioned a fine. Keywords and pain
 * points are the distilled signal.
 */
export function composeRegulatoryQuery(input: RegulatoryRetrievalInput): string {
  return [
    input.topic,
    input.brief?.slice(0, BRIEF_QUERY_CHARS),
    input.keywords?.join(', '),
    input.painPoints?.join('. '),
    input.personaRole,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join('\n')
    .slice(0, MAX_QUERY_CHARS)
}

export async function retrieveRegulatoryContext(
  input: RegulatoryRetrievalInput,
): Promise<RegulatoryRetrievalResult> {
  const notes: string[] = []

  if (process.env.REGULATORY_RETRIEVAL_DISABLED === '1') {
    notes.push('[regulatory] disabled by REGULATORY_RETRIEVAL_DISABLED=1')
    return { block: null, notes }
  }

  if (!process.env.PINECONE_REGULATORY_INDEX_NAME) {
    notes.push('[regulatory] skipped — PINECONE_REGULATORY_INDEX_NAME is not set')
    return { block: null, notes }
  }

  const gate = looksRegulatory(
    input.topic,
    input.brief,
    input.keywords?.join(' '),
    input.painPoints?.join(' '),
    input.personaRole,
  )

  if (!gate.hit) {
    notes.push('[regulatory] gate=miss — topic does not look regulation-adjacent, no block injected')
    return { block: null, notes }
  }

  const query = composeRegulatoryQuery(input)
  const vector = await generateEmbedding(query)

  // Route to the instruments the topic actually names. An explicit corpusId from
  // the caller always wins; otherwise the gate's routing narrows the search, and
  // an empty routing result searches everything rather than nothing.
  const routed = input.corpusId ? [input.corpusId] : gate.corpusIds
  const filter = routed.length ? { corpusId: { $in: routed } } : undefined

  let hits = await searchRegulatory(vector, REGULATORY_QUERY_TOP_K, filter)
  let routingNote = routed.length ? `routed=${JSON.stringify(routed)}` : 'routed=all'

  // A routing decision must never be able to starve the draft. If the instruments
  // we picked hold nothing for this query, fall back to the whole corpus and say
  // so — a wrong guess should cost relevance, not the entire block.
  if (hits.length === 0 && filter) {
    hits = await searchRegulatory(vector, REGULATORY_QUERY_TOP_K)
    routingNote = `routed=${JSON.stringify(routed)} returned 0, fell back to all instruments`
  }

  if (hits.length === 0) {
    notes.push(
      `[regulatory] gate=hit matched=${JSON.stringify(gate.matched)} ${routingNote} ` +
        'but 0 hits — is the corpus ingested?',
    )
    return { block: null, notes }
  }

  // A topic that named an instrument's subject matter but used no legal
  // vocabulary at all has to clear a higher bar — see the constant's note.
  const floor =
    gate.matched.length === 0 ? REGULATORY_TOPIC_ONLY_SCORE_FLOOR : REGULATORY_SCORE_FLOOR

  const topScore = hits[0].score
  if (topScore < floor) {
    notes.push(
      `[regulatory] gate=hit matched=${JSON.stringify(gate.matched)} ${routingNote} ` +
        `topScore=${topScore.toFixed(3)} below floor ${floor}` +
        `${floor === REGULATORY_TOPIC_ONLY_SCORE_FLOOR ? ' (topic-only gate hit)' : ''}` +
        ' — no block injected',
    )
    return { block: null, notes }
  }

  const selected = diversifyHits(
    hits.filter((hit) => hit.score >= floor),
    REGULATORY_MAX_PASSAGES,
  )
  const block = formatRegulatoryBlock(selected)

  notes.push(
    `[regulatory] gate=hit matched=${JSON.stringify(gate.matched.slice(0, 6))} ` +
      `${routingNote} chunks=${selected.length} topScore=${topScore.toFixed(3)} ` +
      `instruments=${JSON.stringify([...new Set(selected.map((hit) => hit.metadata.corpusId))])} ` +
      `cited=${JSON.stringify(selected.map((hit) => hit.metadata.citation))}`,
  )

  return { block, notes }
}
