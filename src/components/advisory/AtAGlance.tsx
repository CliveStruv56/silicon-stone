import { ArrowRight, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * Price, top deliverables and a CTA, directly under the hero.
 *
 * It used to be the hero's right-hand column on the two product pages, which is
 * what displaced the photograph that every other page in the family has. Moving
 * it one band down keeps both: the hero matches its siblings, and the numbers
 * still sit within the first screen on desktop.
 */
export function AtAGlance({
  price,
  priceNote,
  points,
  ctaLabel,
  ctaHref = '#contact',
}: {
  price: string
  priceNote: string
  points: string[]
  ctaLabel: string
  ctaHref?: string
}) {
  return (
    <section className="border-b border-border-subtle bg-stone-charcoal">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_3fr] lg:items-center">
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-wider text-text-muted">
              At a glance
            </div>
            <div className="font-mono text-3xl font-semibold text-text-primary">{price}</div>
            <div className="mt-1 text-sm text-text-muted">{priceNote}</div>
            <a href={ctaHref} className="mt-5 inline-block">
              <Button size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                {ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
          <ul className="space-y-3 lg:border-l lg:border-border-subtle lg:pl-8">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-text-primary">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-silicon-amber-strong" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
