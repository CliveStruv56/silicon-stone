'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { ModulePage } from '@/components/advisory/ModulePage'
import { offeringById } from '@/lib/offering'

const offering = offeringById('sovereign-architecture-review')

export function SovereignArchitectureProject({ coverage }: { coverage: ComponentProps<typeof ModulePage>['coverage'] }) {
  return (
    <ModulePage
      name={offering.name}
      price={offering.price}
      lead="Establish who controls your technology stack, where dependencies limit your choices, and which architecture changes are practical for your business."
      body={<>
        <p>A hosting location alone does not describe control. This review maps where data, inference and model weights sit, who administers the service, who holds the keys, and what you could move if a vendor, buyer requirement or operating constraint changed.</p>
        <p>Start with one agreed system or workload and a specific decision: a cloud renewal, a new AI deployment, a buyer’s sovereignty requirements or an exit option. We compare the current design with feasible alternatives and record the evidence, assumptions and trade-offs behind each option.</p>
        <p>Where the immediate need is to prepare evidence for a buyer’s questionnaire, <Link href={offeringById('european-procurement-readiness').href} className="text-stone-teal underline underline-offset-4">European Procurement Readiness</Link> focuses on that response. This project examines the architecture and the choices it can support.</p>
      </>}
      audience={<>
        <p className="text-xl text-text-primary">For technology, architecture, security and procurement leaders deciding how much control a system needs.</p>
        <p>Useful when a board asks about vendor concentration, a customer requires evidence of control, or a team needs to understand the practical cost of changing providers. The review starts from your operating needs and tolerance for dependency.</p>
      </>}
      method={[
        { title: 'Agree the control question', body: 'Define the system boundary, decision, required controls and evidence available. Identify the people who can explain the current design and the constraints any alternative must meet.' },
        { title: 'Trace access and dependencies', body: 'Review the agreed architecture documents and technical discussions. Map hosting, administrative access, key custody and service dependencies, marking what is evidenced and what remains unverified.' },
        { title: 'Compare feasible options', body: 'Assess portability, exit constraints and changes needed for each option. Present a staged roadmap with effort and cost assumptions, unresolved questions and decisions for your team.' },
      ]}
      deliverables={[
        'Architecture and control map for the agreed system or workload',
        'Hosting, administrative access and key-custody findings with evidence gaps',
        'Dependency, portability and exit-constraint register',
        'Options appraisal covering control, operating trade-offs and indicative effort and cost assumptions',
        'Staged decision roadmap, including technical validation still needed',
        'Written findings and a handover discussion with your team',
      ]}
      scope={<>
        <p>The fee depends on the system boundary, providers and workloads involved, access to documentation and the number of options to assess. We agree deliverables, timing and a fixed project fee in writing before work begins.</p>
        <p>The review is based on supplied documentation and technical discussions. It does not include penetration testing, a source-code audit, certification, migration delivery or a legal opinion. Findings distinguish evidenced controls from assumptions; additional technical validation is separately scoped.</p>
        <p>This work can also form part of a <Link href={offeringById('strategic-assessment').href} className="text-stone-teal underline underline-offset-4">Strategic Assessment</Link> when the decision spans wider governance, investment and operating choices. Where work overlaps, we agree the combined scope and fee to account for it.</p>
      </>}
      contact={{
        interest: offering.name,
        plausibleEvent: 'Engagement Enquiry',
        heading: 'Discuss your architecture review',
        intro: 'Describe the system, the control question and the decision you need to make. We will agree the scope and fee after a free conversation.',
        messageLabel: 'What control or dependency decision are you facing?',
        messagePlaceholder: 'The system or workload, current providers, buyer or board question and decision timing.',
      }}
      coverage={coverage}
    />
  )
}
