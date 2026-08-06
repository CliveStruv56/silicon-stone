'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

/* Preview frames.
 *
 * SVG previews all use a 260×80 viewBox and a frame locked to that same 13:4
 * ratio, so `meet` scaling fills the frame edge to edge at every width. The
 * previous frames were a fixed 112px tall against a ~560px-wide panel, which
 * sized each drawing off its short axis and stranded it in the middle.
 *
 * The two DOM-built previews (bars, gauges) keep explicit heights — they have
 * their own intrinsic sizing and no viewBox to match. */
const PREVIEW_SVG_BOX = 'relative w-full overflow-hidden aspect-[13/4]'
const PREVIEW_BOX = 'relative h-40 overflow-hidden sm:h-44'

/* ─── Mini-Preview: Compliance Checker (Risk-tier decision tree) ── */
function CompliancePreview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  const tiers = [
    { label: 'Prohibited', x: 40, color: 'var(--alert-red)' },
    { label: 'High-Risk', x: 100, color: 'var(--silicon-amber)' },
    { label: 'Limited', x: 160, color: 'var(--stone-teal)' },
    { label: 'Minimal', x: 220, color: 'var(--tier-pulse)' },
  ]

  return (
    <div ref={ref} className={PREVIEW_SVG_BOX}>
      <svg viewBox="0 0 260 80" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {/* Root — the system under assessment. */}
        <motion.g
          initial={{ opacity: 0, y: -4 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <rect
            x="100" y="6" width="60" height="20" rx="5"
            fill="var(--stone-charcoal)"
            stroke="var(--text-muted)"
            strokeWidth="1"
          />
          <text
            x="130" y="16"
            textAnchor="middle" dominantBaseline="central"
            fill="var(--text-primary)" fontSize="9" fontFamily="var(--font-mono)"
          >
            AI System
          </text>
        </motion.g>

        {tiers.map((tier, i) => (
          <motion.line
            key={`line-${tier.label}`}
            x1="130" y1="26" x2={tier.x} y2="52"
            stroke="var(--border-subtle)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 0.8 } : {}}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
          />
        ))}

        {tiers.map((tier, i) => (
          <motion.g
            key={tier.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            style={{ transformOrigin: `${tier.x}px 61px` }}
            transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
          >
            <rect
              x={tier.x - 28} y="52" width="56" height="19" rx="5"
              fill="var(--stone-charcoal)"
              stroke={tier.color}
              strokeWidth="1.2"
            />
            <text
              x={tier.x} y="62"
              textAnchor="middle" dominantBaseline="central"
              fill={tier.color} fontSize="8.5" fontFamily="var(--font-mono)"
            >
              {tier.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

/* ─── Mini-Preview: Supply Chain Map (SVG World) ────────────────── */
function SupplyChainPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  const chokepoints = [
    { label: 'USA', x: 34, y: 44, color: 'var(--silicon-amber)' },
    { label: 'NLD', x: 112, y: 26, color: 'var(--stone-teal)' },
    { label: 'DEU', x: 142, y: 50, color: 'var(--stone-teal)' },
    { label: 'KOR', x: 206, y: 24, color: 'var(--silicon-amber)' },
    { label: 'TWN', x: 228, y: 52, color: 'var(--alert-red)' },
  ]

  const connections = [
    [34, 44, 112, 26],
    [112, 26, 228, 52],
    [228, 52, 206, 24],
    [206, 24, 142, 50],
    [142, 50, 34, 44],
  ]

  return (
    <div ref={ref} className={PREVIEW_SVG_BOX}>
      <svg viewBox="0 0 260 80" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {/* Faint land masses — Americas, Europe, East Asia. */}
        <ellipse cx="40" cy="42" rx="34" ry="26" fill="none" stroke="var(--border-subtle)" strokeWidth="1" opacity="0.45" />
        <ellipse cx="128" cy="38" rx="28" ry="30" fill="none" stroke="var(--border-subtle)" strokeWidth="1" opacity="0.45" />
        <ellipse cx="216" cy="40" rx="32" ry="28" fill="none" stroke="var(--border-subtle)" strokeWidth="1" opacity="0.45" />

        {connections.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--stone-teal)"
            strokeWidth="1"
            strokeDasharray="4 3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 0.55 } : {}}
            transition={{ duration: 0.8, delay: 0.4 + i * 0.15 }}
          />
        ))}

        {chokepoints.map((node, i) => (
          <motion.g
            key={node.label}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.25 + i * 0.1 }}
          >
            <motion.circle
              cx={node.x} cy={node.y} r="5"
              fill="none" stroke={node.color} strokeWidth="1"
              initial={{ r: 4, opacity: 0.8 }}
              animate={inView ? { r: 12, opacity: 0 } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
            <circle cx={node.x} cy={node.y} r="4" fill={node.color} />
            <text
              x={node.x} y={node.y + 14}
              textAnchor="middle"
              fill={node.color}
              fontSize="8.5"
              fontFamily="var(--font-mono)"
            >
              {node.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

/* ─── Mini-Preview: Scenario Modeler (Bar Chart) ────────────────── */
function ScenarioPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  const scenarios = [
    { label: 'Low', value: 35, color: 'var(--stone-teal)' },
    { label: 'Medium', value: 62, color: 'var(--silicon-amber)' },
    { label: 'High', value: 88, color: 'var(--alert-red)' },
  ]

  // Bar heights are resolved to pixels against this track rather than left as
  // percentages: the column that used to hold them had no definite height, so
  // `height: 88%` collapsed to nothing and the bars never rendered.
  const TRACK = 104

  return (
    <div ref={ref} className={`${PREVIEW_BOX} flex items-end gap-5 px-6 pb-5 pt-4`}>
      {scenarios.map((s, i) => (
        <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
          <motion.span
            className="font-mono text-xs text-text-primary"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.6 + i * 0.15 }}
          >
            {s.value}
          </motion.span>
          <motion.div
            className="w-full rounded-t-md"
            style={{ backgroundColor: s.color }}
            initial={{ height: 0 }}
            animate={inView ? { height: Math.round((TRACK * s.value) / 100) } : {}}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
          />
          <span className="font-mono text-xs text-text-muted">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Mini-Preview: Policy Stress-Test (Friction Gauge) ─────────── */
function StressTestPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  const gauges = [
    { label: 'US', score: 3.2, color: 'var(--stone-teal)' },
    { label: 'EU', score: 7.8, color: 'var(--silicon-amber)' },
  ]
  const divergence = (gauges[1].score - gauges[0].score).toFixed(1)

  return (
    <div ref={ref} className={`${PREVIEW_BOX} flex flex-col items-center justify-center gap-3`}>
      <div className="flex items-center gap-10">
        {gauges.map((gauge) => {
          const circumference = 2 * Math.PI * 28
          const dashOffset = circumference * (1 - gauge.score / 10)

          return (
            <div key={gauge.label} className="text-center">
              <div className="relative h-24 w-24">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="var(--surface-elevated)" strokeWidth="5" />
                  <motion.circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke={gauge.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={inView ? { strokeDashoffset: dashOffset } : {}}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-lg font-semibold text-text-primary">
                    {gauge.score}
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-text-muted">
                {gauge.label}
              </span>
            </div>
          )
        })}
      </div>
      <span className="font-mono text-xs text-text-muted">
        Divergence {divergence} pts
      </span>
    </div>
  )
}

/* ─── Tool Data ─────────────────────────────────────────────────── */
const tools = [
  {
    name: 'Supply Chain Mapper',
    scenario: 'A TSMC facility reports delays. You already know which products are exposed.',
    tagline: 'Visualise semiconductor chokepoints and trace upstream dependency in real time.',
    href: '/tools/supply-chain-mapper',
    accent: 'teal' as const,
    Preview: SupplyChainPreview,
    takeFurther: { label: 'Manufacturing Exposure Module', href: '/advisory' },
  },
  {
    name: 'Compliance Checker',
    scenario: 'Monday, 9:14am. The board asks: "Are we compliant?" You answer in 60 seconds.',
    tagline: 'Classify your AI systems against the EU AI Act \u2014 before your auditor does.',
    href: '/tools/compliance-checker',
    accent: 'amber' as const,
    Preview: CompliancePreview,
    takeFurther: { label: 'AI Act Compliance Toolkit (\u00a379)', href: '/products' },
  },
  {
    name: 'Scenario Modeler',
    scenario: 'The CFO wants three futures modelled by Thursday. You have them by lunch.',
    tagline: 'Compare strategic outcomes under competing geopolitical scenarios.',
    href: '/tools/scenario-modeler',
    accent: 'amber' as const,
    Preview: ScenarioPreview,
    takeFurther: { label: 'Scenario Impact Analysis', href: '/advisory' },
  },
  {
    name: 'Policy Stress-Test',
    scenario: 'New US export controls drop. You score the friction against EU operations in minutes.',
    tagline: 'Measure regulatory divergence between US and EU policy positions.',
    href: '/tools/policy-stress-test',
    accent: 'teal' as const,
    Preview: StressTestPreview,
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
            {tools.map((tool) => {
              const Preview = tool.Preview
              return (
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
                    <div className="rounded-md bg-slate-deep/50 border border-border-subtle/50 mb-4 overflow-hidden">
                      <Preview />
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
              )
            })}
          </div>
        </StaggerContainer>
      </div>
    </section>
  )
}
