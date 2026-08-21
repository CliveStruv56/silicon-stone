import 'server-only'

/**
 * Editorial memory as a drafting lane — wave 3, and it ships **dark**.
 *
 * Two switches have to be on, and the second one is the point. The flag
 * `KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED` says the lane may run; `KNOWLEDGE_SCORE_FLOOR`
 * says what counts as a match. **There is no default floor in this file, and
 * that is deliberate.**
 *
 * `PRIOR_COVERAGE_SCORE_FLOOR = 0.37` was not chosen, it was measured: three
 * on-topic queries scored 0.421 / 0.533 / 0.687 on their best match, four
 * off-topic queries — two of them deliberately sharing the publication's
 * professional register — topped out at 0.318, and the floor is the midpoint of
 * that band. Editorial memory cannot reproduce that experiment against two
 * records. So rather than write a plausible number that would outlive everyone's
 * memory of its being a guess, the lane refuses to inject anything until someone
 * has run `npm run knowledge:calibrate` and set what they measured.
 *
 * Turning the flag on is therefore not enough. That is the intended friction.
 *
 * The lane returns the same `RetrievalLaneSnapshot` shape as the other two, so
 * wave 2's provenance covers it without changes, and `laneStatus` keeps
 * "switched off" distinguishable from "found nothing".
 */

import { generateEmbedding } from '../embeddings'
import { getKnowledgePineconeIndex, knowledgeIndexConfigured } from '../pinecone'
import {
  configuredScoreFloor,
  knowledgeFeatureEnabled,
  KNOWLEDGE_SCORE_FLOOR_ENV,
} from './features'
import type {
  RetrievalEntry,
  RetrievalLaneSnapshot,
  RetrievalLaneStatus,
} from '../draft-retrieval'

/** Over-fetch a little; the floor does the cutting. */
export const KNOWLEDGE_TOP_K = 5

export interface EditorialMemoryResult {
  block: string | null
  notes: string[]
  snapshot: RetrievalLaneSnapshot
}

function lane(
  laneStatus: RetrievalLaneStatus,
  entries: RetrievalEntry[] = [],
  scoreFloor?: number,
): RetrievalLaneSnapshot {
  return {
    lane: 'editorial_memory',
    ...(process.env.PINECONE_KNOWLEDGE_INDEX_NAME
      ? { indexName: process.env.PINECONE_KNOWLEDGE_INDEX_NAME }
      : {}),
    ...(scoreFloor !== undefined ? { scoreFloor } : {}),
    laneStatus,
    entries,
  }
}

export interface EditorialMemoryInput {
  topic: string
}

export async function retrieveEditorialMemory(
  input: EditorialMemoryInput,
): Promise<EditorialMemoryResult> {
  const notes: string[] = []

  if (!knowledgeFeatureEnabled('draftRetrieval')) {
    notes.push('[editorial-memory] off — KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED is not true')
    return { block: null, notes, snapshot: lane('skipped') }
  }

  if (!knowledgeIndexConfigured()) {
    notes.push('[editorial-memory] skipped — PINECONE_KNOWLEDGE_INDEX_NAME is not set')
    return { block: null, notes, snapshot: lane('skipped') }
  }

  const floor = configuredScoreFloor()
  if (floor === null) {
    notes.push(
      `[editorial-memory] skipped — no measured score floor. ` +
        `Run npm run knowledge:calibrate and set ${KNOWLEDGE_SCORE_FLOOR_ENV}. ` +
        `The lane will not guess one.`,
    )
    return { block: null, notes, snapshot: lane('skipped') }
  }

  // Embeds the topic alone, matching prior coverage rather than the regulatory
  // lane's composed query. Editorial memory holds the publication's own
  // thinking about a subject, and the research pass's keywords carry this
  // week's news vocabulary — the same reason the prior-coverage lane excludes
  // them, and the asymmetry CLAUDE.md says not to "fix".
  const vector = await generateEmbedding(input.topic)
  const result = await getKnowledgePineconeIndex().query({
    vector,
    topK: KNOWLEDGE_TOP_K,
    includeMetadata: true,
    includeValues: false,
  })

  const hits = (result.matches ?? []).map((match) => ({
    id: match.id,
    score: match.score ?? 0,
    metadata: (match.metadata ?? {}) as Record<string, string>,
  }))

  const toEntry = (hit: (typeof hits)[number]): RetrievalEntry => ({
    recordId: hit.id,
    score: hit.score,
    title: hit.metadata.title,
    locator: hit.metadata.documentType,
  })

  if (hits.length === 0) {
    notes.push('[editorial-memory] 0 records')
    return { block: null, notes, snapshot: lane('empty', [], floor) }
  }

  const kept = hits.filter((hit) => hit.score >= floor)
  const topScore = hits[0].score.toFixed(3)

  if (kept.length === 0) {
    notes.push(
      `[editorial-memory] ${hits.length} hit(s) but topScore=${topScore} below floor ${floor} — no block injected`,
    )
    return { block: null, notes, snapshot: lane('empty', hits.map(toEntry), floor) }
  }

  const lines = kept.map((hit) => `- "${hit.metadata.title}": ${hit.metadata.snippet ?? ''}`.trim())

  notes.push(
    `[editorial-memory] ${kept.length} of ${hits.length} record(s) above floor ${floor}, topScore=${topScore}`,
  )

  return {
    block:
      `=== YOUR OWN REVIEWED NOTES AND SOURCES ===\n` +
      `Material you captured and approved, not published work. Treat it as your ` +
      `own thinking to build on, and do not quote it as though it were a source ` +
      `the reader can check:\n${lines.join('\n')}`,
    notes,
    snapshot: lane('ok', kept.map(toEntry), floor),
  }
}
