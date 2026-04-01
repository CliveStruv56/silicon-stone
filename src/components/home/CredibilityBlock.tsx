'use client'

import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'

export function CredibilityBlock() {
  return (
    <section aria-labelledby="credibility-heading" className="relative bg-stone-charcoal noise-overlay">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <StaggerContainer className="max-w-4xl mx-auto">
          <StaggerItem>
            <div className="relative tech-corners p-8 lg:p-12 border-l-4 border-silicon-amber">
              <h2 id="credibility-heading" className="sr-only">The View from the Edge</h2>

              {/* Data points bar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-silicon-amber" />
                  <span className="font-mono text-xs uppercase tracking-widest text-silicon-amber">
                    30 Years in Tech
                  </span>
                </div>
                <div className="h-4 w-px bg-border-subtle" />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-stone-teal" />
                  <span className="font-mono text-xs uppercase tracking-widest text-stone-teal">
                    Edge of Europe
                  </span>
                </div>
              </div>

              {/* Pull quote */}
              <blockquote className="space-y-4">
                <p className="text-xl lg:text-2xl leading-relaxed text-text-primary font-light">
                  Distilled from <span className="text-silicon-amber font-medium">30 years in the tech industry</span> and
                  observed from the <span className="text-stone-teal font-medium">edge of Europe</span>.
                </p>
                <p className="text-lg lg:text-xl leading-relaxed text-text-muted">
                  Silicon and Stone provides the detached, forensic perspective required to see through
                  the mainland hype and identify the &lsquo;Drift&rsquo;&mdash;the structural shifts in policy
                  and supply chains that define your professional future.
                </p>
              </blockquote>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  )
}
