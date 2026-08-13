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

export const PRIOR_COVERAGE_TOP_K = 5

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
}

async function gatherPriorCoverage(topic: string): Promise<{ block?: string; note: string }> {
  if (!process.env.PINECONE_INDEX_NAME) {
    return { note: '[prior-coverage] skipped — PINECONE_INDEX_NAME is not set' }
  }

  const vector = await generateEmbedding(topic)
  const similar = await searchSimilar(vector, PRIOR_COVERAGE_TOP_K)

  if (similar.length === 0) {
    return { note: '[prior-coverage] 0 related articles' }
  }

  const lines = similar.map(
    (result) =>
      `- "${result.metadata.title}": ${result.metadata.excerpt} (/analysis/${result.metadata.slug})`,
  )

  return {
    block:
      `=== PRIOR COVERAGE IN YOUR KNOWLEDGE BASE ===\n` +
      `You have already written on related topics. Reference, extend, or differentiate ` +
      `from this prior work rather than repeating it:\n${lines.join('\n')}`,
    note: `[prior-coverage] ${similar.length} article(s), topScore=${similar[0].score.toFixed(3)}`,
  }
}

export async function gatherDraftContext(input: DraftContextInput): Promise<DraftContext> {
  const notes: string[] = []

  const [prior, regulatory] = await Promise.allSettled([
    gatherPriorCoverage(input.topic),
    retrieveRegulatoryContext(input),
  ])

  let priorCoverage: string | undefined
  if (prior.status === 'fulfilled') {
    priorCoverage = prior.value.block
    notes.push(prior.value.note)
  } else {
    notes.push(`[prior-coverage] FAILED: ${errorText(prior.reason)}`)
  }

  let regulatoryCorpus: string | undefined
  if (regulatory.status === 'fulfilled') {
    regulatoryCorpus = regulatory.value.block ?? undefined
    notes.push(...regulatory.value.notes)
  } else {
    notes.push(`[regulatory] FAILED: ${errorText(regulatory.reason)}`)
  }

  for (const note of notes) {
    if (note.includes('FAILED')) console.error(note)
    else console.info(note)
  }

  return { priorCoverage, regulatoryCorpus, notes }
}

function errorText(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason)
}
