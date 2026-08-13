"use server";

import { performResearch as researchPipeline, synthesizeDeepReport, buildDeepInstructions } from "@/lib/research";
import { isBackendConfigured, startDeepResearchJob, getDeepResearchJob, type DeepJobStatus } from "@/lib/research-backend";
import { callClaude } from "@/lib/anthropic";
import { buildDraftPrompt, type DraftFormat } from "@/lib/prompts";
import { parseDraftPayload, finalizeDraft } from "@/lib/draft-pipeline";
import { requireAdmin } from "@/lib/auth";
import { ResearchResult } from "@/types/research";
import { generateEmbedding } from "@/lib/embeddings";
import { searchSimilar } from "@/lib/pinecone";
import { checkDurableRateLimit } from "@/lib/durable-rate-limit";
import { getServerActionClientIp } from "@/lib/rate-limit";

const MAX_TOPIC_LENGTH = 300
const MAX_BRIEF_LENGTH = 2000

export type StartResearchResponse =
    | { mode: "result"; result: ResearchResult }
    | { mode: "job"; jobId: string }
    | { mode: "error"; error: string };

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
    try {
        if (deep && isBackendConfigured()) {
            const jobId = await startDeepResearchJob(normalizedTopic, buildDeepInstructions(normalizedTopic, normalizedBrief));
            return { mode: "job", jobId };
        }
        const result = await researchPipeline(normalizedTopic, undefined, { deep, brief: normalizedBrief });
        return { mode: "result", result };
    } catch (error) {
        // Returned, not thrown: Next.js redacts thrown Server Action errors in
        // production, which is what reduced an upstream 410 to "check the logs".
        console.error("Error starting research:", error);
        const detail = error instanceof Error ? error.message : String(error);
        return { mode: "error", error: `Failed to gather intelligence: ${detail}` };
    }
}

/** Poll a background deep-research job; synthesises the report when complete. */
export async function pollResearchJob(
    jobId: string,
    topic: string,
    brief: string = "",
): Promise<{ status: DeepJobStatus["status"]; result?: ResearchResult; error?: string }> {
    await requireAdmin();
    try {
        const job = await getDeepResearchJob(jobId);
        if (job.status === "completed" && job.report) {
            const result = await synthesizeDeepReport(topic, job.report, brief.trim().slice(0, MAX_BRIEF_LENGTH));
            return { status: "completed", result };
        }
        if (job.status === "failed") {
            return { status: "failed", error: job.error ?? "Deep research failed" };
        }
        return { status: job.status };
    } catch (error) {
        console.error("Error polling research job:", error);
        return { status: "failed", error: "Failed to poll research job." };
    }
}

export type CreateDraftResult = { ok: true } | { error: string };

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
    brief: string = ""
): Promise<CreateDraftResult> {
    let stage = "initialising";
    try {
        await requireAdmin();

        // Retrieve semantically similar prior articles from Pinecone (RAG) and
        // format them as a "prior coverage" block the writer can extend/differentiate.
        let priorCoverageBlock = ''
        try {
            const topicVector = await generateEmbedding(topic)
            const similar = await searchSimilar(topicVector, 5)
            if (similar.length > 0) {
                const lines = similar.map(
                    (r) => `- "${r.metadata.title}": ${r.metadata.excerpt} (/analysis/${r.metadata.slug})`
                )
                priorCoverageBlock = `=== PRIOR COVERAGE IN YOUR KNOWLEDGE BASE ===\nYou have already written on related topics. Reference, extend, or differentiate from this prior work rather than repeating it:\n${lines.join('\n')}`
            }
        } catch {
            // Pinecone not configured — skip silently
        }

        // Single, data-driven prompt builder for every format — pulls the brand
        // voice DNA, business profile and full Sanity persona, then carries the
        // research, prior coverage and (for Deep Dives) the full forensic report.
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
            priorCoverage: priorCoverageBlock || undefined,
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
        await finalizeDraft({
            draft,
            format,
            personaSlug,
            source: "generated",
            logPrefix: "/create",
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
    return { ok: true };
}
