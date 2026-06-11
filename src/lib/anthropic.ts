import Anthropic from '@anthropic-ai/sdk';
import { recordUsage } from './usage';

// Default model is env-overridable so individual passes (e.g. the voice-edit
// pass) can be routed to a stronger model without editing code. Keep the pricing
// table in pricing.ts in lockstep with whatever model id is actually used.
const DEFAULT_CLAUDE_MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

/** The model id callClaude uses when no override is passed (for report metadata). */
export const CLAUDE_MODEL = DEFAULT_CLAUDE_MODEL;

const API_KEY = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.trim() : "";

const anthropic = new Anthropic({
    apiKey: API_KEY,
});

export async function callClaude(
    system: string,
    user: string,
    temperature: number = 0.4,
    maxTokens: number = 4096,
    model: string = DEFAULT_CLAUDE_MODEL,
) {
    if (!API_KEY) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error("ANTHROPIC_API_KEY is not configured.");
        }

        console.warn("No ANTHROPIC_API_KEY found. Returning mock response.");
        // Mock response for dev/demo if no key
        await new Promise(r => setTimeout(r, 2000));

        // Return valid JSON structure that matches ResearchResult
        return JSON.stringify({
            summary: "This is a SIMULATED analysis because the Anthropic API Key is missing. The system detected your Inoreader content but cannot analyse it without Claude.",
            sources: [
                {
                    title: "Missing API Key",
                    url: "http://localhost:3000/settings",
                    snippet: "Please add ANTHROPIC_API_KEY to your .env.local file to enable real forensic analysis."
                }
            ],
            suggestedContext: {
                keywords: ["Simulation Mode", "Configuration Required"],
                pain_points: ["System is running in demo mode"]
            }
        });
    }

    try {
        const msg = await anthropic.messages.create({
            model,
            max_tokens: maxTokens,
            temperature,
            system: system,
            messages: [
                { role: "user", content: user }
            ],
        });

        // Record token usage / cost for the analytics dashboard. Fire-and-forget
        // so the ledger round-trip never adds latency to (or breaks) the caller.
        void recordUsage({
            service: "anthropic",
            model,
            operation: "messages",
            inputTokens: msg.usage?.input_tokens,
            outputTokens: msg.usage?.output_tokens,
        }).catch(() => {});

        // Concatenate every text block. Indexing content[0] breaks when a
        // non-text block (e.g. a thinking block) leads the response.
        const text = msg.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map((block) => block.text)
            .join('\n')
            .trim();

        if (text) return text;

        return "Error: No text content returned from Claude.";

    } catch (error) {
        console.error("Claude Generation Failed via SDK:", error);
        throw error; // Re-throw so research.ts can catch and log it
    }
}
