'use server';

import { buildPrompt, extractArticleMetadata } from "@/lib/prompts";
import { callClaude } from "@/lib/anthropic";
import { createArticleInSanity, listSanityCategories } from "@/lib/sanity";
import { requireAdmin } from "@/lib/auth";

type ContentType = 'pulse' | 'signal' | 'deepdive' | 'guide';

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
        await requireAdmin();
        // 1. Build Prompts
        const requestedType = contentType as ContentType;
        const { systemPrompt, userPrompt } = await buildPrompt(topic, personaKey, requestedType);

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

        // 3b. Fetch category taxonomy, then extract SEO metadata + actionable
        // insights + category picks from the finished draft.
        // Best-effort: on failure the draft still saves without the extras.
        const categoryOptions = await listSanityCategories();
        const metadata = await extractArticleMetadata(
            title,
            content,
            personaKey,
            categoryOptions.map(c => ({ slug: c.slug, title: c.title, description: c.description })),
            requestedType === 'pulse' ? 'pulse' : undefined,
        );

        // Prefer the metadata call's meta description as the excerpt — it's tuned for <=160 chars.
        const finalExcerpt = metadata?.metaDescription ?? excerpt;

        // 4. Publish to Sanity
        const result = await createArticleInSanity({
            title,
            slug,
            excerpt: finalExcerpt,
            body: content, // The adapter converts this to blocks
            contentType: requestedType === 'pulse' ? 'signal' : requestedType,
            persona: personaKey,
            seoTitle: metadata?.seoTitle,
            metaDescription: metadata?.metaDescription,
            stoneTruth: metadata?.stoneTruth,
            actionableInsights: metadata?.actionableInsights,
            categorySlugs: metadata?.categorySlugs,
            intelligenceTier: requestedType === 'pulse' ? 'pulse' : metadata?.intelligenceTier,
            methodologyPillars: metadata?.methodologyPillars,
            source: 'generated',
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
