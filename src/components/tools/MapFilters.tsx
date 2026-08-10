'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  NODE_TYPE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  type NodeType,
  type RiskLevel,
} from '@/lib/supply-chain-data'
import { Eye, EyeOff, RotateCcw, Layers, AlertTriangle } from 'lucide-react'

interface MapFiltersProps {
  activeNodeTypes: NodeType[]
  activeRiskLevels: RiskLevel[]
  showConnections: boolean
  onToggleNodeType: (type: NodeType) => void
  onToggleRiskLevel: (level: RiskLevel) => void
  onToggleConnections: () => void
  onReset: () => void
}

export function MapFilters({
  activeNodeTypes,
  activeRiskLevels,
  showConnections,
  onToggleNodeType,
  onToggleRiskLevel,
  onToggleConnections,
  onReset,
}: MapFiltersProps) {
  const allTypesActive = activeNodeTypes.length === NODE_TYPE_OPTIONS.length
  const allRisksActive = activeRiskLevels.length === RISK_LEVEL_OPTIONS.length

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-stone-charcoal/95 backdrop-blur-sm border border-border-subtle rounded-lg p-4 space-y-4"
    >
      {/* Node Types */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-stone-teal" />
          <span className="text-xs font-mono text-stone-teal uppercase">Node Types</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {NODE_TYPE_OPTIONS.map(({ value, label, color }) => {
            const isActive = activeNodeTypes.includes(value)
            return (
              <button
                key={value}
                onClick={() => onToggleNodeType(value)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
                  transition-all duration-200 border
                  ${isActive
                    ? 'bg-surface-elevated border-border-subtle text-text-primary'
                    : 'bg-transparent border-transparent text-text-muted opacity-50 hover:opacity-75'
                  }
                `}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Risk Levels */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-silicon-amber-strong" />
          <span className="text-xs font-mono text-silicon-amber-strong uppercase">Risk Level</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {RISK_LEVEL_OPTIONS.map(({ value, label, color }) => {
            const isActive = activeRiskLevels.includes(value)
            return (
              <button
                key={value}
                onClick={() => onToggleRiskLevel(value)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
                  transition-all duration-200 border
                  ${isActive
                    ? 'bg-surface-elevated border-border-subtle text-text-primary'
                    : 'bg-transparent border-transparent text-text-muted opacity-50 hover:opacity-75'
                  }
                `}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Connections Toggle & Reset */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
        <button
          onClick={onToggleConnections}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
            transition-all duration-200 border
            ${showConnections
              ? 'bg-stone-teal/20 border-stone-teal/40 text-stone-teal'
              : 'bg-transparent border-border-subtle text-text-muted hover:text-text-primary'
            }
          `}
        >
          {showConnections ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          Connections
        </button>

        {(!allTypesActive || !allRisksActive || !showConnections) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-text-muted hover:text-text-primary h-auto py-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// Compact legend for the map
export function MapLegend() {
  return (
    <div className="bg-stone-charcoal/95 backdrop-blur-sm border border-border-subtle rounded-lg p-3 text-xs text-text-muted space-y-2">
      <div className="font-mono text-stone-teal uppercase text-[12px] mb-1">Legend</div>

      <div className="space-y-1">
        <div className="text-[12px] text-text-muted mb-1">Node Types</div>
        {NODE_TYPE_OPTIONS.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full border border-white/50"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="pt-1 border-t border-border-subtle space-y-1">
        <div className="text-[12px] text-text-muted mb-1">Risk Level (Ring)</div>
        {RISK_LEVEL_OPTIONS.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full border-2"
              style={{ borderColor: color, backgroundColor: 'transparent' }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
