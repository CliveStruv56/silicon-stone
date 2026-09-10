'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'

import { ModulePage } from '@/components/advisory/ModulePage'
import { Shield } from 'lucide-react'
import { MODULES } from '@/lib/offering'
import {
  DEPENDENCY_OPTIONS,
  GEOGRAPHY_OPTIONS,
  SCENARIOS,
  SECTOR_OPTIONS,
  SOURCING_OPTIONS,
} from '@/lib/scenario-data'

const offering = MODULES.find(m => m.id === 'scenario-impact')!

/* Every count is read from the tool's data, so the page cannot understate the
   model the way the manufacturing page once did ("thirty" against 31). */
const FRICTION_LEVELS = new Set(SCENARIOS.map(s => s.frictionLevel)).size
const LENS_COMBINATIONS =
  SECTOR_OPTIONS.length * GEOGRAPHY_OPTIONS.length * DEPENDENCY_OPTIONS.length * SOURCING_OPTIONS.length
const SCENARIO_NAMES = SCENARIOS.map(s => s.shortName).join(', ')

/**
 * The sectors are the free tool's own lens options (`SECTOR_OPTIONS` in
 * `scenario-data.ts`), reworded for prose. If the tool learns a sector, this
 * list should too.
 */
const SECTORS = [
  'Industrial manufacturing and automation',
  'Automotive and mobility',
  'AI infrastructure and cloud',
  'Healthcare and medical technology',
  'Financial services and insurance',
  'Consumer technology',
]

const METHOD = [
  {
    title: 'Agree the scope',
    body: 'The scenarios and the business units. Scenarios are adapted from the published set or built new around the event your board is asking about. Fee and NDA are settled here, before any figure changes hands.',
  },
  {
    title: 'Set the baseline',
    body: 'Revenue, gross margin, cost base and the dependencies that matter for each unit, from your own figures under NDA. Where a figure is not available, public filings and sector benchmarks stand in, and the register says so.',
  },
  {
    title: 'Build the scenarios',
    body: 'Each one gets a trigger event, a timeframe, a probability band with a stated confidence, and a cascade: the primary shock, the secondary effects and the tertiary ones, traced to where they land in your business.',
  },
  {
    title: 'Quantify',
    body: 'Value at stake per business unit under each scenario, as revenue and margin at risk with ranges rather than points, and the assumptions written beside every number. One workshop with the unit heads to challenge them before they are final.',
  },
  {
    title: 'Set the early warnings',
    body: 'For each scenario, the signals that would say it is starting: the threshold on each, who owns watching it, and the action it triggers. Indicators without owners are decoration.',
  },
  {
    title: 'Brief the board',
    body: 'One page per scenario in the shape the free tool uses — first impact, the 90-day action, the 12-month hedge and the trigger that says escalate — with the mitigation options ranked by value protected against cost and time.',
  },
]

const DELIVERABLES = [
  'A scenario set built or adapted for your context, each with trigger, timeframe, probability band and confidence',
  'Value at stake by business unit under each scenario: revenue and margin at risk, as ranges with the assumptions stated',
  'Cascade map per scenario: primary, secondary and tertiary effects and where each lands in the business',
  'Early-warning indicator framework: the signals, their thresholds, who owns each and what it triggers',
  'Board brief per scenario: first impact, 90-day action, 12-month hedge, escalation trigger',
  'Mitigation options ranked by value protected against cost and time to put in place',
  'Assumptions and evidence register: every figure with its source, its date and its confidence',
  'The working model as a spreadsheet you can re-run when the numbers move',
  'A written report with a board summary',
  'A 30-day follow-up call once the actions are in motion',
]

type Props = {
  /** Articles placed under this module in Studio, fetched by the server page. */
  coverage: ComponentProps<typeof ModulePage>['coverage']
}

