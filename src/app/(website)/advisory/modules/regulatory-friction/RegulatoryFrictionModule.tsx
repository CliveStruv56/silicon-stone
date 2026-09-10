'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'

import { ModulePage } from '@/components/advisory/ModulePage'
import { DigitalOmnibusContext } from '@/components/advisory/DigitalOmnibusContext'
import { Shield } from 'lucide-react'
import { MODULES, offeringById } from '@/lib/offering'
import { COMPANY_SIZES, INDUSTRIES, POLICIES } from '@/lib/policy-data'
import { AI_ACT_TIMELINE } from '@/lib/ai-act-timeline'

const offering = MODULES.find(m => m.id === 'regulatory-friction')!
const guide = offeringById('us-executive-guide')

/* Every count is read from the tool's data, so the page cannot understate the
   model. The AI Act dates are read from the pinned rule pack's timeline by the
   provision they rest on, never typed. */
const EU_POLICIES = POLICIES.filter(p => p.jurisdiction === 'EU')
const US_POLICIES = POLICIES.filter(p => p.jurisdiction === 'US')
const AI_ACT_GENERAL = AI_ACT_TIMELINE.find(e => e.basis === 'Article 113, second paragraph')
const AI_ACT_ANNEX_III = AI_ACT_TIMELINE.find(e => e.basis.includes('point (c)(i)'))
const AI_ACT_ANNEX_I = AI_ACT_TIMELINE.find(e => e.basis.includes('point (c)(ii)'))

const METHOD = [
  {
    title: 'Agree the scope',
    body: 'The entities, the jurisdictions and the operations: the products you ship, the data you move, the customers you sell to and the reporting you owe on each side. Fee and NDA are settled here.',
  },
  {
    title: 'Inventory the obligations',
    body: 'For each operation in scope, what each side actually requires of it. On the EU side that is read from the pinned statutory text this publication maintains; on the US side from the federal regimes, the sectoral regulators and the state laws that reach you.',
  },
  {
    title: 'Map the conflicts',
    body: 'Where the two pull apart, where they duplicate, and where a requirement in one is quietly blocking something in the other. Most friction turns out to be duplication that nobody has been asked to remove.',
  },
  {
    title: 'Score the friction',
    body: 'Each conflict on the ten-point scale the free tool uses, with the reasoning written down, and the cost and time to resolve it estimated as ranges with the assumptions stated.',
  },
  {
    title: 'Prioritise',
    body: 'A priority matrix on the tool’s own ladder — immediate, 30, 90 and 180 days — sequenced so that the work that unblocks a launch or a deal comes first and the duplication is removed once, not twice.',
  },
  {
    title: 'Roadmap and brief',
    body: 'A transatlantic roadmap with an owner against every action, and a summary written for the board or the US parent that says what the friction costs and what removing it is worth.',
  },
]

const DELIVERABLES = [
  'Dual-jurisdiction obligation inventory, by operation',
  'Conflict map: where US and EU requirements diverge, duplicate or block each other',
  'Friction score per conflict on the tool’s ten-point scale, with the reasoning',
  'Cost and timeline estimates for each resolution, as ranges with assumptions stated',
  'Priority action matrix: immediate, 30, 90 and 180 days',
  'Transatlantic roadmap with owners and sequencing',
  'EU–US data transfer and residency position for the operations in scope',
  'Regulatory calendar: the application dates on each side that reach you, and when',
  'A written report with a board summary',
  'A 30-day follow-up call once the actions are in motion',
]

type Props = {
  /** Articles placed under this module in Studio, fetched by the server page. */
  coverage: ComponentProps<typeof ModulePage>['coverage']
}

