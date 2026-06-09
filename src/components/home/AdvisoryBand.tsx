'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'

type Tier = {
  label: string
  title: string
  body: string
  popular?: boolean
}

const tiers: Tier[] = [
  {
    label: 'From consultation',
    title: 'Advisory Briefing',
    body: 'A one-hour strategic consultation built on your tool results and specific questions.',
  },
  {
    label: 'Most popular',
    title: 'Focused Diagnostic',
    body: 'AI-governance and dependency review; 15–25pp written report; executive summary; 30-day follow-up.',
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
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <StaggerContainer>
          <StaggerItem>
            <div className="max-w-2xl mb-12">
              <Badge
                variant="outline"
                className="mb-4 border-silicon-amber/60 text-silicon-amber font-mono text-[11px] tracking-[0.10em] uppercase bg-silicon-amber/5"
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <StaggerItem key={tier.title}>
                <Link href="/advisory" className="block h-full">
                  <ForensicCard
                    accent={tier.popular ? 'amber' : 'subtle'}
                    showMarkers={false}
                    gridHover={true}
                    delay={0}
                    className="h-full cursor-pointer"
                  >
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.10em] mb-2 block ${
                        tier.popular ? 'text-silicon-amber' : 'text-text-muted'
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
                    <div className="flex items-center gap-1.5 text-sm font-medium text-silicon-amber">
                      <span>Explore advisory</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </ForensicCard>
                </Link>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </div>
    </section>
  )
}
