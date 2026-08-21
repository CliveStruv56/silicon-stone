import 'server-only'

/**
 * The provenance side of `/create` — wave 2 of the knowledge programme.
 *
 * Every function here is **best-effort and silent to its caller**. A research
 * run that cannot be recorded must never cost the writer their research, and a
 * lineage patch that fails must never cost them their draft. That is the same
 * rule the quotation audit, the image prompts and the metadata pass already
 * follow in `finalizeDraft`, and it is why each of these returns `void` or a
 * nullable id rather than a result the caller has to handle.
 *
 * What it is *not*: a second authority. Nothing here changes what is retrieved,
 * what reaches a prompt, or what the reader sees. It records what happened.
 *
 * **Only `/create` calls it.** `/import` has no research run to record and a
 * hand-written article has no pipeline at all; both are left with an empty
 * provenance block, because "there was none" is the honest reading of a blank
 * and a synthesised one would say "we do not know" about work that never
 * happened. `article.source` already tells the two apart.
 */

import { CLAUDE_MODEL } from './anthropic'
import { knowledgeClient } from './knowledge/sanity-client'
import {
  createResearchRun,
  recordRunGeneration,
  updateResearchRun,
  type KnowledgeResult,
  type KnowledgeServiceDeps,
  type ResearchRunSource,
  type RunRetrievalSnapshot,
} from './knowledge/service'
import type { ResearchResult } from '@/types/research'

function deps(): KnowledgeServiceDeps {
  return { client: knowledgeClient() }
}

/** Log and swallow. The caller is mid-pipeline and has nothing useful to do
 * with a provenance failure except carry on. */
function report(what: string, result: KnowledgeResult): void {
  if (result.ok) return
  console.error(`[provenance] ${what} failed: ${result.code} — ${result.message}`)
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export interface OpenRunInput {
  topic: string
  brief?: string
  deep: boolean
  /** The provider's own job handle, for the deep path. Doubles as the
   * idempotency key, so recording the same job twice returns the first run. */
  jobId?: string
}

/**
 * Opens the record, before the outcome is known.
 *
 * Deliberately at the *start*: a run that dies mid-flight is the case where
 * evidence is most valuable, and there is no way to record it if the record is
 * only written on success. `reuseStatus` lands at `pending` regardless — a
 * completed run is not automatically reusable, and this must not collapse the
 * two.
 *
 * Returns the run id, or `null` when nothing was recorded. A null id is not an
 * error the caller reports; it means the rest of the run goes unrecorded and
 * the draft proceeds exactly as it did before this existed.
 */
export async function openResearchRun(input: OpenRunInput): Promise<string | null> {
  try {
    const result = await createResearchRun(deps(), {
      query: input.topic,
      ...(input.brief ? { brief: input.brief } : {}),
      mode: input.deep ? 'deep' : 'fast',
      provider: 'exa',
      // The search begins the moment this returns, so `running` is the true
      // state; `queued` would describe a wait that does not happen here.
      status: 'running',
      ...(input.jobId ? { jobId: input.jobId } : {}),
    })
    report('opening the research run', result)
    return result.ok ? result.documentId : null
  } catch (error) {
    console.error(`[provenance] opening the research run threw: ${errorText(error)}`)
    return null
  }
}

/** What the research pass selected, as it came back. `publisher` and `score`
 * are absent because `ResearchSource` has neither — the shape note in the wave
 * brief is explicit that inventing them would be worse than omitting them. */
function selectedSources(result: ResearchResult): ResearchRunSource[] {
  return result.sources.map((source) => ({
    title: source.title,
    url: source.url,
    snippet: source.snippet,
    ...(source.publishedDate ? { publishedDate: source.publishedDate } : {}),
  }))
}

export interface CompleteRunInput {
  runId: string | null
  result: ResearchResult
  /** Reported by the deep-research backend; absent on the in-process path. */
  costUsd?: number | null
}

/**
 * Closes the record with what the run found.
 *
 * `keywords` is persisted because the schema has a field for it.
 * `suggestedContext.pain_points` is not: there is no home for it, and adding
 * one is schema work this wave is not. It stays transient, which is what it has
 * always been.
 */
export async function completeResearchRun(input: CompleteRunInput): Promise<void> {
  if (!input.runId) return
  try {
    const result = await updateResearchRun(deps(), {
      documentId: input.runId,
      status: 'completed',
      // A completed run must carry what it found — the domain refuses one that
      // does not, so an empty summary is reported rather than silently dropped.
      summary: input.result.summary,
      ...(input.result.deepReport ? { deepReport: input.result.deepReport } : {}),
      keywords: input.result.suggestedContext.keywords,
      selectedSources: selectedSources(input.result),
      modelSnapshot: {
        // The synthesis model, which is the only model the research pass runs.
        // The embedding model belongs to drafting, not to research, and naming
        // it here would attribute it to the wrong step.
        model: CLAUDE_MODEL,
        providerVersion: 'exa',
        ...(typeof input.costUsd === 'number' ? { costUsd: input.costUsd } : {}),
      },
    })
    report('completing the research run', result)
  } catch (error) {
    console.error(`[provenance] completing the research run threw: ${errorText(error)}`)
  }
}

/** Records that the run ended badly. An Exa run that returned nothing is worth
 * knowing about the next time the same topic is tried. */
export async function failResearchRun(runId: string | null, error: string): Promise<void> {
  if (!runId) return
  try {
    const result = await updateResearchRun(deps(), {
      documentId: runId,
      status: 'failed',
      error: error.slice(0, 2000),
    })
    report('recording the research failure', result)
  } catch (thrown) {
    console.error(`[provenance] recording the research failure threw: ${errorText(thrown)}`)
  }
}

export interface RecordGenerationInput {
  runId: string | null
  /** The created draft's document id. */
  articleId: string
  retrieval: readonly RunRetrievalSnapshot[]
}

/** Links the article the run produced, and what retrieval fed it. */
export async function recordGeneration(input: RecordGenerationInput): Promise<void> {
  if (!input.runId || !input.articleId) return
  try {
    const result = await recordRunGeneration(deps(), {
      runId: input.runId,
      articleId: input.articleId,
      retrievalSnapshots: input.retrieval,
    })
    report('recording the generation', result)
  } catch (error) {
    console.error(`[provenance] recording the generation threw: ${errorText(error)}`)
  }
}
