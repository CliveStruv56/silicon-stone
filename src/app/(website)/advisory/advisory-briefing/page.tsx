'use client'

import Link from 'next/link'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { Shield } from 'lucide-react'
import { FocusedEngagementPage, EngagementSteps } from '@/components/advisory/FocusedEngagementPage'
import { FREE_INTRO_WINDOW } from '@/lib/flags'
import { AMOUNTS, gbp } from '@/lib/offering'

export default function AdvisoryBriefingPage() {
  return (
    <FocusedEngagementPage
      hero={{
        badge: 'Advisory Briefing',
        title: 'One question, answered properly.',
        lead: 'A vendor claim you cannot verify. A tool result you need to interpret. A board question that needs a clear answer.',
        body: 'Bring the question and the evidence you have. We apply thirty years of technology industry experience to help you understand what matters and decide what to do next.',
        inShort: 'A focused one-hour working session, with prioritised recommendations and a written follow-up.',
        ctaLabel: 'Request a briefing',
        imageSrc: '/advisory/advisory-briefing.webp',
        imageAlt: 'An isometric stone plinth on a cracked slab, lit from above, with teal, amber and warning-red channels converging on it',
        imageCaption: 'One question, set down and lit from every side.',
        artwork: 'cutout',
        imageRatio: 3 / 2,
      }}
      audience={<>
        <p className="text-xl text-text-primary">For leaders with one specific question to resolve.</p>
        <p>You may have run the Compliance Checker, Supply Chain Mapper, Scenario Modeler or Policy Stress-Test and want help interpreting the result. Or you may need an independent view on a vendor proposal, a policy obligation or a decision facing your team.</p>
        <p>The Briefing works best when the question has a clear boundary. If you need a review of your whole AI estate, the <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link> is the more suitable starting point.</p>
      </>}
      process={<>
        <EngagementSteps steps={[
        { title: 'Bring your question', body: 'Tell us what you need to resolve and share any relevant tool results or supporting material. We confirm whether a focused hour is the right fit before you book.' },
        { title: 'Work through the evidence', body: 'Use the hour to examine what the evidence says, where it falls short and what that means for your situation. We help you prioritise the next actions.' },
        { title: 'Take the answer with you', body: 'Receive a written follow-up with the interpretation and recommendations, ready to share with colleagues and refer to after the call.' },
      ]} />
        <DigitalOmnibusContext>Bring one question about the revised EU rules, a vendor claim or your exposure in Europe. We interpret the relevant changes against that decision.</DigitalOmnibusContext>
      </>}
      price={gbp(AMOUNTS.advisoryBriefing)}
      pricing={<>
        <p className="font-semibold text-text-primary">Fixed fee for the one-hour session and written follow-up.</p>
        <p>If you proceed to a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link> within 30 days, the briefing fee is credited in full toward your first month. There is no obligation to continue.</p>
        {FREE_INTRO_WINDOW && <p className="text-sm">If you simply want to meet us first, a free 25-minute introductory conversation is available during our launch window. The paid Briefing is the working session on your question.</p>}
      </>}
      contact={{
        interest: 'Advisory Briefing',
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Request a briefing',
        intro: "Tell us the question you need to resolve. We’ll confirm whether the Briefing is the right fit before you book.",
        messageLabel: 'What is the question?',
        messagePlaceholder: 'A vendor claim, a tool result, a board question…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
    />
  )
}
