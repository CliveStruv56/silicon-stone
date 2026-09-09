'use client'

import Link from 'next/link'

import { ModulePage } from '@/components/advisory/ModulePage'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { Shield } from 'lucide-react'
import { MODULES } from '@/lib/offering'

const offering = MODULES.find(m => m.id === 'sovereign-architecture-review')!

export default function SovereignArchitectureReviewPage() {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      lead="Where inference, weights and keys sit, who can reach them, and whether you could satisfy a buyer's sovereignty demand without re-architecting."
      body={<>
        <p>Sovereignty tends to arrive as a deadline: a buyer asks where the data goes and who can reach it, and the answer has to be architectural rather than reassuring. This module establishes what your architecture can already support, and what it would cost to support the rest.</p>
        <p>It is the one module with no free tool behind it, because the questions it asks cannot be answered from public information — they depend on your key custody, your administrative access paths and your abstraction layers.</p>
        <p>It keeps your options open. It does not pick your vendors for you, and it separates what the law requires from what a buyer merely prefers.</p>
        <DigitalOmnibusContext>We assess data flows, access, key custody and portability against applicable requirements and buyer expectations, keeping legal duties and strategic sovereignty preferences distinct.</DigitalOmnibusContext>
      </>}
      deliverables={[
        'A model-dependency map: where inference, weights and keys sit, and who can reach them',
        'An abstraction-layer assessment — can you satisfy a buyer’s sovereignty demand without re-architecting?',
        'A key-custody and admin-access review: EU-resident keys, and where a US administrative override still reaches EU data',
        'A sovereignty roadmap that keeps your options open — it does not pick your vendors for you',
      ]}
      scope={<>
        <p className="font-semibold text-text-primary">A fixed quote for the scope you agree.</p>
        <p>The fee depends on the number of systems and jurisdictions in scope, which is agreed with you before work begins. It is the deepest of the modules, and priced accordingly.</p>
        <p>Modules are scoped additions. They can be taken on their own, added to an <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link>, or folded into a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link> as the standing relationship requires.</p>
      </>}
      contact={{
        interest: offering.name,
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Enquire about this module',
        intro: 'Tell us what has prompted the question — a buyer requirement, a procurement round, or a decision about where to run inference.',
        messageLabel: 'What is the sovereignty question?',
        messagePlaceholder: 'A buyer questionnaire, EU data residency, key custody, an administrative access concern…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
    />
  )
}
