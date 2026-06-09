'use server';

import { performResearch } from "@/lib/research";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { finalizeDraft } from "@/lib/draft-pipeline";
import { ResearchResult, ResearchSource } from "@/types/research";

type ResearchState =
    | { success: false; data: null; error?: string }
    | { success: true; data: ResearchResult; error?: undefined };

export async function researchTopic(_prevState: ResearchState, formData: FormData): Promise<ResearchState> {
    const query = formData.get('query') as string;

    if (!query) {
        return { success: false, data: null, error: "Query required" };
    }

    try {
        await requireAdmin();
        const cookieStore = await cookies();
        const token = cookieStore.get('inoreader_access_token')?.value;

        const result = await performResearch(query, token);
        return { success: true, data: result, error: undefined };
    } catch (error) {
        console.error(error);
        return { success: false, data: null, error: "Research failed" };
    }
}

export async function createDraftFromResearch(summary: string, topic: string, sources: ResearchSource[] = []) {
    if (!summary || !topic) return { success: false, message: "Missing data" };

    try {
        await requireAdmin();
        const { callClaude } = await import("@/lib/anthropic");
        const { buildDraftPrompt } = await import("@/lib/prompts");
        const { parseDraftPayload } = await import("@/lib/draft-pipeline");

        // Format sources as context for Claude
        const sourcesContext = sources.length > 0
            ? sources.map(s => `- ${s.title}: ${s.snippet}`).join('\n')
            : "No additional sources.";

        const { systemPrompt, userPrompt } = await buildDraftPrompt({
            topic,
            personaKey: 'global-citizen',
            format: 'signal',
            research: {
                summary,
                sources,
                painPoints: [],
                keywords: [],
            },
            priorCoverage: sourcesContext === "No additional sources." ? undefined : sourcesContext,
        });
        const responseText = await callClaude(systemPrompt, userPrompt);
        const draft = parseDraftPayload(responseText);

        const result = await finalizeDraft({
            draft,
            format: 'signal',
            personaSlug: 'global-citizen',
            source: 'generated',
            logPrefix: '/research',
        });

        return {
            success: true,
            id: result._id,
            message: `Full article draft created in Sanity!`
        };
    } catch (e) {
        console.error("Failed to create draft in Sanity", e);
        return { success: false, message: `Failed to create draft: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
}
