import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MODULES } from '@/lib/offering'

/** One catalogue for direct commissioning and optional tool-led discovery. */
export function SpecialistProjects() {
  return (
    <section id="modules" aria-labelledby="specialist-projects-heading" className="scroll-mt-24 border-y border-border-subtle bg-slate-deep">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-8 max-w-3xl">
          <h2 id="specialist-projects-heading" className="mb-4 text-2xl font-semibold text-text-primary">Specialist advisory projects</h2>
          <p className="leading-relaxed text-text-muted">
            A focused project for a defined business question. Commission directly,
            or explore the question with a free tool first. No earlier purchase or
            retainer is required. Scope and fees are agreed after a free conversation.
          </p>
        </div>
        <div aria-hidden="true" className="hidden gap-8 border-b border-border-subtle px-6 pb-3 text-sm font-semibold text-text-muted lg:grid lg:grid-cols-[1fr_1.5fr_1fr]">
          <span>Your question</span><span>Project and outcome</span><span>Scope and next step</span>
        </div>
        <ul className="divide-y divide-border-subtle">
          {MODULES.map(offering => (
            <li key={offering.id} className="grid gap-5 py-7 lg:grid-cols-[1fr_1.5fr_1fr] lg:gap-8 lg:px-6">
              <p className="font-serif text-lg leading-relaxed text-text-primary">{offering.question}</p>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">
                  <Link href={offering.href} className="rounded-sm hover:text-stone-teal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-teal">{offering.name}</Link>
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">{offering.summary}</p>
                {offering.fromTool && (
                  <p className="mt-3 text-sm text-text-muted">
                    Optional free tool:{' '}
                    <Link href={offering.fromTool.href} className="text-stone-teal underline underline-offset-4">{offering.fromTool.name}</Link>
                  </p>
                )}
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-silicon-amber-strong">{offering.price}</p>
                <Link href={offering.href} aria-label={`View scope: ${offering.name}`} className="mt-3 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-stone-teal underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-teal">
                  View project scope <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text-muted">
          Projects for Drift Retainer clients are separately scoped and charged in
          addition to the monthly fee. Where a broader engagement covers the same
          work, we agree the combined scope and fee to account for the overlap.
        </p>
      </div>
    </section>
  )
}
