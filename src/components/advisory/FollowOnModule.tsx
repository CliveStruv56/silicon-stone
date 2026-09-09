import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { MODULES } from '@/lib/offering'

/**
 * The paid module that follows on from a free tool, shown beneath the tool.
 *
 * Three of the five modules grew out of a self-service tool, and until
 * 2026-09-09 all five were cards on `/advisory` — so a reader who had just run
 * the Supply Chain Mapper and hit its limit was told nothing, while the thing
 * that answers their next question sat two pages away behind a nav item called
 * "Modules". This is the same catalogue entry, put where the question occurs.
 *
 * It reads from `MODULES` by id rather than taking name, price and summary as
 * props: three copies of a catalogue entry across three tool pages is exactly
 * the drift the offering catalogue exists to prevent, and a summary that
 * disagreed with `/pricing` would look entirely healthy on both pages.
 */
export function FollowOnModule({ moduleId }: { moduleId: string }) {
  const offering = MODULES.find(m => m.id === moduleId)
  // A mistyped id must not silently render an empty band beneath the tool.
  if (!offering) throw new Error(`FollowOnModule: no module with id "${moduleId}"`)

  return (
    <section
      aria-labelledby={`follow-on-${offering.id}`}
      className="border-t border-border-subtle bg-stone-charcoal"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider text-silicon-amber-strong">
          When the tool reaches its limit
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 id={`follow-on-${offering.id}`} className="text-2xl font-semibold text-text-primary">
            {offering.name}
          </h2>
          <Badge variant="outline" className="font-mono text-[12px] text-text-primary border-border-subtle">
            {offering.price}
          </Badge>
        </div>
        <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">{offering.summary}</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
          The tool above models the question in general. This module answers it against
          your own organisation, with a scope and a fixed fee agreed before work begins.
        </p>
        <Link
          href={offering.href}
          className="mt-5 inline-flex items-center gap-1.5 font-medium text-stone-teal hover:underline"
        >
          For more details on the {offering.name}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
