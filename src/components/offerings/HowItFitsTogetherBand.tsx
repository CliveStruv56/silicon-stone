import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HOW_IT_FITS_TOGETHER_PATH } from '@/lib/offerings-map'

const STAGES = ['Read', 'Use', 'Talk', 'Commission', 'Stay'] as const

/**
 * The one prominent way into `/how-it-fits-together` (owner request,
 * 2026-09-13): a slim band directly beneath the hero on `/tools`, `/advisory`
 * and `/products`. The same band on all three so it is recognised as the same
 * door. No hooks, so the client `/advisory` page can import it without cost.
 *
 * Teal-tinted rather than amber: on `/products` it sits directly beneath the
 * amber urgency banner, and two amber bands stacked read as one long one.
 */
export function HowItFitsTogetherBand() {
  return (
    <section aria-label="How the offerings fit together" className="border-b border-stone-teal/25 bg-stone-teal/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4 lg:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
          <ol className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-teal" aria-hidden="true">
            {STAGES.map((stage, i) => (
              <li key={stage} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-stone-teal" />
                <span className="hidden lg:inline">{stage}</span>
                {i < STAGES.length - 1 && <span className="ml-1.5 h-px w-3 bg-stone-teal/60" />}
              </li>
            ))}
          </ol>
          <p className="text-sm text-text-primary">
            <span className="font-semibold">Not sure where this sits?</span>{' '}
            The whole path, from free tools to the retainer, on one map.
          </p>
        </div>
        <Link
          href={HOW_IT_FITS_TOGETHER_PATH}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-stone-teal px-4 py-2 text-sm font-medium text-ink-on-accent transition-colors hover:bg-stone-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-teal"
        >
          See how it fits together
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
