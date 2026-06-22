import 'server-only';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { apiVersion, dataset, projectId } from '../sanity/env';
import { CATEGORIES_QUERY } from '../sanity/lib/queries';
import { markdownToPortableText } from './markdown-to-portable-text';
import { CLAUDE_MODEL } from './anthropic';

const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
    console.warn("Missing SANITY_API_WRITE_TOKEN. Write operations will fail.");
}

export const writeClient = createClient({
    projectId,
    dataset,
    useCdn: false, // We want fresh data for writing
    apiVersion,
    token,
});

export interface ArticleData {
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    body: string; // Markdown
    contentType: 'signal' | 'deepdive' | 'guide' | 'youtube';
    persona: string;
    seoTitle?: string;
    metaDescription?: string;
    stoneTruth?: string;
    actionableInsights?: string[];
    categorySlugs?: string[];
    intelligenceTier?: 'pulse' | 'briefing' | 'audit';
    methodologyPillars?: string[];   // matrix-cell slugs
    source?: 'generated' | 'imported' | 'manual';
    sourceMaterial?: string;         // original text for imported articles
    voiceEditNotes?: string;         // Pass-3 voice-edit summary + [AUTHOR: …] list
    imagePrompts?: string[];         // two "what to depict" prompts for the main image
}

export interface CategoryOption {
    _id: string;
    title: string;
    slug: string;
    description?: string;
}

export async function listSanityCategories(): Promise<CategoryOption[]> {
    if (!token) return [];
    // Single source of truth for the category projection (shared with the public
    // read paths). Same projection {_id, title, slug, description}.
    return await writeClient.fetch(CATEGORIES_QUERY);
}

async function resolveCategoryRefs(slugs: string[]): Promise<{ _type: 'reference'; _ref: string; _key: string }[]> {
    if (!slugs.length) return [];
    const query = `*[_type == "category" && slug.current in $slugs]{ _id, "slug": slug.current }`;
    const rows: { _id: string; slug: string }[] = await writeClient.fetch(query, { slugs });
    const bySlug = new Map(rows.map(r => [r.slug, r._id]));
    return slugs
        .map(s => bySlug.get(s))
        .filter((id): id is string => !!id)
        .map(id => ({
            _type: 'reference' as const,
            _ref: id,
            _key: crypto.randomUUID().slice(0, 8),
        }));
}

export async function createArticleInSanity(data: ArticleData) {
    if (!token) throw new Error("Missing SANITY_API_WRITE_TOKEN");

    // Convert Markdown to Blocks
    const blocks = markdownToPortableText(data.body);

    // Map persona key to valid schema option
    // Schema: 'clara', 'ian', 'sofia', 'robert', 'citizen'
    // AI-Writer keys might differ, let's normalize or fallback
    const personaMap: Record<string, string> = {
        'compliance-clara': 'clara',
        'compliance_clara': 'clara',
        'industrial-ian': 'ian',
        'industrial_ian': 'ian',
        'sovereign-sofia': 'sofia',
        'sovereign_sofia': 'sofia',
        'remote-robert': 'robert',
        'remote_robert': 'robert',
        'global-citizen': 'citizen',
        'global_citizen': 'citizen'
    };

    const personaValue = personaMap[data.persona] || data.persona.split(' ')[0].toLowerCase(); // Fallback

    const docId = data.id || `drafts.${crypto.randomUUID()}`;

    const doc: { _id: string; _type: string; [key: string]: unknown } = {
        _id: docId,
        _type: 'article',
        title: data.title,
        slug: { _type: 'slug', current: data.slug },
        excerpt: data.excerpt,
        body: blocks,
        contentType: data.contentType,
        personas: [personaValue],
        // publisedAt removed to keep as draft
    };

    if (data.stoneTruth) doc.stoneTruth = data.stoneTruth;
    if (data.actionableInsights && data.actionableInsights.length > 0) {
        doc.actionableInsights = data.actionableInsights;
    }
    if (data.seoTitle || data.metaDescription) {
        doc.seo = {
            ...(data.seoTitle ? { metaTitle: data.seoTitle } : {}),
            ...(data.metaDescription ? { metaDescription: data.metaDescription } : {}),
        };
    }
    if (data.categorySlugs && data.categorySlugs.length > 0) {
        const refs = await resolveCategoryRefs(data.categorySlugs);
        if (refs.length > 0) doc.categories = refs;
    }
    if (data.intelligenceTier) {
        doc.intelligenceTier = data.intelligenceTier;
    }
    if (data.methodologyPillars && data.methodologyPillars.length > 0) {
        doc.methodologyPillars = data.methodologyPillars;
    }
    if (data.source) doc.source = data.source;
    if (data.sourceMaterial) doc.sourceMaterial = data.sourceMaterial;
    if (data.voiceEditNotes) doc.voiceEditNotes = data.voiceEditNotes;
    if (data.imagePrompts && data.imagePrompts.length > 0) {
        doc.imagePrompts = {
            prompts: data.imagePrompts,
            generatedAt: new Date().toISOString(),
            model: CLAUDE_MODEL,
        };
    }

    return await writeClient.createOrReplace(doc);
}

