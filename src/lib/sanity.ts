import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { apiVersion, dataset, projectId } from '../sanity/env';

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
}

export interface CategoryOption {
    _id: string;
    title: string;
    slug: string;
    description?: string;
}

export async function listSanityCategories(): Promise<CategoryOption[]> {
    if (!token) return [];
    const query = `*[_type == "category"] | order(title asc) {
        _id,
        title,
        "slug": slug.current,
        description
    }`;
    return await writeClient.fetch(query);
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

    return await writeClient.createOrReplace(doc);
}

export async function deleteArticleInSanity(slug: string) {
    if (!token) return; // Skip if no token
    // We used a deterministic ID: draft.slug
    const id = `draft.${slug}`;
    try {
        await writeClient.delete(id);
    } catch (e) {
        console.error("Failed to delete from Sanity:", e);
    }
}

// --- Converter Logic (Ported from sync-content.ts) ---

function markdownToPortableText(markdown: string): unknown[] {
    const blocks: unknown[] = [];
    const lines = markdown.split('\n');
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            const text = currentParagraph.join(' ').trim();
            if (text) {
                blocks.push({
                    _type: 'block',
                    _key: crypto.randomUUID().slice(0, 8),
                    style: 'normal',
                    markDefs: [],
                    children: parseInlineMarkdown(text),
                });
            }
            currentParagraph = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim() === '---') {
            flushParagraph();
            continue;
        }

        if (line.startsWith('### ')) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                _key: crypto.randomUUID().slice(0, 8),
                style: 'h3',
                markDefs: [],
                children: [{ _type: 'span', _key: crypto.randomUUID().slice(0, 8), text: line.replace(/^###\s*/, ''), marks: [] }],
            });
            continue;
        }

        if (line.startsWith('## ')) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                _key: crypto.randomUUID().slice(0, 8),
                style: 'h2',
                markDefs: [],
                children: [{ _type: 'span', _key: crypto.randomUUID().slice(0, 8), text: line.replace(/^##\s*/, ''), marks: [] }],
            });
            continue;
        }

        if (line.startsWith('# ')) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                _key: crypto.randomUUID().slice(0, 8),
                style: 'h1',
                markDefs: [],
                children: [{ _type: 'span', _key: crypto.randomUUID().slice(0, 8), text: line.replace(/^#\s*/, ''), marks: [] }],
            });
            continue;
        }

        // Handle bullet lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                _key: crypto.randomUUID().slice(0, 8),
                style: 'normal',
                listItem: 'bullet',
                level: 1,
                markDefs: [],
                children: parseInlineMarkdown(line.replace(/^[-*]\s*/, '')),
            });
            continue;
        }

        // Handle numbered lists
        if (/^\d+\.\s/.test(line)) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                _key: crypto.randomUUID().slice(0, 8),
                style: 'normal',
                listItem: 'number',
                level: 1,
                markDefs: [],
                children: parseInlineMarkdown(line.replace(/^\d+\.\s*/, '')),
            });
            continue;
        }

        if (line.trim() === '') {
            flushParagraph();
            continue;
        }

        if (line.startsWith('> ')) {
            flushParagraph();
            blocks.push({
                _type: 'block',
                _key: crypto.randomUUID().slice(0, 8),
                style: 'blockquote',
                markDefs: [],
                children: parseInlineMarkdown(line.replace(/^>\s*/, '')),
            });
            continue;
        }

        currentParagraph.push(line);
    }

    flushParagraph();
    return blocks;
}

function parseInlineMarkdown(text: string): unknown[] {
    // Simplified inline parser (matches sync-content.ts)
    const parts: { text: string; bold: boolean }[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    let currentIndex = 0;

    while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > currentIndex) {
            parts.push({ text: text.slice(currentIndex, match.index), bold: false });
        }
        parts.push({ text: match[1], bold: true });
        currentIndex = match.index + match[0].length;
    }

    if (currentIndex < text.length) {
        parts.push({ text: text.slice(currentIndex), bold: false });
    }

    if (parts.length === 0) {
        return [{ _type: 'span', _key: crypto.randomUUID().slice(0, 8), text, marks: [] }];
    }

    return parts.map(part => ({
        _type: 'span',
        _key: crypto.randomUUID().slice(0, 8),
        text: part.text,
        marks: part.bold ? ['strong'] : [],
    }));
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
