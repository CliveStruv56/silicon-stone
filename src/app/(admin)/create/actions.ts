"use server";

import { performResearch as researchPipeline, synthesizeDeepReport, buildDeepInstructions } from "@/lib/research";
import { isBackendConfigured, startDeepResearchJob, getDeepResearchJob, type DeepJobStatus } from "@/lib/research-backend";
import { callClaude, CLAUDE_MODEL } from "@/lib/anthropic";
import { buildDraftPrompt, type DraftFormat } from "@/lib/prompts";
import { parseDraftPayload, finalizeDraft } from "@/lib/draft-pipeline";
import { requireAdmin } from "@/lib/auth";
import { ResearchResult } from "@/types/research";
import { gatherDraftContext } from "@/lib/draft-retrieval";
import { checkDurableRateLimit } from "@/lib/durable-rate-limit";
import { getServerActionClientIp } from "@/lib/rate-limit";
import {
    openResearchRun,
    completeResearchRun,
    failResearchRun,
    recordGeneration,
} from "@/lib/research-provenance";
import { EMBEDDING_MODEL } from "@/lib/embeddings";

const MAX_TOPIC_LENGTH = 300
const MAX_BRIEF_LENGTH = 2000

/**
 * `runId` is the provenance record for this investigation (wave 2). It is
 * opaque to the browser and is the ONLY thing the client hands back: the run is
 * written server-side from what the server actually did, so nothing a client
 * posts can edit what the record says. It is optional throughout — a run that
 * could not be recorded costs provenance, never research.
 */
export type StartResearchResponse =
    | { mode: "result"; result: ResearchResult; runId?: string }
    | { mode: "job"; jobId: string; runId?: string }
    | { mode: "error"; error: string; runId?: string };

/**
 * Entry point for the /create form. Deep Dives run on the Railway backend as a
 * background job (returns a jobId to poll) when the backend is configured;
 * everything else — and the local/dev fallback — runs in-process and returns a
 * result immediately.
 */
export async function startResearch(topic: string, deep: boolean, brief: string = ""): Promise<StartResearchResponse> {
    await requireAdmin();
    const normalizedTopic = topic.trim().slice(0, MAX_TOPIC_LENGTH)
    const normalizedBrief = brief.trim().slice(0, MAX_BRIEF_LENGTH)
    if (!normalizedTopic) {
        throw new Error("Topic is required.")
    }
    // Outside the try: a rate-limit rejection is a specific, actionable message
    // and must not be rewritten into the generic failure below.
    if (deep) {
        const ip = await getServerActionClientIp()
        const rateLimit = await checkDurableRateLimit("deepResearch", ip)
        if (!rateLimit.allowed) {
            return { mode: "error", error: `Too many deep research starts. Try again in ${rateLimit.retryAfter} seconds.` }
        }
    }
    // Opened before the outcome is known, deliberately: a run that dies
    // mid-flight is exactly the one worth having a record of, and there is no
    // way to write one if the record only appears on success. Never throws.
    let runId: string | null = null;
    try {
        if (deep && isBackendConfigured()) {
            const jobId = await startDeepResearchJob(normalizedTopic, buildDeepInstructions(normalizedTopic, normalizedBrief));
            // The job handle is also the run's idempotency key, so it is opened
            // after the job exists rather than before.
            runId = await openResearchRun({ topic: normalizedTopic, brief: normalizedBrief, deep: true, jobId });
            return { mode: "job", jobId, ...(runId ? { runId } : {}) };
        }
        runId = await openResearchRun({ topic: normalizedTopic, brief: normalizedBrief, deep });
        const result = await researchPipeline(normalizedTopic, undefined, { deep, brief: normalizedBrief });
        // Closed here, server-side, from what this function actually received.
        await completeResearchRun({ runId, result });
        return { mode: "result", result, ...(runId ? { runId } : {}) };
    } catch (error) {
        // Returned, not thrown: Next.js redacts thrown Server Action errors in
        // production, which is what reduced an upstream 410 to "check the logs".
        console.error("Error starting research:", error);
        const detail = error instanceof Error ? error.message : String(error);
        await failResearchRun(runId, detail);
        return { mode: "error", error: `Failed to gather intelligence: ${detail}`, ...(runId ? { runId } : {}) };
    }
}

