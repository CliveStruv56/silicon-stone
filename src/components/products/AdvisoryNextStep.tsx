import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AMOUNTS, gbp } from '@/lib/offering'

/**
 * "Take it further" band for product pages — the explicit route from a one-off
 * purchase to advisory. The warmest retainer lead is the buyer who's clearly
 * exposed, so every product names a path to the Advisory Briefing and the
 * Drift Retainer rather than ending at the next product.
 */
export function AdvisoryNextStep() {
  return (
    <section className="border-t border-silicon-amber/30 bg-silicon-amber/5">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-silicon-amber-strong">
            Take it further
          </div>
          <h2 className="mb-4 text-2xl font-bold text-text-primary">
            When the tool reaches its limit
          </h2>
          <p className="mb-8 text-text-muted">
            The buyers who get the most from these products are usually the ones
            already carrying real exposure. If that&apos;s you, the warmest next step is
            a {gbp(AMOUNTS.advisoryBriefing)} Advisory Briefing — a one-hour read on your specific situation,
            credited in full toward a Drift Retainer if you go on to one within 30
            days.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/advisory#contact">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-fill px-5 py-2.5 text-sm font-semibold text-ink-on-accent transition-colors hover:bg-accent-fill/90">
                Book an Advisory Briefing — {gbp(AMOUNTS.advisoryBriefing)}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/advisory#retainer">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-silicon-amber/60 px-5 py-2.5 text-sm font-medium text-silicon-amber-strong transition-colors hover:bg-silicon-amber/10">
                See the Drift Retainer
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
          <p className="mt-5 text-sm text-text-muted">
            Selling into Europe under the AI Act? The{' '}
            <Link href="/eu-exposure" className="text-silicon-amber-strong hover:underline">
              Post-Omnibus Briefing
            </Link>{' '}
            is the fixed-price read on what now applies to your business.
          </p>
        </div>
      </div>
    </section>
  )
}
