import 'server-only'

/**
 * The single retrieval step for drafting: prior coverage from the article index
 * plus primary statutory text from the regulatory corpus.
 *
 * This exists because the prior-coverage block was duplicated between
 * src/app/(admin)/create/actions.ts and scripts/local-draft/pipeline.ts, and the
 * copies had already drifted (one swallowed failures silently, the other
 * warned). Adding a second lane to two call sites would have doubled that.
 * scripts/regulatory-index-checks.ts asserts neither call site re-implements it.
 *
 * The two lanes fail independently — Pinecone being down for one must not cost
 * the other — and NOTHING here throws: a retrieval problem degrades the draft,
 * it does not fail the request. But every outcome is reported in `notes`,
 * including the no-op paths, because a lane that never fires is otherwise
 * indistinguishable from one that is broken.
 */

import { generateEmbedding } from './embeddings'
import { searchSimilar } from './pinecone'
import { retrieveRegulatoryContext } from './regulatory/retrieve'
import type { RetrievalLane } from './knowledge/types'

export const PRIOR_COVERAGE_TOP_K = 5

/**
 * One retrieved record, shaped for `researchRun.retrievalSnapshots[].entries`.
 *
 * Wave 2 (provenance). These types exist so a generated article can answer
 * *what was this written from* — they add nothing to what is retrieved and
 * change nothing about what reaches the prompt. The block and the notes are
 * still the whole of what the drafting path consumes; this is the same
 * information, kept instead of discarded.
 */
export interface RetrievalEntry {
  /** For the prior-coverage lane this is the Sanity article `_id` — the article
   * index keys every vector by document id, so a reference can be built from it
   * without a second lookup. */
  recordId: string
  score?: number
  title?: string
  locator?: string
}

export type RetrievalLaneStatus = 'ok' | 'empty' | 'failed' | 'skipped'

/**
 * What one lane did. `laneStatus` is the point of it: an empty lane and a
 * missing lane are different facts, and the schema says so too. A lane that
 * never fires is otherwise indistinguishable from one that is broken — the same
 * reasoning that put `notes` here in the first place, kept in a form a machine
 * can read a year later.
 */
export interface RetrievalLaneSnapshot {
  lane: RetrievalLane
  indexName?: string
  namespace?: string
  corpusVersion?: string
  scoreFloor?: number
  laneStatus: RetrievalLaneStatus
  entries: RetrievalEntry[]
}

/**
 * Below this cosine score an article is not really related to the topic.
 *
 * Calibrated 2026-08-16 against the live index (15 published articles). Three
 * on-topic queries — AI Act classification, the Chips Act and supply chain,
 * transatlantic policy divergence — scored 0.421, 0.533 and 0.687 on their best
 * match. Four off-topic queries, deliberately including two that share the
 * publication's professional register ("negotiating a warehouse lease in
 * Rotterdam", "onboarding junior engineers remotely"), topped out at 0.318. The
 * floor is the midpoint of that band, so it clears the hardest off-topic case by
 * 0.05 and the weakest on-topic case by the same.
 *
 * Applied per result, not to the top score alone: an on-topic query typically
 * returns two or three genuine neighbours and then a tail in the 0.33–0.35 range,
 * and it is the tail that produces "as we have covered before" about a piece that
 * covered nothing of the sort. The regulatory lane's reasoning holds here too —
 * a weak match is worse than no match, because the model uses whatever it is
 * given.
 */
export const PRIOR_COVERAGE_SCORE_FLOOR = 0.37

export interface DraftContextInput {
  topic: string
  brief?: string
  keywords?: string[]
  painPoints?: string[]
  personaRole?: string
  /** Restrict regulatory retrieval to one instrument. */
  corpusId?: string
}

export interface DraftContext {
  priorCoverage?: string
  regulatoryCorpus?: string
  /** Human-readable trace of what fired and what did not. Always populated. */
  notes: string[]
  /**
   * The same trace, structured, for the provenance record (wave 2). Always
   * populated with one snapshot per lane, including the lanes that did nothing
   * — a skipped lane is a fact worth keeping.
   */
  retrieval: RetrievalLaneSnapshot[]
  /**
   * Sanity `_id`s of the prior articles that cleared the floor and reached the
   * prompt, for `article.priorCoverage[]`. Only the ones actually injected: an
   * article the model was never shown is not prior coverage of anything.
   */
  priorCoverageArticleIds: string[]
}

interface PriorCoverageResult {
  block?: string
  note: string
  snapshot: RetrievalLaneSnapshot
}

/** A lane that did nothing, with the reason recorded rather than implied. */
function inertLane(lane: RetrievalLane, laneStatus: RetrievalLaneStatus): RetrievalLaneSnapshot {
  return { lane, laneStatus, entries: [] }
}

