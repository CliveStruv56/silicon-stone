'use client'

import Link from 'next/link'
import { CheckCircle, Clock, MessageSquare, Shield } from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdvisoryPracticeBand } from '@/components/advisory/AdvisoryPracticeBand'
import { AtAGlance } from '@/components/advisory/AtAGlance'
import { EngagementContactForm } from '@/components/advisory/EngagementContactForm'
import { EngagementHero } from '@/components/advisory/EngagementHero'
import { WhereItLeads } from '@/components/advisory/WhereItLeads'
import { FOUNDING_OFFER_ACTIVE } from '@/lib/flags'
import { AMOUNTS, gbp } from '@/lib/offering'

/**
 * The Drift Retainer, on its own page.
 *
 * It was the last engagement presented as a section on `/advisory` while the
 * other three had pages. That asymmetry was not cosmetic: it is why the styling
 * kept diverging (a section and a page were never built from one template) and
 * why the four-across tier grid had to exist to give the others any presence at
 * all. Moving it here lets all four come off `EngagementHero` + `AtAGlance` +
 * `WhereItLeads`, so consistency stops being something to police.
 *
 * `/advisory#retainer` still resolves — the hub keeps a summary block under that
 * id, because a dead anchor does not 404, it silently scrolls nowhere, and
 * twelve places across the site pointed at it.
 */

const INCLUDES = [
  'The monthly briefing — a short, board-forwardable written read plus a call: what shifted in the drift this month, and the decision it changes',
  'The working session — ninety minutes on one live decision, refereed rather than advised: the call turns on the evidence, not on who prepared the better presentation',
  'The Line — direct access between sessions to challenge a vendor claim, sanity-check a proposal, or prepare a board answer',
  'The quarterly exposure review — a deeper written read on the same 3×2 method the public analysis uses, traced to your exposure',
]

