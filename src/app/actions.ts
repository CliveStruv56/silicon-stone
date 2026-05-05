'use server';

import { buildPrompt, buildMetadataPrompt, type CategoryChoice } from "@/lib/prompts";
import { callClaude } from "@/lib/anthropic";
import { createArticleInSanity, listSanityCategories } from "@/lib/sanity";
import { logErrorToFile } from "@/lib/debug";

type ContentType = 'signal' | 'deepdive' | 'guide';

interface ArticleMetadata {
    seoTitle?: string;
    metaDescription?: string;
    stoneTruth?: string;
    actionableInsights?: string[];
    categorySlugs?: string[];
    intelligenceTier?: 'pulse' | 'briefing' | 'audit';
    methodologyPillars?: string[];
}

async function extractArticleMetadata(
    title: string,
    body: string,
    personaKey: string,
    categories: CategoryChoice[],
): Promise<ArticleMetadata | null> {
    let raw = "";
    try {
        const { systemPrompt, userPrompt } = await buildMetadataPrompt(title, body, personaKey, categories);
        raw = await callClaude(systemPrompt, userPrompt);

        const firstOpen = raw.indexOf('{');
        const lastClose = raw.lastIndexOf('}');
        if (firstOpen === -1 || lastClose === -1) throw new Error("No JSON object in metadata response");

        const parsed = JSON.parse(raw.substring(firstOpen, lastClose + 1));

        const clamp = (s: unknown, max: number): string | undefined => {
            if (typeof s !== 'string') return undefined;
            const trimmed = s.trim();
            if (!trimmed) return undefined;
            return trimmed.length > max ? trimmed.slice(0, max).trimEnd() : trimmed;
        };

        const insights = Array.isArray(parsed.actionableInsights)
            ? parsed.actionableInsights
                .map((i: unknown) => (typeof i === 'string' ? i.trim() : ''))
                .filter((i: string) => i.length > 0)
                .slice(0, 5)
            : [];

        const allowedSlugs = new Set(categories.map(c => c.slug));
        const rawSlugs = Array.isArray(parsed.categorySlugs)
            ? parsed.categorySlugs
                .map((s: unknown) => (typeof s === 'string' ? s.trim() : ''))
                .filter((s: string) => allowedSlugs.has(s))
                .slice(0, 2)
            : [];

        const VALID_TIERS = ['pulse', 'briefing', 'audit'] as const;
        type IntelligenceTier = typeof VALID_TIERS[number];
        const intelligenceTier: IntelligenceTier | undefined =
            (VALID_TIERS as readonly string[]).includes(parsed.intelligenceTier)
                ? (parsed.intelligenceTier as IntelligenceTier)
                : undefined;

        const VALID_CELLS = [
            'supply-chain-scenario-modelling',
            'supply-chain-long-memory-filter',
            'policy-scenario-modelling',
            'policy-long-memory-filter',
            'talent-scenario-modelling',
            'talent-long-memory-filter',
        ];
        const methodologyPillars: string[] | undefined = (() => {
            if (!Array.isArray(parsed.methodologyPillars)) return undefined;
            const filtered = (parsed.methodologyPillars as unknown[]).filter(
                (p: unknown): p is string =>
                    typeof p === 'string' && VALID_CELLS.includes(p)
            );
            const cells = Array.from(new Set<string>(filtered)).slice(0, 6);
            return cells.length > 0 ? cells : undefined;
        })();

        return {
            seoTitle: clamp(parsed.seoTitle, 60),
            metaDescription: clamp(parsed.metaDescription, 160),
            stoneTruth: clamp(parsed.stoneTruth, 160),
            actionableInsights: insights.length >= 3 ? insights : undefined,
            categorySlugs: rawSlugs.length > 0 ? rawSlugs : undefined,
            intelligenceTier,
            methodologyPillars,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logErrorToFile(`METADATA EXTRACTION FAILED: ${message}\n\nRAW:\n${raw}`);
        return null;
    }
}

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

        // 3b. Fetch category taxonomy, then extract SEO metadata + actionable
        // insights + category picks from the finished draft.
        // Best-effort: on failure the draft still saves without the extras.
        const categoryOptions = await listSanityCategories();
        const metadata = await extractArticleMetadata(
            title,
            content,
            personaKey,
            categoryOptions.map(c => ({ slug: c.slug, title: c.title, description: c.description })),
        );

        // Prefer the metadata call's meta description as the excerpt — it's tuned for <=160 chars.
        const finalExcerpt = metadata?.metaDescription ?? excerpt;

        // 4. Publish to Sanity
        const result = await createArticleInSanity({
            title,
            slug,
            excerpt: finalExcerpt,
            body: content, // The adapter converts this to blocks
            contentType: contentType as ContentType,
            persona: personaKey,
            seoTitle: metadata?.seoTitle,
            metaDescription: metadata?.metaDescription,
            stoneTruth: metadata?.stoneTruth,
            actionableInsights: metadata?.actionableInsights,
            categorySlugs: metadata?.categorySlugs,
            intelligenceTier: metadata?.intelligenceTier,
            methodologyPillars: metadata?.methodologyPillars,
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
