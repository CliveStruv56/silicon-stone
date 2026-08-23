import "server-only";

import { BACKEND_START_TIMEOUT_MS, BACKEND_TIMEOUT_MS } from "./timeouts";

/**
 * Thin client for the Railway logic backend's deep-research job endpoints.
 * Used only for Deep Dives, whose Exa Research runs for minutes and would time
 * out a Vercel serverless function. The backend runs the job and we poll it.
 *
 * Requires BACKEND_API_URL + BACKEND_API_KEY (see railway-vercel-setup docs).
 * When unset, callers fall back to the in-process path in research.ts.
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

export function isBackendConfigured(): boolean {
    return Boolean(BACKEND_API_URL && BACKEND_API_KEY);
}

export interface DeepJobStatus {
    status: "pending" | "running" | "completed" | "failed" | "unknown";
    report?: string | null;
    error?: string | null;
    costDollars?: number | null;
}

function headers(): HeadersInit {
    return {
        "Content-Type": "application/json",
        "x-backend-api-key": BACKEND_API_KEY ?? "",
    };
}

/** Start a deep-research job. Returns the job id to poll. */
export async function startDeepResearchJob(topic: string, instructions: string): Promise<string> {
    const res = await fetch(`${BACKEND_API_URL}/v1/research/deep`, {
        method: "POST",
        headers: headers(),
        // No `model`: the backend picks the Exa Agent effort tier. The old
        // `exa-research-pro` name belonged to the Research API, retired by Exa
        // in April 2026 (410 RESEARCH_RETIRED).
        body: JSON.stringify({ topic, instructions }),
        cache: "no-store",
        signal: AbortSignal.timeout(BACKEND_START_TIMEOUT_MS),
    });

    if (!res.ok) {
        // Surface the backend's own detail (rate limit, budget store, Exa key)
        // rather than a bare status the writer can't act on.
        const detail = await res.text().catch(() => "");
        throw new Error(`Backend research start failed: ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ""}`);
    }

    const data = (await res.json()) as { jobId?: string };
    if (!data.jobId) {
        throw new Error("Backend did not return a jobId");
    }
    return data.jobId;
}

/** Poll a deep-research job's status. */
export async function getDeepResearchJob(jobId: string): Promise<DeepJobStatus> {
    const res = await fetch(`${BACKEND_API_URL}/v1/research/deep/${jobId}`, {
        headers: headers(),
        cache: "no-store",
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });

    if (!res.ok) {
        throw new Error(`Backend research poll failed: ${res.status}`);
    }

    return (await res.json()) as DeepJobStatus;
}
