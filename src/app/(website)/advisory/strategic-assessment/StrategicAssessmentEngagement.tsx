'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  FileText,
  Layers,
  Presentation,
  Route,
  Shield,
} from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AtAGlance } from '@/components/advisory/AtAGlance'
import { EngagementContactForm } from '@/components/advisory/EngagementContactForm'
import { EngagementHero } from '@/components/advisory/EngagementHero'
import { WhereItLeads } from '@/components/advisory/WhereItLeads'
import { RelatedCoverage } from '@/components/advisory/RelatedCoverage'
import { AMOUNTS, gbp } from '@/lib/offering'
import {
  ASSESSMENT_REPORT_CONTENTS,
  ASSESSMENT_STAGES,
  PROVISIONAL_CONTENT_APPROVED,
} from '@/lib/advisory/provisional-content'

/**
 * The Strategic Assessment, on its own page.
 *
 * The most expensive non-bespoke engagement on the site had 77 words in a
 * four-across grid cell, and its strongest argument — that a framework-neutral
 * decision document costs less than a year of the governance software it stops
 * you mis-buying — was rendered at 12px above the fold of a card.
 *
 * **Framed standalone, at the owner's decision (2026-09-04).** The transition
 * into a Drift Retainer is still stated, but as what happens after the decision
 * is made, not as the reason to buy.
 *
 * Sections gated on `PROVISIONAL_CONTENT_APPROVED` are drafted, not
 * owner-supplied. See `src/lib/advisory/provisional-content.ts`.
 */

/** The architecture-level scope option, folded in from the retired module. */
const SOVEREIGN_SCOPE = [
  'A model-dependency map: where inference, weights and keys sit, and who can reach them',
  'An abstraction-layer assessment — can you satisfy a buyer’s sovereignty demand without re-architecting?',
  'A key-custody and admin-access review: EU-resident keys, and where a US administrative override still reaches EU data',
  'A sovereignty roadmap that keeps your options open',
]

const DELIVERABLES = [
  {
    icon: Layers,
    title: 'Multi-framework analysis',
    body: 'Your position read against each framework in scope, with the overlaps separated from the genuine conflicts — the second of which is where the cost usually sits.',
  },
  {
    icon: FileText,
    title: 'A comprehensive report',
    body: 'Forty pages and up: the analysis, the reasoning, and the recommendation stated plainly enough to disagree with.',
  },
  {
    icon: Presentation,
    title: 'A board-ready presentation',
    body: 'The version that survives a board meeting — the decision, what it costs, and what happens if it is deferred.',
  },
  {
    icon: Route,
    title: 'An implementation roadmap',
    body: 'Sequenced by what has to be true first, not by what is easiest to start.',
  },
]

type Props = {
  /** Articles placed under this engagement in Studio, fetched by the server page. */
  coverage: ComponentProps<typeof RelatedCoverage>
}

