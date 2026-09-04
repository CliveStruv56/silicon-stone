import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

/**
 * The same three lines of orientation at the top of all four engagement pages.
 *
 * Each page used to open cold on its own product. That is right for a reader who
 * arrived from the Advisory menu and wrong for the one who arrived from a search
 * for "AI Act exposure review" and has no idea whose page this is — and the
 * second reader is the one a product page exists to catch.
 *
 * Deliberately identical on every page and deliberately quiet: muted type, no
 * heading level, ~3 lines. It orients without delaying the product message, and
 * because it is byte-identical everywhere it is also what makes the four pages
 * read as one family. The link out is the other half of that — every engagement
 * page is one click from its three siblings.
 */
export function AdvisoryPracticeBand() {
  return (
    <section className="border-b border-border-subtle bg-stone-charcoal/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-4">
          <Badge variant="outline" className="w-fit border-stone-teal text-stone-teal">
            Advisory
          </Badge>
          <p className="max-w-3xl text-sm leading-relaxed text-text-muted">
            AI adoption creates a governance problem and a dependency problem at the same
            time — and both keep moving. We help organisations map the exposure, then stay
            ahead of it.
          </p>
        </div>
        <Link
          href="/advisory#engagements"
          className="inline-flex flex-shrink-0 items-center gap-1 text-sm text-stone-teal hover:underline"
        >
          Compare all four engagements
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  )
}
