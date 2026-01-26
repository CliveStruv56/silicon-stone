'use server';

import { buildPrompt } from "@/lib/prompts";
import { callClaude } from "@/lib/anthropic";
import { createArticleInSanity } from "@/lib/sanity";

type ContentType = 'signal' | 'deepdive' | 'guide';

interface ActionState {
    success: boolean;
    message: string;
    path: string;
    id?: string;
}

export async function generateContent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const topic = formData.get('topic') as string;
    const personaKey = formData.get('persona') as string;
    const contentType = formData.get('type') as string;

    if (!topic || !personaKey || !contentType) {
        return { success: false, message: "Missing required fields", path: "" };
    }

    try {
        // 1. Build Prompts
        const { systemPrompt, userPrompt } = await buildPrompt(topic, personaKey, contentType as ContentType);

        // 2. Call AI
        const content = await callClaude(systemPrompt, userPrompt);

        // 3. Parse Content
        const lines = content.split('\n');

        // Extract Title (first # Header)
        let title = topic; // fallback
        for (const line of lines) {
            if (line.startsWith('# ')) {
                title = line.replace(/^#\s*/, '').trim();
                break;
            }
        }

        // Extract Excerpt (Subject Line or Preview Text)
        let excerpt = "";
        for (const line of lines) {
            if (line.startsWith('**Subject Line:**') || line.startsWith('**Preview Text:**')) {
                excerpt = line.replace(/\*\*.*:\*\*\s*/, '').trim();
                break;
            }
        }
        // Fallback excerpt
        if (!excerpt) {
            const firstPara = lines.find((l: string) => l.trim() && !l.startsWith('#') && !l.startsWith('*'));
            excerpt = firstPara ? firstPara.slice(0, 150) + "..." : "New draft analysis.";
        }

        // Generate Slug
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50) + '-' + Date.now().toString().slice(-4);

        // 4. Publish to Sanity
        const result = await createArticleInSanity({
            title,
            slug,
            excerpt,
            body: content, // The adapter converts this to blocks
            contentType: contentType as ContentType,
            persona: personaKey,
        });

        return {
            success: true,
            message: `Draft created in Sanity! (ID: ${result._id})`,
            path: `/analysis/${slug}`,
            id: result._id
        };
    } catch (error) {
        console.error("Generation Error:", error);
        return {
            success: false,
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            path: ""
        };
    }
}
