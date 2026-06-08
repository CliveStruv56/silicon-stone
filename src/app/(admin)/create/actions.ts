"use server";

import { redirect } from "next/navigation";
import { performResearch as researchPipeline, synthesizeDeepReport, buildDeepInstructions } from "@/lib/research";
import { isBackendConfigured, startDeepResearchJob, getDeepResearchJob, type DeepJobStatus } from "@/lib/research-backend";
import { callClaude } from "@/lib/anthropic";
import { buildDraftPrompt, type DraftFormat } from "@/lib/prompts";
import { parseDraftPayload, finalizeDraft } from "@/lib/draft-pipeline";
import { requireAdmin } from "@/lib/auth";
import { ResearchResult } from "@/types/research";
import { generateEmbedding } from "@/lib/embeddings";
import { searchSimilar } from "@/lib/pinecone";

export type StartResearchResponse =
    | { mode: "result"; result: ResearchResult }
    | { mode: "job"; jobId: string };

/**
 * Entry point for the /create form. Deep Dives run on the Railway backend as a
 * background job (returns a jobId to poll) when the backend is configured;
 * everything else — and the local/dev fallback — runs in-process and returns a
 * result immediately.
 */
export async function startResearch(topic: string, deep: boolean): Promise<StartResearchResponse> {
    await requireAdmin();
    try {
        if (deep && isBackendConfigured()) {
            const jobId = await startDeepResearchJob(topic, buildDeepInstructions(topic));
            return { mode: "job", jobId };
        }
        const result = await researchPipeline(topic, undefined, { deep });
        return { mode: "result", result };
    } catch (error) {
        console.error("Error starting research:", error);
        throw new Error("Failed to gather intelligence.");
    }
}

/** Poll a background deep-research job; synthesises the report when complete. */
export async function pollResearchJob(
    jobId: string,
    topic: string,
): Promise<{ status: DeepJobStatus["status"]; result?: ResearchResult; error?: string }> {
    await requireAdmin();
    try {
        const job = await getDeepResearchJob(jobId);
        if (job.status === "completed" && job.report) {
            const result = await synthesizeDeepReport(topic, job.report);
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

export async function createDraftFromResearch(
    researchResult: ResearchResult,
    format: DraftFormat,
    personaSlug: string,
    topic: string = ""
) {
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
        });

        // Deep Dives can exceed the 4096-token default — give them headroom
        // (matches /import; previously /create truncated long deep dives at 4096).
        const maxTokens = format === "deep_dive" ? 8192 : 4096;
        const responseText = await callClaude(systemPrompt, userPrompt, 0.4, maxTokens);

        const draft = parseDraftPayload(responseText);

        // Pass-3 (voice edit) → Pass-2 (metadata) → Sanity write — shared with /import.
        await finalizeDraft({
            draft,
            format,
            personaSlug,
            source: "generated",
            logPrefix: "/create",
        });

    } catch (error) {
        console.error("Error creating draft:", error);
        throw new Error("Failed to create draft.");
    }

    // Navigate to the embedded Sanity Studio to view the draft
    redirect("/studio/structure/article");
}
