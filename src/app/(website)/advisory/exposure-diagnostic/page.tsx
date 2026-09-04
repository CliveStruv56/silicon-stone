'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  FileText,
  Layers,
  MessageSquare,
  Scale,
  Search,
  Shield,
} from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdvisoryPracticeBand } from '@/components/advisory/AdvisoryPracticeBand'
import { AtAGlance } from '@/components/advisory/AtAGlance'
import { EngagementContactForm } from '@/components/advisory/EngagementContactForm'
import { EngagementHero } from '@/components/advisory/EngagementHero'
import { WhereItLeads } from '@/components/advisory/WhereItLeads'
import { AMOUNTS, gbp } from '@/lib/offering'
import {
  DIAGNOSTIC_REPORT_CONTENTS,
  DIAGNOSTIC_STAGES,
  PROVISIONAL_CONTENT_APPROVED,
} from '@/lib/advisory/provisional-content'

/**
 * The Exposure Diagnostic.
 *
 * Rebuilt onto the shared engagement template (`AdvisoryPracticeBand`,
 * `EngagementHero`, `AtAGlance`, `WhereItLeads`) so it cannot drift from its
 * three siblings. Its own first version put the price card in the hero's right
 * column, which is what displaced the photograph every other page in the family
 * has — the single loudest inconsistency a reader moving between pages would hit.
 *
 * Sections gated on `PROVISIONAL_CONTENT_APPROVED` are drafted, not
 * owner-supplied. See `src/lib/advisory/provisional-content.ts`.
 */

/** What the engagement reviews. Verbatim from the tier card it replaced. */
const REVIEW_AREAS = [
  {
    icon: Search,
    title: 'AI system and vendor-evidence review',
    body: 'What you run, and what your vendors can actually prove — as opposed to what their marketing asserts.',
  },
  {
    icon: Layers,
    title: 'Dependency mapping',
    body: 'Models, APIs, cloud and jurisdiction exposure across your stack, including the dependencies nobody decided to take on.',
  },
  {
    icon: Scale,
    title: 'Regulatory-friction read',
    body: 'Where US and EU divergence touches your operations, and which of those frictions is an operating constraint rather than a filing exercise.',
  },
]

