import { BarChart3, DollarSign, FileText, Users, Zap, Youtube } from "lucide-react";
import { getUsageSummary } from "@/lib/usage";
import {
    getContentStats,
    personaBreakdown,
    CONTENT_TYPE_LABELS,
    TIER_LABELS,
    YT_STATUS_LABELS,
} from "@/lib/metrics/content";
import { getKitStats } from "@/lib/metrics/kit";
import {
    StatCard,
    BarList,
    SpendTrend,
    NotConfigured,
    formatUSD,
    formatNumber,
    formatTokens,
    type BarItem,
} from "@/components/admin/metric-bits";

// Always render fresh — these are live operational metrics.
export const dynamic = "force-dynamic";

const SERVICE_LABELS: Record<string, string> = {
    anthropic: "Claude (Anthropic)",
    openai: "OpenAI (embeddings)",
    exa: "Exa",
};

function toBars(record: Record<string, number>, labels: Record<string, string>): BarItem[] {
    return Object.entries(record)
        .map(([key, count]) => ({ label: labels[key] ?? key, count }))
        .sort((a, b) => b.count - a.count);
}

export default async function AnalyticsPage() {
    const [usage, content, kit] = await Promise.all([
        getUsageSummary("mtd"),
        getContentStats(),
        getKitStats(),
    ]);

    const personas = personaBreakdown(content);

    return (
        <main className="p-8 max-w-7xl mx-auto space-y-12">
            <header className="flex items-center gap-3 border-b border-border pb-6">
                <BarChart3 className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        API usage &amp; cost, content library, and audience — at a glance.
                    </p>
                </div>
            </header>

            {/* ── API Usage & Cost ─────────────────────────────────────── */}
            <section className="space-y-5">
                <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-secondary-foreground" />
                    <h2 className="text-2xl font-bold">API Usage &amp; Cost</h2>
                    <span className="text-sm text-muted-foreground">month to date</span>
                </div>

                {!usage.available ? (
                    <NotConfigured>
                        Usage tracking is instrumented in the app but the backend store isn&apos;t live yet. Once the
                        Railway <code className="font-mono">/v1/usage</code> endpoint is deployed, spend and token
                        totals will appear here automatically.
                    </NotConfigured>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <StatCard
                                label="Total spend (MTD)"
                                value={formatUSD(usage.totalCostDollars)}
                                accent="text-primary"
                            />
                            <StatCard label="Total API calls" value={formatNumber(usage.totalCalls)} />
                            <StatCard label="Services tracked" value={usage.byService.length} />
                        </div>

                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/30 text-muted-foreground">
                                    <tr className="text-left">
                                        <th className="px-4 py-2.5 font-medium">Service</th>
                                        <th className="px-4 py-2.5 font-medium text-right">Calls</th>
                                        <th className="px-4 py-2.5 font-medium text-right">In tokens</th>
                                        <th className="px-4 py-2.5 font-medium text-right">Out tokens</th>
                                        <th className="px-4 py-2.5 font-medium text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usage.byService.map((s) => (
                                        <tr key={s.service} className="border-t border-border/60">
                                            <td className="px-4 py-2.5">{SERVICE_LABELS[s.service] ?? s.service}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(s.calls)}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums">{formatTokens(s.inputTokens)}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums">{formatTokens(s.outputTokens)}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatUSD(s.costDollars)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5">
                            <h3 className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">Daily spend</h3>
                            <SpendTrend points={usage.daily} />
                        </div>
                    </>
                )}
            </section>

            {/* ── Content Library ──────────────────────────────────────── */}
            <section className="space-y-5">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-secondary-foreground" />
                    <h2 className="text-2xl font-bold">Content Library</h2>
                </div>

                {!content.available ? (
                    <NotConfigured>
                        Content counts need <code className="font-mono">SANITY_API_WRITE_TOKEN</code> to read
                        draft-aware totals. Add it to enable this section.
                    </NotConfigured>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard label="Published articles" value={formatNumber(content.articlesPublished)} accent="text-primary" />
                            <StatCard label="Drafts / pending" value={formatNumber(content.articlesDrafts)} sublabel="incl. unpublished edits" />
                            <StatCard label="YouTube scripts" value={formatNumber(content.youtubeScriptsTotal)} />
                            <StatCard
                                label="Deep dives"
                                value={formatNumber(content.byContentType.deepdive ?? 0)}
                            />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">By content type</h3>
                                <BarList items={toBars(content.byContentType, CONTENT_TYPE_LABELS)} barClass="bg-blue-500/70" />
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h3 className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">By intelligence tier</h3>
                                <BarList items={toBars(content.byTier, TIER_LABELS)} barClass="bg-emerald-500/70" />
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-border bg-card p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-sm uppercase tracking-wider text-muted-foreground">By persona</h3>
                                </div>
                                <BarList
                                    items={personas.map((p) => ({ label: p.label, count: p.count }))}
                                    barClass="bg-purple-500/70"
                                />
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Youtube className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-sm uppercase tracking-wider text-muted-foreground">YouTube pipeline</h3>
                                </div>
                                <BarList items={toBars(content.youtubeByStatus, YT_STATUS_LABELS)} barClass="bg-amber-500/70" />
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* ── Audience ─────────────────────────────────────────────── */}
            <section className="space-y-5">
                <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-secondary-foreground" />
                    <h2 className="text-2xl font-bold">Audience</h2>
                    <span className="text-sm text-muted-foreground">Kit / newsletter</span>
                </div>

                {!kit.available ? (
                    <NotConfigured>Kit metrics unavailable{kit.note ? ` — ${kit.note}.` : "."}</NotConfigured>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            label="Subscribers"
                            value={kit.subscribers !== null ? formatNumber(kit.subscribers) : "—"}
                            accent="text-primary"
                        />
                        <StatCard
                            label="Net new (last 90d)"
                            value={kit.netNewSubscribers !== null ? formatNumber(kit.netNewSubscribers) : "—"}
                        />
                    </div>
                )}
            </section>

            {/* Phase 2 channels */}
            <section>
                <NotConfigured>
                    Coming next: YouTube, LinkedIn, and Substack channel metrics, plus Kit broadcast open/click rates.
                </NotConfigured>
            </section>
        </main>
    );
}
