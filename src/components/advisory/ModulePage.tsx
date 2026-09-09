import type { ComponentProps, ReactNode } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EngagementContactForm } from './EngagementContactForm'

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
}

/**
 * The one template every follow-on module page comes off.
 *
 * The four engagements learned this the expensive way: three were pages and the
 * Retainer was a section on the hub, and that asymmetry is exactly why their
 * styling kept diverging. A module is not an engagement — it has no hero
 * artwork and no "where it leads" band — so it gets its own template rather
 * than a fifth variant of `FocusedEngagementPage`. A sixth module comes off
 * this or the divergence starts again.
 */
export function ModulePage({ name, price, lead, body, deliverables, fromTool, scope, contact }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
              Follow-on module
            </Badge>
            <h1 className="mb-6 max-w-4xl text-4xl font-bold text-text-primary sm:text-5xl">{name}</h1>
            <p className="max-w-3xl text-xl leading-relaxed text-text-muted">{lead}</p>

            {fromTool && (
              <p className="mt-6 max-w-3xl leading-relaxed text-text-muted">
                {/* The catalogue stores the bare tool name, because the tool
                    pages use it as a heading. The article belongs to the
                    sentence, not to the name. */}
                Follows on from the{' '}
                <Link href={fromTool.href} className="text-stone-teal underline underline-offset-4">
                  {fromTool.name}
                </Link>
                , which you can run yourself for nothing. This module is what happens when
                you need the same question answered against your own estate.
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button asChild size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                <a href="#contact">Enquire about this module</a>
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

        <section aria-labelledby="scope-heading" className="border-b border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:px-8 lg:py-12">
            <div>
              <h2 id="scope-heading" className="mb-3 text-2xl font-semibold text-text-primary">Scope and fee</h2>
              <p className="font-mono text-3xl font-semibold text-silicon-amber-strong">{price}</p>
            </div>
            <div className="max-w-3xl space-y-4 leading-relaxed text-text-muted">{scope}</div>
          </div>
        </section>

        <EngagementContactForm {...contact} />
      </main>
      <Footer />
    </div>
  )
}
