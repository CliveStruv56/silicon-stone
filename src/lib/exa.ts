import 'server-only';
import Exa from 'exa-js';
import { recordUsage } from './usage';

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

        // Record cost for the analytics dashboard (non-fatal). Exa reports the
        // per-request cost on the search response when available.
        const searchCost = (result as { costDollars?: { total?: number } }).costDollars?.total;
        void recordUsage({
            service: "exa",
            model: "exa-search",
            operation: "search",
            costDollars: searchCost ?? 0,
        }).catch(() => {});

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

const EXA_AGENT_URL = "https://api.exa.ai/agent/runs";
/**
 * Cost/quality tier, in place of the retired `exa-research-pro` model name.
 * Valid values: minimal | low | medium | high | xhigh | auto. The tier is the
 * cost control — fixed-price tiers reject a `budget` object, so don't add one.
 */
const EXA_AGENT_EFFORT = "high";
const EXA_AGENT_USAGE_MODEL = "exa-agent";

interface ExaAgentRun {
    id?: string;
    status?: string;
    output?: { text?: string };
    costDollars?: number | { total?: number };
    error?: string | { message?: string; code?: string };
}

/**
 * Total run cost. The live Agent API returns `costDollars` as an object
 * ({ total, agentCompute, search, … }), though Exa's reference describes a bare
 * number — accept either so a shape change degrades to "no cost recorded".
 */
function agentCost(run: ExaAgentRun): number | undefined {
    const cost = run.costDollars;
    return typeof cost === "object" ? cost?.total : cost;
}

function agentError(run: ExaAgentRun): string | undefined {
    const error = run.error;
    if (!error) return undefined;
    return typeof error === "object" ? (error.message ?? error.code) : error;
}

async function exaAgentFetch(path: string, init?: RequestInit): Promise<ExaAgentRun> {
    const res = await fetch(`${EXA_AGENT_URL}${path}`, {
        ...init,
        headers: { "x-api-key": API_KEY as string, "Content-Type": "application/json" },
        cache: "no-store",
    });
    if (!res.ok) {
        throw new Error(`Exa agent request failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
    }
    return (await res.json()) as ExaAgentRun;
}

/**
 * Agentic multi-step research via Exa's Agent API. Reserved for Deep Dives: it
 * plans the research, runs multiple searches/reads, and reasons across them.
 * Slower (minutes) and billed per run, so it is format-gated upstream — never
 * call this for short-form.
 *
 * Called through raw fetch rather than the SDK: exa-js is pinned at 2.2.0 for
 * the `/search` path above and predates the `agent.runs` namespace. This also
 * keeps the request shape identical to the Railway backend's httpx version.
 *
 * NOTE: this is the local/dev fallback. In production the Railway backend runs
 * the job, because a minutes-long poll would outlive a serverless invocation.
 */
export async function deepResearchExa(instructions: string): Promise<DeepResearchResult | null> {
    if (!API_KEY) {
        console.warn("Exa API Key missing. Returning null.");
        return null;
    }

    try {
        const created = await exaAgentFetch("", {
            method: "POST",
            body: JSON.stringify({ query: instructions, effort: EXA_AGENT_EFFORT }),
        });

        if (!created.id) {
            console.error("Exa did not return an agent run id.");
            return null;
        }

        const deadline = Date.now() + 10 * 60 * 1000; // 10 min — see infra caveat in research.ts
        while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 3000));
            const run = await exaAgentFetch(`/${created.id}`);

            if (run.status === "completed") {
                const costDollars = agentCost(run);
                // Record cost for the analytics dashboard (non-fatal). This is the
                // in-process fallback path; when the Railway backend runs the job it
                // records the event itself at completion, so the two never both fire
                // for one job (research.ts picks one path or the other).
                void recordUsage({
                    service: "exa",
                    model: EXA_AGENT_USAGE_MODEL,
                    operation: "deep-research",
                    costDollars: costDollars ?? 0,
                }).catch(() => {});

                return { content: run.output?.text ?? "", costDollars };
            }
            if (run.status === "failed" || run.status === "cancelled" || run.status === "canceled") {
                console.error(`Exa agent run did not complete (status: ${run.status}): ${agentError(run) ?? "no reason given"}`);
                return null;
            }
        }

        console.error("Exa agent run timed out.");
        return null;
    } catch (e) {
        console.error("Exa deep research failed:", e);
        return null;
    }
}
