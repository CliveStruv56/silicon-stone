'use client'

import Link from 'next/link'

import { ModulePage } from '@/components/advisory/ModulePage'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { Shield } from 'lucide-react'
import { MODULES, offeringById } from '@/lib/offering'

const offering = MODULES.find(m => m.id === 'regulatory-friction')!
const guide = offeringById('us-executive-guide')

/**
 * Typed in for now; the intended source is a field on the Sanity article
 * saying which offers it appears under. See `RelatedCoverage`.
 */
const COVERAGE = {
  articles: [
    {
      title: 'EU AI Act: What 2 August 2026 Actually Requires (and What Moves to 2027–28)',
      href: '/analysis/eu-ai-act-compliance-chasm-august-2026',
      note: 'The transparency line, the penalty regime and the dates the heavy obligations actually moved to.',
    },
    {
      title: 'GPAI Enforcement Activates 2 August — and the Signatory List Shows Who Is Betting Against Brussels',
      href: '/analysis/gpai-enforcement-activates-2-august-and-the-signatory-list',
      note: 'What the Code of Practice signatory list tells a US company entering Europe.',
    },
    {
      title: 'CAIDA’s Sovereignty Tiers: Legal Architecture or Hyperscaler Licence to Stay?',
      href: '/analysis/caidas-sovereignty-tiers-legal-architecture-or-hyperscaler',
      note: 'The tiered cloud framework, and what qualifying as a sovereign provider does and does not require.',
    },
    {
      title: 'The Collision Course: Trump’s Tariffs vs. EU Tech Enforcement',
      href: '/analysis/tariff-enforcement-collision',
      note: 'Where trade policy and enforcement pull a transatlantic operation in opposite directions.',
    },
  ],
  more: { label: 'All Atlantic Drift coverage', href: '/analysis/category/atlantic-drift' },
}

export default function RegulatoryFrictionPage() {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      lead="Where US and EU requirements pull in different directions across your operations, scored for friction and set out as a roadmap rather than a list of rules."
      fromTool={offering.fromTool}
      body={<>
        <p>The free tool tests a position against published policy. This module maps two jurisdictions against each other across your actual operations, and scores where the friction between them costs you time, money or a deal.</p>
        <p>It is most useful for organisations operating on both sides of the Atlantic, where compliance work is being duplicated or where a requirement in one jurisdiction is quietly blocking something in the other.</p>
        <p>For background on European digital sovereignty from a US perspective, start with the free{' '}
          <Link href={guide.href} className="text-stone-teal underline underline-offset-4">{guide.name}</Link>.
          {' '}This assessment takes that context into your own operations, with a prioritised transatlantic roadmap.</p>
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
      coverage={COVERAGE}
    />
  )
}
