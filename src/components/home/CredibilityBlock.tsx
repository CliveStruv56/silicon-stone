'use client'

import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'

export function CredibilityBlock() {
  return (
    <section aria-labelledby="credibility-heading" className="relative bg-stone-charcoal noise-overlay">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <StaggerContainer className="max-w-4xl mx-auto">
          <StaggerItem>
            <div className="text-center mb-8">
              <h2 id="credibility-heading" className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
                The View from the Edge
              </h2>
              <p className="font-mono text-xs uppercase tracking-widest text-stone-teal">
                30 Years in the Making
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="relative tech-corners p-8 lg:p-12">
              {/* Founder authority frame */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-start">
                <blockquote className="space-y-5">
                  <p className="text-xl lg:text-2xl leading-relaxed text-text-primary font-light">
                    Distilled from <span className="text-silicon-amber font-medium">three decades at the heart
                    of the tech industry</span> and observed from a vantage point on the
                    north coast of Scotland.
                  </p>
                  <p className="text-lg leading-relaxed text-text-muted">
                    While the mainland reacts to the noise, we identify the
                    &lsquo;Drift&rsquo;&mdash;the structural shifts in policy and supply
                    chains that define your professional future.
                  </p>
                  <p className="text-lg leading-relaxed text-text-muted">
                    In an era of synthetic expertise, Silicon and Stone provides something
                    AI cannot replicate: <span className="text-stone-teal font-medium">the human-in-the-loop
                    perspective</span> built on real-world experience, not training data.
                  </p>
                </blockquote>

                {/* Stone-inspired data column */}
                <div className="lg:border-l lg:border-border-subtle lg:pl-8 space-y-6">
                  <div>
                    <div className="font-mono text-3xl font-bold text-silicon-amber">30</div>
                    <div className="font-mono text-xs uppercase tracking-wider text-text-muted mt-1">
                      Years in Tech
                    </div>
                  </div>
                  <div className="h-px bg-border-subtle" />
                  <div>
                    <div className="font-mono text-sm text-stone-teal">Scotland</div>
                    <div className="font-mono text-xs uppercase tracking-wider text-text-muted mt-1">
                      The Edge of Europe
                    </div>
                  </div>
                  <div className="h-px bg-border-subtle" />
                  <div>
                    <div className="font-mono text-sm text-text-primary">Human-in-the-Loop</div>
                    <div className="font-mono text-xs uppercase tracking-wider text-text-muted mt-1">
                      Not AI-Generated
                    </div>
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
