'use client'

import Link from 'next/link'
import Image from 'next/image'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

/* Preview frames.
 *
 * The four illustrations are all 3168×1344, so the frame is locked to that
 * same ratio and the artwork sits in it uncropped. The panel is at most ~548px
 * wide (two columns inside max-w-7xl, less the card's p-6), so `sizes` lets
 * Next serve a variant near that rather than the full-width original.
 *
 * The panels point at 1600px-wide WebP renders (~290KB for all four); the
 * untouched 3168px PNG originals sit beside them in public/tools/ as the
 * source of truth if these ever need re-deriving. */
const PREVIEW_RATIO = 3168 / 1344

/* ─── Tool Data ─────────────────────────────────────────────────── */
const tools = [
  {
    name: 'Supply Chain Mapper',
    scenario: 'A TSMC facility reports delays. You already know which products are exposed.',
    tagline: 'Visualise semiconductor chokepoints and trace upstream dependency in real time.',
    href: '/tools/supply-chain-mapper',
    accent: 'teal' as const,
    preview: '/tools/supply-chain-mapper-preview.webp',
    takeFurther: { label: 'Manufacturing Exposure Module', href: '/advisory' },
  },
  {
    name: 'Compliance Checker',
    scenario: 'Monday, 9:14am. The board asks: "Are we compliant?" You answer in 60 seconds.',
    tagline: 'Classify your AI systems against the EU AI Act — before your auditor does.',
    href: '/tools/compliance-checker',
    accent: 'amber' as const,
    preview: '/tools/compliance-checker-preview.webp',
    takeFurther: { label: 'AI Act Compliance Toolkit (£79)', href: '/products' },
  },
  {
    name: 'Scenario Modeler',
    scenario: 'The CFO wants three futures modelled by Thursday. You have them by lunch.',
    tagline: 'Compare strategic outcomes under competing geopolitical scenarios.',
    href: '/tools/scenario-modeler',
    accent: 'amber' as const,
    preview: '/tools/scenario-modeler-preview.webp',
    takeFurther: { label: 'Scenario Impact Analysis', href: '/advisory' },
  },
  {
    name: 'Policy Stress-Test',
    scenario: 'New US export controls drop. You score the friction against EU operations in minutes.',
    tagline: 'Measure regulatory divergence between US and EU policy positions.',
    href: '/tools/policy-stress-test',
    accent: 'teal' as const,
    preview: '/tools/policy-stress-test-preview.webp',
    takeFurther: { label: 'Regulatory Friction Assessment', href: '/advisory' },
  },
]

/* ─── Main Component ────────────────────────────────────────────── */
export function ToolsGallery() {
  return (
    <section aria-labelledby="tools-heading" className="bg-stone-charcoal/50">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-14">
        <StaggerContainer>
          <StaggerItem>
            <div className="max-w-3xl mb-8">
              <Badge
                variant="outline"
                className="mb-5 border-silicon-amber/60 text-silicon-amber font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
              >
                Use · decision tools
              </Badge>
              <h2
                id="tools-heading"
                className="font-bold text-text-primary mb-4"
                style={{
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                From Analysis to Action
              </h2>
              <p className="text-base text-text-muted leading-relaxed">
                Four tools that solve high-stakes problems — calibrated against
                the same intelligence the briefings draw from.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tools/supply-chain-mapper"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-teal/60 bg-stone-teal/5 px-4 py-2 text-sm font-medium text-stone-teal transition-colors hover:bg-stone-teal/10"
                >
                  Map technology dependency
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tools/compliance-checker"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-silicon-amber/60 bg-silicon-amber/5 px-4 py-2 text-sm font-medium text-silicon-amber transition-colors hover:bg-silicon-amber/10"
                >
                  Assess AI governance exposure
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </StaggerItem>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <StaggerItem key={tool.name}>
                <ForensicCard
                  accent={tool.accent}
                  showMarkers={true}
                  gridHover={true}
                  delay={0}
                  className="h-full"
                >
                  {/* POV scenario line */}
                  <p className="text-xs text-text-muted italic mb-3 font-mono leading-relaxed">
                    &ldquo;{tool.scenario}&rdquo;
                  </p>

                  {/* Mini preview */}
                  <div
                    className="relative mb-4 overflow-hidden rounded-md border border-border-subtle/50 bg-slate-deep/50"
                    style={{ aspectRatio: PREVIEW_RATIO }}
                  >
                    <Image
                      src={tool.preview}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 548px, (min-width: 640px) 44vw, 88vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Tool info */}
                  <h3 className="text-lg font-semibold text-text-primary mb-1">{tool.name}</h3>
                  <p className="text-sm text-text-muted mb-4">{tool.tagline}</p>

                  {/* CTA — launch the free tool */}
                  <Link
                    href={tool.href}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${tool.accent === 'amber' ? 'text-silicon-amber hover:text-silicon-amber/80' : 'text-stone-teal hover:text-stone-teal/80'}`}
                  >
                    <span>Launch tool</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Bridge — the paid next step */}
                  <Link
                    href={tool.takeFurther.href}
                    className="mt-4 pt-3 border-t border-dashed border-border-subtle/70 flex items-center gap-1.5 font-mono text-[12.5px] font-semibold tracking-[0.03em] text-text-muted transition-colors hover:text-text-primary"
                  >
                    <span>Take it further → {tool.takeFurther.label}</span>
                  </Link>
                </ForensicCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </div>
    </section>
  )
}
