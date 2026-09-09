'use client'

import Link from 'next/link'

import { ModulePage } from '@/components/advisory/ModulePage'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { Shield } from 'lucide-react'
import { MODULES } from '@/lib/offering'

const offering = MODULES.find(m => m.id === 'regulatory-friction')!

export default function RegulatoryFrictionPage() {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      lead="Where US and EU requirements pull in different directions across your operations, scored for friction and set out as a roadmap rather than a list of rules."
      fromTool={{ name: 'the Policy Stress-Test', href: '/tools/policy-stress-test' }}
      body={<>
        <p>The free tool tests a position against published policy. This module maps two jurisdictions against each other across your actual operations, and scores where the friction between them costs you time, money or a deal.</p>
        <p>It is most useful for organisations operating on both sides of the Atlantic, where compliance work is being duplicated or where a requirement in one jurisdiction is quietly blocking something in the other.</p>
        <p>It reads regulation as an operating constraint. It is not legal advice, and it does not replace counsel on any specific obligation.</p>
        <DigitalOmnibusContext>The revised EU rules change what applies, to whom and from when. We map those changes against your US obligations rather than treating either in isolation.</DigitalOmnibusContext>
      </>}
      deliverables={[
        'Dual-jurisdiction compliance mapping',
        'Friction scoring for your operations',
        'Priority action matrix',
        'Cost and timeline estimates',
      ]}
      scope={<>
        <p className="font-semibold text-text-primary">A fixed quote for the scope you agree.</p>
        <p>The fee depends on the entities, jurisdictions and operations in scope, which are agreed with you before work begins.</p>
        <p>Modules are scoped additions. They can be taken on their own, added to an <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link>, or folded into a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link> as the standing relationship requires.</p>
      </>}
      contact={{
        interest: offering.name,
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Enquire about this module',
        intro: 'Tell us which jurisdictions and operations are in scope. We will confirm the scope and fee before any work begins.',
        messageLabel: 'Where is the friction?',
        messagePlaceholder: 'Duplicated compliance work, a requirement blocking a launch, a transatlantic data question…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
    />
  )
}
