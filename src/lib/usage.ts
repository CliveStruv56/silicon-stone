import "server-only";
import { computeTokenCost, hasRate } from "./pricing";

/**
 * API usage ledger client.
 *
 * Records a usage event (tokens + computed cost) per metered external call to
 * the Railway backend, and reads back an aggregate summary for the analytics
 * dashboard. The persistent store lives backend-side (reuses the deep-research
 * Redis/job-store infra) — see the `/v1/usage` + `/v1/usage/summary` contract.
 *
 * Designed to degrade gracefully: if the backend is unconfigured or the
 * endpoints don't exist yet, recording is a no-op and the summary reports
 * `available: false` so the dashboard can show a "not yet wired" state rather
 * than erroring. Recording NEVER throws — a logging failure must never break a
 * generation.
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

function isConfigured(): boolean {
    return Boolean(BACKEND_API_URL && BACKEND_API_KEY);
}

function headers(): HeadersInit {
    return {
        "Content-Type": "application/json",
        "x-backend-api-key": BACKEND_API_KEY ?? "",
    };
}

export type UsageService = "anthropic" | "openai" | "exa" | (string & {});

export interface RecordUsageInput {
    /** Provider bucket, e.g. "anthropic" | "openai" | "exa". */
    service: UsageService;
    /** Exact model id, e.g. "claude-sonnet-4-6". */
    model: string;
    /** Logical operation, e.g. "messages" | "embedding" | "search" | "deep-research". */
    operation: string;
    inputTokens?: number;
    outputTokens?: number;
    /**
     * Pre-computed cost (USD). Pass this when the provider reports cost directly
     * (Exa). Omit for token-priced calls — cost is derived from the price table.
     */
    costDollars?: number;
    /** Correlates a deep-research event with its backend job. */
    jobId?: string;
}

export interface UsageEvent extends RecordUsageInput {
    costDollars: number;
    /** ISO timestamp set at record time. */
    ts: string;
}

/**
 * Record a single usage event. Fire-and-forget and self-contained: swallows all
 * errors and no-ops when the backend isn't configured.
 */
export async function recordUsage(input: RecordUsageInput): Promise<void> {
    if (!isConfigured()) return;

    // Warn when a token-metered call has no rate row — its cost silently logs as
    // $0, so the dashboard under-reports spend. Add the model to pricing.ts.
    if (
        input.costDollars === undefined &&
        (input.inputTokens || input.outputTokens) &&
        !hasRate(input.model)
    ) {
        console.warn(`recordUsage: no price row for model "${input.model}" — cost recorded as $0.`);
    }

    const costDollars =
        input.costDollars ??
        computeTokenCost({
            model: input.model,
            inputTokens: input.inputTokens,
            outputTokens: input.outputTokens,
        });

    const event: UsageEvent = {
        ...input,
        costDollars,
        ts: new Date().toISOString(),
    };

    try {
        await fetch(`${BACKEND_API_URL}/v1/usage`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(event),
            cache: "no-store",
        });
    } catch (err) {
        // Never let usage logging break the caller.
        console.warn("recordUsage failed (non-fatal):", err);
    }
}

export type UsagePeriod = "7d" | "30d" | "mtd" | "all";

export interface UsageServiceSummary {
    service: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    costDollars: number;
}

export interface UsageDailyPoint {
    /** YYYY-MM-DD */
    date: string;
    costDollars: number;
}

export interface UsageSummary {
    period: UsagePeriod;
    /** False when the backend store is unconfigured or the endpoint is absent. */
    available: boolean;
    totalCostDollars: number;
    totalCalls: number;
    byService: UsageServiceSummary[];
    daily: UsageDailyPoint[];
}

function emptySummary(period: UsagePeriod): UsageSummary {
    return {
        period,
        available: false,
        totalCostDollars: 0,
        totalCalls: 0,
        byService: [],
        daily: [],
    };
}

/**
 * Read an aggregate usage summary for the dashboard. Returns an empty,
 * `available: false` summary if the backend is unconfigured or the endpoint
 * doesn't exist yet (404), so the UI renders without erroring.
 */
export async function getUsageSummary(period: UsagePeriod = "mtd"): Promise<UsageSummary> {
    if (!isConfigured()) return emptySummary(period);

    try {
        const res = await fetch(`${BACKEND_API_URL}/v1/usage/summary?period=${period}`, {
            headers: headers(),
            cache: "no-store",
        });

        if (!res.ok) return emptySummary(period);

        const data = (await res.json()) as Partial<UsageSummary>;
        return {
            period,
            available: true,
            totalCostDollars: data.totalCostDollars ?? 0,
            totalCalls: data.totalCalls ?? 0,
            byService: data.byService ?? [],
            daily: data.daily ?? [],
        };
    } catch {
        return emptySummary(period);
    }
}
