import { ArrowRight } from 'lucide-react'

/**
 * "The Ladder" credit box — every paid step leads to the next. Shown on
 * /products and /advisory.
 *
 * Supersedes the locked pre-launch copy (packaging spec §2.4), which ran
 * £24 → £450 → £2,500 and had two problems: it skipped the £79 Toolkit even
 * though the first rung's whole benefit is £20 off it, and it said "Briefing"
 * for the £450 Advisory Briefing while a second, unrelated £2,500 briefing
 * existed on /eu-exposure. Both briefings are now named in full.
 *
 * Every figure here is a commercial claim — keep them in step with their
 * source pages:
 *   £24 / £79   products/page.tsx (`From £79` — Standard £79, Professional £149)
 *   £450        advisory/page.tsx (Advisory Briefing, credited in full)
 *   £2,500      eu-exposure/page.tsx (Post-Omnibus Briefing, `From £2,500`)
 *   £2,500      advisory/page.tsx (Exposure Diagnostic, credited to Q1)
 * `+` renders the "From" in those prices without bloating the mono column.
 * Only rungs 1, 3 and 5 carry a money credit; 2 and 4 are scope progressions,
 * so they are deliberately not bolded as if they discounted anything.
 */
export function LadderBox() {
  const rungs = [
    { from: '£24 Checklist Pack', to: <><strong className="text-text-primary">£20 off</strong> the AI Act Compliance Toolkit.</> },
    { from: '£79+ Compliance Toolkit', to: <>the evidence base a briefing starts from.</> },
    { from: '£450 Advisory Briefing', to: <><strong className="text-text-primary">credited in full</strong> to your first retainer month.</> },
    { from: '£2,500+ Post-Omnibus Briefing', to: <>extends into a Drift Retainer where the exposure is ongoing.</> },
    { from: '£2,500+ Exposure Diagnostic', to: <><strong className="text-text-primary">credited</strong> to your first retainer quarter.</> },
  ]

  return (
    <div className="rounded-lg border border-silicon-amber/30 bg-silicon-amber/5 p-6 lg:p-8">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">
        Every step builds on the last.
      </h3>
      <ul className="space-y-2.5">
        {rungs.map((rung, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
            <span className="font-mono text-text-primary">{rung.from}</span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-silicon-amber-strong" aria-label="leads to" />
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