export default function ExposureDiagnosticPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <AdvisoryPracticeBand />

        <EngagementHero
          badge="A one-off engagement"
          title="Where your AI dependency becomes an operating constraint."
          lead="Most organisations can list the AI they bought. Far fewer can say which vendors they cannot replace, which jurisdictions their data actually touches, or which of their suppliers could not evidence a claim if a buyer asked next month."
          body="The Exposure Diagnostic is the clearest first picture of where you stand: what you run, what your vendors can prove, and where the dependency turns into something that limits what the business can do."
          inShort={
            <>
              One pass over the whole estate, from {gbp(AMOUNTS.exposureDiagnostic)}, scoped
              to a boundary you agree before anything is invoiced — with a written report
              and a 30-day follow-up call.
            </>
          }
          ctaLabel="Request a diagnostic"
          imageCaption="Dependency mapping, vendor evidence and regulatory friction — read across your whole stack."
        />

        <AtAGlance
          price={`From ${gbp(AMOUNTS.exposureDiagnostic)}`}
          priceNote="Custom scope, quoted against an agreed boundary"
          points={[
            'A written report of 15–25 pages, with an executive summary',
            'Prioritised actions — what to do this quarter, and why that order',
            'A 30-day follow-up call once you have tried to act on it',
            'Credited toward your first quarter if you go on to a Drift Retainer',
          ]}
          ctaLabel="Request a diagnostic"
        />

        {/* Who it is for — and who it is not. The strongest paragraph the tier
            card had, previously rendered at 12px inside a grid cell. */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
              Who this is for
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              This is not a document pack, and it is not the cheapest option.
            </h2>
            <p className="mb-4 leading-relaxed text-text-muted">
              If what you need is template policies and a compliance file, a fixed-price
              compliance shop will do it cheaper — our own{' '}
              <Link href="/products/ai-act-toolkit" className="text-stone-teal hover:underline">
                {gbp(AMOUNTS.toolkitStandard)} toolkit
              </Link>{' '}
              covers the essentials and you should start there.
            </p>
            <p className="leading-relaxed text-text-muted">
              The Exposure Diagnostic is for the questions documents cannot answer: where
              your dependency on specific vendors, models and jurisdictions becomes an
              operating constraint, and what to do about it this quarter. It suits an
              organisation that has already adopted AI in earnest and now has to answer for
              it — to a board, a regulator, or a customer running a procurement
              questionnaire.
            </p>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* What we review */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8 max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">What we review</h2>
            <p className="text-text-muted">
              Three passes over the same estate, each answering a different question.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {REVIEW_AREAS.map((area, idx) => {
              const Icon = area.icon
              return (
                <motion.div
                  key={area.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="card-interactive h-full border-border-subtle bg-stone-charcoal">
                    <CardHeader>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-stone-teal/30 bg-stone-teal/10">
                        <Icon className="h-5 w-5 text-stone-teal" />
                      </div>
                      <div className="text-lg font-semibold text-text-primary">{area.title}</div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-text-muted">{area.body}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* PROVISIONAL — drafted, not owner-supplied. Hidden until the real
            cadence is confirmed; a stated timeline is a commercial promise. */}
        {PROVISIONAL_CONTENT_APPROVED && (
          <>
            <Separator className="mx-auto max-w-7xl bg-border-subtle" />
            <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
              <div className="mb-8 max-w-3xl">
                <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                  How the engagement runs
                </h2>
                <p className="text-text-muted">
                  Scope is agreed before anything is invoiced, and the report is talked
                  through rather than emailed.
                </p>
              </div>
              <ol className="max-w-3xl space-y-6">
                {DIAGNOSTIC_STAGES.map((stage) => (
                  <li key={stage.title} className="border-l-2 border-stone-teal/40 pl-5">
                    <div className="mb-1 font-mono text-xs uppercase tracking-wider text-stone-teal">
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
                  <FileText className="h-5 w-5 text-stone-teal" />
                  <h2 className="text-xl font-semibold text-text-primary">
                    What the report contains
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {DIAGNOSTIC_REPORT_CONTENTS.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-primary">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-teal" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}

        {/* Price and what it credits toward. The credit closes the argument
            rather than defining the product. */}
        <section className="border-y border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="max-w-3xl">
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                {gbp(AMOUNTS.exposureDiagnostic)} and up, scoped to the boundary you agree
              </h2>
              <p className="mb-4 leading-relaxed text-text-muted">
                The fee is quoted against an agreed scope — which entities, which systems,
                which jurisdictions — so it is fixed before any work begins rather than
                accruing against a day rate.
              </p>
              <p className="leading-relaxed text-text-muted">
                It stands on its own: you can take the report, act on it, and never speak to
                us again. If the exposure turns out to be the kind that keeps moving, the fee
                is{' '}
                <strong className="font-semibold text-text-primary">
                  credited toward your first quarter
                </strong>{' '}
                on{' '}
                <Link href="/advisory/drift-retainer" className="text-silicon-amber-strong hover:underline">
                  the Drift Retainer
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <WhereItLeads
          currentId="exposure-diagnostic"
          heading="Where it leads"
          intro="A diagnostic is one pass over two domains. What you do with it depends on what it finds."
          bridges={{
            'advisory-briefing':
              'Not sure a full pass is what you need? An hour on the single question first, credited toward the diagnostic’s bigger sibling if you go on.',
            'drift-retainer':
              'If the exposure turns out to keep moving, the diagnostic fee is credited toward your first quarter of a standing monthly read.',
            'strategic-assessment':
              'If what the diagnostic surfaces is a decision rather than a to-do list, this is the framework-neutral document a board needs to take it.',
          }}
        />

        <EngagementContactForm
          interest="Exposure Diagnostic"
          plausibleEvent="Engagement Enquiry"
          heading="Request a diagnostic"
          intro="Tell us roughly what you run and what has prompted the question. We'll come back with a proposed scope and a fixed price, or say if something else on the ladder fits better."
          messageLabel="What has prompted this?"
          messagePlaceholder="A board question, a procurement questionnaire, a vendor you cannot get answers from…"
          trustItems={[
            {
              icon: Shield,
              title: 'Confidentiality first',
              body: 'All enquiries are treated with strict confidentiality.',
            },
            {
              icon: Clock,
              title: 'Rapid response',
              body: 'Initial response within 48 hours on business days.',
            },
            {
              icon: MessageSquare,
              title: 'Scoped before it is priced',
              body: 'You get a boundary and a fixed figure before anything is committed.',
            },
          ]}
        />
      </main>

      <Footer />
    </div>
  )
}
