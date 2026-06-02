import Exa from 'exa-js';

const API_KEY = process.env.EXA_API_KEY;

export interface ExaSearchOptions {
    /** Look-back window in days for recency bias. Pass null to disable (evergreen topics). */
    recencyDays?: number | null;
    /** Number of results. Exa caps this at 10 on basic plans. */
    numResults?: number;
    /** Restrict to an Exa content category. */
    category?: 'company' | 'research paper' | 'news' | 'pdf' | 'tweet' | 'personal site' | 'financial report' | 'people';
    /** Hard-restrict to these domains. Off by default to preserve recall. */
    includeDomains?: string[];
}

/**
 * Standard web search for short-form (Pulse / Signal / Briefing).
 * Recency-biased and livecrawl-aware so the model reads current pages, not a
 * stale index copy.
 */
export async function searchExa(query: string, options: ExaSearchOptions = {}) {
    if (!API_KEY) {
        console.warn("Exa API Key missing. Returning null.");
        return null;
    }

    const { recencyDays = 90, numResults = 8, category, includeDomains } = options;
    const exa = new Exa(API_KEY);

    try {
        // RegularSearchOptions (numResults, type, category, startPublishedDate,
        // includeDomains…) at the top level; page-content options (text, highlights,
        // livecrawl) nested under `contents`.
        const result = await exa.search(query, {
            type: "auto",                          // Exa picks neural vs keyword per query
            useAutoprompt: true,
            numResults: Math.min(numResults, 10),  // Exa basic-plan ceiling
            ...(recencyDays != null
                ? { startPublishedDate: new Date(Date.now() - recencyDays * 86_400_000).toISOString() }
                : {}),
            ...(category ? { category } : {}),
            ...(includeDomains?.length ? { includeDomains } : {}),
            contents: {
                text: true,
                livecrawl: "fallback",             // fetch the live page when the index copy is stale
                highlights: { numSentences: 3, highlightsPerUrl: 1 },
            },
        });
        return result.results;
    } catch (e) {
        console.error("Exa Search Failed:", e);
        return null;
    }
}

export interface DeepResearchResult {
    /** Full research output as text (markdown, with inline sources). */
    content: string;
    /** Total cost in USD for the research request, if reported. */
    costDollars?: number;
}

/**
 * Agentic multi-step research via Exa's native Research API (exa-research-pro).
 * Reserved for Deep Dives: it plans the research, runs multiple searches/reads,
 * and reasons across them. Slower (minutes) and billed per request, so it is
 * format-gated upstream — never call this for short-form.
 */
export async function deepResearchExa(instructions: string): Promise<DeepResearchResult | null> {
    if (!API_KEY) {
        console.warn("Exa API Key missing. Returning null.");
        return null;
    }

    const exa = new Exa(API_KEY);

    try {
        const created = await exa.research.create({
            instructions,
            model: "exa-research-pro",
        });

        const finished = await exa.research.pollUntilFinished(created.researchId, {
            pollInterval: 3000,
            timeoutMs: 10 * 60 * 1000, // 10 minutes — see infra caveat in research.ts
        });

        if (finished.status !== "completed") {
            console.error(`Exa research did not complete (status: ${finished.status}).`);
            return null;
        }

        return {
            content: finished.output.content,
            costDollars: finished.costDollars?.total,
        };
    } catch (e) {
        console.error("Exa deep research failed:", e);
        return null;
    }
}