export function ScenarioImpactModule({ coverage }: Props) {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      fromTool={offering.fromTool}
      lead="Geopolitical scenarios built for your business, with the value at stake quantified by business unit — revenue and margin at risk, with stated ranges, rather than one company-wide figure no one can act on."
      body={<>
        <p>The free tool runs published scenarios against general assumptions. This module builds the scenarios that actually threaten your business and puts a number against each one, by business unit, so that the argument in the room turns on how much is at risk and where, rather than on whether a risk exists.</p>
        <p>The tool holds {SCENARIOS.length} scenarios across {FRICTION_LEVELS} friction levels — {SCENARIO_NAMES} — and re-reads each through a lens of {SECTOR_OPTIONS.length} sectors, {GEOGRAPHY_OPTIONS.length} geographies, {DEPENDENCY_OPTIONS.length} dependencies and {SOURCING_OPTIONS.length} sourcing postures: {LENS_COMBINATIONS} combinations, scaled by a bounded multiplier. The module replaces the sector with your business units, the directional euro figure with your own revenue and margin, and the published scenario with one built around the event your board is actually asking about.</p>
        <p>It is bought at a particular moment: a planning cycle, an investment decision, a capital allocation between units, or a board question that the risk register no longer answers — not whether the Taiwan Strait or an export-control cycle matters, but what it would do to next year’s numbers and which part of the business would feel it first.</p>
        <p>Where the question is what to commit to rather than what is at stake, the <Link href="/advisory/strategic-assessment" className="text-stone-teal underline underline-offset-4">Strategic Assessment</Link> is the fuller engagement.</p>
      </>}
      audience={<>
        <p className="text-xl text-text-primary">For CFOs, heads of strategy and risk, and the boards they answer to, once the question has moved from whether a risk exists to how much of the business it reaches.</p>
        <p>Most organisations already hold a risk register that names the geopolitical risks. What it rarely holds is a defensible figure against each one, by business unit, with the assumptions written down. That gap is what turns a board discussion into a deferral, because nobody can say what a hedge is worth against what it costs.</p>
        <p>The module is written for the sectors the free tool’s lens covers:</p>
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {SECTORS.map(sector => (
            <li key={sector} className="text-text-primary">{sector}</li>
          ))}
        </ul>
      </>}
      method={METHOD}
      deliverables={DELIVERABLES}
      /* The NIS2 clause is read from the pinned text in
         `corpus/regulatory/nis2/` (Article 21(2)(c)). Check there before
         changing it. Nothing else here is a legal claim. */
      context={{
        heading: 'How the numbers are built',
        body: <>
          <p>A single alarming figure is easy to produce and impossible to defend. Every figure this module produces is a range, with the assumptions beside it and the source and date of each input in the register, so that the board can see what moves the number and by how much. The free tool bounds its exposure multiplier for the same reason; the module keeps the discipline while replacing the tool’s sector averages with your own figures.</p>
          <p>Probabilities are estimates and are labelled as such, with a confidence attached and the date they were last reviewed. A scenario is a structured way of asking what would happen, not a forecast that it will.</p>
          <p><span className="font-semibold text-text-primary">Where regulation asks for this.</span> For essential and important entities under NIS2, business continuity and crisis management are among the risk-management measures listed in Article 21(2)(c). A scenario set with owned indicators and a board-agreed response is one way to evidence that. Whether your organisation is in scope, and how your Member State has transposed the Directive, are questions for counsel — the module reads regulation as an operating constraint and is not legal advice.</p>
        </>,
      }}
      scope={<>
        <p className="font-semibold text-text-primary">A fixed quote for the scope you agree.</p>
        <p>The fee is set by the number of scenarios and business units in scope, which is agreed with you before work begins. The free tool’s board brief for your nearest lens is a good starting point for that conversation, if you have run it.</p>
        <p>Modules are scoped additions. They can be taken on their own, added to an <Link href="/advisory/exposure-diagnostic" className="text-stone-teal underline underline-offset-4">Exposure Diagnostic</Link>, or folded into a <Link href="/advisory/drift-retainer" className="text-stone-teal underline underline-offset-4">Drift Retainer</Link>, where the indicators are watched for you and the figures are refreshed as the scenarios move.</p>
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
      coverage={coverage}
    />
  )
}
