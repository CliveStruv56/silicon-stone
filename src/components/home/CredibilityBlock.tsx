'use client'

import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { Badge } from '@/components/ui/badge'

export function CredibilityBlock() {
  return (
    <section
      aria-labelledby="credibility-heading"
      className="relative bg-stone-charcoal noise-overlay"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <StaggerContainer className="max-w-4xl mx-auto">
          <StaggerItem>
            <div className="text-center mb-10">
              <Badge
                variant="outline"
                className="mb-5 border-silicon-amber/60 text-silicon-amber font-mono text-[11px] tracking-[0.10em] uppercase bg-silicon-amber/5"
              >
                Brand Position
              </Badge>
              <h2
                id="credibility-heading"
                className="font-bold text-text-primary mb-3"
                style={{
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                The View from the Edge
              </h2>
              <p className="font-mono text-xs uppercase tracking-[0.10em] text-silicon-amber">
                Thirty years inside. Fifty miles north.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="relative tech-corners p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-start">
                <blockquote className="space-y-5">
                  <p className="text-xl lg:text-2xl leading-relaxed text-text-primary font-light">
                    Distilled from{' '}
                    <span className="text-silicon-amber font-medium">
                      three decades at the heart of the technology industry
                    </span>{' '}
                    and observed from a small island sixty miles north of the
                    Scottish mainland.
                  </p>
                  <p className="text-lg leading-relaxed text-text-muted">
                    While the mainland reacts to the noise, we identify{' '}
                    <strong className="text-silicon-amber font-medium">the Drift</strong>
                    {' '}— the structural shifts in policy, capital, and supply
                    chains that will define{' '}
                    <strong className="text-text-primary font-semibold">
                      European industry&apos;s next decade
                    </strong>
                    .
                  </p>
                  <p className="text-lg leading-relaxed text-text-muted">
                    Practitioner-grade analysis from thirty years inside the
                    industry.{' '}
                    <em className="text-silicon-amber font-medium">
                      Calibrated where the evidence supports it, hedged where
                      it doesn&apos;t.
                    </em>{' '}
                    Never glib, never breathless.
                  </p>
                </blockquote>

                <div className="lg:border-l lg:border-border-subtle lg:pl-8 space-y-6 lg:max-w-[220px]">
                  <div>
                    <div className="font-mono text-3xl font-bold text-silicon-amber leading-none">
                      30
                    </div>
                    <div className="font-mono text-xs uppercase tracking-[0.10em] text-text-muted mt-2">
                      Years in Tech
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed mt-2">
                      From inside the industry, not observing it from outside.
                    </p>
                  </div>
                  <div className="h-px bg-border-subtle" />
                  <div>
                    <div className="font-mono text-2xl font-bold text-stone-teal leading-none">
                      50 mi N
                    </div>
                    <div className="font-mono text-xs uppercase tracking-[0.10em] text-text-muted mt-2">
                      Beyond the Mainland
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed mt-2">
                      The view from the edge is structurally clearer than the
                      view from any centre.
                    </p>
                  </div>
                  <div className="h-px bg-border-subtle" />
                  <div>
                    <div className="font-mono text-sm font-bold text-text-primary leading-tight whitespace-nowrap">
                      PRACTITIONER‑GRADE
                    </div>
                    <div className="font-mono text-xs uppercase tracking-[0.10em] text-text-muted mt-2">
                      Calibrated by Default
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed mt-2">
                      Hedged on purpose. Not pundit takes, not consensus
                      reading.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  )
}
