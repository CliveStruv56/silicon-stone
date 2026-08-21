import 'server-only';
import { extractArticleMetadata, runVoiceEditPass, type DraftFormat } from './prompts';
import { buildImagePrompts } from './image-prompts';
import { createArticleInSanity, listSanityCategories, type GenerationSnapshot } from './sanity';
import { slugify } from './utils';
import { auditQuotations, formatQuotationAudit } from './quotation-audit';
import type { ResearchSource } from '@/types/research';

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

const DRAFT_MARKERS = {
    title: '===TITLE===',
    excerpt: '===EXCERPT===',
    keywords: '===KEYWORDS===',
    content: '===CONTENT===',
} as const;

/** Text after `start`, up to the earliest of `nexts` that follows it (or end). */
function sliceSection(raw: string, start: string, nexts: string[] = []): string {
    const from = raw.indexOf(start);
    if (from === -1) return '';
    const begin = from + start.length;
    let end = raw.length;
    for (const marker of nexts) {
        const at = raw.indexOf(marker, begin);
        if (at !== -1 && at < end) end = at;
    }
    return raw.slice(begin, end).trim();
}

/**
 * Parse the delimiter format (see buildDraftPrompt). Returns null if the
 * required markers aren't present, so the caller can fall back to JSON.
 * Robust to multi-line markdown — no escaping needed, unlike a JSON string value.
 */
function parseDelimitedDraft(raw: string): ParsedDraft | null {
    if (!raw.includes(DRAFT_MARKERS.title) || !raw.includes(DRAFT_MARKERS.content)) return null;
    const { title: T, excerpt: E, keywords: K, content: C } = DRAFT_MARKERS;
    const keywordsRaw = sliceSection(raw, K, [C]);
    const keywords = keywordsRaw
        ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)
        : undefined;
    return {
        title: sliceSection(raw, T, [E, K, C]),
        excerpt: sliceSection(raw, E, [K, C]),
        content: sliceSection(raw, C),
        keywords: keywords?.length ? keywords : undefined,
    };
}

/** Legacy JSON shape `{ title, excerpt, content, keywords }`. Throws on invalid JSON. */
function parseJsonDraft(raw: string): ParsedDraft {
    const parsed = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
    return {
        title: typeof parsed.title === 'string' ? parsed.title : '',
        excerpt: typeof parsed.excerpt === 'string' ? parsed.excerpt : '',
        content: typeof parsed.content === 'string' ? parsed.content : '',
        keywords: Array.isArray(parsed.keywords)
            ? parsed.keywords.filter((k): k is string => typeof k === 'string')
            : undefined,
    };
}

/**
 * Parse + validate a model draft response. Requires `title` and `content`;
 * `excerpt` is optional (the metadata pass usually supplies a meta description).
 * Prefers the delimiter format (robust for multi-line markdown) and falls back
 * to the legacy JSON shape — the latter regularly broke JSON.parse when the
 * markdown body held literal newlines or unescaped quotes. Throws on malformed
 * payloads so callers share one validation contract.
 */
