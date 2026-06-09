import "server-only";
import { writeClient } from "@/lib/sanity";
import { CONTENT_STATS_QUERY } from "@/sanity/lib/queries";
import { BRIEFINGS_PERSONA_ORDER, getPersonaLabel, type PersonaSlug } from "@/lib/personas";

/**
 * Content-library counts for the analytics dashboard.
 *
 * Uses the token-bearing `writeClient` (useCdn:false) so counts are fresh and
 * draft-aware. Breakdowns count published docs only; `articlesDrafts` is a
 * separate rough indicator (see CONTENT_STATS_QUERY).
 */

export interface ContentStats {
    available: boolean;
    articlesPublished: number;
    articlesDrafts: number;
    byContentType: Record<string, number>;
    byTier: Record<string, number>;
    byPersona: Record<string, number>;
    youtubeScriptsTotal: number;
    youtubeByPillar: Record<string, number>;
    youtubeByStatus: Record<string, number>;
}

// Display labels for the article contentType enum.
export const CONTENT_TYPE_LABELS: Record<string, string> = {
    signal: "Signals",
    deepdive: "Deep Dives",
    guide: "Tool Guides",
    youtube: "YouTube (article)",
};

export const TIER_LABELS: Record<string, string> = {
    pulse: "Pulse (30s)",
    briefing: "Briefing (5min)",
    audit: "Audit (deep)",
    untiered: "Untiered",
};

export const YT_PILLAR_LABELS: Record<string, string> = {
    "stone-briefing": "Stone Briefing (Tue)",
    "silicon-move": "Silicon Move (Fri)",
    shorts: "Shorts (60s)",
};

export const YT_STATUS_LABELS: Record<string, string> = {
    idea: "Idea",
    scripted: "Scripted",
    filmed: "Filmed",
    edited: "Edited",
    published: "Published",
};

const EMPTY: ContentStats = {
    available: false,
    articlesPublished: 0,
    articlesDrafts: 0,
    byContentType: {},
    byTier: {},
    byPersona: {},
    youtubeScriptsTotal: 0,
    youtubeByPillar: {},
    youtubeByStatus: {},
};

export async function getContentStats(): Promise<ContentStats> {
    // writeClient requires SANITY_API_WRITE_TOKEN; without it, degrade.
    if (!process.env.SANITY_API_WRITE_TOKEN) return EMPTY;

    try {
        const data = await writeClient.fetch<Omit<ContentStats, "available">>(CONTENT_STATS_QUERY);
        return { available: true, ...data };
    } catch (err) {
        console.warn("getContentStats failed (non-fatal):", err);
        return EMPTY;
    }
}

/** Persona counts in canonical order with display names. */
export function personaBreakdown(stats: ContentStats): Array<{ slug: PersonaSlug; label: string; count: number }> {
    return BRIEFINGS_PERSONA_ORDER.map((slug) => ({
        slug,
        label: getPersonaLabel(slug),
        count: stats.byPersona[slug] ?? 0,
    }));
}
