'use server';

import { performResearch } from "@/lib/research";
import { cookies } from "next/headers";
import { createArticleInSanity } from "@/lib/sanity";
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
        // Format sources as markdown for the body
        const sourcesMd = sources.length > 0
            ? sources.map(s => `- [${s.title}](${s.url})\n  > ${s.snippet.substring(0, 150)}...`).join('\n\n')
            : "No sources provided.";

        // Build markdown body
        const body = `## Executive Summary

${summary}

## Key Sources

${sourcesMd}

## Analysis Notes

*Generated from Research Agent - ready for expansion.*
`;

        // Generate slug
        const slug = slugify(topic).substring(0, 50) + '-' + Date.now().toString().slice(-4);

        // Create in Sanity as unpublished draft
        const result = await createArticleInSanity({
            title: topic,
            slug,
            excerpt: summary.substring(0, 200) + "...",
            body,
            contentType: 'signal', // Default to signal, can be changed in Studio
            persona: 'global_citizen', // Default persona
        });

        return {
            success: true,
            id: result._id,
            slug,
            message: `Draft created in Sanity!`
        };
    } catch (e) {
        console.error("Failed to create draft in Sanity", e);
        return { success: false, message: `Failed to create draft: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
}
