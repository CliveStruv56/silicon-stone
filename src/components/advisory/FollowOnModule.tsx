import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { MODULES } from '@/lib/offering'

/**
 * The paid module that follows on from a free tool, shown beneath the tool.
 *
 * Three of the modules grew out of a self-service tool, and until 2026-09-09 all
 * of them were cards on `/advisory` — so a reader who had just run the Supply
 * Chain Mapper and hit its limit was told nothing, while the thing that answers
 * their next question sat two pages away behind a nav item called "Modules".
 * This is the same catalogue entry, put where the question occurs.
 *
 * It addresses someone who has **just finished the tool**, which is what the
 * first version got wrong: it opened "When the tool reaches its limit", which
 * describes the module rather than speaking to the reader, and it wore the same
 * quiet card styling as the tool's own panels, so at the bottom of a long page
 * it read as more tool rather than as the next step. The amber band is the
 * site's commercial callout treatment — the same one the pricing sections use.
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
  if (!offering.fromTool) {
    throw new Error(`FollowOnModule: "${moduleId}" has no fromTool in the catalogue`)
  }

  return (
    <section
      aria-labelledby={`follow-on-${offering.id}`}
      className="border-t border-silicon-amber/30 bg-silicon-amber/5"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider text-silicon-amber-strong">
          Now you have run the {offering.fromTool.name}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 id={`follow-on-${offering.id}`} className="text-2xl font-semibold text-text-primary">
            {offering.name}
          </h2>
          <Badge variant="outline" className="font-mono text-[12px] text-text-primary border-border-subtle">
            {offering.price}
          </Badge>
        </div>
        <p className="mt-4 max-w-3xl leading-relaxed text-text-primary">
          You have the general picture. The next question is usually the specific one —
          what this means for your organisation, your suppliers and your decisions.
          That is what this module answers.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-text-muted">{offering.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={offering.href}
            className="inline-flex items-center gap-2 rounded-md bg-accent-fill px-5 py-2.5 font-medium text-ink-on-accent transition-colors hover:bg-accent-fill/90"
          >
            For more details on the {offering.name}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-text-muted">
            Scoped and fixed-priced before any work begins.
          </span>
        </div>
      </div>
    </section>
  )
}
