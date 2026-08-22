import 'server-only';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { apiVersion, dataset, projectId } from '../sanity/env';
import { CATEGORIES_QUERY } from '../sanity/lib/queries';
import { markdownToPortableText, stripAuthoringPreamble } from './markdown-to-portable-text';
import { CLAUDE_MODEL } from './anthropic';
import { normalizeUrl } from './citations';
import { keyedReferences, reference } from './knowledge/ids';

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
    quotationAudit?: string;         // statutory quotations checked against the retrieved text
    imagePrompts?: string[];         // two "what to depict" prompts for the main image
    /**
     * What the drafting model was actually given to write from, recorded in the
     * internal provenance group — NOT the public Sources list, which stays
     * authored by hand. An editor promotes the ones that belong to the reader
     * with the "Add from research" control on the Sources field.
     */
    citationSnapshots?: ResearchSnapshot[];
    /**
     * Article lineage — wave 2. Passed by the caller that actually has it, never
     * derived here: this function is the single funnel for /create, /import and
     * the local-draft `save`, and deriving lineage inside it would give an
     * imported article a provenance block describing a run that never happened.
     *
     * `researchRunId` and `priorCoverageArticleIds` are references and follow
     * their targets; `generationSnapshot` is a snapshot and must read the same
     * in a year. That split is why the article schema separates them, and it is
     * the constraint most easily lost by treating provenance as one blob.
     */
    researchRunId?: string;
    /** Sanity `_id`s of the earlier articles the prior-coverage lane injected. */
    priorCoverageArticleIds?: string[];
    generationSnapshot?: GenerationSnapshot;
}

/** What was in force when this draft was generated. Every field optional, and
 * an absent one means nobody knew — not that the answer was nothing. */
export interface GenerationSnapshot {
    generatedAt?: string;
    model?: string;
    embeddingModel?: string;
    rulesVersion?: string;
    rulePackVersion?: string;
    /** Every record id retrieval returned, across all lanes. */
    retrievalRecordIds?: string[];
    notes?: string;
}

/** One source as the research pass returned it, for `citationSnapshots`. */
export interface ResearchSnapshot {
    title?: string;
    url?: string;
    publisher?: string;
    publishedDate?: string;
    locator?: string;
}

export interface CategoryOption {
    _id: string;
    title: string;
    slug: string;
    description?: string;
}

/**
 * Shape research sources into `citationSnapshot` array members, dropping
 * repeats. Uses the shared URL rule so a snapshot an editor later promotes to
 * the Sources list dedupes correctly against what the fact-check appends.
 * Entries with no URL are kept — a snapshot's job is to record what was there.
 */
function dedupeSnapshots(snapshots: ResearchSnapshot[]) {
    const seen = new Set<string>();
    const out: Array<ResearchSnapshot & { _type: 'citationSnapshot'; _key: string }> = [];
    for (const snap of snapshots) {
        const normalized = snap.url ? normalizeUrl(snap.url) : null;
        if (normalized) {
            if (seen.has(normalized)) continue;
            seen.add(normalized);
        }
        out.push({
            _type: 'citationSnapshot',
            _key: crypto.randomUUID().slice(0, 8),
            ...(snap.title ? { title: snap.title } : {}),
            ...(snap.url ? { url: snap.url } : {}),
            ...(snap.publisher ? { publisher: snap.publisher } : {}),
            ...(snap.publishedDate ? { publishedDate: snap.publishedDate } : {}),
            ...(snap.locator ? { locator: snap.locator } : {}),
        });
    }
    return out;
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

    // Convert Markdown to Blocks. Every generation path lands here (/create,
    // /import and the local-draft `save` command, which skips finalizeDraft), so
    // this is the one place that guarantees the newsletter furniture the voice
    // pass adds — duplicate `# Title`, `**Subject Line:**`, `**Preview Text:**`,
    // `## Article` — never becomes visible body copy.
    const blocks = markdownToPortableText(stripAuthoringPreamble(data.body, data.title));

    // Map persona key to valid schema option
    // Schema: 'clara', 'ian', 'sofia', 'citizen'
    // AI-Writer keys might differ, let's normalize or fallback.
    // The retired Remote Robert persona normalises to Global Citizen so any
    // legacy generator output lands on a valid persona instead of erroring.
    const personaMap: Record<string, string> = {
        'compliance-clara': 'clara',
        'compliance_clara': 'clara',
        'industrial-ian': 'ian',
        'industrial_ian': 'ian',
        'sovereign-sofia': 'sofia',
        'sovereign_sofia': 'sofia',
        'remote-robert': 'citizen',
        'remote_robert': 'citizen',
        'global-citizen': 'citizen',
        'global_citizen': 'citizen',
        'transatlantic-troy': 'troy',
        'transatlantic_troy': 'troy'
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
    if (data.quotationAudit) doc.quotationAudit = data.quotationAudit;
    if (data.imagePrompts && data.imagePrompts.length > 0) {
        doc.imagePrompts = {
            prompts: data.imagePrompts,
            generatedAt: new Date().toISOString(),
            model: CLAUDE_MODEL,
        };
    }
    if (data.researchRunId) {
        doc.researchRun = reference(data.researchRunId);
    }
    if (data.priorCoverageArticleIds && data.priorCoverageArticleIds.length > 0) {
        // The knowledge module's own helpers: keys derived from the target, so
        // regenerating a draft produces a byte-identical array instead of one
        // that merely looks changed.
        doc.priorCoverage = keyedReferences(data.priorCoverageArticleIds);
    }
    if (data.generationSnapshot) {
        const snapshot = Object.fromEntries(
            Object.entries(data.generationSnapshot).filter(([, v]) => v !== undefined),
        );
        if (Object.keys(snapshot).length > 0) doc.generationSnapshot = snapshot;
    }
    if (data.citationSnapshots && data.citationSnapshots.length > 0) {
        // Everything the model was handed, deduped by URL but not filtered:
        // this is a provenance record, so a source that turned out to be
        // useless is still part of what the draft was written from.
        doc.citationSnapshots = dedupeSnapshots(data.citationSnapshots);
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
    // perspective: 'raw' — on recent apiVersions the client defaults to the
    // 'published' perspective, which hides drafts.* entirely. Without this the
    // library shows only published articles, so every generated draft is
    // invisible and an article vanishes the moment it is unpublished.
    const docs = await writeClient.fetch<SanityArticle[]>(query, {}, { perspective: 'raw' });

    // An article with unpublished edits exists twice under 'raw'. Collapse the
    // twins to one row per article, preferring the published variant so the
    // badge reflects what the public site is actually serving.
    const byBaseId = new Map<string, SanityArticle>();
    for (const doc of docs) {
        const baseId = doc._id.replace(/^drafts\./, '');
        const existing = byBaseId.get(baseId);
        if (!existing || existing._id.startsWith('drafts.')) byBaseId.set(baseId, doc);
    }
    return [...byBaseId.values()];
}

export async function listPublishedArticles(): Promise<SanityArticle[]> {
    if (!token) return [];
    // Filter out drafts explicitly since we are using a token
    const query = `*[_type == "article" && !(_id in path("drafts.**"))] | order(coalesce(publishedAt, _updatedAt) desc) {
        _id,
        title,
        slug,
        "publishedAt": coalesce(publishedAt, _updatedAt),
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
