import type { ComponentProps, ReactNode } from 'react'

import { Header, Footer } from '@/components/layout'
import { EngagementContactForm } from './EngagementContactForm'
import { EngagementHero } from './EngagementHero'
import { RelatedCoverage } from './RelatedCoverage'

type Props = {
  hero: Omit<ComponentProps<typeof EngagementHero>, 'showRelatedLink'>
  audience: ReactNode
  process: ReactNode
  price: string
  pricing: ReactNode
  contact: ComponentProps<typeof EngagementContactForm>
  /**
   * Articles placed under this engagement in Studio (`article.appearsUnder`),
   * fetched by the server half of the page. Rendered after the enquiry form,
   * as on the module pages; nothing placed, nothing rendered.
   */
  coverage?: ComponentProps<typeof RelatedCoverage>
}

/** The agreed reading order for Briefing, Diagnostic and Retainer. */
export function FocusedEngagementPage({ hero, audience, process, price, pricing, contact, coverage }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <EngagementHero {...hero} showRelatedLink={false} />

        <section aria-labelledby="audience-heading" className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
            <h2 id="audience-heading" className="text-2xl font-semibold text-text-primary">Who it’s for</h2>
            <div className="max-w-3xl space-y-4 leading-relaxed text-text-muted">{audience}</div>
          </div>
        </section>

        <section aria-labelledby="process-heading" className="border-y border-border-subtle bg-stone-charcoal">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <h2 id="process-heading" className="mb-8 text-2xl font-semibold text-text-primary">How it works</h2>
            {process}
          </div>
        </section>

        <section aria-labelledby="pricing-heading" className="border-b border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:px-8 lg:py-12">
            <div>
              <h2 id="pricing-heading" className="mb-3 text-2xl font-semibold text-text-primary">Pricing</h2>
              <p className="font-mono text-3xl font-semibold text-silicon-amber-strong">{price}</p>
            </div>
            <div className="max-w-3xl space-y-4 leading-relaxed text-text-muted">{pricing}</div>
          </div>
        </section>

        <EngagementContactForm {...contact} />

        {coverage && <RelatedCoverage {...coverage} />}
      </main>
      <Footer />
    </div>
  )
}

/** Numbered only for steps that actually happen in sequence. */
export function EngagementSteps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-8 md:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="border-t border-border-subtle pt-5">
          <div className="mb-3 text-sm text-stone-teal">Step {index + 1}</div>
          <h3 className="mb-3 text-lg font-semibold text-text-primary">{step.title}</h3>
          <p className="text-sm leading-relaxed text-text-muted">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}
