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
  Network,
  Presentation,
  Route,
  Scale,
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
import { SCOPED_FEE, gbp, AMOUNTS } from '@/lib/offering'
import { FeeLabel } from '@/components/advisory/FeeLabel'
import {
  ASSESSMENT_REPORT_CONTENTS,
  PROVISIONAL_CONTENT_APPROVED,
  type EngagementStage,
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
 * **Combined with the Sovereign Architecture Review (owner decision,
 * 2026-09-14).** The Review had been a module (2026-09-09, folded in the same
 * day as a four-bullet scope option), then a standalone project page
 * (2026-09-10). This time its substance came across — the control map, the
 * options appraisal, the audience and the scope exclusions — and the standalone
 * page is gone. The engagement now asks two questions: what the board should
 * commit to, and how much of the stack the organisation actually controls.
 * The Review is not sold separately.
 *
 * The process below is owner-approved and renders unconditionally. The report
 * chapter list is still gated on `PROVISIONAL_CONTENT_APPROVED`. See
 * `src/lib/advisory/provisional-content.ts`.
 */

const DELIVERABLES = [
  {
    icon: Layers,
    title: 'Multi-framework analysis',
    body: 'Your position read against each framework in scope, with the overlaps separated from the genuine conflicts — the second of which is where the cost usually sits.',
  },
  {
    icon: Network,
    title: 'An architecture and control map',
    body: 'Where data, inference, model weights and keys sit, who administers the service, who can reach it — and which of those controls is evidenced rather than assumed.',
  },
  {
    icon: Scale,
    title: 'A vendor-agnostic options appraisal',
    body: 'The current design set against feasible alternatives: control gained, operating trade-offs, portability and exit constraints, and indicative effort and cost for each.',
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
    title: 'A staged roadmap',
    body: 'Sequenced by what has to be true first, not by what is easiest to start — including the technical validation still needed before a step is safe to take.',
  },
]

/**
 * Owner-approved 2026-09-14. The Assessment's six-week stage plan merged with
 * the Review's three-step method (agree the control question, trace access
 * and dependencies, compare feasible options).
 */
const ASSESSMENT_PROCESS: EngagementStage[] = [
  {
    when: 'Before we start',
    title: 'Scoping and mandate',
    detail:
      'What decision is this assessment for, which board signs it off, and where the system boundary sits. We agree the frameworks in scope, the controls the decision turns on, and who can explain the current design.',
  },
  {
    when: 'Weeks 1–2',
    title: 'Discovery',
    detail:
      'Systems, vendors, contracts and the governance you already run, plus interviews across the functions that would carry whatever the board decides. Where control is in scope, we trace hosting, administrative access, key custody and service dependencies from the architecture documents, marking what is evidenced and what is not.',
  },
  {
    when: 'Weeks 3–4',
    title: 'Analysis and options',
    detail:
      'Your position read against each framework in scope, with the overlaps and the genuine conflicts separated. The current architecture set against feasible alternatives, with portability, exit constraints and indicative effort and cost recorded for each.',
  },
  {
    when: 'Week 5',
    title: 'Draft and challenge',
    detail:
      'A draft you can argue with before it is finished. An assessment that first appears in its final form at a board meeting is one nobody has stress-tested.',
  },
  {
    when: 'Week 6',
    title: 'Board presentation and roadmap',
    detail:
      'The report, the presentation, and a staged roadmap sequenced by what has to be true first, with the technical validation still outstanding named rather than assumed.',
  },
]

/** The architecture-level scope, carried in from the Review. */
const SOVEREIGN_SCOPE = [
  'A model-dependency map: where inference, weights and keys sit, and who can reach them',
  'A hosting, administrative-access and key-custody review: EU-resident keys, and where a US administrative override still reaches EU data',
  'A dependency, portability and exit-constraint register for the agreed system or workload',
  'An abstraction-layer assessment — can you satisfy a buyer’s sovereignty demand without re-architecting?',
  'Options appraisal covering control, operating trade-offs and indicative effort and cost',
  'A staged decision roadmap, including the technical validation still needed',
]

const NOT_INCLUDED = [
  'Penetration testing or a source-code audit',
  'Certification, or a legal opinion',
  'Migration delivery',
]

const USEFUL_WHEN = [
  'A governance platform purchase is on the table and the only framing of the need is the vendor’s',
  'The board asks about vendor concentration, or a customer requires evidence of control',
  'A cloud renewal, a new AI deployment or a buyer’s sovereignty requirement forces the question of what you could move',
  'A team needs the practical cost of changing providers before it can recommend anything',
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
          title="Before the board commits: what do you need, and what do you control?"
          lead="AI governance platforms are sold at four figures a month, and sovereignty is sold as a hosting region. Both decisions are usually made from a vendor’s own framing of the problem, because that is the only framing on the table."
          body="The Strategic Assessment gives your board a framework-neutral decision document instead: what you are actually required to do, what you genuinely need tooling for, and where control of your technology stack — hosting, administrative access, key custody, exit — really sits. It is vendor-agnostic because we sell no software and take no referral fees."
          inShort={
            <>
              A board-ready decision document — multi-framework analysis, an
              architecture and control map, a 40-page report, a presentation and
              a staged roadmap, scoped to the decision in front of you.
            </>
          }
          ctaLabel="Request a proposal"
          imageSrc="/advisory/strategic-assessment-v3.webp"
          imageAlt="An isometric sandstone gateway with verdigris caps on a slate slab; three routes leave it toward a raised stepped plinth lit amber, two drawn only as faint teal traces and the centre one built as a stone causeway with amber-lit joints, with a slate tablet beside the gate scored with the same three lines"
          imageCaption="Three routes on the table. One built."
        />

        <AtAGlance
          price={SCOPED_FEE}
          priceNote="Scoped to the decision in front of the board"
          points={[
            'Multi-framework analysis across everything in scope',
            'An architecture and control map: hosting, administrative access, key custody, exit',
            'A report of 40+ pages, and a board-ready presentation',
            'A staged roadmap you can actually sequence work from',
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
              Most assessments of how sovereign your architecture is are produced by
              somebody who sells hosting. That is not dishonesty; it is just an
              incentive, and it reliably produces the conclusion that you need more of
              the thing being assessed.
            </p>
            <p className="leading-relaxed text-text-muted">
              We sell no software, no hosting and take no referral fees, so &ldquo;you
              need less than you were told&rdquo; is a conclusion this engagement is free
              to reach — and on a decision priced at four figures a month, that is where
              the value usually is.
            </p>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* What you get */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8 max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">What you get</h2>
            <p className="text-text-muted">
              Six deliverables, aimed at a board that has to make one decision and live
              with it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        {/* Who it is for — carried in from the Review and widened to the board. */}
        <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-8 lg:pb-12">
          <div className="max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">Who it is for</h2>
            <p className="mb-5 text-xl leading-relaxed text-text-primary">
              A board that has to decide, and the technology, architecture, security and
              procurement leads who will carry the decision.
            </p>
            <p className="mb-4 text-text-muted">It is most useful when:</p>
            <ul className="space-y-2.5">
              {USEFUL_WHEN.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-text-primary">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-teal" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* How it runs — owner-approved, renders unconditionally. */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8 max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              How the engagement runs
            </h2>
            <p className="text-text-muted">
              Six weeks. You see a draft you can argue with before anything reaches a board.
            </p>
          </div>
          <ol className="max-w-3xl space-y-6">
            {ASSESSMENT_PROCESS.map((stage) => (
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

        {/* Keep the anchor: the Review had two URLs of its own and both 301 here. */}
        <section id="sovereign-architecture-review" className="scroll-mt-24 mx-auto max-w-7xl px-6 pb-10 lg:px-8 lg:pb-12">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
            Included — not sold separately
          </div>
          <h2 className="text-2xl font-semibold text-text-primary">Sovereign Architecture Review</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">
            A hosting location alone does not describe control. Where control of the stack
            is part of the decision, the assessment goes to architecture level: where data,
            inference, model weights and keys sit, who administers the service, who holds
            the keys, and what you could move if a vendor, a buyer requirement or an
            operating constraint changed. It establishes what your architecture can already
            support and what the rest would cost, so a buyer&rsquo;s demand can be answered
            with a plan rather than a rebuild.
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
            It keeps your options open — it does not pick your vendors for you, and it keeps
            what the law requires distinct from what a buyer merely prefers.
          </p>
        </section>

        {/* Scope boundaries — carried in from the Review. */}
        <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-8 lg:pb-12">
          <div className="max-w-3xl rounded-lg border border-border-subtle bg-stone-charcoal p-6 lg:p-8">
            <h2 className="mb-3 text-xl font-semibold text-text-primary">What it does not include</h2>
            <p className="mb-4 text-sm leading-relaxed text-text-muted">
              The assessment is based on supplied documentation and technical discussions.
              Findings distinguish evidenced controls from assumptions, and any further
              technical validation is separately scoped. It does not include:
            </p>
            <ul className="space-y-2.5">
              {NOT_INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-primary">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
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
        )}

        {/* Price, and what follows the decision. */}
        <section className="border-y border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="max-w-3xl">
              <FeeLabel as="h2" price={SCOPED_FEE} className="mb-4" />
              <p className="mb-4 leading-relaxed text-text-muted">
                Scoped against the decision, the frameworks in play and the system
                boundary, and fixed before the work starts. If you have had an{' '}
                <Link href="/advisory/advisory-briefing" className="text-silicon-amber-strong hover:underline">
                  Advisory Briefing
                </Link>
                , its {gbp(AMOUNTS.advisoryBriefing)} fee comes off in full.
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
                bespoke engagement is available. {SCOPED_FEE} —{' '}
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
          intro="Tell us what decision the board is facing, which systems it touches, and roughly when it has to be made. We'll come back with a scope and a fixed price."
          messageLabel="What decision is this for?"
          messagePlaceholder="A platform purchase, a cloud renewal, a buyer’s sovereignty requirement, an entry into a new market, a governance mandate the board has set…"
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
