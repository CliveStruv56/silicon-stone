import 'server-only';
import { extractArticleMetadata, runVoiceEditPass, type DraftFormat } from './prompts';
import { createArticleInSanity, listSanityCategories } from './sanity';
import { slugify } from './utils';

/**
 * Shared draft-finalisation pipeline used by both /create and /import.
 *
 * Both routes generate a draft via the same prompt builder, then run the
 * identical Pass-3 (voice edit) → Pass-2 (metadata) → Sanity-write sequence.
 * That sequence — and the JSON extraction / validation in front of it — lived
 * duplicated (and subtly diverging) in two server actions; it now lives here.
 */

/** Slice the first `{ … }` object out of a model response (tolerates fences/prose). */
export function extractJsonObject(raw: string): string {
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    return first !== -1 && last !== -1 ? raw.slice(first, last + 1) : raw;
}

export interface ParsedDraft {
    title: string;
    excerpt: string;
    content: string;
    keywords?: string[];
}

/**
 * Parse + validate a model draft response. Requires `title` and `content`;
 * `excerpt` is optional (the metadata pass usually supplies a meta description).
 * Throws on malformed payloads so callers share one validation contract.
 */
export function parseDraftPayload(raw: string): ParsedDraft {
    const parsed = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const content = typeof parsed.content === 'string' ? parsed.content.trim() : '';
    if (!title || !content) {
        throw new Error('The model returned an unexpected draft payload (missing title or content).');
    }
    const excerpt = typeof parsed.excerpt === 'string' ? parsed.excerpt.trim() : '';
    const keywords = Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((k): k is string => typeof k === 'string')
        : undefined;
    return { title, excerpt, content, keywords };
}

function contentTypeForFormat(format: DraftFormat): 'signal' | 'deepdive' | 'guide' | 'youtube' {
    switch (format) {
        case 'youtube':
            return 'youtube';
        case 'deep_dive':
            return 'deepdive';
        case 'guide':
            return 'guide';
        default:
            // pulse + signal both map to the "signal" content type.
            return 'signal';
    }
}

export interface FinalizeDraftInput {
    draft: ParsedDraft;
    format: DraftFormat;
    personaSlug: string;
    source: 'generated' | 'imported';
    /** Verbatim original, kept on imported articles. */
    sourceMaterial?: string;
    /** Log label, e.g. "/create" or "/import". */
    logPrefix?: string;
}

/**
 * Run Pass-3 (voice edit) then Pass-2 (metadata), assemble the article payload
 * and write it to Sanity as a draft. Both passes are best-effort: a failure logs
 * and the draft still saves. Pass-3 runs first so the metadata reflects the
 * edited body. Returns the created Sanity document.
 */
export async function finalizeDraft({
    draft,
    format,
    personaSlug,
    source,
    sourceMaterial,
    logPrefix = 'draft',
}: FinalizeDraftInput) {
    // Pass 3 — humanising voice edit (Deep Dives audit-only, others rewritten).
    let voiceEditNotes: string | undefined;
    try {
        const edit = await runVoiceEditPass(draft.title, draft.content, format);
        if (edit) {
            draft.content = edit.content;
            voiceEditNotes = edit.editSummary;
        }
    } catch (err) {
        console.error(`[${logPrefix}] Voice edit pass failed:`, err);
    }

    // Pass 2 — SEO / insights / taxonomy / tier / matrix-cell extraction.
    let metadata: Awaited<ReturnType<typeof extractArticleMetadata>> | undefined;
    try {
        const categoryOptions = await listSanityCategories();
        metadata = await extractArticleMetadata(
            draft.title,
            draft.content,
            personaSlug,
            categoryOptions,
            format === 'pulse' ? 'pulse' : undefined,
        );
    } catch (err) {
        console.error(`[${logPrefix}] Metadata extraction failed:`, err);
    }

    return createArticleInSanity({
        title: draft.title,
        slug: slugify(draft.title),
        excerpt: metadata?.metaDescription ?? draft.excerpt ?? '',
        body: draft.content,
        contentType: contentTypeForFormat(format),
        persona: personaSlug,
        seoTitle: metadata?.seoTitle,
        metaDescription: metadata?.metaDescription,
        stoneTruth: metadata?.stoneTruth,
        actionableInsights: metadata?.actionableInsights,
        categorySlugs: metadata?.categorySlugs,
        intelligenceTier: format === 'pulse' ? 'pulse' : metadata?.intelligenceTier,
        methodologyPillars: metadata?.methodologyPillars,
        voiceEditNotes,
        source,
        ...(sourceMaterial ? { sourceMaterial } : {}),
    });
}
