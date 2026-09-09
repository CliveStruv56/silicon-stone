'use client'

import Link from 'next/link'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { Clock, Shield } from 'lucide-react'
import { FocusedEngagementPage, EngagementSteps } from '@/components/advisory/FocusedEngagementPage'
import { AMOUNTS, gbp } from '@/lib/offering'

const REVIEW_AREAS = [
  { title: 'Systems and vendor evidence', body: 'What AI you run, what your vendors can prove and where the evidence is missing.' },
  { title: 'Dependencies', body: 'How your models, APIs and cloud services connect, where your data goes and which suppliers would be difficult to replace.' },
  { title: 'European Procurement Readiness', body: 'Where European sales or procurement are in scope, map buyer questionnaires to your evidence, identify gaps that could block a deal, and flag contractual commitments for review with counsel.' },
  { title: 'Regulatory friction', body: 'Where different jurisdictional requirements affect your operations and create constraints on the business.' },
]

export default function ExposureDiagnosticPage() {
  return (
    <FocusedEngagementPage
      hero={{
        badge: 'Exposure Diagnostic',
        title: 'Know where your AI dependencies leave you exposed.',
        lead: 'You can list the AI you bought. Can you explain which vendors you depend on, where your data goes and whether the evidence supports the claims?',
        body: 'The Exposure Diagnostic connects those questions into a clear picture of your AI estate, so you can see which dependencies could constrain the business and where to act first.',
        inShort: 'A scoped review of your systems, vendor evidence and dependencies, with a written report and prioritised actions.',
        ctaLabel: 'Request a diagnostic',
        imageSrc: '/advisory/exposure-diagnostic.webp',
        imageAlt: 'A circuit board examined through an optical inspection lens beside supporting papers',
        imageCaption: 'Trace the dependencies. Examine the evidence. Set priorities.',
      }}
      audience={<>
        <p className="text-xl text-text-primary">For organisations already using AI that need a defensible picture of where they stand.</p>
        <p>A board may be asking about risk, a customer may need evidence for procurement, or your team may be unsure how dependent it has become on a particular vendor. The Diagnostic helps when answering the question means looking across systems and suppliers.</p>
        <p>It gives leadership, technology and procurement teams a shared basis for deciding what to address this quarter.</p>
      </>}
      process={<>
        <EngagementSteps steps={[
          { title: 'Agree the scope', body: 'Define the entities, systems and jurisdictions the review will cover. The scope and fee are agreed before work begins.' },
          { title: 'Examine the estate', body: 'Review your AI systems and vendor evidence, map the dependencies and assess where regulatory differences affect your operations.' },
          { title: 'Act on the findings', body: 'Receive a 15–25 page written report with an executive summary and prioritised actions. A 30-day follow-up call helps you work through what happened when you put them into practice.' },
        ]} />
        <div className="mt-10 border-t border-border-subtle pt-8">
          <h3 className="mb-5 text-lg font-semibold text-text-primary">What the review covers</h3>
          <dl className="grid gap-6 md:grid-cols-2">
            {REVIEW_AREAS.map(area => <div key={area.title}>
              <dt className="mb-2 font-semibold text-text-primary">{area.title}</dt>
              <dd className="text-sm leading-relaxed text-text-muted">{area.body}</dd>
            </div>)}
          </dl>
        </div>
        <DigitalOmnibusContext>We use the relevant Digital Omnibus changes to examine your systems, roles and evidence. European Procurement Readiness forms part of the agreed diagnostic scope where relevant.</DigitalOmnibusContext>
      </>}
      price={`From ${gbp(AMOUNTS.exposureDiagnostic)}`}
      pricing={<>
        <p className="font-semibold text-text-primary">A fixed quote for the scope you agree.</p>
        <p>The fee covers the review, report and follow-up call. You know the boundary and the price before committing, and can use the findings independently.</p>
        <p>If you move to a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link>, the diagnostic fee is credited toward your first quarter. There is no obligation to continue.</p>
      </>}
      contact={{
        interest: 'Exposure Diagnostic',
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Request a diagnostic',
        intro: "Tell us what you run and what has prompted the review. We’ll come back with a proposed scope and a fixed price.",
        messageLabel: 'What has prompted this?',
        messagePlaceholder: 'A board question, a procurement questionnaire, a vendor you cannot get answers from…',
        trustItems: [
          { icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' },
          { icon: Clock, title: 'Rapid response', body: 'Initial response within 48 hours on business days.' },
        ],
      }}
    />
  )
}
