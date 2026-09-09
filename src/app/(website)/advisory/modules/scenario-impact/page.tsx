'use client'

import Link from 'next/link'

import { ModulePage } from '@/components/advisory/ModulePage'
import { Shield } from 'lucide-react'
import { MODULES } from '@/lib/offering'

const offering = MODULES.find(m => m.id === 'scenario-impact')!

export default function ScenarioImpactPage() {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      lead="Geopolitical scenarios built for your industry and geography, with the value at stake quantified by business unit rather than described in the abstract."
      fromTool={{ name: 'the Scenario Modeler', href: '/tools/scenario-modeler' }}
      body={<>
        <p>The free tool runs published scenarios against general assumptions. This module builds the scenarios that actually threaten your business, and puts a number against each one — by business unit, not as a single company-wide figure that no one can act on.</p>
        <p>It is most useful ahead of a planning cycle or an investment decision, where the argument turns on how much is at risk rather than on whether a risk exists.</p>
        <p>Where the question is what to commit to rather than what is at stake, the <Link href="/advisory/strategic-assessment" className="text-stone-teal underline underline-offset-4">Strategic Assessment</Link> is the fuller engagement.</p>
      </>}
      deliverables={[
        'Custom scenario development for your context',
        'Value-at-stake quantification by business unit',
        'Cascade effect mapping',
        'Early warning indicator framework',
      ]}
      scope={<>
        <p className="font-semibold text-text-primary">A fixed quote for the scope you agree.</p>
        <p>The fee depends on the number of scenarios and business units in scope, which is agreed with you before work begins.</p>
        <p>Modules are scoped additions. They can be taken on their own, added to an <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link>, or folded into a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link> as the standing relationship requires.</p>
      </>}
      contact={{
        interest: offering.name,
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Enquire about this module',
        intro: 'Tell us which scenarios worry you and which parts of the business they would reach. We will confirm the scope and fee before any work begins.',
        messageLabel: 'What are you trying to quantify?',
        messagePlaceholder: 'An export control, a supplier failure, a jurisdictional change…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
    />
  )
}