export function RegulatoryFrictionModule({ coverage }: Props) {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      fromTool={offering.fromTool}
      lead="Where US and EU requirements pull against each other across your operations — each conflict scored for friction, priced and dated, and set out as a transatlantic roadmap rather than a list of rules."
      body={<>
        <p>This project maps EU and US requirements against each other across your actual operations, and scores where the friction between them costs you time, money or a deal.</p>
        <p>For a specific buyer’s questionnaire or tender response, <Link href={offeringById('european-procurement-readiness').href} className="text-stone-teal underline underline-offset-4">European Procurement Readiness</Link> focuses on the evidence for that review. This assessment examines operating friction across jurisdictions.</p>
        <p>The tool holds {POLICIES.length} policies — {EU_POLICIES.length} EU and {US_POLICIES.length} US — and scores each against {INDUSTRIES.length} industries and {COMPANY_SIZES.length} company sizes for friction on a ten-point scale, with actions sorted into immediate, 30, 90 and 180-day priorities. The module replaces the industry average with your entities and operations: the products you ship, the data you move, the customers you sell to and the reporting you owe on each side.</p>
        <p>It is bought at a particular moment: an EU launch from a US base or the reverse; a US parent asking why the European entity needs a second compliance function; a customer questionnaire that wants both regimes evidenced at once; or a deal held up by a data-transfer question nobody owns.</p>
        <p>For background on European digital sovereignty from a US perspective, start with the free{' '}
          <Link href={guide.href} className="text-stone-teal underline underline-offset-4">{guide.name}</Link>.
          {' '}This assessment takes that context into your own operations, with a prioritised transatlantic roadmap.</p>
        <DigitalOmnibusContext>The revised EU rules change what applies, to whom and from when. We map those changes against your US obligations rather than treating either in isolation.</DigitalOmnibusContext>
      </>}
      audience={<>
        <p className="text-xl text-text-primary">For general counsel, heads of compliance and regulatory affairs, chief operating officers, and the US executives who run or oversee European operations.</p>
        <p>Most transatlantic organisations comply with both regimes. What they rarely have is one view of where the two conflict, what that conflict costs, and which of the duplicated controls could be run once. The friction is paid for in duplicated teams, delayed launches and deals that stall on a question neither side owns.</p>
        <p>The module is written for the industries the free tool covers:</p>
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {INDUSTRIES.map(industry => (
            <li key={industry} className="text-text-primary">{industry}</li>
          ))}
        </ul>
      </>}
      method={METHOD}
      deliverables={DELIVERABLES}
      /* The EU application dates are legal claims. The AI Act's are read from
         the pinned rule pack's timeline above. The Data Act, Cyber Resilience
         Act and NIS2 dates are read from `corpus/regulatory/<instrument>/
         <version>/meta.json` (`applicationNote`) — check there before changing
         one. Nothing on the US side is dated here. */
      context={{
        heading: 'The calendar the friction runs on',
        body: <>
          <p>Transatlantic friction is not static: the EU side is still phasing in, and each new application date moves work from optional to owed. The regulatory calendar in the report is built from the pinned statutory text this publication maintains, so that a date on it can be traced to the provision it comes from.</p>
          {AI_ACT_GENERAL && AI_ACT_ANNEX_III && AI_ACT_ANNEX_I && (
            <p><span className="font-semibold text-text-primary">The AI Act.</span> Transparency duties, GPAI enforcement and the penalty regime have applied since {AI_ACT_GENERAL.date}. Standalone high-risk systems under Annex III follow on {AI_ACT_ANNEX_III.date} and product-embedded systems under Annex I on {AI_ACT_ANNEX_I.date}, both deferred by the Digital Omnibus.</p>
          )}
          <p><span className="font-semibold text-text-primary">The Data Act.</span> In application since 12 September 2025; the design-for-access duty in Article 3(1) reaches connected products and related services placed on the market after 12 September 2026.</p>
          <p><span className="font-semibold text-text-primary">The Cyber Resilience Act.</span> Mostly still to come. Conformity-assessment provisions apply from 11 June 2026, the reporting duty in Article 14 from 11 September 2026, and the Regulation as a whole from 11 December 2027.</p>
          <p><span className="font-semibold text-text-primary">NIS2.</span> A Directive, not a Regulation: Member States had to apply their national measures from 18 October 2024, and the obligations on an organisation arise under that national law, which varies. A transatlantic roadmap has to say which Member State’s version it is reading.</p>
          <p>The module reads regulation as an operating constraint. It is not legal advice, and it does not replace counsel on any specific obligation — including whether a given instrument reaches your entity at all.</p>
        </>,
      }}
      scope={<>
        <p className="font-semibold text-text-primary">A fixed quote for the scope you agree.</p>
        <p>The fee is set by the entities, jurisdictions and operations in scope, which are agreed with you before work begins. The free tool’s stress-test brief for your industry is a good starting point for that conversation, if you have run it.</p>
      </>}
      contact={{
        interest: offering.name,
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Discuss this project',
        intro: 'Tell us which jurisdictions and operations are in scope. We will confirm the scope and fee before any work begins.',
        messageLabel: 'Where is the friction?',
        messagePlaceholder: 'Duplicated compliance work, a requirement blocking a launch, a transatlantic data question…',
        trustItems: [{ icon: Shield, title: 'Confidentiality first', body: 'All enquiries are treated with strict confidentiality.' }],
      }}
      coverage={coverage}
    />
  )
}