export async function deleteArticleInSanity(slug: string) {
    if (!token) return; // Skip if no token
    try {
        // Resolve real document ids by slug rather than reconstructing an ID, so
        // this works regardless of the id scheme used at creation time:
        //   - legacy sync flow:  draft.${fileSlug}      (a published doc)
        //   - AI-draft flow:     drafts.${uuid}         (a true Sanity draft)
        //   - any published twin
        const ids: string[] = await writeClient.fetch(
            `*[_type == "article" && slug.current == $slug]._id`,
            { slug }
        );
        const targets = new Set<string>(ids);
        // Always include the legacy deterministic id as a belt-and-braces fallback.
        targets.add(`draft.${slug}`);
        // Remove the drafts.* twin for any published id we found.
        for (const id of [...targets]) {
            if (!id.startsWith('drafts.')) targets.add(`drafts.${id}`);
        }
        await Promise.all(
            [...targets].map((id) =>
                writeClient.delete(id).catch(() => {
                    /* missing id is fine — nothing to delete */
                })
            )
        );
    } catch (e) {
        console.error("Failed to delete from Sanity:", e);
    }
}

export interface SanityArticle {
    _id: string;
    title: string;
    slug: { current: string };
    _createdAt: string;
    publishedAt?: string;
    excerpt?: string;
    contentType: string;
    mainImage?: {
        asset: {
            url: string;
        };
        alt?: string;
    };
}

export async function listSanityArticles(): Promise<SanityArticle[]> {
    if (!token) return [];
    // Fetch all articles, sorted by creation date
    const query = `*[_type == "article"] | order(_createdAt desc) {
        _id,
        title,
        slug,
        _createdAt,
        contentType
    }`;
    return await writeClient.fetch(query);
}

export async function listPublishedArticles(): Promise<SanityArticle[]> {
    if (!token) return [];
    // Filter out drafts explicitly since we are using a token
    const query = `*[_type == "article" && !(_id in path("drafts.**"))] | order(publishedAt desc, _createdAt desc) {
        _id,
        title,
        slug,
        "publishedAt": coalesce(publishedAt, _createdAt),
        excerpt,
        contentType,
        mainImage {
            asset -> {
                url
            },
            alt
        }
    }[0...10]`;
    return await writeClient.fetch(query);
}

export interface PersonaData {
    _id: string;
    name: string;
    role: string;
    slug: { current: string };
    painPoints: string;
    contentNeeds: string[];
    organizationTypes: string[];
    keyConcerns: string[];
}

export async function listSanityPersonas(): Promise<PersonaData[]> {
    if (!token) return [];
    const query = `*[_type == "persona"] | order(name asc) {
        _id,
        name,
        role,
        slug
    }`;
    return await writeClient.fetch(query);
}

export async function getSanityPersona(slug: string): Promise<PersonaData | null> {
    if (!token) return null;
    const query = `*[_type == "persona" && slug.current == $slug][0]`;
    return await writeClient.fetch(query, { slug });
}
