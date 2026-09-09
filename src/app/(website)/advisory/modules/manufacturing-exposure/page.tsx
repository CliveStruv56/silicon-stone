'use client'

import Link from 'next/link'

import { ModulePage } from '@/components/advisory/ModulePage'
import { Shield } from 'lucide-react'
import { MODULES } from '@/lib/offering'

const offering = MODULES.find(m => m.id === 'manufacturing-exposure')!

export default function ManufacturingExposurePage() {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      lead="Semiconductor, cloud, supplier and operational dependencies mapped where they matter to your organisation — with the chokepoints named and the questions to put to your suppliers."
      fromTool={offering.fromTool}
      body={<>
        <p>The free tool models dependency at the level of an industry. This module does it at the level of your organisation: the components you actually buy, the suppliers you actually depend on, and the substitutions that are realistically available to you.</p>
        <p>It is most useful when a board or a customer has asked a question the tool cannot answer — which of these dependencies would genuinely stop us, and what would we do about it.</p>
        <p>Where your exposure is broader than manufacturing, the <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link> is the wider review and this module folds into its scope.</p>
      </>}
      deliverables={[
        'Technology and supplier dependency map',
        'Chokepoint identification for critical components',
        'Procurement questions for exposed suppliers',
        'Prioritised resilience actions',
      ]}
      scope={<>
        <p className="font-semibold text-text-primary">A fixed quote for the scope you agree.</p>
        <p>The fee depends on the number of product lines and suppliers in scope, which is agreed with you before work begins.</p>
        <p>Modules are scoped additions. They can be taken on their own, added to an <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link>, or folded into a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link> as the standing relationship requires.</p>
      </>}
      contact={{
        interest: offering.name,
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Enquire about this module',
        intro: 'Tell us which product lines and suppliers matter most. We will confirm the scope and fee before any work begins.',
        messageLabel: 'What are you trying to establish?',
        messagePlaceholder: 'A supplier concentration, a component you cannot second-source, a customer question…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
    />
  )
}
