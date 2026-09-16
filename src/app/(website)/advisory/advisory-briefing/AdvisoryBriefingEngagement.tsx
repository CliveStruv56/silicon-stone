'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { Shield } from 'lucide-react'
import { FocusedEngagementPage, EngagementSteps } from '@/components/advisory/FocusedEngagementPage'
import { BuyButton } from '@/components/products/BuyButton'
import { CHECKOUT_URLS, liveCheckoutUrl } from '@/lib/checkout'
import { FREE_INTRO_WINDOW } from '@/lib/flags'
import { AMOUNTS, gbp } from '@/lib/offering'

type Props = {
  /** Articles placed under this engagement in Studio, fetched by the server page. */
  coverage: ComponentProps<typeof FocusedEngagementPage>['coverage']
}

export function AdvisoryBriefingEngagement({ coverage }: Props) {
  // The only engagement with a fixed fee, so the only one that can be bought
  // outright. Null while PRE_LAUNCH is on or the store link is unset; the
  // enquiry form stays either way for anyone who wants to confirm fit first.
  const buyUrl = liveCheckoutUrl(CHECKOUT_URLS.advisoryBriefing)
  return (
    <FocusedEngagementPage
      hero={{
        badge: 'Advisory Briefing',
        title: 'Your result, or one of your AI systems. One hour.',
        lead: 'Understand what a tool or product has surfaced, or one of your AI systems, and what it means for your business.',
        body: 'Bring your result and the question it raises. We review it before the call, then use a one-hour discussion to clarify the assumptions, identify the priorities and help you decide what to do next.',
        inShort: 'A review of your result or system, a one-hour discussion and a written follow-up with priorities, evidence gaps and practical next steps.',
        ctaLabel: buyUrl ? 'Book a briefing' : 'Request a briefing',
        ctaHref: buyUrl ? '#pricing' : '#contact',
        imageSrc: '/advisory/advisory-briefing.webp',
        imageAlt: 'An isometric walled stone enclosure on a slate slab, a lit stepped plinth at its centre, with an amber path leading in through one gate and teal circuit lines running out',
        imageCaption: 'One question, set down inside a clear boundary.',
      }}
      audience={<>
        <p className="text-xl text-text-primary">For leaders who need a clear interpretation of a result, or of one AI system.</p>
        <p>You have run the <Link href="/tools/compliance-checker" className="text-stone-teal underline underline-offset-4">Compliance Checker</Link>, worked through the Toolkit or the Checklist Pack, or have one AI system in view, and want to understand the classification, the missing evidence or the actions it suggests. Bring what it surfaced and a few sentences about how the system is used in your business.</p>
        <p>You leave with priorities and next actions you can use independently. If the question reaches across several systems, the <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link> provides a broader review.</p>
      </>}
      process={<>
        <EngagementSteps steps={[
        { title: 'Share your result or system', body: 'Send your result, or a short description of the AI system, and a few sentences of business context. We confirm the fit before you book and read it before the call. No supporting documents are needed.' },
        { title: 'Work through it together', body: 'One hour to clarify the assumptions behind the result, discuss the implications for your AI system and identify the priorities. The discussion is grounded in your result and your account of how the system is used.' },
        { title: 'Keep a written follow-up', body: 'Receive a short summary of what was clarified, what remains uncertain and the next actions. If further investigation would help, it is proposed separately. You can use the summary without commissioning more work.' },
      ]} />
        <DigitalOmnibusContext>Where a revised EU rule affects your Checker result, we discuss what that change means for the AI system in scope.</DigitalOmnibusContext>
      </>}
      price={gbp(AMOUNTS.advisoryBriefing)}
      pricing={<>
        <p className="font-semibold text-text-primary">One result or one AI system, one hour, one fixed fee.</p>
        <p>Includes preparation from your result or system description and brief business context, the one-hour discussion and a short written follow-up.</p>
        <p>The Briefing interprets your result based on your account. It does not verify your system or vendor evidence, certify compliance or include supporting-document review. Document review and wider investigations are scoped and charged separately.</p>
        <p>Further work is optional. If we go on to work together, whether a specialist project, a diagnostic, an assessment or the <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link>, the briefing fee is credited in full against that work.</p>
        {FREE_INTRO_WINDOW && <p className="text-sm">If you simply want to meet us first, a free 25-minute introductory conversation is available during our launch window. The paid Briefing is the working session on your question.</p>}
      </>}
      purchase={buyUrl && (
        <div className="pt-2">
          <BuyButton url={buyUrl} label={`Book a briefing — ${gbp(AMOUNTS.advisoryBriefing)}`} event="Buy Advisory Briefing" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90 font-semibold" />
          <p className="mt-3 text-sm">Secure checkout by Lemon Squeezy, which issues the receipt and handles VAT. After payment you choose a time and send your result. If you would rather confirm the fit first, use the <a href="#contact" className="text-stone-teal underline underline-offset-4">form below</a>.</p>
        </div>
      )}
      contact={{
        interest: 'Advisory Briefing',
        plausibleEvent: 'Engagement Enquiry',
        showIntroBooking: false,
        heading: 'Request a briefing',
        intro: 'Tell us what a tool or product surfaced, or describe the AI system in view. We will confirm the fit and arrange for you to share the result before the call. No supporting documents are needed.',
        messageLabel: 'Which result or AI system, and what do you want to understand?',
        messagePlaceholder: 'How we use the system, what the Checker result says, and the question we want to resolve…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
      coverage={coverage}
    />
  )
}
