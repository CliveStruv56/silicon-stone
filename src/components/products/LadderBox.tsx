import { ArrowRight } from 'lucide-react'

/**
 * "The Ladder" credit box — every paid step credits toward the next. Shown on
 * /products and /advisory. Copy is locked (pre-launch packaging spec §2.4).
 */
export function LadderBox() {
  const rungs = [
    { from: '£24 Checklist Pack', to: <><strong className="text-text-primary">£20 off</strong> the Toolkit.</> },
    { from: '£450 Briefing', to: <><strong className="text-text-primary">credited in full</strong> to your first retainer month.</> },
    { from: '£2,500 Diagnostic', to: <><strong className="text-text-primary">credited</strong> to your first retainer quarter.</> },
  ]

  return (
    <div className="rounded-lg border border-silicon-amber/30 bg-silicon-amber/5 p-6 lg:p-8">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">
        Every step pays for the next.
      </h3>
      <ul className="space-y-2.5">
        {rungs.map((rung, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
            <span className="font-mono text-text-primary">{rung.from}</span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-silicon-amber" aria-label="leads to" />
            <span>{rung.to}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm italic text-text-muted">
        Start anywhere. Never pay twice for the same ground.
      </p>
    </div>
  )
}
