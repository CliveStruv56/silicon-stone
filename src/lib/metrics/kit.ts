import "server-only";

import { KIT_TIMEOUT_MS } from "../timeouts";

/**
 * Kit (ConvertKit) audience metrics for the analytics dashboard.
 *
 * Phase 1 surfaces the account subscriber total (and recent net growth) via
 * Kit API v4's account growth-stats endpoint. Broadcast open/click stats and
 * per-tag counts are deferred to phase 2.
 *
 * Defensive by design: Kit's documented response shape isn't pinned here, so we
 * scan the returned stats object for the first plausible subscriber-count field
 * and degrade to `available: false` if nothing usable comes back. Never throws.
 */

const KIT_API_KEY = process.env.CONVERTKIT_API_KEY || "";
const KIT_BASE = "https://api.kit.com/v4";

export interface KitStats {
    available: boolean;
    /** Total subscribers, if the API exposes a count. */
    subscribers: number | null;
    /** Net new subscribers over the stats window (default ~90 days), if reported. */
    netNewSubscribers: number | null;
    /** Note shown in the UI when data is unavailable. */
    note?: string;
}

const UNAVAILABLE = (note: string): KitStats => ({
    available: false,
    subscribers: null,
    netNewSubscribers: null,
    note,
});

// Candidate keys for "total subscribers", most-specific first.
const SUBSCRIBER_KEYS = [
    "cumulative_subscribers",
    "ending_subscribers",
    "total_subscribers",
    "subscribers",
];
const NET_NEW_KEYS = ["net_new_subscribers", "new_subscribers"];

function pickNumber(obj: Record<string, unknown> | undefined, keys: string[]): number | null {
    if (!obj) return null;
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
    }
    return null;
}

export async function getKitStats(): Promise<KitStats> {
    if (!KIT_API_KEY) return UNAVAILABLE("Kit API key not configured");

    try {
        const res = await fetch(`${KIT_BASE}/account/growth_stats`, {
            headers: {
                Accept: "application/json",
                "X-Kit-Api-Key": KIT_API_KEY,
            },
            cache: "no-store",
            signal: AbortSignal.timeout(KIT_TIMEOUT_MS),
        });

        if (!res.ok) {
            return UNAVAILABLE(`Kit API returned ${res.status}`);
        }

        const body = (await res.json()) as { stats?: Record<string, unknown> } & Record<string, unknown>;
        // Stats may be nested under `stats` or returned flat — try both.
        const stats = (body.stats as Record<string, unknown>) ?? body;

        const subscribers = pickNumber(stats, SUBSCRIBER_KEYS);
        const netNewSubscribers = pickNumber(stats, NET_NEW_KEYS);

        if (subscribers === null && netNewSubscribers === null) {
            return UNAVAILABLE("Kit response had no recognised subscriber fields");
        }

        return { available: true, subscribers, netNewSubscribers };
    } catch (err) {
        console.warn("getKitStats failed (non-fatal):", err);
        return UNAVAILABLE("Kit request failed");
    }
}
