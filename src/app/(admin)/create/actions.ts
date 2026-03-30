"use server";

import { redirect } from "next/navigation";
import { performResearch as researchPipeline } from "@/lib/research";
import { callClaude } from "@/lib/anthropic";
import { createArticleInSanity } from "@/lib/sanity";
import { ResearchResult } from "@/types/research";

export async function performResearch(topic: string) {
    try {
        const result = await researchPipeline(topic);
        return result;
    } catch (error) {
        console.error("Error performing research:", error);
        throw new Error("Failed to gather intelligence.");
    }
}

export async function createDraftFromResearch(
    researchResult: ResearchResult,
    format: "signal" | "deep_dive",
    personaSlug: string
) {
    try {
        const isDeepDive = format === "deep_dive";
        const wordCount = isDeepDive ? "3000+" : "800";

        // Construct the prompt for Claude
        const systemPrompt = `
You are writing a ${format.replace('_', ' ')} (approx ${wordCount} words) for the brand "Silicon & Stone".
The target persona slug is: ${personaSlug}
Your task is to write the full article draft using the provided forensic research.

Please output ONLY a JSON object with the following structure:
{
  "title": "A compelling, forensic title",
  "excerpt": "A short, punchy 2-sentence summary",
  "content": "The full article content in markdown format",
  "keywords": ["keyword1", "keyword2"]
}
`;

        const userMessage = `
=== RESEARCH SUMMARY ===
${researchResult.summary}

=== PAIN POINTS & KEYWORDS ===
${[...researchResult.suggestedContext.pain_points, ...researchResult.suggestedContext.keywords].join(', ')}
`;

        const responseText = await callClaude(systemPrompt, userMessage);
        const parsedData = JSON.parse(responseText);

        const sanityArticle = {
            title: parsedData.title,
            slug: parsedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            excerpt: parsedData.excerpt,
            body: parsedData.content,
            contentType: (format === "deep_dive" ? "deepdive" : "signal") as "signal" | "deepdive" | "guide",
            persona: personaSlug
        };

        await createArticleInSanity(sanityArticle);

    } catch (error) {
        console.error("Error creating draft:", error);
        throw new Error("Failed to create draft.");
    }

    // Navigate to the embedded Sanity Studio to view the draft
    redirect("/studio/structure/article");
}
