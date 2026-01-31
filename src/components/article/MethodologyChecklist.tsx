'use client'

import Link from 'next/link'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

type MethodologyPillar = 'supply-chain-forensics' | 'policy-stress-testing' | 'scenario-modeling' | 'signal-filtering'

interface MethodologyChecklistProps {
  pillars?: string[]
  variant?: 'compact' | 'expanded'
  className?: string
}

const PILLAR_DATA: Record<MethodologyPillar, { label: string; description: string; anchor: string }> = {
  'supply-chain-forensics': {
    label: 'Supply Chain Forensics',
    description: 'Neon/Lithography Chokepoints',
    anchor: 'supply-chain-forensics',
  },
  'policy-stress-testing': {
    label: 'Policy Stress-Testing',
    description: 'Atlantic Drift Model',
    anchor: 'policy-stress-testing',
  },
  'scenario-modeling': {
    label: 'Scenario Modeling',
    description: 'Drift & Disruption Scenarios',
    anchor: 'scenario-modeling',
  },
  'signal-filtering': {
    label: 'Signal Filtering',
    description: '30-Year Cycle Benchmark',
    anchor: 'experience-led-filtering',
  },
}

const PILLAR_ORDER: MethodologyPillar[] = [
  'supply-chain-forensics',
  'policy-stress-testing',
  'scenario-modeling',
  'signal-filtering',
]

export function MethodologyChecklist({
  pillars = [],
  variant = 'compact',
  className,
}: MethodologyChecklistProps) {
  const appliedPillars = new Set(pillars)

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'glass-plate tech-corners rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="font-ui-mono text-silicon-cyan text-xs">Methodology Audit</span>
        </div>
        <ul className="space-y-2">
          {PILLAR_ORDER.map((pillarKey) => {
            const pillar = PILLAR_DATA[pillarKey]
            const isApplied = appliedPillars.has(pillarKey)

            return (
              <li key={pillarKey} className="flex items-center gap-2">
                {isApplied ? (
                  <Check className="h-4 w-4 text-silicon-amber flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-stone-teal/40 flex-shrink-0" />
                )}
                <Link
                  href={`/methodology#${pillar.anchor}`}
                  className={cn(
                    'text-sm transition-colors hover:text-silicon-cyan',
                    isApplied ? 'text-text-primary' : 'text-text-muted/60'
                  )}
                >
                  {pillar.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  // Expanded variant
  return (
    <div
      className={cn(
        'glass-plate tech-corners rounded-lg p-6 border border-border-subtle',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="font-ui-mono text-silicon-cyan">Methodology Audit</span>
      </div>
      <ul className="space-y-4">
        {PILLAR_ORDER.map((pillarKey) => {
          const pillar = PILLAR_DATA[pillarKey]
          const isApplied = appliedPillars.has(pillarKey)

          return (
            <li key={pillarKey} className="flex items-start gap-3">
              <div className="mt-0.5">
                {isApplied ? (
                  <div className="w-5 h-5 rounded bg-silicon-amber/20 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-silicon-amber" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded border border-stone-teal/30 flex items-center justify-center">
                    <Circle className="h-3 w-3 text-stone-teal/40" />
                  </div>
                )}
              </div>
              <div>
                <Link
                  href={`/methodology#${pillar.anchor}`}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-silicon-cyan',
                    isApplied ? 'text-text-primary' : 'text-text-muted/60'
                  )}
                >
                  {pillar.label}
                </Link>
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    isApplied ? 'text-text-muted' : 'text-text-muted/40'
                  )}
                >
                  {pillar.description}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {appliedPillars.size > 0 && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <p className="text-xs text-text-muted">
            {appliedPillars.size} of {PILLAR_ORDER.length} analytical lenses applied
          </p>
        </div>
      )}
    </div>
  )
}
