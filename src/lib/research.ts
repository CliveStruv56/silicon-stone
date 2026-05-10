import { callClaude } from "./anthropic";
import { ResearchResult } from "@/types/research";
import { searchItems } from "./inoreader";
import { logErrorToFile } from "@/lib/debug";
import { searchExa } from "@/lib/exa";

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

export async function performResearch(topic: string, inoreaderToken?: string): Promise<ResearchResult> {
    let searchContext = "";

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

    // 2. Web Search (Real via Exa)
    console.log(`Searching Exa for: ${topic}`);
    // Check if Exa key present (simple check, the lib handles details)
    try {
        const exaResults = await searchExa(topic);
        if (exaResults && exaResults.length > 0) {
            searchContext += `\n--- WEB RESULTS (EXA.AI) ---\n${formatExaResults(exaResults)}`;
        } else {
            if (process.env.NODE_ENV === 'production') {
                throw new Error("Exa returned no results or is not configured.");
            }
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

    // 3. Synthesize with Claude
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

    const userPrompt = `Analyze these search results for the topic: "${topic}".
    
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
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse research JSON", e);

        const logs = `ERROR: ${e instanceof Error ? e.message : 'Unknown error'}\n\nRAW OUTPUT:\n${rawJson}`;
        logErrorToFile(logs);

        // Fallback
        return {
            summary: "Analysis failed to parse. I have logged the raw output to debug_error.log.",
            sources: [],
            suggestedContext: { keywords: [], pain_points: [] }
        };
    }
}
