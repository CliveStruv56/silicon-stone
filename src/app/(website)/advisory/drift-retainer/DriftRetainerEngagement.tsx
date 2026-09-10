'use client'

import type { ComponentProps } from 'react'
import { Shield } from 'lucide-react'
import { FocusedEngagementPage } from '@/components/advisory/FocusedEngagementPage'
import { FOUNDING_OFFER_ACTIVE } from '@/lib/flags'
import { AMOUNTS, gbp, priceOf } from '@/lib/offering'

const INCLUDES = [
  { title: 'Monthly briefing', cadence: 'Every month', body: 'A concise written briefing you can forward to the board, plus a call: what has changed in technology and policy, and which decisions it affects.' },
  { title: 'Working session', cadence: 'Every month', body: 'Ninety minutes on one live decision. An independent facilitator keeps the discussion grounded in evidence and helps your team reach a clear position.' },
  { title: 'The Line', cadence: 'Between sessions', body: 'Direct access to challenge a vendor claim, sense-check a proposal or prepare an answer for the board while the question is still live.' },
  { title: 'Exposure review', cadence: 'Every quarter', body: 'A deeper written review of how your exposure has changed and where the next quarter’s attention belongs.' },
]

type Props = {
  /** Articles placed under this engagement in Studio, fetched by the server page. */
  coverage: ComponentProps<typeof FocusedEngagementPage>['coverage']
}

export function DriftRetainerEngagement({ coverage }: Props) {
  return (
    <FocusedEngagementPage
      hero={{
        badge: 'Drift Retainer',
        title: 'An independent view, as the picture changes.',
        lead: 'Your AI suppliers, technology choices and policy obligations keep changing. Your leadership team needs to know which changes matter to the business — and what to do about them.',
        body: 'The Drift Retainer brings a senior, independent perspective to your supply chains, procurement and people, with regular time to work through the decisions in front of you.',
        inShort: 'Ongoing technology and policy advice, grounded in your operations and delivered through a standing monthly relationship.',
        ctaLabel: 'Book a 25-minute conversation',
        imageSrc: '/advisory/drift-retainer.webp',
        imageAlt: 'A stone coastal observation room overlooking Atlantic shipping lanes, with a warm desk light inside',
        imageCaption: 'A clear view of what is changing around your business.',
        showLaunchLine: true,
      }}
      audience={<>
        <p className="text-xl text-text-primary">For leadership teams making technology decisions in a changing environment.</p>
        <p>You have adopted AI and now need to explain what it changes for revenue, risk and customers. You want someone independent to test the assumptions, interpret developments and help the team decide where to focus.</p>
        <p>The retainer also supports US companies operating in or entering Europe that need an ongoing view of how European policy and technology dependencies affect their position.</p>
      </>}
      process={<>
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
          <h3 className="text-lg font-semibold text-text-primary">Start with a Baseline Month</h3>
          <div className="max-w-3xl space-y-4 leading-relaxed text-text-muted">
            <p>We examine where AI and technology change touch your operations, using your organisation chart, current tools and spend, and short conversations with three or four process owners.</p>
            <p>The Baseline Briefing identifies the two or three areas of real exposure and sets the priorities for the work that follows.</p>
          </div>
        </div>
        <h3 className="mb-6 text-lg font-semibold text-text-primary">Then keep the picture current</h3>
        <dl className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {INCLUDES.map(item => <div key={item.title} className="border-t border-border-subtle pt-5">
            <dt className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-lg font-semibold text-text-primary">{item.title}</span>
              <span className="text-sm text-stone-teal">{item.cadence}</span>
            </dt>
            <dd className="text-sm leading-relaxed text-text-muted">{item.body}</dd>
          </div>)}
        </dl>
        <p className="mt-8 max-w-3xl border-l-2 border-stone-teal/40 pl-5 text-sm leading-relaxed text-text-muted">The analysis covers supply chains, policy and talent, using scenarios and thirty years of industry precedent to understand what a change means for your business.</p>
      </>}
      price={`${priceOf('drift-retainer')}/month`}
      pricing={<>
        <p className="font-semibold text-text-primary">Rolling monthly, with no minimum term.</p>
        <p>The retainer includes the Baseline Month and the ongoing support described above. You can finish after the first month, paying for that month only, or continue month by month.</p>
        <p>Prefer annual? Twelve months for the price of ten — {gbp(AMOUNTS.driftRetainerAnnual)} a year.</p>
        <p>We work with a handful of client companies at a time so each relationship gets the attention it needs.</p>
        {FOUNDING_OFFER_ACTIVE && <div className="border-t border-silicon-amber/30 pt-4 text-sm">
          <p className="mb-1 font-semibold text-text-primary">Founding offer</p>
          <p>The first five retainer clients join at {gbp(AMOUNTS.driftRetainerFounding)}/month for the first six months, then the standard monthly rate. The monthly option has no minimum term.</p>
        </div>}
      </>}
      contact={{
        interest: 'Drift Retainer',
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Book a 25-minute conversation',
        intro: "Tell us where AI sits in your operations and what your leadership team is trying to decide. We’ll discuss whether the retainer fits your needs.",
        messageLabel: 'What is your team trying to decide?',
        messagePlaceholder: 'What has changed, what it costs us, where we are exposed…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
      coverage={coverage}
    />
  )
}
