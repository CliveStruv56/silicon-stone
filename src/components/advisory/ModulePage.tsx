import type { ComponentProps, ReactNode } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EngagementContactForm } from './EngagementContactForm'
import { EngagementSteps } from './FocusedEngagementPage'
import { RelatedCoverage } from './RelatedCoverage'

type Props = {
  /** Catalogue id, so the page and `MODULES` cannot drift apart. */
  name: string
  price: string
  lead: string
  body: ReactNode
  deliverables: string[]
  /** The self-service tool this module follows on from, where there is one. */
  fromTool?: { name: string; href: string }
  scope: ReactNode
  contact: ComponentProps<typeof EngagementContactForm>
  /**
   * Who the module is for and the moment it is bought at. Rendered between
   * "What it is" and the method, so the reader places themselves before they
   * are told how the work is done.
   */
  audience?: ReactNode
  /** The steps the work goes through, in order. Rendered as numbered steps. */
  method?: { title: string; body: string }[]
  /**
   * Why the output matters beyond the engagement — typically the regulation
   * that asks for the record the module produces. Takes a heading because the
   * framing differs by module.
   */
  context?: { heading: string; body: ReactNode }
  /** Published coverage under this offer; see `RelatedCoverage`. */
  coverage?: ComponentProps<typeof RelatedCoverage>
}

/** Shared presentation for independently commissioned specialist projects. */
export function ModulePage({
  name, price, lead, body, deliverables, fromTool, scope, contact,
  audience, method, context, coverage,
}: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <Link href="/advisory#modules" className="mb-5 block text-sm text-stone-teal underline underline-offset-4">All specialist projects</Link>
            <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
              Specialist advisory
            </Badge>
            <h1 className="mb-6 max-w-4xl text-4xl font-bold text-text-primary sm:text-5xl">{name}</h1>
            <p className="max-w-3xl text-xl leading-relaxed text-text-muted">{lead}</p>

            <p className="mt-5 max-w-3xl leading-relaxed text-text-muted">
              Commission this project directly after a free scoping conversation.
              No previous engagement or use of a tool is required.
            </p>
            {fromTool && (
              <p className="mt-6 max-w-3xl leading-relaxed text-text-muted">
                {/* The catalogue stores the bare tool name, because the tool
                    pages use it as a heading. The article belongs to the
                    sentence, not to the name. */}
                Optional starting point: the free{' '}
                <Link href={fromTool.href} className="text-stone-teal underline underline-offset-4">
                  {fromTool.name}
                </Link>
                .
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button asChild size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                <a href="#contact">Discuss this project</a>
              </Button>
              <span className="font-mono text-lg font-semibold text-silicon-amber-strong">{price}</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="what-heading" className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
            <h2 id="what-heading" className="text-2xl font-semibold text-text-primary">What it is</h2>
            <div className="max-w-3xl space-y-4 leading-relaxed text-text-muted">{body}</div>
          </div>
        </section>

        {audience && (
          <section aria-labelledby="audience-heading" className="border-t border-border-subtle">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
              <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
                <h2 id="audience-heading" className="text-2xl font-semibold text-text-primary">Who it is for</h2>
                <div className="max-w-3xl space-y-4 leading-relaxed text-text-muted">{audience}</div>
              </div>
            </div>
          </section>
        )}

        {method && method.length > 0 && (
          <section aria-labelledby="method-heading" className="border-t border-border-subtle">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
              <h2 id="method-heading" className="mb-8 text-2xl font-semibold text-text-primary">How the work is done</h2>
              <EngagementSteps steps={method} />
            </div>
          </section>
        )}

        <section aria-labelledby="deliverables-heading" className="border-y border-border-subtle bg-stone-charcoal">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <h2 id="deliverables-heading" className="mb-8 text-2xl font-semibold text-text-primary">What you receive</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {deliverables.map(item => (
                <li key={item} className="flex items-start gap-3 leading-relaxed text-text-primary">
                  <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-stone-teal" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {context && (
          <section aria-labelledby="context-heading" className="border-b border-border-subtle">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
              <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
                <h2 id="context-heading" className="text-2xl font-semibold text-text-primary">{context.heading}</h2>
                <div className="max-w-3xl space-y-4 leading-relaxed text-text-muted">{context.body}</div>
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="scope-heading" className="border-b border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:px-8 lg:py-12">
            <div>
              <h2 id="scope-heading" className="mb-3 text-2xl font-semibold text-text-primary">Scope and fee</h2>
              <p className="font-mono text-3xl font-semibold text-silicon-amber-strong">{price}</p>
            </div>
            <div className="max-w-3xl space-y-4 leading-relaxed text-text-muted">
              <p>A standalone specialist engagement, scoped and priced after a free conversation. No previous paid engagement is required.</p>
              {scope}
              <p>For <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link> clients, this project is separately scoped and charged at the agreed project fee. It is additional to the monthly retainer.</p>
            </div>
          </div>
        </section>

        <EngagementContactForm {...contact} />

        {coverage && <RelatedCoverage {...coverage} />}
      </main>
      <Footer />
    </div>
  )
}
