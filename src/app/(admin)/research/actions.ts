'use server';

import { performResearch } from "@/lib/research";
import { cookies } from "next/headers";
import { createArticleInSanity } from "@/lib/sanity";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
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
        // Import dynamically to avoid circular deps
        const { callClaude } = await import("@/lib/anthropic");
        const { getVoiceDNA, getBusinessProfile } = await import("@/lib/api");

        // Format sources as context for Claude
        const sourcesContext = sources.length > 0
            ? sources.map(s => `- ${s.title}: ${s.snippet}`).join('\n')
            : "No additional sources.";

        // Get voice and profile for consistent tone
        const [voice, profile] = await Promise.all([
            getVoiceDNA(),
            getBusinessProfile()
        ]);

        const currentYear = new Date().getFullYear();

        const systemPrompt = `You are "Silicon & Stone", a forensic technopolitical analyst.
Your mission: ${profile.positioning.unique_angle}.
Your voice: ${voice.personality.traits.join(", ")}.
Keywords: ${voice.vocabulary.keywords_2026.join(", ")}.

NEVER use hype words: ${voice.voice_boundaries.never_uses_phrases.join(", ")}.
ALWAYS be: ${voice.emotional_range.primary_emotions.join(", ")}.

IMPORTANT: The current year is ${currentYear}. Always use ${currentYear} for any date references or copyright notices.`;

        const userPrompt = `Write a "Signal" analysis piece (800-1200 words) about: "${topic}".

RESEARCH CONTEXT:
Initial Analysis: ${summary}

Sources Found:
${sourcesContext}

Format: Markdown.
Goal: "What just happened and what does it actually mean?"

Structure:
# [Headline: Specific & Urgent]

**Executive Summary**: 3 bullet points on why this matters.

## The Signal
What actually happened? (Facts, not hype).

## The Noise
What is the mainstream getting wrong? (Cut through the hype).

## Forensic Analysis
Apply the "Silicon vs Stone" lens.
- Silicon aspect: (Tech/Code speed)
- Stone aspect: (Regulation/Geography/Sovereignty friction)

## Strategic Implication
Three specific impacts:
1. [Impact 1]
2. [Impact 2]
3. [Impact 3]

## The Long View
Conclusion with forward-looking perspective.

## Sources
Reference the sources from the research.

Tone: Clinical, urgent, actionable.`;

        // Generate the full article with Claude
        const content = await callClaude(systemPrompt, userPrompt);

        // Extract title from generated content
        const lines = content.split('\n');
        let title = topic;
        for (const line of lines) {
            if (line.startsWith('# ')) {
                title = line.replace(/^#\s*/, '').trim();
                break;
            }
        }

        // Extract excerpt
        let excerpt = summary.substring(0, 200) + "...";
        const execSummaryMatch = content.match(/\*\*Executive Summary\*\*:?([\s\S]*?)(?=\n##|\n\*\*)/);
        if (execSummaryMatch) {
            excerpt = execSummaryMatch[1].trim().substring(0, 200) + "...";
        }

        // Generate slug
        const slug = slugify(topic).substring(0, 50) + '-' + Date.now().toString().slice(-4);

        // Create in Sanity as unpublished draft
        const result = await createArticleInSanity({
            title,
            slug,
            excerpt,
            body: content,
            contentType: 'signal',
            persona: 'global_citizen',
        });

        return {
            success: true,
            id: result._id,
            slug,
            message: `Full article draft created in Sanity!`
        };
    } catch (e) {
        console.error("Failed to create draft in Sanity", e);
        return { success: false, message: `Failed to create draft: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
}