/** Poll a background deep-research job; synthesises the report when complete. */
export async function pollResearchJob(
    jobId: string,
    topic: string,
    brief: string = "",
    runId?: string,
): Promise<{ status: DeepJobStatus["status"]; result?: ResearchResult; error?: string }> {
    await requireAdmin();
    const run = runId ?? null;
    try {
        const job = await getDeepResearchJob(jobId);
        if (job.status === "completed" && job.report) {
            const result = await synthesizeDeepReport(topic, job.report, brief.trim().slice(0, MAX_BRIEF_LENGTH));
            // Recorded HERE, before the result is handed to a browser that may
            // never come back. This poll is the only moment the report exists
            // in this process — the backend's copy ages out, and a client that
            // stops polling loses it. That is the concrete form of "research
            // must survive job expiry".
            await completeResearchRun({ runId: run, result, costUsd: job.costDollars });
            return { status: "completed", result };
        }
        if (job.status === "failed") {
            const detail = job.error ?? "Deep research failed";
            await failResearchRun(run, detail);
            return { status: "failed", error: detail };
        }
        return { status: job.status };
    } catch (error) {
        console.error("Error polling research job:", error);
        // The poll failing is not the job failing — the backend may still be
        // working — so the run is left alone rather than marked failed on the
        // strength of one bad round trip.
        return { status: "failed", error: "Failed to poll research job." };
    }
}

/**
 * `articleId` is the created draft's document id, returned so the client can
 * start the fact-check on it. The check runs from the browser rather than here
 * on purpose: /api/fact-check already owns the auth, rate-limit, re-entrancy
 * and background-run guards, and giving it its own invocation keeps a 90–180s
 * verification off the end of a generation that has already spent most of this
 * route's 300s budget on five sequential model calls.
 */
export type CreateDraftResult = { ok: true; articleId?: string } | { error: string };

/**
 * Map a thrown error from the draft pipeline to a specific, user-facing message
 * that names the API/credential at fault, so the admin UI can show what actually
 * broke instead of a generic "try again". `stage` is the step we were in when it
 * threw (set progressively below).
 */
function describeDraftError(error: unknown, stage: string): string {
    const raw = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number } | null)?.status;

    // Sanity write path
    if (/SANITY_API_WRITE_TOKEN/i.test(raw)) {
        return "Couldn't save the draft to Sanity — the write token (SANITY_API_WRITE_TOKEN) is missing or invalid. Add a write-enabled token in your Vercel env vars.";
    }
    if (/Insufficient permissions|not allowed|Unauthorized/i.test(raw) && /sanity/i.test(stage)) {
        return "Sanity rejected the write — the SANITY_API_WRITE_TOKEN is read-only or lacks permission to create documents. Issue an Editor token.";
    }

    // Anthropic path
    if (/ANTHROPIC_API_KEY is not configured/i.test(raw)) {
        return "The Anthropic API key (ANTHROPIC_API_KEY) is not configured on the server.";
    }
    if (status === 401 || /invalid x-api-key|authentication_error/i.test(raw)) {
        return "Anthropic rejected the API key (401). Check ANTHROPIC_API_KEY — it may have been rotated or revoked.";
    }
    if (/credit balance|insufficient.*quota|billing/i.test(raw)) {
        return "Anthropic credits are exhausted (or billing failed). Top up your Anthropic account and retry.";
    }
    if (status === 429 || /rate.?limit|overloaded/i.test(raw)) {
        return "Anthropic is rate-limiting or temporarily overloaded (429). Wait a moment and retry.";
    }
    if (status === 400) {
        return `Anthropic rejected the request (400) while ${stage}: ${raw}`;
    }
    if (/unexpected draft payload|Unexpected token|in JSON|is not valid JSON/i.test(raw)) {
        return "Claude returned a draft that couldn't be parsed (not valid JSON — usually a truncated or off-format reply). Retry; if it keeps happening the response may be hitting the token limit or ANTHROPIC_MODEL is set to an unexpected model.";
    }

    return `Draft generation failed while ${stage}: ${raw}`;
}

