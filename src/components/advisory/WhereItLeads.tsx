import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ENGAGEMENTS, type Offering } from '@/lib/offering'

/**
 * The three siblings, on every engagement page.
 *
 * The ladder used to be visible only inside `LadderBox` on the hub, so a reader
 * who landed on one product page from search saw one product and no sense that
 * there were four. This is the cross-promotion the whole restructure is for, and
 * it is strongest on the Advisory Briefing, whose entire job is to end with a
 * decision about what to do next.
 *
 * Rows are keyed on `Offering.question` — the buyer's words, not the product
 * name — because "I don't know what we've actually got" sorts a reader faster
 * than a name and a price. `lead` is the page-specific bridge: what it means
 * when *this* engagement ends pointing at *that* one.
 *
 * Everything but the bridge comes from the catalogue, so a price or a URL cannot
 * drift from `/pricing` and the nav.
 */
export function WhereItLeads({
  currentId,
  heading = 'Where it leads',
  intro,
  bridges = {},
}: {
  /** Catalogue id of the page this renders on — it is excluded from the list. */
  currentId: string
  heading?: string
  intro?: React.ReactNode
  /** Per-sibling bridging line, keyed by catalogue id. */
  bridges?: Record<string, string>
}) {
  const LADDER_IDS = [
    'advisory-briefing',
    'exposure-diagnostic',
    'drift-retainer',
    'strategic-assessment',
  ]

  const siblings: Offering[] = LADDER_IDS.filter((id) => id !== currentId)
    .map((id) => ENGAGEMENTS.find((offering) => offering.id === id))
    .filter((offering): offering is Offering => Boolean(offering))

  return (
    <section id="where-it-leads" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
      <div className="mb-8 max-w-3xl">
        <h2 className="mb-4 text-2xl font-semibold text-text-primary">{heading}</h2>
        {intro && <p className="text-text-muted">{intro}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {siblings.map((offering) => (
          <Link key={offering.id} href={offering.href} className="group block h-full">
            <div className="flex h-full flex-col rounded-lg border border-border-subtle bg-stone-charcoal p-6 transition-colors group-hover:border-stone-teal/40">
              {offering.question && (
                <p className="mb-3 font-serif text-base italic leading-snug text-text-primary">
                  &ldquo;{offering.question}&rdquo;
                </p>
              )}
              <div className="mb-1 text-lg font-semibold text-text-primary">{offering.name}</div>
              <div className="mb-3 font-mono text-sm text-silicon-amber-strong">
                {offering.price}
                {offering.priceNote && (
                  <span className="ml-2 font-sans text-xs text-text-muted">{offering.priceNote}</span>
                )}
              </div>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-text-muted">
                {bridges[offering.id] ?? offering.summary}
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-stone-teal group-hover:underline">
                Read more
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