async function gatherPriorCoverage(topic: string): Promise<PriorCoverageResult> {
  const indexName = process.env.PINECONE_INDEX_NAME
  if (!indexName) {
    return {
      note: '[prior-coverage] skipped — PINECONE_INDEX_NAME is not set',
      snapshot: inertLane('prior_articles', 'skipped'),
    }
  }

  // Embeds the topic alone, deliberately, while the regulatory lane composes a
  // query from topic + brief + keywords + pain points. That asymmetry is not an
  // oversight: the keywords come out of the research pass and carry its news
  // vocabulary, which is the exact thing the regulatory lane excludes its
  // summary to avoid. Here it would pull the search toward whatever this week's
  // reporting happens to say rather than what the piece is about.
  const vector = await generateEmbedding(topic)
  const similar = await searchSimilar(vector, PRIOR_COVERAGE_TOP_K)

  // The lane ran, so every outcome below carries the index and the floor that
  // was applied — the two facts you need to reread a snapshot later and know
  // whether a different answer today means the corpus changed or the rules did.
  const lane = (laneStatus: RetrievalLaneStatus, entries: RetrievalEntry[]): RetrievalLaneSnapshot => ({
    lane: 'prior_articles',
    indexName,
    scoreFloor: PRIOR_COVERAGE_SCORE_FLOOR,
    laneStatus,
    entries,
  })

  const toEntry = (result: (typeof similar)[number]): RetrievalEntry => ({
    recordId: result.id,
    score: result.score,
    title: result.metadata.title,
    locator: `/analysis/${result.metadata.slug}`,
  })

  if (similar.length === 0) {
    return { note: '[prior-coverage] 0 related articles', snapshot: lane('empty', []) }
  }

  const related = similar.filter((result) => result.score >= PRIOR_COVERAGE_SCORE_FLOOR)
  const topScore = similar[0].score.toFixed(3)

  if (related.length === 0) {
    // `empty`, not `ok`: nothing reached the prompt. The hits are still recorded
    // — the near-misses are what a later recalibration of the floor asks about.
    return {
      note:
        `[prior-coverage] ${similar.length} hit(s) but topScore=${topScore} below floor ` +
        `${PRIOR_COVERAGE_SCORE_FLOOR} — no block injected`,
      snapshot: lane('empty', similar.map(toEntry)),
    }
  }

  const lines = related.map(
    (result) =>
      `- "${result.metadata.title}": ${result.metadata.excerpt} (/analysis/${result.metadata.slug})`,
  )

  return {
    block:
      `=== PRIOR COVERAGE IN YOUR KNOWLEDGE BASE ===\n` +
      `You have already written on related topics. Reference, extend, or differentiate ` +
      `from this prior work rather than repeating it:\n${lines.join('\n')}`,
    note:
      `[prior-coverage] ${related.length} of ${similar.length} article(s) above floor ` +
      `${PRIOR_COVERAGE_SCORE_FLOOR}, topScore=${topScore}`,
    snapshot: lane('ok', related.map(toEntry)),
  }
}

export async function gatherDraftContext(input: DraftContextInput): Promise<DraftContext> {
  const notes: string[] = []

  const [prior, regulatory] = await Promise.allSettled([
    gatherPriorCoverage(input.topic),
    retrieveRegulatoryContext(input),
  ])

  const retrieval: RetrievalLaneSnapshot[] = []

  let priorCoverage: string | undefined
  let priorCoverageArticleIds: string[] = []
  if (prior.status === 'fulfilled') {
    priorCoverage = prior.value.block
    notes.push(prior.value.note)
    retrieval.push(prior.value.snapshot)
    // Only what was injected. `snapshot.entries` deliberately also holds the
    // below-floor near-misses, which are evidence about the floor rather than
    // prior coverage of this article.
    if (prior.value.block) {
      priorCoverageArticleIds = prior.value.snapshot.entries.map((entry) => entry.recordId)
    }
  } else {
    notes.push(`[prior-coverage] FAILED: ${errorText(prior.reason)}`)
    retrieval.push(inertLane('prior_articles', 'failed'))
  }

  let regulatoryCorpus: string | undefined
  if (regulatory.status === 'fulfilled') {
    regulatoryCorpus = regulatory.value.block ?? undefined
    notes.push(...regulatory.value.notes)
    retrieval.push(regulatory.value.snapshot)
  } else {
    notes.push(`[regulatory] FAILED: ${errorText(regulatory.reason)}`)
    retrieval.push(inertLane('regulatory', 'failed'))
  }

  for (const note of notes) {
    if (note.includes('FAILED')) console.error(note)
    else console.info(note)
  }

  return { priorCoverage, regulatoryCorpus, notes, retrieval, priorCoverageArticleIds }
}

function errorText(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason)
}
