'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'

type Rung = {
  marker: string
  title: string
  body: string
  cta: string
  href: string
  tone: 'free' | 'paid'
}

// The commitment ladder, made visible in the first screen: Read → Use → Buy → Engage.
// Rungs 1–2 are free (cool/teal accent); rungs 3–4 are paid (warm/amber accent).
const rungs: Rung[] = [
  {
    marker: 'Free',
    title: 'Read',
    body: 'Understand the shift. Twice-weekly intelligence and a deep archive — from a 30-second Pulse to a forensic Audit.',
    cta: 'Browse Intelligence',
    href: '/intelligence',
    tone: 'free',
  },
  {
    marker: 'Free',
    title: 'Use',
    body: 'Apply it to your own situation. Four interactive tools that turn the analysis into a result about you.',
    cta: 'Open the Tools',
    href: '/tools',
    tone: 'free',
  },
  {
    marker: 'From £24',
    title: 'Buy',
    body: 'Practical Tools for Compliance and Strategy',
    cta: 'See Products',
    href: '/products',
    tone: 'paid',
  },
  {
    marker: 'From £2,000/mo',
    title: 'Retain',
    body: 'A standing read on the drift, so your leadership team is never blindsided. Diagnostics and assessments scope into an ongoing relationship.',
    cta: 'Explore Advisory',
    href: '/advisory#retainer',
    tone: 'paid',
  },
]

export function StartHereSpine() {
  return (
    <section
      aria-labelledby="start-here-heading"
      className="border-b border-border-subtle bg-stone-charcoal/30"
    >
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14">
        <StaggerContainer>
          <StaggerItem>
            <div className="max-w-3xl mb-10">
              <Badge
                variant="outline"
                className="mb-4 border-stone-teal/60 text-stone-teal font-mono text-[12.5px] tracking-[0.10em] uppercase bg-stone-teal/5"
              >
                Start here
              </Badge>
              <h2 id="start-here-heading" className="sr-only">
                Four ways to use Silicon &amp; Stone
              </h2>
              <p className="text-lg italic text-text-primary/90 leading-relaxed">
                Four ways to use Silicon &amp; Stone — from a free read to a standing
                advisory relationship. Most people start at the top and move down as the
                stakes rise.
              </p>
            </div>
          </StaggerItem>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rungs.map((rung) => {
              const isFree = rung.tone === 'free'
              const accentText = isFree ? 'text-stone-teal' : 'text-silicon-amber'
              const markerClasses = isFree
                ? 'bg-stone-teal/10 text-stone-teal'
                : 'bg-silicon-amber/10 text-silicon-amber'
              return (
                <StaggerItem key={rung.title}>
                  <Link href={rung.href} className="block h-full">
                    <ForensicCard
                      accent={isFree ? 'teal' : 'amber'}
                      showMarkers={false}
                      gridHover={true}
                      delay={0}
                      className="h-full cursor-pointer"
                    >
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 mb-3 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] ${markerClasses}`}
                      >
                        {rung.marker}
                      </span>
                      <h3 className={`text-2xl font-bold mb-2 ${accentText}`}>
                        {rung.title}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed mb-4 min-h-[80px]">
                        {rung.body}
                      </p>
                      <div
                        className={`flex items-center gap-1.5 font-mono text-[12.5px] font-semibold uppercase tracking-[0.05em] ${accentText}`}
                      >
                        <span>{rung.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </ForensicCard>
                  </Link>
                </StaggerItem>
              )
            })}
          </div>
        </StaggerContainer>
      </div>
    </section>
  )
}
