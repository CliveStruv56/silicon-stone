'use client'

import Link from 'next/link'
import { CheckCircle, Clock, MessageSquare, Shield } from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { Separator } from '@/components/ui/separator'
import { AdvisoryPracticeBand } from '@/components/advisory/AdvisoryPracticeBand'
import { AtAGlance } from '@/components/advisory/AtAGlance'
import { EngagementContactForm } from '@/components/advisory/EngagementContactForm'
import { EngagementHero } from '@/components/advisory/EngagementHero'
import { WhereItLeads } from '@/components/advisory/WhereItLeads'
import { FREE_INTRO_WINDOW } from '@/lib/flags'
import { AMOUNTS, gbp } from '@/lib/offering'

/**
 * The Advisory Briefing, on its own page.
 *
 * It kept its place in the four-across tier grid right up until that grid was
 * deleted — two of its cards duplicated pages that now exist and a third
 * duplicated a section higher up the same page — at which point the Briefing was
 * the only engagement with nowhere to live.
 *
 * **Deliberately the lightest of the four.** It is the low-commitment step, and
 * a page as long as the Retainer's would argue against its own premise. So: no
 * "how the engagement runs" section for an hour-long call, and the substance is
 * the credit and the routes onward rather than a deliverables inventory.
 *
 * `WhereItLeads` matters more here than anywhere else on the site. The whole
 * point of the hour is to end knowing what to do next, so the three routes out
 * are the product rather than a footer.
 */

const WHAT_YOU_GET = [
  'Review of your interactive tool results — the Compliance Checker, Supply Chain Mapper, Scenario Modeler or Policy Stress-Test output you bring',
  'Expert interpretation and context — what the output means for your situation, and what it does not',
  'Initial recommendations, prioritised',
  'A written follow-up document, so the hour survives the meeting',
]

export default function AdvisoryBriefingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <AdvisoryPracticeBand />

        <EngagementHero
          badge="One hour · the low-commitment first step"
          title="One question, answered properly."
          lead="You have run the tools, or read the analysis, and you have one specific question you cannot resolve internally. An hour with someone who has spent thirty years inside this industry is usually enough to settle it."
          body="The Advisory Briefing is a working session, not a sales call: you bring your tool results and your question, and you leave with an interpretation, a prioritised set of recommendations, and a written follow-up you can forward."
          inShort={
            <>
              {gbp(AMOUNTS.advisoryBriefing)} for a focused hour — and credited in full
              toward your first month on a Drift Retainer if you proceed within 30 days, so
              if we go on to work together the conversation was free.
            </>
          }
          ctaLabel="Request a briefing"
          imageCaption="One hour, one question — read against three forensic domains and two analytical methods."
        />

        <AtAGlance
          price={gbp(AMOUNTS.advisoryBriefing)}
          priceNote="One hour, fixed price · credited in full toward a first retainer month within 30 days"
          points={WHAT_YOU_GET}
          ctaLabel="Request a briefing"
        />

        {/* Who it is for — and the free alternative, said plainly. */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
              Who this is for
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              For one specific question — not for a survey of everything.
            </h2>
            <p className="mb-4 leading-relaxed text-text-muted">
              The Briefing works when you can name the question: whether a vendor&rsquo;s
              claim stands up, what a tool result actually implies, whether an obligation
              reaches you, how to answer a board member who has read one article. It is the
              low-commitment way to test whether an outside read is worth having at all.
            </p>
            <p className="leading-relaxed text-text-muted">
              If the question is really &ldquo;where do we stand across the whole
              estate&rdquo;, an hour cannot do it and we will say so — that is what the{' '}
              <Link href="/advisory/exposure-diagnostic" className="text-stone-teal hover:underline">
                Exposure Diagnostic
              </Link>{' '}
              is for.
            </p>
            {FREE_INTRO_WINDOW && (
              <p className="mt-6 border-l-2 border-silicon-amber/60 pl-4 leading-relaxed text-text-muted">
                <strong className="font-semibold text-text-primary">New here?</strong> Start
                with the free 25-minute conversation — it is open during our launch window,
                the first ninety days. That call is an introduction; the Briefing is the
                working session, with your results, your question and a written follow-up.
              </p>
            )}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* What you get */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8 max-w-3xl">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">What the hour buys</h2>
            <p className="text-text-muted">
              A working session built on evidence you already have, and a document that
              outlives the call.
            </p>
          </div>
          <ul className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
            {WHAT_YOU_GET.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-lg border border-border-subtle bg-stone-charcoal p-5 text-sm leading-relaxed text-text-primary"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-teal" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* The credit — a strong offer that used to render in tiny italics. */}
        <section className="border-y border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="max-w-3xl">
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                {gbp(AMOUNTS.advisoryBriefing)}, and you may never pay it
              </h2>
              <p className="mb-4 leading-relaxed text-text-muted">
                The fee is{' '}
                <strong className="font-semibold text-text-primary">credited in full</strong>{' '}
                toward your first month on a{' '}
                <Link href="/advisory/drift-retainer" className="text-silicon-amber-strong hover:underline">
                  Drift Retainer
                </Link>{' '}
                if you proceed within 30 days. If we go on to work together, the
                conversation was free; if we do not, you have an hour of senior time and a
                written follow-up for {gbp(AMOUNTS.advisoryBriefing)}.
              </p>
              <p className="leading-relaxed text-text-muted">
                That is the whole of the risk. There is no scoping exercise to sit through
                and nothing to commit to on the call.
              </p>
            </div>
          </div>
        </section>

        <WhereItLeads
          currentId="advisory-briefing"
          heading="Where it leads"
          intro="An hour is enough to settle a question. What it usually settles is which of these three you actually need — and the fee comes off the first two."
          bridges={{
            'exposure-diagnostic':
              'If the hour ends with “we do not really know what we are running”, this is the pass over the whole estate. Your briefing fee is credited toward it.',
            'drift-retainer':
              'If it ends with “this keeps changing under us”, a standing monthly read is the answer rather than another one-off. Your briefing fee comes off month one.',
            'strategic-assessment':
              'If it ends with “the board has to decide”, this is the framework-neutral document that decision needs.',
          }}
        />

        <EngagementContactForm
          interest="Advisory Briefing"
          plausibleEvent="Engagement Enquiry"
          heading="Request a briefing"
          intro="Tell us the question and bring any tool results you have. If an hour is the wrong shape for it, we'll say so before you book."
          messageLabel="What is the question?"
          messagePlaceholder="A vendor claim you cannot verify, a tool result you want read, a board question you have to answer…"
          trustItems={[
            {
              icon: Shield,
              title: 'Confidentiality first',
              body: 'All enquiries are treated with strict confidentiality.',
            },
            {
              icon: Clock,
              title: 'One hour, fixed price',
              body: 'No scoping exercise, and nothing to commit to on the call.',
            },
            {
              icon: MessageSquare,
              title: 'Credited if you go on',
              body: `${gbp(AMOUNTS.advisoryBriefing)} comes off your first retainer month within 30 days.`,
            },
          ]}
        />
      </main>

      <Footer />
    </div>
  )
}
