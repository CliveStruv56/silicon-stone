import Anthropic from '@anthropic-ai/sdk';
import { recordUsage } from './usage';

const CLAUDE_MODEL = "claude-sonnet-4-6";

const API_KEY = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.trim() : "";

const anthropic = new Anthropic({
    apiKey: API_KEY,
});

export async function callClaude(system: string, user: string, temperature: number = 0.4, maxTokens: number = 4096) {
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
            model: CLAUDE_MODEL,
            max_tokens: maxTokens,
            temperature,
            system: system,
            messages: [
                { role: "user", content: user }
            ],
        });

        // Record token usage / cost for the analytics dashboard (non-fatal).
        await recordUsage({
            service: "anthropic",
            model: CLAUDE_MODEL,
            operation: "messages",
            inputTokens: msg.usage?.input_tokens,
            outputTokens: msg.usage?.output_tokens,
        });

        // The SDK returns ContentBlock[], likely of type { type: 'text', text: '...' }
        // We extract the first text block.
        const textBlock = msg.content[0];
        if (textBlock.type === 'text') {
            return textBlock.text;
        }

        return "Error: No text content returned from Claude.";

    } catch (error) {
        console.error("Claude Generation Failed via SDK:", error);
        throw error; // Re-throw so research.ts can catch and log it
    }
}
