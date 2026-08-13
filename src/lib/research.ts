import { callClaude } from "./anthropic";
import { ResearchResult } from "@/types/research";
import { searchItems } from "./inoreader";
import { logErrorToFile } from "@/lib/debug";
import { searchExa, deepResearchExa } from "@/lib/exa";

// Mock search function if no API key or Exa fails
async function searchWeb(query: string): Promise<string> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error(`Live web search unavailable for query: ${query}`);
    }

    console.log(`Searching web (MOCK) for: ${query}`);
    await new Promise(r => setTimeout(r, 1000));

    // Return a mock search blob for Claude to summarize
    return `
    [Result 1] Title: EU AI Act Implementation Updates (Autumn 2025)
    Snippet: The European AI Office has released new guidance on General Purpose AI models. Harmonized standards are expected to be delayed until Q4 2025, creating uncertainty for "High Risk" providers...
    URL: europa.eu/ai-act-updates

    [Result 2] Title: Semiconductor Supply Chain: The Dresden Expansion
    Snippet: TSMC's Dresden fab is proceeding on schedule, but workforce shortages in Saxony threaten to delay full operational capacity until 2028.
    URL: techcrunch.com/chips-dresden
    
    [Result 3] Title: The Atlantic Drift: Divergence in US-EU Digital Policy
    Snippet: Analysis of the widening gap between US executive orders on AI safety and the binding constraints of the EU AI Act. The "Vulnerability Gap" is growing.
    URL: politodigital.eu/atlantic-drift
    `;
}

interface ExaResult {
    title: string | null;
    url: string;
    text?: string;
}

// Helper to format Exa results for from object to text
function formatExaResults(results: ExaResult[]): string {
    return results.map((r, i) => `
    [Web Result ${i + 1}] Title: ${r.title}
    URL: ${r.url}
    Snippet: ${r.text ? r.text.substring(0, 300) : "No content available."}
    `).join('\n');
}

/**
 * Forensic research instructions for the Exa Research API. Shared by the
 * in-process deep path (below) and the Railway background job, so the prompt
 * lives in exactly one place.
 */
export function buildDeepInstructions(topic: string, brief?: string): string {
    const focus = brief?.trim()
        ? `\n\nThe author has supplied a specific editorial brief — treat it as authoritative steering for what to prioritise, what angle to take, and what to avoid:\n${brief.trim()}\n`
        : '';
    return `You are a forensic technopolitics analyst for "Silicon & Stone". Produce a thorough, board-grade research brief on: "${topic}".${focus}

Cover, where the evidence supports it:
- The physical / supply-chain layer (chokepoints, capacity, critical materials, who controls what).
- The regulatory layer (specific rules, dates, enforcement actions, US-EU divergence).
- The talent / capability layer (where skilled people are moving, skill density by region).
- Low / medium / high friction scenarios, with rough Value-at-Stake figures where quantifiable.

Ground every claim in sources. Include specific figures, dates, named entities, and inline source URLs. Where the evidence is thin, say so explicitly rather than guessing.`;
}

