'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { Shield } from 'lucide-react'
import { FocusedEngagementPage, EngagementSteps } from '@/components/advisory/FocusedEngagementPage'
import { FREE_INTRO_WINDOW } from '@/lib/flags'
import { AMOUNTS, gbp } from '@/lib/offering'

type Props = {
  /** Articles placed under this engagement in Studio, fetched by the server page. */
  coverage: ComponentProps<typeof FocusedEngagementPage>['coverage']
}

export function AdvisoryBriefingEngagement({ coverage }: Props) {
  return (
    <FocusedEngagementPage
      hero={{
        badge: 'Advisory Briefing',
        title: 'One AI system. One principal question.',
        lead: 'Understand your Compliance Checker result and what it means for your business.',
        body: 'Bring your result and the question it raises. We review it before the call, then use a one-hour discussion to clarify the assumptions, identify the priorities and help you decide what to do next.',
        inShort: 'A review of your Checker result, a one-hour discussion and a written follow-up with priorities, evidence gaps and practical next steps.',
        ctaLabel: 'Request a briefing',
        imageSrc: '/advisory/advisory-briefing.webp',
        imageAlt: 'An isometric walled stone enclosure on a slate slab, a lit stepped plinth at its centre, with an amber path leading in through one gate and teal circuit lines running out',
        imageCaption: 'One question, set down inside a clear boundary.',
      }}
      audience={<>
        <p className="text-xl text-text-primary">For leaders who need a clear interpretation of one AI system’s result.</p>
        <p>You have run the <Link href="/tools/compliance-checker" className="text-stone-teal underline underline-offset-4">Compliance Checker</Link> and want to understand the classification, the missing evidence or the actions it suggests. Bring one principal question and a few sentences about how the system is used in your business.</p>
        <p>You leave with priorities and next actions you can use independently. If the question reaches across several systems, the <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link> provides a broader review.</p>
      </>}
      process={<>
        <EngagementSteps steps={[
        { title: 'Share your result and question', body: 'Send your Checker result, one principal question and a few sentences of business context. We confirm the fit before you book and read your result before the call. No supporting documents are needed.' },
        { title: 'Work through it together', body: 'One hour to clarify the assumptions behind the result, discuss the implications for your AI system and identify the priorities. The discussion is grounded in your result and your account of how the system is used.' },
        { title: 'Keep a written follow-up', body: 'Receive a short summary of what was clarified, what remains uncertain and the next actions. If further investigation would help, it is proposed separately. You can use the summary without commissioning more work.' },
      ]} />
        <DigitalOmnibusContext>Where a revised EU rule affects your Checker result, we discuss what that change means for the AI system in scope.</DigitalOmnibusContext>
      </>}
      price={gbp(AMOUNTS.advisoryBriefing)}
      pricing={<>
        <p className="font-semibold text-text-primary">One AI system, one principal question, one fixed fee.</p>
        <p>Includes preparation from your Checker result and brief business context, the one-hour discussion and a short written follow-up.</p>
        <p>The Briefing interprets your result based on your account. It does not verify your system or vendor evidence, certify compliance or include supporting-document review. Document review and wider investigations are scoped and charged separately.</p>
        <p>Further work is optional. If you choose a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link> within 30 days, the briefing fee is credited in full toward your first month.</p>
        {FREE_INTRO_WINDOW && <p className="text-sm">If you simply want to meet us first, a free 25-minute introductory conversation is available during our launch window. The paid Briefing is the working session on your question.</p>}
      </>}
      contact={{
        interest: 'Advisory Briefing',
        plausibleEvent: 'Engagement Enquiry',
        showIntroBooking: false,
        heading: 'Request a briefing',
        intro: 'Describe the AI system and your principal question. We will confirm the fit and arrange for you to share your Checker result before the call. No supporting documents are needed.',
        messageLabel: 'Which AI system, and what is your principal question?',
        messagePlaceholder: 'How we use the system, what the Checker result says, and the question we want to resolve…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
      coverage={coverage}
    />
  )
}
