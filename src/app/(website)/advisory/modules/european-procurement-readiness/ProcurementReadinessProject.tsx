'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { ModulePage } from '@/components/advisory/ModulePage'
import { offeringById } from '@/lib/offering'

const offering = offeringById('european-procurement-readiness')

export function ProcurementReadinessProject({ coverage }: { coverage: ComponentProps<typeof ModulePage>['coverage'] }) {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      lead="Prepare the evidence a European buyer needs to assess your product or service, with gaps identified before they hold up the procurement process."
      body={<>
        <p>A buyer has sent a questionnaire, a tender is approaching, or a sales team needs to explain how its service is governed. This project maps the buyer’s requests to the evidence you can supply, identifies what is missing and sets out the work needed to prepare a defensible response.</p>
        <p>The starting scope is one agreed product or service and one buyer’s procurement process. We distinguish evidence you hold, claims that need support, and commitments that need a decision by your technical team or counsel.</p>
        <p>If the question spans conflicting EU and US operating requirements across your business, the <Link href={offeringById('regulatory-friction').href} className="text-stone-teal underline underline-offset-4">Regulatory Friction Assessment</Link> is the broader investigation. Procurement Readiness focuses on the evidence and preparation for a particular buyer review.</p>
      </>}
      audience={<>
        <p className="text-xl text-text-primary">For commercial, procurement, compliance and product leaders preparing for a European customer’s review.</p>
        <p>Useful before a tender response, during supplier onboarding, or when a deal is waiting for answers about governance, hosting, access or dependencies. Bring the buyer’s requests where available; if they are not yet known, we agree a preparation scope and record that uncertainty.</p>
      </>}
      method={[
        { title: 'Define the buyer review', body: 'Agree the product or service, buyer process, decision date and evidence available. Separate the buyer’s stated requirements from assumptions about what they might ask.' },
        { title: 'Map requests to evidence', body: 'Review the agreed materials and link each request to supporting evidence, an unresolved gap or a question for the responsible team. Record the owner and status of each item.' },
        { title: 'Prepare the response plan', body: 'Prioritise the gaps against the procurement timetable, outline the response pack and work through the open decisions with your team in a handover discussion.' },
      ]}
      deliverables={[
        'Buyer requirements and evidence matrix for the agreed product or service',
        'Evidence gap register with owners, priorities and unresolved questions',
        'Response pack outline linked to the evidence reviewed',
        'Technical and contractual commitments flagged for the relevant team or counsel',
        'Readiness action plan sequenced against the agreed procurement timetable',
        'Written findings and a handover discussion with your team',
      ]}
      scope={<>
        <p>The fee depends on the product or service, number and depth of buyer requests, evidence available and response timetable. We agree deliverables, access to materials, timing and a fixed project fee in writing before work begins.</p>
        <p>This is evidence preparation and advisory review. It does not guarantee tender success, provide legal sign-off, negotiate contracts or implement missing controls. Additional buyers, products, evidence preparation or ongoing response support need an agreed scope.</p>
        <p>You can also include this work within an <Link href={offeringById('exposure-diagnostic').href} className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link> or <Link href={offeringById('strategic-assessment').href} className="text-stone-teal underline underline-offset-4">Strategic Assessment</Link>. Where work overlaps, we agree the combined scope and fee to account for it.</p>
      </>}
      contact={{
        interest: offering.name,
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Discuss procurement readiness',
        intro: 'Tell us what you sell, which buyer process you are preparing for and when a response is needed. We will agree the scope and fee after a free conversation.',
        messageLabel: 'What is the buyer asking you to establish?',
        messagePlaceholder: 'The product or service, buyer review, open questions and timing. An outline is enough for the first conversation.',
      }}
      coverage={coverage}
    />
  )
}
