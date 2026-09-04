'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { CopyMarkdownButton } from '@/components/tools/CopyMarkdownButton'
import { ToolSubscribeCard } from '@/components/tools/ToolSubscribeCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_EXPOSURE_PROFILE,
  SCENARIOS,
  FRICTION_COLORS,
  SEVERITY_COLORS,
  SEVERITY_TEXT_COLORS,
  getAdjustedBoardBrief,
  getAdjustedImpacts,
  getExposureBand,
  getExposureMultiplier,
  getMaxImpactValue,
} from '@/lib/scenario-data'
import { scenarioModelerMarkdown, scenarioCompareMarkdown } from '@/lib/tools-markdown'
import type {
  ExposureDependency,
  ExposureGeography,
  ExposureProfile,
  ExposureSector,
  Scenario,
  SectorImpact,
  SourcingFlexibility,
} from '@/types/scenario'
import {
  AlertTriangle,
  TrendingDown,
  ChevronRight,
  Clock,
  Target,
  Shield,
  Eye,
  ArrowRight,
  BriefcaseBusiness,
  Gauge,
  Layers,
  MapPin,
  Radar,
  GitCompareArrows,
  X,
} from 'lucide-react'

const SECTOR_OPTIONS: Array<{ value: ExposureSector; label: string }> = [
  { value: 'industrial', label: 'Industrial' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'ai-cloud', label: 'AI / Cloud' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'consumer-tech', label: 'Consumer Tech' },
]

const GEOGRAPHY_OPTIONS: Array<{ value: ExposureGeography; label: string }> = [
  { value: 'europe', label: 'Europe' },
  { value: 'north-america', label: 'North America' },
  { value: 'asia', label: 'Asia' },
  { value: 'global', label: 'Global' },
]

const DEPENDENCY_OPTIONS: Array<{ value: ExposureDependency; label: string }> = [
  { value: 'advanced-chips', label: 'Advanced chips' },
  { value: 'cloud-ai', label: 'Cloud / AI compute' },
  { value: 'regulated-ai', label: 'Regulated AI' },
  { value: 'connected-products', label: 'Connected products' },
  { value: 'data-services', label: 'Data services' },
]

const SOURCING_OPTIONS: Array<{ value: SourcingFlexibility; label: string }> = [
  { value: 'single-source', label: 'Single-source' },
  { value: 'dual-source', label: 'Dual-source' },
  { value: 'diversified', label: 'Diversified' },
]

const SCENARIO_OPTIONS = SCENARIOS.map(scenario => ({
  value: scenario.id,
  label: scenario.name,
}))