export function StrategicAssessmentEngagement({ coverage }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* The practice band ("AI adoption creates a governance problem…") was
            removed at the owner's request on 2026-09-10; the hero now opens
            the page, as it does on the other three engagements. */}
        <EngagementHero
          badge="The deep one-off · for a high-stakes decision"
          title="Before you commit to governance software, know what you need it to do."
          lead="AI governance platforms are sold at four figures a month. The decision to buy one is usually made from a vendor’s own framing of the problem, because that is the only framing on the table."
          body="The Strategic Assessment gives your board a framework-neutral decision document instead: what you are actually required to do, what you genuinely need tooling for, and what you do not. It is vendor-agnostic because we sell no software and take no referral fees."
          inShort={
            <>
              A board-ready decision document from {gbp(AMOUNTS.strategicAssessment)} —
              multi-framework analysis, a 40-page report, a presentation and an
              implementation roadmap, scoped to the decision in front of you.
            </>
          }
          ctaLabel="Request a proposal"
          imageSrc="/advisory/strategic-assessment-v3.webp"
          imageAlt="An isometric sandstone gateway with verdigris caps on a slate slab; three routes leave it toward a raised stepped plinth lit amber, two drawn only as faint teal traces and the centre one built as a stone causeway with amber-lit joints, with a slate tablet beside the gate scored with the same three lines"
          imageCaption="Three routes on the table. One built."
        />

        <AtAGlance
          price={`From ${gbp(AMOUNTS.strategicAssessment)}`}
          priceNote="Scoped to the decision in front of the board"
          points={[
            'Multi-framework analysis across everything in scope',
            'A report of 40+ pages, and a board-ready presentation',
            'An implementation roadmap you can actually sequence work from',
            'Vendor-agnostic — we sell no software and take no referral fees',
          ]}
          ctaLabel="Request a proposal"
        />

        {/* Independence — the differentiator, stated once and properly. */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
              Why it is worth paying for
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              We have nothing to sell you afterwards.
            </h2>
            <p className="mb-4 leading-relaxed text-text-muted">
              Most assessments of what AI governance tooling you need are produced by
              somebody who sells AI governance tooling, or is paid by somebody who does.
              That is not dishonesty; it is just an incentive, and it reliably produces
              the conclusion that you need more of the thing being assessed.
            </p>
            <p className="leading-relaxed text-text-muted">
              We sell no software and take no referral fees, so &ldquo;you need less than
              you were told&rdquo; is a conclusion this engagement is free to reach — and
              on a decision priced at four figures a month, that is where the value
              usually is.
            </p>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* What you get */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8 max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">What you get</h2>
            <p className="text-text-muted">
              Four deliverables, aimed at a board that has to make one decision and live
              with it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {DELIVERABLES.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="card-interactive h-full border-border-subtle bg-stone-charcoal">
                    <CardHeader>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-sister-indigo/30 bg-sister-indigo/10">
                        <Icon className="h-5 w-5 text-sister-indigo" />
                      </div>
                      <div className="text-lg font-semibold text-text-primary">{item.title}</div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-text-muted">{item.body}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Keep the legacy anchor for existing and browser-cached inbound links. */}
        <section id="sovereign-architecture-review" className="scroll-mt-24 mx-auto max-w-7xl px-6 pb-10 lg:px-8 lg:pb-12">
          <h2 className="text-2xl font-semibold text-text-primary">Sovereign Architecture Review</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">
            Where sovereignty is part of the decision, the assessment goes to architecture
            level: where inference, weights and keys sit, and who can reach them. It
            establishes what your architecture can already support and what the rest would
            cost, so a buyer&rsquo;s demand can be answered with a plan rather than a rebuild.
          </p>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {SOVEREIGN_SCOPE.map(item => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-text-primary">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-teal" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-3xl text-sm italic leading-relaxed text-text-muted">
            Available within the agreed assessment scope, or as a standalone specialist project.
            It keeps your options open — it does not pick your vendors for you, and it keeps
            what the law requires distinct from what a buyer merely prefers.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-muted">
            <Link href="/advisory/modules/sovereign-architecture" className="text-stone-teal underline underline-offset-4">Explore the standalone Sovereign Architecture Review</Link>.
            {' '}Where work overlaps, we agree the combined scope and fee to account for it.
          </p>
        </section>

        <section id="european-procurement-readiness" className="scroll-mt-24 mx-auto max-w-7xl px-6 pb-10 lg:px-8 lg:pb-12">
          <h2 className="text-2xl font-semibold text-text-primary">European Procurement Readiness</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">Where European procurement is part of the decision, the assessment includes buyer evidence requirements, gaps that could delay market access, and the cost and sequence of addressing them. Contractual commitments are flagged for review with counsel. This work is included in the agreed assessment scope.</p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-muted">
            You can also commission <Link href="/advisory/modules/european-procurement-readiness" className="text-stone-teal underline underline-offset-4">European Procurement Readiness as a standalone project</Link>.
            {' '}Where work overlaps, we agree the combined scope and fee to account for it.
          </p>
          <DigitalOmnibusContext>We translate the relevant regulatory changes and remaining uncertainty into governance choices, investment priorities and a board-ready roadmap.</DigitalOmnibusContext>
        </section>

        {/* PROVISIONAL — drafted, not owner-supplied. See the module comment. */}
        {PROVISIONAL_CONTENT_APPROVED && (
          <>
            <Separator className="mx-auto max-w-7xl bg-border-subtle" />
            <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
              <div className="mb-8 max-w-3xl">
                <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                  How the engagement runs
                </h2>
                <p className="text-text-muted">
                  You see a draft you can argue with before anything reaches a board.
                </p>
              </div>
              <ol className="max-w-3xl space-y-6">
                {ASSESSMENT_STAGES.map((stage) => (
                  <li key={stage.title} className="border-l-2 border-sister-indigo/40 pl-5">
                    <div className="mb-1 font-mono text-xs uppercase tracking-wider text-sister-indigo">
                      {stage.when}
                    </div>
                    <div className="mb-1 font-semibold text-text-primary">{stage.title}</div>
                    <p className="text-sm leading-relaxed text-text-muted">{stage.detail}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-8 lg:pb-12">
              <div className="max-w-3xl rounded-lg border border-border-subtle bg-stone-charcoal p-6 lg:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-sister-indigo" />
                  <h2 className="text-xl font-semibold text-text-primary">
                    What the report contains
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {ASSESSMENT_REPORT_CONTENTS.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-primary">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sister-indigo" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}

        {/* Price, and what follows the decision. */}
        <section className="border-y border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="max-w-3xl">
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                From {gbp(AMOUNTS.strategicAssessment)}, scoped to the decision
              </h2>
              <p className="mb-4 leading-relaxed text-text-muted">
                Scoped against the decision and the frameworks in play, and fixed before
                the work starts.
              </p>
              <p className="leading-relaxed text-text-muted">
                Once the decision is made, keeping it current is a different job from
                making it — so the assessment transitions into{' '}
                <Link href="/advisory/drift-retainer" className="text-silicon-amber-strong hover:underline">
                  a Drift Retainer
                </Link>{' '}
                for ongoing oversight, if and when the board wants that. It is not a
                condition of the engagement.
              </p>
              <p className="mt-4 leading-relaxed text-text-muted">
                For a group, multi-jurisdiction exposure or a full board mandate, the
                bespoke tier runs {gbp(AMOUNTS.bespokeFloor)}–{gbp(AMOUNTS.bespokeCeiling)} —{' '}
                <Link href="/advisory#contact" className="text-silicon-amber-strong hover:underline">
                  discuss an engagement
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <WhereItLeads
          currentId="strategic-assessment"
          heading="Where it leads"
          intro="An assessment settles one decision. Keeping the decision current, or scoping it in the first place, is a different job."
          bridges={{
            'advisory-briefing':
              'If the question concerns one AI system, start with an hour interpreting its Compliance Checker result and setting priorities.',
            'exposure-diagnostic':
              'If the board cannot yet say what it runs, a pass over the estate has to come before a decision about it.',
            'drift-retainer':
              'Once the decision is made, keeping it current is a standing job rather than another one-off. The assessment transitions into one if the board wants that.',
          }}
        />

        <EngagementContactForm
          interest="Strategic Assessment"
          plausibleEvent="Engagement Enquiry"
          heading="Request a proposal"
          intro="Tell us what decision the board is facing and roughly when it has to be made. We'll come back with a scope and a fixed price."
          messageLabel="What decision is this for?"
          messagePlaceholder="A platform purchase, an entry into a new market, a governance mandate the board has set…"
          trustItems={[
            {
              icon: Shield,
              title: 'Vendor-agnostic',
              body: 'We sell no software and take no referral fees.',
            },
            {
              icon: Clock,
              title: 'Rapid response',
              body: 'Initial response within 48 hours on business days.',
            },
            {
              icon: FileText,
              title: 'Fixed scope, fixed price',
              body: 'Agreed against the decision before any work begins.',
            },
          ]}
        />

        {/* After the enquiry form, as on every other offering page. */}
        <RelatedCoverage {...coverage} />
      </main>

      <Footer />
    </div>
  )
}