export async function performResearch(
    topic: string,
    inoreaderToken?: string,
    opts: { deep?: boolean; brief?: string } = {}
): Promise<ResearchResult> {
    let searchContext = "";
    let deepReport: string | undefined;

    // 1. Inoreader Search (Priority)
    if (inoreaderToken) {
        console.log(`Searching Inoreader for: ${topic}`);
        try {
            const items = await searchItems(inoreaderToken, topic);
            if (items.length > 0) {
                // Convert Inoreader items to context string
                const inoreaderContext = items.map((item, i) => `
                [Inoreader Source ${i + 1}] Title: ${item.title}
                Source: ${item.origin?.title || 'Feed'}
                Date: ${new Date(item.published * 1000).toISOString()}
                Snippet: ${(item.summary?.content || '').replace(/<[^>]*>/g, '').substring(0, 300)}...
                URL: ${item.canonical?.[0]?.href || ''}
                `).join('\n');

                searchContext += `\n--- INOREADER RESULTS ---\n${inoreaderContext}\n`;
            } else {
                searchContext += `\n--- INOREADER RESULTS ---\nNo results found in your subscriptions.\n`;
            }
        } catch (e) {
            console.error("Inoreader search failed inside research agent", e);
        }
    }

    // 2. Web research.
    //    Deep Dives use Exa's agentic Research API (multi-step, minutes-long).
    //    Everything else uses the fast, recency-biased single search.
    //
    //    INFRA CAVEAT: deep research can run for minutes. If /create is served by a
    //    short-timeout serverless function (e.g. Vercel), route the deep path through
    //    the Railway backend or a background job rather than blocking the request.
    if (opts.deep) {
        console.log(`Deep research (Exa Agent) for: ${topic}`);
        const instructions = buildDeepInstructions(topic, opts.brief);
        try {
            const deep = await deepResearchExa(instructions);
            if (deep?.content) {
                deepReport = deep.content;
                searchContext += `\n--- DEEP RESEARCH (EXA AGENT) ---\n${deep.content}\n`;
            } else if (process.env.NODE_ENV === 'production') {
                throw new Error("Exa deep research returned no content.");
            }
        } catch (e) {
            console.error("Exa deep research error", e);
            if (process.env.NODE_ENV === 'production') {
                throw new Error("Deep research failed.");
            }
        }
        // Dev fallback (or empty deep result outside production): standard search.
        if (!deepReport) {
            const exaResults = await searchExa(topic, { recencyDays: 90, numResults: 8 });
            searchContext += exaResults && exaResults.length > 0
                ? `\n--- WEB RESULTS (EXA.AI) ---\n${formatExaResults(exaResults)}`
                : `\n--- WEB RESULTS (MOCK FALLBACK) ---\n${await searchWeb(topic)}`;
        }
    } else {
        // Standard: recency-first, news-biased; broaden to evergreen if too thin.
        console.log(`Searching Exa for: ${topic}`);
        try {
            let exaResults = await searchExa(topic, { recencyDays: 90, numResults: 8, category: "news" });
            if (!exaResults || exaResults.length < 3) {
                const broad = await searchExa(topic, { recencyDays: null, numResults: 8 });
                const seen = new Set((exaResults ?? []).map(r => r.url));
                exaResults = [...(exaResults ?? []), ...((broad ?? []).filter(r => !seen.has(r.url)))];
            }
            if (exaResults && exaResults.length > 0) {
                searchContext += `\n--- WEB RESULTS (EXA.AI) ---\n${formatExaResults(exaResults)}`;
            } else if (process.env.NODE_ENV === 'production') {
                throw new Error("Exa returned no results or is not configured.");
            } else {
                console.log("Exa returned no results or failed, falling back to mock.");
                searchContext += `\n--- WEB RESULTS (MOCK FALLBACK) ---\n${await searchWeb(topic)}`;
            }
        } catch (e) {
            console.error("Exa search error in main flow", e);
            if (process.env.NODE_ENV === 'production') {
                throw new Error("Live web search failed.");
            }
            searchContext += `\n--- WEB RESULTS (MOCK FALLBACK) ---\n${await searchWeb(topic)}`;
        }
    }

    // 3. Synthesize gathered context into the ResearchResult shape.
    return synthesizeContext(topic, searchContext, deepReport, opts.brief);
}

/**
 * Synthesises gathered context (web / Inoreader / deep report) into the
 * ResearchResult shape via Claude. Shared by the standard and deep paths.
 */
async function synthesizeContext(
    topic: string,
    searchContext: string,
    deepReport?: string,
    brief?: string
): Promise<ResearchResult> {
    const briefBlock = brief?.trim()
        ? `\n\n    The author's editorial brief (prioritise this angle when extracting the signal):\n    ${brief.trim()}\n`
        : '';
    const systemPrompt = `You are a Forensic Technopolitical Analyst.
    Your job is to synthesize raw search results into actionable intelligence.

    Output JSON ONLY with this structure:
    {
       "summary": "A 2-3 sentence forensic summary of the situation.",
       "sources": [{"title": "...", "url": "...", "snippet": "..."}],
       "suggestedContext": {
          "keywords": ["New Term 1", "New Term 2"],
          "pain_points": ["New specific anxiety for the ICP"]
       }
    }`;

    const userPrompt = `Analyze these search results for the topic: "${topic}".${briefBlock}

    Search Results:
    ${searchContext}

    Extract the key signal from the noise. Identify any new keywords or pain points that should be added to our knowledge base.`;

    let rawJson = "";

    try {
        rawJson = await callClaude(systemPrompt, userPrompt);

        // Robust extraction: Find the first '{' and the last '}'
        const firstOpen = rawJson.indexOf('{');
        const lastClose = rawJson.lastIndexOf('}');

        if (firstOpen === -1 || lastClose === -1) {
            throw new Error("No JSON object found in response");
        }

        const cleaned = rawJson.substring(firstOpen, lastClose + 1);
        const parsed = JSON.parse(cleaned) as ResearchResult;
        return { ...parsed, deepReport };
    } catch (e) {
        console.error("Failed to parse research JSON", e);

        const logs = `ERROR: ${e instanceof Error ? e.message : 'Unknown error'}\n\nRAW OUTPUT:\n${rawJson}`;
        logErrorToFile(logs);

        // Fallback. If a deep report exists, still hand it to the writer.
        return {
            summary: deepReport
                ? "Synthesis parse failed, but the full forensic research report is available to the writer."
                : "Analysis failed to parse. I have logged the raw output to debug_error.log.",
            sources: [],
            suggestedContext: { keywords: [], pain_points: [] },
            deepReport,
        };
    }
}

/**
 * Synthesises a completed Exa Research report (delivered by the Railway
 * background job) into the ResearchResult shape, preserving the full report
 * so the Deep Dive writer builds on it verbatim.
 */
export async function synthesizeDeepReport(topic: string, report: string, brief?: string): Promise<ResearchResult> {
    const searchContext = `\n--- DEEP RESEARCH (EXA AGENT) ---\n${report}\n`;
    return synthesizeContext(topic, searchContext, report, brief);
}
