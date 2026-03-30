'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { EmailGateOverlay } from '@/components/tools/EmailGateOverlay'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  SCENARIOS,
  FRICTION_COLORS,
  SEVERITY_COLORS,
  getMaxImpactValue,
} from '@/lib/scenario-data'
import type { Scenario, SectorImpact } from '@/types/scenario'
import {
  AlertTriangle,
  TrendingDown,
  ChevronRight,
  Clock,
  Target,
  Shield,
  Eye,
  ArrowRight,
} from 'lucide-react'

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
                style={{ color: SEVERITY_COLORS[impact.severity] }}
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
        <div className="text-xs font-mono text-silicon-amber uppercase mb-2">Secondary</div>
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

export default function ScenarioModelerPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0])
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showGate, setShowGate] = useState(false)

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario)
    if (!isUnlocked) {
      setShowGate(true)
    }
  }

  const handleGateUnlock = () => {
    setIsUnlocked(true)
    setShowGate(false)
  }

  const maxImpactValue = useMemo(() => getMaxImpactValue(), [])

  const totalValueAtStake = useMemo(() => {
    const total = selectedScenario.impacts.reduce((sum, i) => sum + i.valueNumeric, 0)
    return `€${total}B`
  }, [selectedScenario])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
              Interactive Tool
            </Badge>
            <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-4">
              Scenario Modeler
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Explore geopolitical futures and their impact on technology value chains.
              Select a scenario to analyze sector-by-sector exposure and cascade effects.
            </p>
          </div>
        </section>

        {/* Scenario Selector */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {SCENARIOS.map((scenario) => {
              const isSelected = selectedScenario.id === scenario.id
              const colors = FRICTION_COLORS[scenario.frictionLevel]

              return (
                <button
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className={`
                    text-left p-4 rounded-lg border transition-all duration-200
                    ${isSelected
                      ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-offset-background`
                      : 'bg-stone-charcoal border-border-subtle hover:border-stone-teal/50'
                    }
                  `}
                >
                  <Badge
                    variant="outline"
                    className={`mb-2 text-[10px] ${colors.text} ${colors.border}`}
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

          {!isUnlocked ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-deep/70 to-slate-deep z-10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-12 h-12 rounded-full bg-silicon-amber/10 border border-silicon-amber/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-silicon-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <p className="text-text-primary font-semibold mb-2">Select a scenario to unlock the full analysis</p>
                  <p className="text-text-muted text-sm">Click any scenario above to begin</p>
                </div>
              </div>
              <div className="blur-sm pointer-events-none opacity-40 space-y-6 min-h-[400px]">
                <div className="bg-stone-charcoal rounded-xl p-6 h-32" />
                <div className="bg-stone-charcoal rounded-xl p-6 h-48" />
                <div className="bg-stone-charcoal rounded-xl p-6 h-32" />
              </div>
            </div>
          ) : (
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
                          Probability
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
                        <span className={FRICTION_COLORS[selectedScenario.frictionLevel].text}>Total Value at Stake</span>
                      </div>
                      <p className={`text-3xl font-bold ${FRICTION_COLORS[selectedScenario.frictionLevel].text}`}>
                        {totalValueAtStake}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Impact Chart */}
                <Card className="lg:col-span-2 bg-stone-charcoal border-border-subtle">
                  <CardHeader>
                    <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-silicon-amber" />
                      Sector Impact Analysis
                    </CardTitle>
                    <CardDescription>
                      Value at stake by sector. Hover for details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImpactChart impacts={selectedScenario.impacts} maxValue={maxImpactValue} />
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
                      <Shield className="w-5 h-5 text-silicon-amber" />
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

              {/* CTA */}
              <div className="flex justify-center pt-6">
                <Link href="/services#contact">
                  <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
                    Request Custom Scenario Analysis
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
          )}
        </section>
      </main>

      <Footer />
      <EmailGateOverlay
        isOpen={showGate}
        onUnlock={handleGateUnlock}
        toolName="Scenario Modeler"
        resultLabel="the scenario analysis"
      />
    </div>
  )
}
