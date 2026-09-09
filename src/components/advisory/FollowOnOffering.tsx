import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Offering } from '@/lib/offering'

/** Shared treatment for the paid next step beneath a free tool. */
export function FollowOnOffering({ offering, eyebrow, intro, note }: {
  offering: Offering
  eyebrow: string
  intro: string
  note: string
}) {
  return (
    <section
      aria-labelledby={`follow-on-${offering.id}`}
      className="border-t border-silicon-amber/30 bg-silicon-amber/5"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider text-silicon-amber-strong">
          {eyebrow}
        </div>
        {/* The badge sits beside the name, not at the far edge. With
            `justify-between` it was pushed to the right of a max-w-7xl row —
            around 900px from the heading at desktop width — so the price read
            as an unrelated chit floating in the band rather than as this
            offering's price. `flex-wrap` still drops it below on a narrow
            screen, where the heading takes the full width. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id={`follow-on-${offering.id}`} className="text-2xl font-semibold text-text-primary">
            {offering.name}
          </h2>
          <Badge variant="outline" className="font-mono text-[12px] text-text-primary border-border-subtle">
            {offering.price}
          </Badge>
        </div>
        <p className="mt-4 max-w-3xl leading-relaxed text-text-primary">{intro}</p>
        <p className="mt-3 max-w-3xl leading-relaxed text-text-muted">{offering.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={offering.href}
            className="inline-flex items-center gap-2 rounded-md bg-accent-fill px-5 py-2.5 font-medium text-ink-on-accent transition-colors hover:bg-accent-fill/90"
          >
            For more details on the {offering.name}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
          <span className="text-sm text-text-muted">{note}</span>
        </div>
      </div>
    </section>
  )
}
