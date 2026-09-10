'use client'

import Link from 'next/link'

import { ModulePage } from '@/components/advisory/ModulePage'
import { Shield } from 'lucide-react'
import { MODULES } from '@/lib/offering'

const offering = MODULES.find(m => m.id === 'manufacturing-exposure')!

/**
 * The sectors are the free tool's own industry-context options
 * (`INDUSTRY_SECTOR_OPTIONS` in `supply-chain-data.ts`), reworded for prose.
 * If the tool learns a sector, this list should too.
 */
const SECTORS = [
  'Industrial manufacturing and automation',
  'Automotive and mobility',
  'AI infrastructure and accelerator buyers',
  'Cloud and data centre operators',
  'Consumer electronics',
  'Defence and aerospace',
  'Medical devices',
  'Telecom and networking',
  'Energy and utilities',
]

const METHOD = [
  {
    title: 'Inventory',
    body: 'Agree the product lines in scope and list what each one depends on: the modules, boards, controllers, cloud capacity and accelerators, and the suppliers behind them.',
  },
  {
    title: 'Resolve the sub-tier',
    body: 'Trace each critical component down through its supplier to the fab node, package technology, memory, materials and design toolchain it rests on. This is where supply that looks diversified at assembly level turns out to share a single chokepoint.',
  },
  {
    title: 'Score',
    body: 'Rate every dependency on the four structural dimensions the free tool uses: exposure, substitution difficulty, lead-time pressure and geopolitical pressure.',
  },
  {
    title: 'Stress-test',
    body: 'Run the map against the five published scenarios (Taiwan disruption, an EUV constraint, an HBM shortage, export-control escalation and baseline) and one built around the event your board is actually asking about.',
  },
  {
    title: 'Put the questions to suppliers',
    body: 'You receive a questionnaire for each exposed supplier, written to be sent as it stands. You put it to them; we help you read the answers and can join the conversation where that is useful. What each supplier proved, asserted or could not answer goes on the record.',
  },
  {
    title: 'Prioritise',
    body: 'Actions ranked by what would genuinely stop you, with the immediate moves separated from the 30, 60 and 90-day ones, and a summary written for the board.',
  },
]

const DELIVERABLES = [
  'Technology and supplier dependency map, by product line',
  'Chokepoint analysis: which fab, packaging, memory, material or toolchain dependency each product actually rests on',
  'Scenario comparison across the five published scenarios and one built for you',
  'Substitution and lead-time assessment for every critical component',
  'Supplier due-diligence questionnaire, written to be sent as it stands',
  'Evidence register: what each supplier proved, asserted or could not answer',
  'Export-control and geopolitical addendum',
  'Signal watchlist: the indicators that would change the picture',
  'Prioritised resilience actions with a 30, 60 and 90-day roadmap',
  'Board briefing summary, with assumptions and sources stated',
  'A written report and the register as a working spreadsheet',
  'A 30-day follow-up call once the actions are in motion',
]

/**
 * Typed in for now; the intended source is a field on the Sanity article
 * saying which offers it appears under. See `RelatedCoverage`.
 */
const COVERAGE = {
  articles: [
    {
      title: 'Semiconductor Testing Bottleneck: Why the AI Accelerator Supply Chain Is Stalling at the Last Meter',
      href: '/analysis/semiconductor-testing-bottleneck-ai-accelerators',
      note: 'The constraint on accelerator supply is test capacity, not fab output. A dependency map that stops at the foundry misses it.',
    },
    {
      title: 'Korean Memory Fab Capacity Squeeze 2027',
      href: '/analysis/korean-memory-fab-capacity-squeeze-2027',
      note: 'DRAM and NAND capacity, geopolitical exposure and the operational responses open to buyers.',
    },
    {
      title: 'Iran Conflict: How a Middle Eastern War Becomes a European Technology Supply Crisis',
      href: '/analysis/iran-conflict-european-technology-supply-crisis',
      note: 'Rare earths, specialty chemicals and MLCC supply: how a regional conflict reaches a European bill of materials.',
    },
    {
      title: 'Helium Scarcity Is Quietly Strangling Semiconductor Production',
      href: '/analysis/helium-scarcity-semiconductor-production',
      note: 'A material most buyers have never thought about, and the fabs and edge deployments it constrains.',
    },
  ],
  more: { label: 'All semiconductor supply chain coverage', href: '/analysis/category/semiconductors' },
}

