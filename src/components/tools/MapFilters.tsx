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

/**
 * A single unboxed row above the map: a word and a small icon per group, then
 * the toggles as plain text with a colour dot. It used to be a bordered card
 * with three stacked rows of pill buttons, which read as a second panel
 * competing with the map rather than the map's own controls.
 */
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
  const isFiltered = !allTypesActive || !allRisksActive || !showConnections

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs"
    >
      {/* Node Types */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        <span className="mr-1 flex items-center gap-1.5 font-mono uppercase tracking-wider text-stone-teal">
          <Layers className="w-3.5 h-3.5" aria-hidden />
          Node types
        </span>
        {NODE_TYPE_OPTIONS.map(({ value, label, color }) => (
          <FilterToggle
            key={value}
            label={label}
            color={color}
            active={activeNodeTypes.includes(value)}
            onClick={() => onToggleNodeType(value)}
          />
        ))}
      </div>

      {/* Risk Levels */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        <span className="mr-1 flex items-center gap-1.5 font-mono uppercase tracking-wider text-silicon-amber-strong">
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
          Risk
        </span>
        {RISK_LEVEL_OPTIONS.map(({ value, label, color }) => (
          <FilterToggle
            key={value}
            label={label}
            color={color}
            ring
            active={activeRiskLevels.includes(value)}
            onClick={() => onToggleRiskLevel(value)}
          />
        ))}
      </div>

      {/* Connections Toggle */}
      <button
        type="button"
        onClick={onToggleConnections}
        aria-pressed={showConnections}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors duration-200 ${
          showConnections
            ? 'text-stone-teal hover:text-stone-teal/80'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        {showConnections ? (
          <Eye className="w-3.5 h-3.5" aria-hidden />
        ) : (
          <EyeOff className="w-3.5 h-3.5" aria-hidden />
        )}
        Connections
      </button>

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto h-auto py-1 text-xs text-text-muted hover:text-text-primary"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden />
          Reset
        </Button>
      )}
    </motion.div>
  )
}

interface FilterToggleProps {
  label: string
  color: string
  active: boolean
  /** Risk levels are drawn on the map as a ring, so their dot is a ring too. */
  ring?: boolean
  onClick: () => void
}

function FilterToggle({ label, color, active, ring, onClick }: FilterToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors duration-200 ${
        active
          ? 'text-text-primary'
          : 'text-text-muted line-through decoration-text-muted/60 hover:text-text-primary'
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full transition-opacity ${ring ? 'border-2' : ''} ${active ? '' : 'opacity-40'}`}
        style={ring ? { borderColor: color } : { backgroundColor: color }}
      />
      {label}
    </button>
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
