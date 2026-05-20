'use client'

import Link from 'next/link'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

type MatrixCell =
  | 'supply-chain-scenario-modelling'
  | 'supply-chain-long-memory-filter'
  | 'policy-scenario-modelling'
  | 'policy-long-memory-filter'
  | 'talent-scenario-modelling'
  | 'talent-long-memory-filter'

type Domain = 'Supply Chain' | 'Policy' | 'Talent'
type Method = 'Scenario Modelling' | 'Long-Memory Filter'

interface MethodologyChecklistProps {
  pillars?: string[]
  variant?: 'compact' | 'expanded'
  className?: string
}

interface CellMeta {
  label: string
  domain: Domain
  method: Method
  description: string
  anchor: string
}

const CELL_DATA: Record<MatrixCell, CellMeta> = {
  'supply-chain-scenario-modelling': {
    label: 'Supply Chain × Scenario Modelling',
    domain: 'Supply Chain',
    method: 'Scenario Modelling',
    description: 'Three-tier futures for the physical chokepoints',
    anchor: 'supply-chain-forensics',
  },
  'supply-chain-long-memory-filter': {
    label: 'Supply Chain × Long-Memory Filter',
    domain: 'Supply Chain',
    method: 'Long-Memory Filter',
    description: '30-year cycle pattern-match on the physical layer',
    anchor: 'supply-chain-forensics',
  },
  'policy-scenario-modelling': {
    label: 'Policy × Scenario Modelling',
    domain: 'Policy',
    method: 'Scenario Modelling',
    description: 'Low / Medium / High friction across regulatory regimes',
    anchor: 'policy-stress-testing',
  },
  'policy-long-memory-filter': {
    label: 'Policy × Long-Memory Filter',
    domain: 'Policy',
    method: 'Long-Memory Filter',
    description: '30-year regulatory precedent and enforcement drift',
    anchor: 'policy-stress-testing',
  },
  'talent-scenario-modelling': {
    label: 'Talent × Scenario Modelling',
    domain: 'Talent',
    method: 'Scenario Modelling',
    description: 'Capability-flow scenarios across the human layer',
    anchor: 'talent-capability-flow',
  },
  'talent-long-memory-filter': {
    label: 'Talent × Long-Memory Filter',
    domain: 'Talent',
    method: 'Long-Memory Filter',
    description: '30-year skill-density and migration cycles',
    anchor: 'talent-capability-flow',
  },
}

const CELL_ORDER: MatrixCell[] = [
  'supply-chain-scenario-modelling',
  'supply-chain-long-memory-filter',
  'policy-scenario-modelling',
  'policy-long-memory-filter',
  'talent-scenario-modelling',
  'talent-long-memory-filter',
]

const DOMAIN_ORDER: Domain[] = ['Supply Chain', 'Policy', 'Talent']
const METHOD_ORDER: Method[] = ['Scenario Modelling', 'Long-Memory Filter']

function isMatrixCell(value: string): value is MatrixCell {
  return value in CELL_DATA
}

// Legacy 4-lens slugs from before the 3 × 2 matrix migration.
// Maps each to the closest single new cell so historic articles render
// something meaningful. Backfill the underlying Sanity data to remove
// the need for this — see project_summary.md §10.
const LEGACY_PILLAR_MAP: Record<string, MatrixCell[]> = {
  'supply-chain-forensics': ['supply-chain-scenario-modelling'],
  'policy-stress-testing': ['policy-scenario-modelling'],
  'scenario-modeling': [
    'supply-chain-scenario-modelling',
    'policy-scenario-modelling',
    'talent-scenario-modelling',
  ],
  'signal-filtering': [
    'supply-chain-long-memory-filter',
    'policy-long-memory-filter',
    'talent-long-memory-filter',
  ],
}

function normalisePillars(input: string[]): MatrixCell[] {
  const out = new Set<MatrixCell>()
  for (const value of input) {
    if (isMatrixCell(value)) {
      out.add(value)
      continue
    }
    const mapped = LEGACY_PILLAR_MAP[value]
    if (mapped) {
      for (const cell of mapped) out.add(cell)
    }
  }
  return Array.from(out)
}