export default function ManufacturingExposurePage() {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      lead="Semiconductor, cloud, supplier and operational dependencies mapped where they matter to your organisation — with the chokepoints named, the evidence recorded and the questions to put to your suppliers."
      fromTool={offering.fromTool}
      body={<>
        <p>The free tool models dependency at the level of an industry. This module does it at the level of your organisation: the components you actually buy, the suppliers you actually depend on, and the substitutions that are realistically available to you.</p>
        <p>The tool scores thirty named chokepoints across six layers — fabrication, materials, equipment, design, advanced packaging and the IP and EDA toolchain — against five stress scenarios. The module takes the components, boards, cloud capacity and accelerators on your own bill of materials and resolves each one down to those layers, so that a supplier who looks diversified at assembly level is shown to sit on the same foundry, the same packaging route or the same controlled material as the alternative.</p>
        <p>It is most useful when a board or a customer has asked a question the tool cannot answer — which of these dependencies would genuinely stop us, what would we do about it, and what can we show we did.</p>
        <p>Where your exposure is broader than manufacturing, the <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link> is the wider review and this module folds into its scope.</p>
      </>}
      audience={<>
        <p className="text-xl text-text-primary">For operations, supply chain and procurement leaders whose products depend on chips they never buy directly.</p>
        <p>Most organisations buy modules, boards, industrial systems, vehicles, cloud capacity and AI hardware, not wafers. The semiconductor dependency sits two or three tiers below the supplier relationship, which is why a finished-goods supplier can honestly report diversified supply while the chip underneath is single-source.</p>
        <p>It is bought at a particular moment: a board has asked what a Taiwan event would do to delivery; a customer questionnaire wants supply-chain assurance you cannot yet evidence; an AI hardware purchase is about to commit you to one accelerator, one packaging route and one memory supplier; a critical vendor contract is up for renewal; or a planning cycle needs a stress-test that is not simply the last shortage replayed.</p>
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {SECTORS.map(sector => (
            <li key={sector} className="text-text-primary">{sector}</li>
          ))}
        </ul>
      </>}
      method={METHOD}
      deliverables={DELIVERABLES}
      /* Article numbers are read from the pinned Chips Act text in
         `corpus/regulatory/eu-chips-act/` (Articles 23, 25, 26 and Annex IV),
         NIS2 Article 21(2)(d) and CRA Annex I Part II(1). Check there before
         changing one. */
      context={{
        heading: 'Why the evidence matters now',
        body: <>
          <p>A documented record of exposure and of the mitigation you put in place is no longer only good practice. Three EU instruments now ask for it, and the evidence register is written with them in view.</p>
          <p><span className="font-semibold text-text-primary">The EU Chips Act.</span> If the Council activates the Act’s crisis stage, the Commission can require foundries to accept and prioritise orders of crisis-relevant products. Article 26(4) restricts that relief to critical-sector users and their suppliers who had put appropriate risk mitigation in place and still could not avoid the shortage, and the Commission may ask a beneficiary for evidence of it. Annex IV’s critical sectors include transport, health, energy, digital infrastructure, defence and food, which reaches most automotive, medical-device and industrial suppliers. In the same crisis stage, Article 25 lets the Commission ask undertakings along the semiconductor supply chain for their capacity and current disruptions. An organisation that has already mapped its dependencies can answer both.</p>
          <p><span className="font-semibold text-text-primary">NIS2.</span> Essential and important entities must address supply-chain security, including the security-related aspects of their relationships with direct suppliers and service providers, under Article 21(2)(d).</p>
          <p><span className="font-semibold text-text-primary">The Cyber Resilience Act.</span> Manufacturers of products with digital elements must keep a software bill of materials covering at least the product’s top-level dependencies. This module is the hardware-side counterpart; the <Link href="/advisory/exposure-diagnostic#ai-bill-of-materials" className="text-stone-teal underline underline-offset-4">AI Bill of Materials</Link> within the Exposure Diagnostic covers the software side.</p>
          <p>The module reads regulation as an operating constraint. It is not legal advice, and it does not replace counsel on any specific obligation — including whether your organisation sits in a critical sector or is an essential or important entity.</p>
        </>,
      }}
      scope={<>
        <p className="font-semibold text-text-primary">A fixed quote for the scope you agree.</p>
        <p>The fee is set by the number of product lines and critical suppliers in scope, which is agreed with you before work begins. The free tool’s exposure snapshot is a good starting point for that conversation, if you have run it.</p>
        <p>Modules are scoped additions. They can be taken on their own, added to an <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link>, or folded into a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link>, where the quarterly exposure review keeps the map current as suppliers, scenarios and controls move.</p>
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
      coverage={COVERAGE}
    />
  )
}