export function parseDraftPayload(raw: string): ParsedDraft {
    const draft = parseDelimitedDraft(raw) ?? parseJsonDraft(raw);
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title || !content) {
        throw new Error('The model returned an unexpected draft payload (missing title or content).');
    }
    const keywords = draft.keywords?.filter((k) => k.trim().length > 0);
    return { title, excerpt: draft.excerpt.trim(), content, keywords: keywords?.length ? keywords : undefined };
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
    /**
     * The verbatim statutory block this draft was written against, if any.
     * Passed in so the quotation audit can check what the model actually
     * quoted against what it was actually given — the retrieved block is the
     * contract the prompt makes about quotation.
     */
    regulatoryCorpus?: string;
    /**
     * The sources the research pass selected and the drafting prompt was built
     * from. Recorded on the article's internal `citationSnapshots` — provenance,
     * never the reader-facing Sources list, which stays authored by hand. An
     * editor promotes the ones that belong to the reader from the Sources field
     * in Studio. Imported articles have none.
     */
    researchSources?: ResearchSource[];
    /**
     * Article lineage — wave 2, and **only `/create` supplies it.** `/import`
     * has no research run and a hand-written article has no pipeline, so both
     * leave the provenance block empty on purpose: a blank reads as "there was
     * none", which is true, where a synthesised one would say "we do not know"
     * about work that never happened.
     */
    lineage?: {
        researchRunId?: string;
        priorCoverageArticleIds?: string[];
        generationSnapshot?: GenerationSnapshot;
    };
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
    regulatoryCorpus,
    researchSources,
    lineage,
    logPrefix = 'draft',
}: FinalizeDraftInput) {
    // Pass 3 — humanising voice edit (Deep Dives audit-only, others rewritten).
    let voiceEditNotes: string | undefined;
    let authorSpecifics: string[] = [];
    try {
        const edit = await runVoiceEditPass(draft.title, draft.content, format);
        if (edit) {
            draft.content = edit.content;
            voiceEditNotes = edit.editSummary;
            authorSpecifics = edit.authorSpecifics ?? [];
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

    // Pre-fill two main-image prompts from the finalised body, so they're ready
    // before the editor opens the draft. Best-effort — never blocks the save.
    let imagePrompts: string[] | undefined;
    try {
        imagePrompts = await buildImagePrompts({
            title: draft.title,
            stoneTruth: metadata?.stoneTruth,
            excerpt: metadata?.metaDescription ?? draft.excerpt,
            text: draft.content,
        });
    } catch (err) {
        console.error(`[${logPrefix}] Image-prompt generation failed:`, err);
    }

    // Quotation audit. Deterministic, no model call, and runs AFTER the voice
    // edit because that pass rewrites the body — auditing the pre-edit text
    // would check quotations the reader will never see. Never throws: an audit
    // failure must not cost the author their draft.
    let quotationAudit: string | undefined;
    try {
        const audit = auditQuotations(draft.content, regulatoryCorpus);
        if (audit.checked > 0) {
            quotationAudit = formatQuotationAudit(audit);
            console.info(
                `[${logPrefix}] quotation audit — checked=${audit.checked} verified=${audit.verified} ` +
                `unmatched=${audit.unmatched} uncovered=${audit.uncovered}`,
            );
        }
    } catch (err) {
        console.error(`[${logPrefix}] Quotation audit failed:`, err);
    }

    // LAST, so nothing above audits or summarises the scaffold: the metadata
    // pass, the image prompts and the quotation audit all read draft.content.
    if (authorSpecifics.length > 0) {
        draft.content = appendAuthorSpecifics(draft.content, authorSpecifics);
        console.info(`[${logPrefix}] appended ${authorSpecifics.length} author placeholder(s) to the body`);
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
        ...(quotationAudit ? { quotationAudit } : {}),
        source,
        ...(imagePrompts?.length ? { imagePrompts } : {}),
        ...(sourceMaterial ? { sourceMaterial } : {}),
        ...(researchSources?.length
            ? { citationSnapshots: researchSources.map(toSnapshot) }
            : {}),
        ...(lineage?.researchRunId ? { researchRunId: lineage.researchRunId } : {}),
        ...(lineage?.priorCoverageArticleIds?.length
            ? { priorCoverageArticleIds: lineage.priorCoverageArticleIds }
            : {}),
        ...(lineage?.generationSnapshot ? { generationSnapshot: lineage.generationSnapshot } : {}),
    });
}

export const AUTHOR_SPECIFICS_HEADING = '## ⚠ Author specifics needed'

/**
 * Put the audit pass's author specifics in the BODY, where the publish guard
 * can see them.
 *
 * Deep Dives are the one format whose voice pass audits rather than rewrites —
 * too long to rewrite economically — so it never inserts `[AUTHOR: …]` markers
 * into the prose the way every other format's pass does. It writes them up in
 * Voice Edit Notes instead, and `publish-preflight` deliberately does not scan
 * that field, because it *lists* placeholders and scanning it would block every
 * voice-passed article forever. The result was that the publish blocker could
 * not fire at all on the longest, most claim-dense format: a Deep Dive with
 * three unresolved verification tasks offered "Publish anyway" (21 Aug 2026).
 *
 * The body is the only place a marker self-clears, because it is the only one
 * the author edits — which is exactly why the rewrite formats work. So the
 * markers go here, under a heading the author deletes with the last of them.
 */
export function appendAuthorSpecifics(body: string, specifics: string[]): string {
    if (specifics.length === 0) return body
    // Never double-append: finalizeDraft can run again over an existing body.
    if (body.includes(AUTHOR_SPECIFICS_HEADING)) return body

    return [
        body.trimEnd(),
        '',
        AUTHOR_SPECIFICS_HEADING,
        '',
        'Delete each line as you resolve it, then delete this heading. Publishing is blocked until they are gone.',
        '',
        ...specifics.map((s) => `- ${s}`),
        '',
    ].join('\n')
}

/**
 * A research source as a provenance snapshot. `publishedDate` is carried as the
 * string the search returned — the schema field is a string precisely because
 * upstream often gives only a year, and inferring one would be inventing it.
 */
function toSnapshot(source: ResearchSource) {
    return {
        title: source.title,
        url: source.url,
        publishedDate: source.publishedDate,
    };
}
