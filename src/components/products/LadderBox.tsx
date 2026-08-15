import { ArrowRight } from 'lucide-react'

import { LADDER } from '@/lib/offering'

/**
 * "The Ladder" credit box — every paid step leads to the next. Shown on
 * /products, /advisory and /pricing.
 *
 * Supersedes the locked pre-launch copy (packaging spec §2.4), which ran
 * £24 → £450 → £2,500 and had two problems: it skipped the Toolkit even though
 * the first rung's whole benefit is money off it, and it said "Briefing" for
 * the Advisory Briefing while a second, unrelated briefing existed on
 * /eu-exposure. Both briefings are now named in full.
 *
 * The rungs come from `LADDER` in src/lib/offering.ts, so the figures here
 * cannot drift from the pages they point at, and the data decides which rungs
 * carry a money credit worth emphasising.
 */
export function LadderBox() {
  return (
    <div className="rounded-lg border border-silicon-amber/30 bg-silicon-amber/5 p-6 lg:p-8">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">
        Every step builds on the last.
      </h3>
      <ul className="space-y-2.5">
        {LADDER.map((rung) => (
          <li key={rung.from} className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
            <span className="font-mono text-text-primary">{rung.from}</span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-silicon-amber-strong" aria-label="leads to" />
            <span>
              {rung.emphasis && (
                <>
                  <strong className="text-text-primary">{rung.emphasis}</strong>{' '}
                </>
              )}
              {rung.to}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm italic text-text-muted">
        Start anywhere. Never pay twice for the same ground.
      </p>
    </div>
  )
}
