import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Format a USD amount; sub-cent values get more precision for embeddings etc. */
export function formatUSD(value: number): string {
    if (value === 0) return "$0.00";
    if (value < 0.01) return `$${value.toFixed(4)}`;
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number): string {
    return value.toLocaleString("en-US");
}

export function formatTokens(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return formatNumber(value);
}

/** Headline KPI tile. */
export function StatCard({
    label,
    value,
    sublabel,
    accent = "text-foreground",
}: {
    label: string;
    value: string | number;
    sublabel?: string;
    accent?: string;
}) {
    return (
        <Card className="gap-2 py-5">
            <div className="px-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className={cn("mt-1 text-3xl font-bold tabular-nums", accent)}>{value}</div>
                {sublabel ? <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div> : null}
            </div>
        </Card>
    );
}

export interface BarItem {
    label: string;
    count: number;
}

/** Horizontal count bars, scaled to the largest item in the list. */
export function BarList({ items, barClass = "bg-primary/70" }: { items: BarItem[]; barClass?: string }) {
    const max = Math.max(1, ...items.map((i) => i.count));
    return (
        <div className="space-y-2.5">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 truncate text-sm text-muted-foreground">{item.label}</div>
                    <div className="relative h-5 flex-1 overflow-hidden rounded bg-muted/40">
                        <div
                            className={cn("absolute inset-y-0 left-0 rounded", barClass)}
                            style={{ width: `${(item.count / max) * 100}%` }}
                        />
                    </div>
                    <div className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">{item.count}</div>
                </div>
            ))}
        </div>
    );
}

/** Pure-SVG daily spend bar chart (server-rendered, no client deps). */
export function SpendTrend({ points }: { points: Array<{ date: string; costDollars: number }> }) {
    if (points.length === 0) {
        return <div className="text-sm text-muted-foreground">No spend recorded in this period yet.</div>;
    }

    const W = 720;
    const H = 140;
    const gap = 2;
    const max = Math.max(...points.map((p) => p.costDollars), 0.0001);
    const barW = (W - gap * (points.length - 1)) / points.length;

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-36 w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label="Daily API spend"
        >
            {points.map((p, i) => {
                const h = Math.max(1, (p.costDollars / max) * (H - 4));
                return (
                    <rect
                        key={p.date}
                        x={i * (barW + gap)}
                        y={H - h}
                        width={barW}
                        height={h}
                        rx={1}
                        className="fill-primary/70"
                    >
                        <title>{`${p.date}: ${formatUSD(p.costDollars)}`}</title>
                    </rect>
                );
            })}
        </svg>
    );
}

/** Muted notice used when a data source isn't wired up / configured yet. */
export function NotConfigured({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {children}
        </div>
    );
}