export async function createDraftFromResearch(
    researchResult: ResearchResult,
    format: DraftFormat,
    personaSlug: string,
    topic: string = "",
    brief: string = "",
    runId?: string
): Promise<CreateDraftResult> {
    let stage = "initialising";
    let articleId = "";
    try {
        await requireAdmin();

        // Prior coverage (article index) + primary statutory text (regulatory
        // corpus), retrieved together. Both lanes fail independently and neither
        // throws — but every outcome is logged, including the no-ops. This used
        // to be an inline block ending in a bare `catch {}`, so a Pinecone
        // outage silently produced un-RAGed drafts with nothing in the logs.
        stage = "retrieving prior coverage and regulatory context";
        const draftContext = await gatherDraftContext({
            topic,
            brief,
            keywords: researchResult.suggestedContext.keywords,
            painPoints: researchResult.suggestedContext.pain_points,
            personaRole: personaSlug.replace(/-/g, " "),
        });

        // Single, data-driven prompt builder for every format — pulls the brand
        // voice DNA, business profile and full Sanity persona, then carries the
        // research, statute, prior coverage and (for Deep Dives) the full
        // forensic report.
        stage = "building the prompt";
        const { systemPrompt, userPrompt } = await buildDraftPrompt({
            topic,
            personaKey: personaSlug,
            format,
            research: {
                summary: researchResult.summary,
                sources: researchResult.sources,
                painPoints: researchResult.suggestedContext.pain_points,
                keywords: researchResult.suggestedContext.keywords,
            },
            priorCoverage: draftContext.priorCoverage,
            regulatoryCorpus: draftContext.regulatoryCorpus,
            deepReport: researchResult.deepReport,
            brief: brief.trim().slice(0, MAX_BRIEF_LENGTH) || undefined,
        });

        // Deep Dives can exceed the 4096-token default — give them headroom
        // (matches /import; previously /create truncated long deep dives at 4096).
        const maxTokens = format === "deep_dive" ? 8192 : 4096;
        stage = "generating the draft with Claude";
        const responseText = await callClaude(systemPrompt, userPrompt, 0.4, maxTokens);

        stage = "parsing Claude's draft";
        const draft = parseDraftPayload(responseText);

        // Pass-3 (voice edit) → Pass-2 (metadata) → Sanity write — shared with /import.
        stage = "saving the draft to Sanity";
        const created = await finalizeDraft({
            draft,
            format,
            personaSlug,
            source: "generated",
            // The same block the prompt quoted from, so the quotation audit
            // checks what the model wrote against what it was actually given.
            regulatoryCorpus: draftContext.regulatoryCorpus,
            // Provenance only — recorded on citationSnapshots, never on the
            // reader-facing Sources list. Promote in Studio.
            researchSources: researchResult.sources,
            // Article lineage (wave 2). Only this path supplies it: /import has
            // no run and a hand-written article has no pipeline.
            lineage: {
                ...(runId ? { researchRunId: runId } : {}),
                priorCoverageArticleIds: draftContext.priorCoverageArticleIds,
                generationSnapshot: {
                    generatedAt: new Date().toISOString(),
                    model: CLAUDE_MODEL,
                    embeddingModel: EMBEDDING_MODEL,
                    // Every id both lanes returned, including the ones that did
                    // not clear a floor: what the retrieval step saw, not what
                    // survived it. `rulesVersion` and `rulePackVersion` are left
                    // unset — the bundled style rules carry no version, and the
                    // rule pack belongs to the Compliance Checker's lane, which
                    // this drafting path never reads.
                    retrievalRecordIds: draftContext.retrieval.flatMap((lane) =>
                        lane.entries.map((entry) => entry.recordId),
                    ),
                    notes: draftContext.notes.join("\n"),
                },
            },
            logPrefix: "/create",
        });

        // TWO ids, and the difference matters. `createdId` is what Sanity
        // actually holds — `drafts.<uuid>`, because nothing here publishes —
        // and it is the only one that resolves to a document right now.
        // `articleId` is the published id the client needs for the fact-check.
        // Handing the stripped one to the domain asks it to reference a
        // document that will not exist until someone presses Publish, and its
        // reference check refuses exactly that.
        const createdId = String(created?._id ?? "");
        articleId = createdId.replace(/^drafts\./, "");

        // The other half of the link, and the last thing to happen: the run
        // learns which article it produced and what retrieval fed it. After the
        // write, so a failure here costs the back-reference and not the draft.
        // The stored reference is normalised to the published id, which is
        // where the article lands when the editor publishes it.
        await recordGeneration({
            runId: runId ?? null,
            articleId: createdId,
            retrieval: draftContext.retrieval,
        });

    } catch (error) {
        // Log the raw error server-side (visible in Vercel logs) and return a
        // specific, user-facing message so the admin knows which API/credential
        // failed. We return (not throw) because Next.js redacts thrown Server
        // Action error messages in production.
        console.error(`Error creating draft (stage: ${stage}):`, error);
        return { error: describeDraftError(error, stage) };
    }

    // Success. We deliberately do NOT redirect() from here: redirect() works by
    // throwing NEXT_REDIRECT, which — for a directly-invoked server action — can
    // surface to the client's try/catch as a rejection and trigger a spurious
    // "failed" alert even though the draft saved. Let the client navigate.
        return { ok: true, ...(articleId ? { articleId } : {}) };
}