export default function DriftRetainerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <AdvisoryPracticeBand />

        <EngagementHero
          badge="The standing relationship · most popular"
          title="Your standing read on the drift."
          lead="You have bought the licences and your people are experimenting. When the board asks what has actually changed in how the business makes money, manages risk, or serves customers, the honest answer is often: not much."
          body="Meanwhile the drift does not hold still. Export controls shift, a fab reports delays, a regulatory position diverges across the Atlantic — and the exposure you mapped in spring reads differently by autumn."
          inShort={
            <>
              A senior, independent reading of how technopolitical movement affects your
              supply chains, your procurement and your people — delivered every month, from{' '}
              {gbp(AMOUNTS.driftRetainerMonthly)} a month on a three-month initial term.
            </>
          }
          ctaLabel="Book a 25-minute conversation"
          imageCaption="Three forensic domains, two analytical methods — read against your business, every month."
          showLaunchLine
        />

        <AtAGlance
          price={`${gbp(AMOUNTS.driftRetainerMonthly)}/month`}
          priceNote="Three-month initial term, then rolling monthly · limited to a handful of client companies at any time"
          points={[
            'A board-forwardable monthly briefing — what shifted, and the decision it changes',
            'A ninety-minute working session on one live decision, externally refereed',
            'The Line — direct access between sessions for the awkward questions',
            'A quarterly written exposure review on the 3×2 method',
          ]}
          ctaLabel="Book a 25-minute conversation"
        />

        {/* Who it is for */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
              Who this is for
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              Leadership teams that stay ahead of the drift, not catch up to it.
            </h2>
            <p className="mb-4 leading-relaxed text-text-muted">
              The Drift Retainer is the relationship behind the analysis: a senior,
              independent reading of how technopolitical movement affects <em>your</em>{' '}
              supply chains, <em>your</em> procurement, and <em>your</em> people —
              delivered every month, in language a semi-technical leadership team can act
              on.
            </p>
            <p className="leading-relaxed text-text-muted">
              Equally for{' '}
              <strong className="font-semibold text-text-primary">
                US companies operating in or entering Europe
              </strong>
              : a standing, independent read on how the AI Act, the sovereignty package,
              and the wider drift affect your European position — so compliance becomes a
              maintained state, not an annual panic.
            </p>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* What it includes, and the anti-software argument */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr] lg:items-start">
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                How it starts
              </h2>
              <p className="mb-4 max-w-2xl leading-relaxed text-text-muted">
                Every engagement opens with the Baseline Month: a structured read of where
                AI and the drift currently touch your operations, built from your org
                chart, your current tools and spend, and short conversations with three or
                four process owners. It ends with a Baseline Briefing — the two or three
                places where the exposure is real and where the next quarter&rsquo;s focus
                belongs.
              </p>
              <p className="mb-6 max-w-2xl leading-relaxed text-text-muted">
                <strong className="font-semibold text-text-primary">
                  You know within thirty days whether the relationship earns its fee.
                </strong>{' '}
                After month one you can walk away paying that month only.
              </p>
              <p className="mb-6 max-w-2xl leading-relaxed text-text-muted">
                <strong className="font-semibold text-text-primary">What we read.</strong>{' '}
                Three forensic domains — supply chain, policy, talent — each read two ways,
                for scenarios and against thirty years of precedent.{' '}
                <Link href="/advisory#method" className="text-stone-teal hover:underline">
                  What the 3×2 method means in practice →
                </Link>
              </p>
              <p className="max-w-2xl border-l-2 border-sister-indigo/50 pl-4 text-sm italic text-text-muted">
                The same drift runs through individual careers as well as company strategy.
                Where the brief is personal rather than organisational,{' '}
                <Link href="/waymarkpath" className="text-sister-indigo hover:underline">
                  WaymarkPath
                </Link>{' '}
                is the companion.
              </p>
            </div>

            <Card className="border-silicon-amber/40 bg-stone-charcoal">
              <CardHeader>
                <div className="font-mono text-xs uppercase tracking-wider text-text-muted">
                  What it includes
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-3">
                  {INCLUDES.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-primary">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-silicon-amber-strong" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="border-t border-border-subtle pt-4 text-sm leading-relaxed text-text-muted">
                  Software tracks your controls. It doesn&rsquo;t read export controls. A
                  governance platform will tell you what&rsquo;s in your inventory; the
                  Drift Retainer tells you what&rsquo;s about to change around it — and
                  which decision it changes. Most clients eventually run both; the Retainer
                  also tells you which platform you actually need before you buy one.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Price and terms */}
        <section className="border-y border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="max-w-3xl">
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                {gbp(AMOUNTS.driftRetainerMonthly)} a month, on a three-month initial term
              </h2>
              <p className="mb-4 leading-relaxed text-text-muted">
                <strong className="font-semibold text-text-primary">
                  The Baseline Month guarantee:
                </strong>{' '}
                after month one, walk away paying that month only.
              </p>
              <p className="mb-4 leading-relaxed text-text-muted">
                Prefer annual? Twelve months for the price of ten —{' '}
                {gbp(AMOUNTS.driftRetainerAnnual)} a year. Either way it is limited to a
                handful of client companies at any time.
              </p>
              <p className="leading-relaxed text-text-muted">
                An{' '}
                <Link href="/advisory/advisory-briefing" className="text-silicon-amber-strong hover:underline">
                  Advisory Briefing
                </Link>{' '}
                is credited in full toward your first month, and an{' '}
                <Link href="/advisory/exposure-diagnostic" className="text-silicon-amber-strong hover:underline">
                  Exposure Diagnostic
                </Link>{' '}
                toward your first quarter.
              </p>
              {FOUNDING_OFFER_ACTIVE && (
                <div className="mt-6 rounded-lg border border-silicon-amber/40 bg-silicon-amber/10 p-4 text-sm leading-relaxed text-text-primary">
                  <strong className="font-semibold text-silicon-amber-strong">
                    Founding rate — five companies, launch only.
                  </strong>{' '}
                  The first five retainer clients join at{' '}
                  <strong className="font-semibold">
                    {gbp(AMOUNTS.driftRetainerFounding)}/month for the first six months
                  </strong>
                  , then the standard rate. Same Baseline Month guarantee.
                </div>
              )}
            </div>
          </div>
        </section>

        <WhereItLeads
          currentId="drift-retainer"
          heading="Where it starts"
          intro="Most retainers begin with a smaller piece of work. Each of these credits toward the relationship if you go on to one."
          bridges={{
            'advisory-briefing':
              'One hour on a single question, credited in full toward your first retainer month.',
            'exposure-diagnostic':
              'One pass over the estate first, so month one starts from a map rather than a blank page. Credited toward your first quarter.',
            'strategic-assessment':
              'For a board decision that has to be made before any standing arrangement makes sense.',
          }}
        />

        <EngagementContactForm
          interest="Drift Retainer"
          plausibleEvent="Engagement Enquiry"
          heading="Book a 25-minute conversation"
          intro="Tell us roughly where AI sits in your operations and what the board is asking. We'll say whether a retainer is the right shape, or whether something smaller is."
          messageLabel="What is the board asking?"
          messagePlaceholder="What has changed, what it costs us, whether we are exposed…"
          trustItems={[
            {
              icon: Shield,
              title: 'Confidentiality first',
              body: 'All enquiries are treated with strict confidentiality.',
            },
            {
              icon: Clock,
              title: 'Thirty days to decide',
              body: 'The Baseline Month guarantee — after month one, walk away paying that month only.',
            },
            {
              icon: MessageSquare,
              title: 'A standing line',
              body: 'Thirty years inside the technology industry, on call between sessions.',
            },
          ]}
        />
      </main>

      <Footer />
    </div>
  )
}