// Impact bar chart component
function ImpactChart({ impacts, maxValue }: { impacts: SectorImpact[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {impacts.map((impact, idx) => {
        const percentage = (impact.valueNumeric / maxValue) * 100
        return (
          <motion.div
            key={impact.sector}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-text-primary font-medium">{impact.sector}</span>
              <span
                className="text-sm font-mono font-bold"
                style={{ color: SEVERITY_TEXT_COLORS[impact.severity] }}
              >
                {impact.valueAtStake}
              </span>
            </div>
            <div className="h-6 bg-surface-elevated rounded overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                className="h-full rounded"
                style={{ backgroundColor: SEVERITY_COLORS[impact.severity] }}
              />
              <div className="absolute inset-0 flex items-center px-2">
                <span className="text-xs text-white/90 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {impact.description}
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Cascade flow diagram component
function CascadeFlow({ cascade }: { cascade: Scenario['cascade'] }) {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 bg-alert-red/10 border border-alert-red/30 rounded-lg p-4"
      >
        <div className="text-xs font-mono text-alert-red uppercase mb-2">Primary</div>
        <p className="text-sm text-text-primary">{cascade.primary}</p>
      </motion.div>

      <div className="hidden md:flex items-center justify-center">
        <ArrowRight className="w-6 h-6 text-text-muted" />
      </div>
      <div className="md:hidden flex justify-center">
        <ChevronRight className="w-6 h-6 text-text-muted rotate-90" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 bg-silicon-amber/10 border border-silicon-amber/30 rounded-lg p-4"
      >
        <div className="text-xs font-mono text-silicon-amber-strong uppercase mb-2">Secondary</div>
        <p className="text-sm text-text-primary">{cascade.secondary}</p>
      </motion.div>

      <div className="hidden md:flex items-center justify-center">
        <ArrowRight className="w-6 h-6 text-text-muted" />
      </div>
      <div className="md:hidden flex justify-center">
        <ChevronRight className="w-6 h-6 text-text-muted rotate-90" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-1 bg-stone-teal/10 border border-stone-teal/30 rounded-lg p-4"
      >
        <div className="text-xs font-mono text-stone-teal uppercase mb-2">Tertiary</div>
        <p className="text-sm text-text-primary">{cascade.tertiary}</p>
      </motion.div>
    </div>
  )
}

function ProfileSelect<T extends string>({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string
  icon: typeof BriefcaseBusiness
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs text-text-muted mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-md border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-stone-teal"
      >
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-slate-deep text-text-primary">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function useScenarioDerived(scenarioId: string | null, profile: ExposureProfile) {
  const scenario = useMemo(() => {
    if (!scenarioId) return null
    return SCENARIOS.find(s => s.id === scenarioId) ?? null
  }, [scenarioId])

  const exposureMultiplier = useMemo(() => {
    return scenario ? getExposureMultiplier(scenario, profile) : 1
  }, [scenario, profile])

  const exposureBand = useMemo(() => getExposureBand(exposureMultiplier), [exposureMultiplier])

  const adjustedImpacts = useMemo(() => {
    return scenario ? getAdjustedImpacts(scenario, profile) : []
  }, [scenario, profile])

  const totalValueAtStake = useMemo(() => {
    const total = adjustedImpacts.reduce((sum, i) => sum + i.valueNumeric, 0)
    return `€${total}B`
  }, [adjustedImpacts])

  const boardBrief = useMemo(() => {
    return scenario ? getAdjustedBoardBrief(scenario, profile) : null
  }, [scenario, profile])

  return { scenario, exposureMultiplier, exposureBand, adjustedImpacts, totalValueAtStake, boardBrief }
}

export default function ScenarioModelerPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id)
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>(null)
  const [exposureProfile, setExposureProfile] = useState<ExposureProfile>(DEFAULT_EXPOSURE_PROFILE)

  const primary = useScenarioDerived(selectedScenarioId, exposureProfile)
  const secondary = useScenarioDerived(compareScenarioId, exposureProfile)

  const selectedScenario = primary.scenario ?? SCENARIOS[0]
  const exposureMultiplier = primary.exposureMultiplier
  const exposureBand = primary.exposureBand
  const adjustedImpacts = primary.adjustedImpacts
  const totalValueAtStake = primary.totalValueAtStake
  const adjustedBoardBrief = primary.boardBrief ?? selectedScenario.boardBrief

  const maxImpactValue = useMemo(() => {
    const all = [...adjustedImpacts, ...secondary.adjustedImpacts]
    return Math.max(getMaxImpactValue(), ...all.map(impact => impact.valueNumeric))
  }, [adjustedImpacts, secondary.adjustedImpacts])

  const compareOptions = useMemo(() => {
    return SCENARIOS
      .filter(s => s.id !== selectedScenarioId)
      .map(s => ({ value: s.id, label: s.name }))
  }, [selectedScenarioId])

  const updateExposureProfile = <K extends keyof ExposureProfile>(
    key: K,
    value: ExposureProfile[K]
  ) => {
    setExposureProfile(current => ({ ...current, [key]: value }))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle py-10 md:py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
              Interactive Tool
            </Badge>
            <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-4">
              Scenario Modeler
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Explore geopolitical futures and their impact on technology value chains.
              Select a scenario to analyse sector-by-sector exposure and cascade effects.
            </p>
          </div>
        </section>

        {/* Scenario Selector */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {SCENARIOS.map((scenario) => {
              const isSelected = selectedScenarioId === scenario.id
              const colors = FRICTION_COLORS[scenario.frictionLevel]

              return (
                <button
                  type="button"
                  key={scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  aria-pressed={isSelected}
                  className={`
                    cursor-pointer text-left p-4 rounded-lg border transition-all duration-200
                    ${isSelected
                      ? `${colors.bg} ${colors.border} ring-2 ring-stone-teal ring-offset-2 ring-offset-background`
                      : 'bg-stone-charcoal border-border-subtle hover:border-stone-teal/50'
                    }
                  `}
                >
                  <Badge
                    variant="outline"
                    className={`mb-2 text-[12px] ${colors.text} ${colors.border}`}
                  >
                    {scenario.frictionLevel.toUpperCase()} FRICTION
                  </Badge>
                  <h3 className={`font-semibold ${isSelected ? colors.text : 'text-text-primary'}`}>
                    {scenario.shortName}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">
                    {scenario.triggerEvent}
                  </p>
                </button>
              )
            })}
          </div>

          <Card className="bg-stone-charcoal border-border-subtle mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                <Target className="w-5 h-5 text-silicon-amber-strong" />
                Selected Scenario
              </CardTitle>
              <CardDescription>
                Use the dropdown if the scenario cards are awkward on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 items-start">
                <ProfileSelect
                  label="Scenario"
                  icon={Target}
                  value={selectedScenarioId}
                  options={SCENARIO_OPTIONS}
                  onChange={setSelectedScenarioId}
                />
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={`${FRICTION_COLORS[selectedScenario.frictionLevel].text} ${FRICTION_COLORS[selectedScenario.frictionLevel].border}`}
                    >
                      {selectedScenario.frictionLevel.toUpperCase()} FRICTION
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {selectedScenario.timeframe} | Base probability {selectedScenario.probability}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-text-primary mb-1">
                    {selectedScenario.name}
                  </h2>
                  <p className="text-sm text-text-muted">
                    {selectedScenario.triggerEvent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-charcoal border-border-subtle mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                <GitCompareArrows className="w-5 h-5 text-silicon-amber-strong" />
                Compare a second scenario
              </CardTitle>
              <CardDescription>
                Optional. Pick another scenario to see both under the same exposure lens, side by side.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={compareScenarioId ?? ''}
                  onChange={(event) => setCompareScenarioId(event.target.value || null)}
                  className="h-10 flex-1 rounded-md border border-border-subtle bg-surface-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-silicon-amber"
                >
                  <option value="">No comparison</option>
                  {compareOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {compareScenarioId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCompareScenarioId(null)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                    Clear comparison
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-charcoal border-border-subtle mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                <Gauge className="w-5 h-5 text-stone-teal" />
                Exposure Lens
              </CardTitle>
              <CardDescription>
                Adjust the scenario around a specific operating context. This changes the exposure estimate and board brief, not the base geopolitical assumption.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProfileSelect
                  label="Sector"
                  icon={BriefcaseBusiness}
                  value={exposureProfile.sector}
                  options={SECTOR_OPTIONS}
                  onChange={(value) => updateExposureProfile('sector', value)}
                />
                <ProfileSelect
                  label="Geography"
                  icon={MapPin}
                  value={exposureProfile.geography}
                  options={GEOGRAPHY_OPTIONS}
                  onChange={(value) => updateExposureProfile('geography', value)}
                />
                <ProfileSelect
                  label="Dependency"
                  icon={Layers}
                  value={exposureProfile.dependency}
                  options={DEPENDENCY_OPTIONS}
                  onChange={(value) => updateExposureProfile('dependency', value)}
                />
                <ProfileSelect
                  label="Sourcing"
                  icon={Radar}
                  value={exposureProfile.sourcing}
                  options={SOURCING_OPTIONS}
                  onChange={(value) => updateExposureProfile('sourcing', value)}
                />
              </div>
            </CardContent>
          </Card>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedScenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Scenario Details Header */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Scenario Overview */}
                <Card className="lg:col-span-1 bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge
                        variant="outline"
                        className={`${FRICTION_COLORS[selectedScenario.frictionLevel].text} ${FRICTION_COLORS[selectedScenario.frictionLevel].border}`}
                      >
                        {selectedScenario.frictionLevel.toUpperCase()} FRICTION
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl text-text-primary mt-2">
                      {selectedScenario.name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {selectedScenario.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
                        <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                          <Clock className="w-3 h-3" />
                          Timeframe
                        </div>
                        <span className="text-text-primary font-medium">{selectedScenario.timeframe}</span>
                      </div>
                      <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
                        <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                          <Target className="w-3 h-3" />
                          Base Probability
                        </div>
                        <span className="text-text-primary font-medium">{selectedScenario.probability}</span>
                      </div>
                    </div>

                    <div className="bg-surface-elevated rounded-lg p-4 border border-border-subtle">
                      <div className="flex items-center gap-2 text-xs text-text-muted uppercase mb-2">
                        <AlertTriangle className="w-3 h-3" />
                        Trigger Event
                      </div>
                      <p className="text-text-primary text-sm">{selectedScenario.triggerEvent}</p>
                    </div>

                    <div className={`rounded-lg p-4 border ${FRICTION_COLORS[selectedScenario.frictionLevel].bg} ${FRICTION_COLORS[selectedScenario.frictionLevel].border}`}>
                      <div className="flex items-center gap-2 text-xs uppercase mb-2">
                        <TrendingDown className={`w-3 h-3 ${FRICTION_COLORS[selectedScenario.frictionLevel].text}`} />
                        <span className={FRICTION_COLORS[selectedScenario.frictionLevel].text}>Profile-Adjusted Value at Stake</span>
                      </div>
                      <p className={`text-3xl font-bold ${FRICTION_COLORS[selectedScenario.frictionLevel].text}`}>
                        {totalValueAtStake}
                      </p>
                      <p className="text-xs text-text-muted mt-2">
                        {exposureBand} exposure lens x{exposureMultiplier.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Impact Chart */}
                <Card className="lg:col-span-2 bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-silicon-amber-strong" />
                      Sector Impact Analysis
                    </CardTitle>
                    <CardDescription>
                      Value at stake by sector, adjusted by the selected exposure lens. Hover for details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImpactChart impacts={adjustedImpacts} maxValue={maxImpactValue} />
                    <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-border-subtle text-xs text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS.severe }} />
                        Severe
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS.negative }} />
                        Negative
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS.neutral }} />
                        Neutral
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS.positive }} />
                        Positive
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Board Brief */}
              <Card className="bg-stone-charcoal border-border-subtle">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                    <BriefcaseBusiness className="w-5 h-5 text-silicon-amber-strong" />
                    Board Brief
                  </CardTitle>
                  <CardDescription>
                    Decision summary for the selected scenario and exposure lens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface-elevated rounded-lg border border-border-subtle p-4">
                      <div className="text-xs font-mono text-alert-red uppercase mb-2">First Impact</div>
                      <p className="text-sm text-text-primary">{adjustedBoardBrief.firstImpact}</p>
                    </div>
                    <div className="bg-surface-elevated rounded-lg border border-border-subtle p-4">
                      <div className="text-xs font-mono text-silicon-amber-strong uppercase mb-2">90-Day Action</div>
                      <p className="text-sm text-text-primary">{adjustedBoardBrief.ninetyDayAction}</p>
                    </div>
                    <div className="bg-surface-elevated rounded-lg border border-border-subtle p-4">
                      <div className="text-xs font-mono text-stone-teal uppercase mb-2">12-Month Hedge</div>
                      <p className="text-sm text-text-primary">{adjustedBoardBrief.twelveMonthHedge}</p>
                    </div>
                    <div className="bg-surface-elevated rounded-lg border border-border-subtle p-4">
                      <div className="text-xs font-mono text-text-muted uppercase mb-2">Escalate When</div>
                      <p className="text-sm text-text-primary">{adjustedBoardBrief.escalationTrigger}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cascade Effects */}
              <Card className="bg-stone-charcoal border-border-subtle">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-alert-red" />
                    Cascade Effects
                  </CardTitle>
                  <CardDescription>
                    How the initial shock propagates through the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CascadeFlow cascade={selectedScenario.cascade} />
                </CardContent>
              </Card>

              {/* Key Indicators and Mitigation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                      <Eye className="w-5 h-5 text-stone-teal" />
                      Early Warning Indicators
                    </CardTitle>
                    <CardDescription>
                      Signals to monitor for this scenario
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {selectedScenario.keyIndicators.map((indicator, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-3 text-text-primary"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-teal mt-2 flex-shrink-0" />
                          <span className="text-sm">{indicator}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                      <Shield className="w-5 h-5 text-silicon-amber-strong" />
                      Mitigation Options
                    </CardTitle>
                    <CardDescription>
                      Strategic responses to reduce exposure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {selectedScenario.mitigationOptions.map((option, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-3 text-text-primary"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-silicon-amber mt-2 flex-shrink-0" />
                          <span className="text-sm">{option}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Evidence Notes */}
              <Card className="bg-stone-charcoal border-border-subtle">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                    <Target className="w-5 h-5 text-stone-teal" />
                    Why This Matters Now
                  </CardTitle>
                  <CardDescription>
                    Current assumptions behind this scenario. Confidence: {selectedScenario.confidence}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedScenario.evidenceNotes.map((note, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-surface-elevated rounded-lg border border-border-subtle p-4"
                      >
                        <div className="text-xs font-mono text-text-muted uppercase mb-2">Evidence</div>
                        <p className="text-sm text-text-primary mb-3">{note.fact}</p>
                        <div className="text-xs font-mono text-silicon-amber-strong uppercase mb-2">Implication</div>
                        <p className="text-sm text-text-muted">{note.implication}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comparison */}
              {secondary.scenario && (
                <Card className="bg-stone-charcoal border-silicon-amber/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                      <GitCompareArrows className="w-5 h-5 text-silicon-amber-strong" />
                      {selectedScenario.shortName} vs {secondary.scenario.shortName}
                    </CardTitle>
                    <CardDescription>
                      Both scenarios under the same exposure lens. Numbers are profile-adjusted.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border-subtle">
                            <th className="p-3 text-left text-xs uppercase tracking-wider text-text-muted font-medium"></th>
                            <th className="p-3 text-left text-xs uppercase tracking-wider text-text-muted font-medium">
                              {selectedScenario.shortName}
                            </th>
                            <th className="p-3 text-left text-xs uppercase tracking-wider text-text-muted font-medium">
                              {secondary.scenario.shortName}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          <tr>
                            <td className="p-3 text-text-muted">Friction</td>
                            <td className="p-3 text-text-primary">{selectedScenario.frictionLevel.toUpperCase()}</td>
                            <td className="p-3 text-text-primary">{secondary.scenario.frictionLevel.toUpperCase()}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-text-muted">Timeframe</td>
                            <td className="p-3 text-text-primary">{selectedScenario.timeframe}</td>
                            <td className="p-3 text-text-primary">{secondary.scenario.timeframe}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-text-muted">Base probability</td>
                            <td className="p-3 text-text-primary">{selectedScenario.probability}</td>
                            <td className="p-3 text-text-primary">{secondary.scenario.probability}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-text-muted">Profile-adjusted value at stake</td>
                            <td className="p-3 font-mono text-silicon-amber-strong">{totalValueAtStake}</td>
                            <td className="p-3 font-mono text-silicon-amber-strong">{secondary.totalValueAtStake}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-text-muted">Exposure band</td>
                            <td className="p-3 text-text-primary">{exposureBand}</td>
                            <td className="p-3 text-text-primary">{secondary.exposureBand}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-text-muted align-top">First impact</td>
                            <td className="p-3 text-text-primary">{adjustedBoardBrief.firstImpact}</td>
                            <td className="p-3 text-text-primary">{secondary.boardBrief?.firstImpact}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-text-muted align-top">90-day action</td>
                            <td className="p-3 text-text-primary">{adjustedBoardBrief.ninetyDayAction}</td>
                            <td className="p-3 text-text-primary">{secondary.boardBrief?.ninetyDayAction}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-text-muted align-top">12-month hedge</td>
                            <td className="p-3 text-text-primary">{adjustedBoardBrief.twelveMonthHedge}</td>
                            <td className="p-3 text-text-primary">{secondary.boardBrief?.twelveMonthHedge}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-text-muted align-top">Escalate when</td>
                            <td className="p-3 text-text-primary">{adjustedBoardBrief.escalationTrigger}</td>
                            <td className="p-3 text-text-primary">{secondary.boardBrief?.escalationTrigger}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export + CTA */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center pt-6">
                <CopyMarkdownButton
                  toolName="Scenario Modeler"
                  filename={
                    secondary.scenario
                      ? `scenario-compare-${new Date().toISOString().slice(0, 10)}.md`
                      : `scenario-brief-${new Date().toISOString().slice(0, 10)}.md`
                  }
                  getMarkdown={() => {
                    const primaryArgs = {
                      scenario: selectedScenario,
                      profile: exposureProfile,
                      adjustedImpacts,
                      totalValueAtStake,
                      exposureMultiplier,
                      exposureBand,
                      boardBrief: adjustedBoardBrief,
                    }
                    if (secondary.scenario && secondary.boardBrief) {
                      return scenarioCompareMarkdown(primaryArgs, {
                        scenario: secondary.scenario,
                        profile: exposureProfile,
                        adjustedImpacts: secondary.adjustedImpacts,
                        totalValueAtStake: secondary.totalValueAtStake,
                        exposureMultiplier: secondary.exposureMultiplier,
                        exposureBand: secondary.exposureBand,
                        boardBrief: secondary.boardBrief,
                      })
                    }
                    return scenarioModelerMarkdown(primaryArgs)
                  }}
                />
                <Link href="/advisory/drift-retainer">
                  <Button className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                    Request Custom Scenario Analysis
                  </Button>
                </Link>
              </div>

              <ToolSubscribeCard tool="scenario-modeler" />
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <Footer />
    </div>
  )
}
