/**
 * Price table for metered external APIs, used to turn token / request counts
 * into a dollar cost at the moment a call is recorded (see src/lib/usage.ts).
 *
 * Cost is computed and stored at *record time*, so historical spend stays
 * accurate even when these rates change later — update the table when a
 * provider changes pricing; past events keep the rate they were logged with.
 *
 * IMPORTANT: verify these against each provider's current published pricing
 * before relying on the dashboard's dollar figures. Rates are USD.
 */

/** USD per 1,000,000 tokens, split by input vs output where applicable. */
interface TokenRate {
    /** USD per 1M input (prompt) tokens. */
    input: number;
    /** USD per 1M output (completion) tokens. 0 for embeddings. */
    output: number;
}

/**
 * Keyed by the exact model id passed to the provider SDK. Add a row here when
 * a new model is introduced; an unknown model yields a $0 computed cost (the
 * raw token counts are still recorded), so missing rows are visible as
 * "tokens but no cost" rather than silently dropped.
 */
const TOKEN_RATES: Record<string, TokenRate> = {
    // Anthropic — Claude Sonnet 4.x (verify current rate)
    "claude-sonnet-4-6": { input: 3, output: 15 },
    // OpenAI — embeddings (output side is free)
    "text-embedding-3-small": { input: 0.02, output: 0 },
};

export interface ComputeCostInput {
    model: string;
    inputTokens?: number;
    outputTokens?: number;
}

/**
 * Compute USD cost from token counts via the rate table. Returns 0 for models
 * we don't have a rate for (Exa deep-research reports its own `costDollars`
 * and bypasses this).
 */
export function computeTokenCost({ model, inputTokens = 0, outputTokens = 0 }: ComputeCostInput): number {
    const rate = TOKEN_RATES[model];
    if (!rate) return 0;
    return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
}

export function hasRate(model: string): boolean {
    return model in TOKEN_RATES;
}
