'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { MODULES, SCOPED_FEE } from '@/lib/offering'

type Tier = {
  label: string
  title: string
  body: string
  href?: string
  popular?: boolean
}

const tiers: Tier[] = [
  {
    label: 'From consultation',
    title: 'Advisory Briefing',
    body: 'One AI system, one principal question. A review of your Checker result, a one-hour discussion and a written follow-up.',
    href: '/advisory/advisory-briefing',
  },
  {
    label: 'First picture',
    title: 'The Exposure Diagnostic',
    body: 'AI-governance and dependency review; 15–25pp written report; executive summary; 30-day follow-up.',
  },
  {
    label: 'Most popular · Ongoing',
    title: 'The Drift Retainer',
    body: `When the board asks what has actually changed, a standing independent read on how the drift affects your supply chains, procurement, and people — delivered monthly, so the leadership team is never blindsided. ${SCOPED_FEE}.`,
    href: '/advisory/drift-retainer',
    popular: true,
  },
  {
    label: 'Enterprise',
    title: 'Strategic Assessment',
    body: 'Multi-framework analysis; 40+pp report; board-ready presentation; quarterly check-ins over 12 months.',
  },
]

export function AdvisoryBand() {
  return (
    <section
      aria-labelledby="advisory-band-heading"
      className="border-b border-border-subtle"
    >
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
        <StaggerContainer>
          <StaggerItem>
            <div className="max-w-2xl mb-8">
              <Badge
                variant="outline"
                className="mb-4 border-silicon-amber/60 text-silicon-amber-strong font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
              >
                Engage · advisory
              </Badge>
              <h2
                id="advisory-band-heading"
                className="font-bold text-text-primary mb-4"
                style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                When self-serve isn&apos;t enough — work with us
              </h2>
              <p className="text-base text-text-muted leading-relaxed">
                Strategic advisory for the technopolitical age, built on the same 3×2 method.
              </p>
            </div>
          </StaggerItem>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <StaggerItem key={tier.title}>
                <Link href={tier.href ?? '/advisory'} className="block h-full">
                  <ForensicCard
                    accent={tier.popular ? 'amber' : 'subtle'}
                    showMarkers={false}
                    gridHover={true}
                    delay={0}
                    className="h-full cursor-pointer"
                  >
                    <span
                      className={`font-mono text-[12px] uppercase tracking-[0.10em] mb-2 block ${
                        tier.popular ? 'text-silicon-amber-strong' : 'text-text-muted'
                      }`}
                    >
                      {tier.label}
                    </span>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {tier.title}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {tier.body}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-silicon-amber-strong">
                      <span>Explore advisory</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </ForensicCard>
                </Link>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
        <div className="mt-8 border-t border-border-subtle pt-6">
          <h3 className="text-xl font-semibold text-text-primary">Specialist projects for a defined question</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
            Commission directly after a free scoping conversation. No tool, earlier purchase or retainer is required.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {MODULES.map(project => (
              <li key={project.id}>
                <Link href={project.href} className="text-sm text-stone-teal underline underline-offset-4">{project.name}</Link>
              </li>
            ))}
          </ul>
          <Link href="/advisory#modules" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-stone-teal">
            Compare specialist projects <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
