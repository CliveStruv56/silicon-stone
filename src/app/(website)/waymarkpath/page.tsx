import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ConnectedSystem, FlowRibbon, WaymarkPathSignup } from '@/components/waymarkpath'
import { WAYMARKPATH_PROOF } from '@/lib/waymarkpath'

/**
 * The WaymarkPath page.
 *
 * This is a server component: every interactive part (the two signup forms, the
 * connected-system diagram) is a client component of its own. It used to be
 * `'use client'` with the form inline and rendered twice off one piece of
 * state, so submitting the hero form turned the closing CTA into a success
 * panel. Metadata moved back here from a sibling `layout.tsx` that existed only
 * to work around the client boundary.
 *
 * Colour register is `--sister-indigo` throughout, not the S&S amber/teal. The
 * design system reserves that token for WaymarkPath specifically, so the page
 * reads as a sister product rather than as another Silicon and Stone line.
 */

export const metadata: Metadata = {
  title: 'WaymarkPath — Career Navigation for the AI Shift | Silicon and Stone',
  description:
    'A career-transition companion for mid-career professionals: skills measured against ESCO, gaps ranked, a CV that clears the filters, and a coach that carries your history.',
  alternates: { canonical: '/waymarkpath' },
}

const FRICTIONS = [
  {
    title: 'Which experience actually transfers',
    body: 'Twenty years of work does not come labelled for the role you are moving into. Most of it transfers. The difficulty is establishing which parts, in the vocabulary the target role recognises.',
  },
  {
    title: 'What to learn first',
    body: 'There is more available training than there is time. Without a ranking, effort goes to whatever is nearest to hand rather than to whatever is actually blocking the move.',
  },
  {
    title: 'Why applications go unanswered',
    body: 'Most applications are filtered before a person reads them. A CV can be accurate, well written and still fail on formatting the applicant never gets to see.',
  },
  {
    title: 'What holds it together over months',
    body: 'A transition runs across months of ordinary working weeks. Human coaching is the usual answer to that, at an hourly rate that rules it out for most of the people who need it.',
  },
]

const AUDIENCE = [
  'Directors considering a pivot',
  'Managers upskilling into AI roles',
  'Technical leads moving to strategy',
  'Anyone 35–55 navigating career change',
]

export default function WaymarkPathPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm uppercase tracking-[0.18em] text-sister-indigo">
                  WaymarkPath
                </span>
                <Badge className="border-sister-indigo/30 bg-sister-indigo/15 text-sister-indigo">
                  Early access
                </Badge>
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-tight text-text-primary sm:text-5xl lg:text-[3.4rem]">
                Seven stages of a career change, working from one set of facts
                about you.
              </h1>

              <p className="mb-4 text-xl leading-relaxed text-text-muted">
                A transition companion for mid-career professionals. It catalogues
                what you already have, measures it against what the target role
                requires, and keeps the plan alive through the months that takes.
              </p>

              <p className="mb-9 leading-relaxed text-text-muted">
                Silicon and Stone reads the technology shift at company level.
                WaymarkPath reads it at the level of a single career — a separate
                product, built by the same hand.
              </p>

              <WaymarkPathSignup id="hero" />

              <FlowRibbon className="mt-12 max-w-2xl" />
            </div>
          </div>
        </section>

        {/* The frictions */}
        <section className="border-b border-border-subtle bg-stone-charcoal/40">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
            <div className="mb-10 max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold text-text-primary">
                Career changes rarely fail for lack of effort
              </h2>
              <p className="text-lg leading-relaxed text-text-muted">
                They fail on four specific unknowns, and none of them resolve by
                trying harder.
              </p>
            </div>

            <StaggerContainer className="grid gap-5 sm:grid-cols-2">
              {FRICTIONS.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="card-interactive h-full rounded-xl border border-border-subtle bg-stone-charcoal p-6">
                    <h3 className="mb-2 font-semibold text-text-primary">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-text-muted">{item.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* The connected system — the centrepiece */}
        <section className="border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
            <div className="mb-10 max-w-2xl">
              <span className="mb-3 block font-mono text-[12px] uppercase tracking-[0.12em] text-sister-indigo">
                How it fits together
              </span>
              <h2 className="mb-4 text-3xl font-bold text-text-primary">
                Most tools solve one piece of this
              </h2>
              <p className="text-lg leading-relaxed text-text-muted">
                A CV checker does not know what you are aiming at. A course
                catalogue does not know what you already have. Here the gap
                analysis sets the learning order, the same strengths reframe the
                CV, and the coach sees all of it. Select a stage to see what it
                settles and what receives it.
              </p>
            </div>

            <ConnectedSystem />
          </div>
        </section>

        {/* Proof */}
        <section className="border-b border-border-subtle bg-stone-charcoal/40">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14">
            <StaggerContainer className="grid gap-6 md:grid-cols-3">
              {WAYMARKPATH_PROOF.map((item) => (
                <StaggerItem key={item.label}>
                  <div className="h-full border-l-2 border-sister-indigo/40 pl-5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                      {item.label}
                    </span>
                    <p className="mt-1 text-xl font-semibold text-text-primary">{item.value}</p>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.note}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
                Built for:
              </span>
              <div className="flex flex-wrap gap-3">
                {AUDIENCE.map((who) => (
                  <Badge
                    key={who}
                    variant="outline"
                    className="border-border-subtle text-xs text-text-muted"
                  >
                    {who}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-slate-deep">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
            <div className="max-w-2xl">
              <h2 className="mb-4 text-2xl font-bold text-text-primary">
                Join the early access list
              </h2>
              <p className="mb-8 leading-relaxed text-text-muted">
                WaymarkPath is in late development: all seven stages are built,
                and the billing and account work is the remainder. The early
                access list gets it first, and gets asked what is missing while
                that still changes the product.
              </p>

              <WaymarkPathSignup id="closing" />

              <p className="mt-10 text-sm text-text-muted">
                Here for the company-level view?{' '}
                <Link href="/intelligence" className="text-stone-teal hover:underline">
                  Explore the Intelligence Stream
                  <ArrowRight className="ml-1 inline h-3 w-3" />
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