export function MethodologyChecklist({
  pillars = [],
  variant = 'compact',
  className,
}: MethodologyChecklistProps) {
  const appliedCells = new Set(normalisePillars(pillars))

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'glass-plate tech-corners rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="font-ui-mono text-silicon-cyan text-xs">
            Methodology Audit
          </span>
          <span className="font-ui-mono text-text-muted/60 text-[10px]">
            3 × 2 matrix
          </span>
        </div>
        <ul className="space-y-2">
          {CELL_ORDER.map((cellKey) => {
            const cell = CELL_DATA[cellKey]
            const isApplied = appliedCells.has(cellKey)

            return (
              <li key={cellKey} className="flex items-center gap-2">
                {isApplied ? (
                  <Check className="h-4 w-4 text-silicon-amber flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-stone-teal/40 flex-shrink-0" />
                )}
                <Link
                  href={`/methodology#${cell.anchor}`}
                  className={cn(
                    'text-sm transition-colors hover:text-silicon-cyan',
                    isApplied ? 'text-text-primary' : 'text-text-muted/60'
                  )}
                >
                  {cell.label}
                </Link>
              </li>
            )
          })}
        </ul>
        {appliedCells.size > 0 && (
          <p className="text-xs text-text-muted mt-3">
            {appliedCells.size} of {CELL_ORDER.length} cells applied
          </p>
        )}
      </div>
    )
  }

  // Expanded variant — render as a 3 × 2 matrix grid
  return (
    <div
      className={cn(
        'glass-plate tech-corners rounded-lg p-6 border border-border-subtle',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="font-ui-mono text-silicon-cyan">Methodology Audit</span>
        <span className="font-ui-mono text-text-muted/60 text-xs">
          3 forensic domains × 2 analytical methods
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 text-xs font-ui-mono text-text-muted uppercase tracking-wide w-1/4"></th>
              {METHOD_ORDER.map((method) => (
                <th
                  key={method}
                  className="text-left p-2 text-xs font-ui-mono text-text-muted uppercase tracking-wide"
                >
                  {method}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DOMAIN_ORDER.map((domain) => (
              <tr
                key={domain}
                className="border-t border-border-subtle/40"
              >
                <td className="p-2 text-sm font-medium text-text-primary align-top">
                  {domain}
                </td>
                {METHOD_ORDER.map((method) => {
                  const cellKey = CELL_ORDER.find(
                    (k) =>
                      CELL_DATA[k].domain === domain &&
                      CELL_DATA[k].method === method
                  )
                  if (!cellKey) return <td key={method} className="p-2" />
                  const cell = CELL_DATA[cellKey]
                  const isApplied = appliedCells.has(cellKey)

                  return (
                    <td key={method} className="p-2 align-top">
                      <div className="flex items-start gap-2">
                        {isApplied ? (
                          <div className="w-5 h-5 rounded bg-silicon-amber/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <Check className="h-3.5 w-3.5 text-silicon-amber" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border border-stone-teal/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <Circle className="h-3 w-3 text-stone-teal/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/methodology#${cell.anchor}`}
                            className={cn(
                              'text-xs font-medium transition-colors hover:text-silicon-cyan block',
                              isApplied
                                ? 'text-text-primary'
                                : 'text-text-muted/60'
                            )}
                          >
                            {method}
                          </Link>
                          <p
                            className={cn(
                              'text-[11px] mt-0.5 leading-snug',
                              isApplied
                                ? 'text-text-muted'
                                : 'text-text-muted/40'
                            )}
                          >
                            {cell.description}
                          </p>
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {appliedCells.size > 0 && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <p className="text-xs text-text-muted">
            {appliedCells.size} of {CELL_ORDER.length} matrix cells applied
          </p>
        </div>
      )}
    </div>
  )
}
