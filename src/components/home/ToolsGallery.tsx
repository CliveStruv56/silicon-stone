'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

/* ─── Mini-Preview: Compliance Checker (Decision Tree) ──────────── */
function CompliancePreview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  const nodes = [
    { label: 'AI System', x: 50, y: 10, color: 'var(--text-muted)' },
    { label: 'Prohibited', x: 10, y: 55, color: 'var(--alert-red)' },
    { label: 'High-Risk', x: 37, y: 55, color: 'var(--silicon-amber)' },
    { label: 'Limited', x: 63, y: 55, color: 'var(--stone-teal)' },
    { label: 'Minimal', x: 90, y: 55, color: 'var(--tier-pulse)' },
  ]

  return (
    <div ref={ref} className="relative h-32 overflow-hidden">
      <svg viewBox="0 0 100 70" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Connection lines */}
        {[10, 37, 63, 90].map((x, i) => (
          <motion.line
            key={x}
            x1="50" y1="18" x2={x} y2="48"
            stroke="var(--border-subtle)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 0.6 } : {}}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
          />
        ))}
        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.label}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3, delay: i === 0 ? 0.2 : 0.6 + i * 0.1 }}
          >
            <rect
              x={node.x - 12} y={node.y - 6}
              width="24" height="12" rx="2"
              fill="var(--stone-charcoal)"
              stroke={node.color}
              strokeWidth="0.5"
            />
            <text
              x={node.x} y={node.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={node.color}
              fontSize="3"
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

/* ─── Mini-Preview: Supply Chain Map (SVG World) ────────────────── */
function SupplyChainPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  const chokepoints = [
    { label: 'USA', x: 22, y: 35, color: 'var(--silicon-amber)' },
    { label: 'NLD', x: 48, y: 28, color: 'var(--stone-teal)' },
    { label: 'DEU', x: 52, y: 30, color: 'var(--stone-teal)' },
    { label: 'TWN', x: 78, y: 42, color: 'var(--alert-red)' },
    { label: 'KOR', x: 80, y: 34, color: 'var(--silicon-amber)' },
  ]

  const connections = [
    [22, 35, 48, 28],
    [48, 28, 78, 42],
    [78, 42, 80, 34],
    [80, 34, 52, 30],
    [52, 30, 22, 35],
  ]

  return (
    <div ref={ref} className="relative h-32 overflow-hidden">
      <svg viewBox="0 0 100 65" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Simplified continent outlines */}
        <ellipse cx="25" cy="35" rx="18" ry="14" fill="none" stroke="var(--border-subtle)" strokeWidth="0.3" opacity="0.3" />
        <ellipse cx="50" cy="30" rx="12" ry="16" fill="none" stroke="var(--border-subtle)" strokeWidth="0.3" opacity="0.3" />
        <ellipse cx="78" cy="38" rx="16" ry="14" fill="none" stroke="var(--border-subtle)" strokeWidth="0.3" opacity="0.3" />

        {/* Connection lines */}
        {connections.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--stone-teal)"
            strokeWidth="0.3"
            strokeDasharray="2 1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 0.4 } : {}}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.15 }}
          />
        ))}

        {/* Chokepoint nodes */}
        {chokepoints.map((node, i) => (
          <motion.g
            key={node.label}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
          >
            {/* Pulse ring */}
            <motion.circle
              cx={node.x} cy={node.y} r="3"
              fill="none" stroke={node.color} strokeWidth="0.3"
              initial={{ r: 1.5, opacity: 0.8 }}
              animate={inView ? { r: 4, opacity: 0 } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
            <circle cx={node.x} cy={node.y} r="1.5" fill={node.color} />
            <text
              x={node.x} y={node.y + 5}
              textAnchor="middle"
              fill={node.color}
              fontSize="2.5"
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

  return (
    <div ref={ref} className="h-32 flex items-end justify-center gap-4 px-4 pb-2">
      {scenarios.map((s, i) => (
        <div key={s.label} className="flex flex-col items-center gap-1 flex-1">
          <motion.div
            className="w-full rounded-t"
            style={{ backgroundColor: s.color }}
            initial={{ height: 0 }}
            animate={inView ? { height: `${s.value}%` } : {}}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
          />
          <span className="font-mono text-[9px] text-text-muted">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Mini-Preview: Policy Stress-Test (Friction Gauge) ─────────── */
function StressTestPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <div ref={ref} className="h-32 flex items-center justify-center gap-6">
      {[
        { label: 'US', score: 3.2, color: 'var(--stone-teal)' },
        { label: 'EU', score: 7.8, color: 'var(--silicon-amber)' },
      ].map((gauge) => {
        const circumference = 2 * Math.PI * 28
        const dashOffset = circumference * (1 - gauge.score / 10)

        return (
          <div key={gauge.label} className="text-center">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--surface-elevated)" strokeWidth="4" />
                <motion.circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke={gauge.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={inView ? { strokeDashoffset: dashOffset } : {}}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-xs text-text-primary">{gauge.score}</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-text-muted">{gauge.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Tool Data ─────────────────────────────────────────────────── */
const tools = [
  {
    name: 'Compliance Checker',
    tagline: 'Know your AI Act risk classification in 60 seconds',
    href: '/tools/compliance-checker',
    color: 'silicon-amber' as const,
    Preview: CompliancePreview,
  },
  {
    name: 'Supply Chain Mapper',
    tagline: 'Visualise semiconductor chokepoints before they hit your operations',
    href: '/tools/supply-chain-mapper',
    color: 'stone-teal' as const,
    Preview: SupplyChainPreview,
  },
  {
    name: 'Scenario Modeler',
    tagline: 'Compare strategic outcomes under three geopolitical futures',
    href: '/tools/scenario-modeler',
    color: 'silicon-amber' as const,
    Preview: ScenarioPreview,
  },
  {
    name: 'Policy Stress-Test',
    tagline: 'Score the regulatory friction between US and EU approaches',
    href: '/tools/policy-stress-test',
    color: 'stone-teal' as const,
    Preview: StressTestPreview,
  },
]

/* ─── Main Component ────────────────────────────────────────────── */
export function ToolsGallery() {
  return (
    <section aria-labelledby="tools-heading" className="bg-stone-charcoal/50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <StaggerContainer>
          <StaggerItem>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber font-mono text-xs">
                Immediate Wins
              </Badge>
              <h2 id="tools-heading" className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                Your Execution Toolkit
              </h2>
              <p className="text-lg text-text-muted">
                Transform analysis into action. Four tools that deliver value in your first session.
              </p>
            </div>
          </StaggerItem>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tools.map((tool) => {
              const Preview = tool.Preview
              return (
                <StaggerItem key={tool.name}>
                  <Link href={tool.href} className="block h-full">
                    <ForensicCard
                      accent={tool.color === 'silicon-amber' ? 'amber' : 'teal'}
                      showMarkers={true}
                      gridHover={true}
                      delay={0}
                      className="h-full cursor-pointer"
                    >
                      {/* Mini preview */}
                      <div className="rounded-md bg-slate-deep/50 border border-border-subtle/50 mb-4 overflow-hidden">
                        <Preview />
                      </div>

                      {/* Tool info */}
                      <h3 className="text-lg font-semibold text-text-primary mb-1">{tool.name}</h3>
                      <p className="text-sm text-text-muted mb-4">{tool.tagline}</p>

                      {/* CTA */}
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${tool.color === 'silicon-amber' ? 'text-silicon-amber' : 'text-stone-teal'}`}>
                        <span>Launch Tool</span>
                        <ArrowRight className="w-4 h-4" />
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
