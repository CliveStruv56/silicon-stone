'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre'
import type { FeatureCollection, Feature, LineString } from 'geojson'
import type { LayerProps } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Tooltip } from 'react-tooltip'
import { Header, Footer } from '@/components/layout'
import { EmailGateOverlay } from '@/components/tools/EmailGateOverlay'
import { usePrintGate } from '@/components/tools/usePrintGate'
import { CopyMarkdownButton } from '@/components/tools/CopyMarkdownButton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapFilters, MapLegend } from '@/components/tools/MapFilters'
import {
  SUPPLY_CHAIN_NODES,
  SUPPLY_CHAIN_CONNECTIONS,
  SUPPLY_CHAIN_SCENARIOS,
  INDUSTRY_SECTOR_OPTIONS,
  getIndustrySectorLabel,
  getNodeById,
  getConnectionsForNode,
  getUpstreamNodes,
  getDownstreamNodes,
  getNodeRiskProfile,
  getScenarioAdjustedScore,
  getTopExposureNodes,
  scoreNodeForExposure,
  NODE_COLORS,
  RISK_COLORS,
  CONNECTION_COLORS,
  NODE_TYPE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  type SupplyChainNode,
  type NodeType,
  type RiskLevel,
  type ScenarioId,
  type ExposureProfile,
  type ChipExposure,
  type IndustrySector,
  type SourcingFlexibility,
} from '@/lib/supply-chain-data'
import { supplyChainMapperMarkdown } from '@/lib/tools-markdown'
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Network,
  X,
  Gauge,
  ClipboardList,
  Activity,
  ExternalLink,
  ShieldCheck,
  FileText,
  Mail,
} from 'lucide-react'

// Free dark map style from MapTiler (no API key required for limited use)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const CHIP_EXPOSURE_OPTIONS: { value: ChipExposure; label: string }[] = [
  { value: 'ai-accelerators', label: 'AI accelerators / GPUs' },
  { value: 'automotive-mcus', label: 'Automotive electronics' },
  { value: 'industrial-control', label: 'Industrial control systems' },
  { value: 'networking', label: 'Networking / infrastructure' },
  { value: 'consumer-devices', label: 'Consumer devices' },
]

const SOURCING_OPTIONS: { value: SourcingFlexibility; label: string }[] = [
  { value: 'single-source', label: 'Single-source or unclear' },
  { value: 'dual-source', label: 'Dual-source for key parts' },
  { value: 'multi-source', label: 'Multi-source with qualified alternates' },
]

const GEOGRAPHY_OPTIONS = [
  { value: 'europe', label: 'Europe-facing operations' },
  { value: 'asia', label: 'Asia-heavy supply base' },
  { value: 'global', label: 'Global / mixed exposure' },
]

export default function SupplyChainMapperPage() {
  const [selectedNode, setSelectedNode] = useState<SupplyChainNode | null>(null)
  // Email gate is now triggered only by the "Email me the brief" export action.
  // The interactive map and node detail are free to use.
  const { showGate, requestBrief, unlock, dismiss } = usePrintGate()
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>('baseline')
  const [exposureProfile, setExposureProfile] = useState<ExposureProfile>({
    industry: 'industrial-manufacturing',
    chipExposure: 'ai-accelerators',
    sourcingFlexibility: 'single-source',
    geography: 'europe',
  })

  const handleSelectNode = useCallback((node: SupplyChainNode) => {
    setSelectedNode(node)
  }, [])

  const [activeNodeTypes, setActiveNodeTypes] = useState<NodeType[]>(
    NODE_TYPE_OPTIONS.map(opt => opt.value)
  )
  const [activeRiskLevels, setActiveRiskLevels] = useState<RiskLevel[]>(
    RISK_LEVEL_OPTIONS.map(opt => opt.value)
  )
  const [showConnections, setShowConnections] = useState(true)

  const selectedScenario = SUPPLY_CHAIN_SCENARIOS.find(
    scenario => scenario.id === selectedScenarioId
  ) ?? SUPPLY_CHAIN_SCENARIOS[0]

  const topExposureNodes = useMemo(() => {
    return getTopExposureNodes(exposureProfile, selectedScenarioId, 5)
  }, [exposureProfile, selectedScenarioId])

  const selectedNodeRiskProfile = selectedNode ? getNodeRiskProfile(selectedNode) : null
  const selectedNodeScenarioScore = selectedNode
    ? getScenarioAdjustedScore(selectedNode, selectedScenarioId)
    : null
  const selectedNodeExposureScore = selectedNode
    ? scoreNodeForExposure(selectedNode, exposureProfile, selectedScenarioId)
    : null

  // Filter nodes based on active filters
  const filteredNodes = useMemo(() => {
    return SUPPLY_CHAIN_NODES.filter(
      node => activeNodeTypes.includes(node.type) && activeRiskLevels.includes(node.risk)
    )
  }, [activeNodeTypes, activeRiskLevels])

  // Get connections for visible nodes
  const visibleConnections = useMemo(() => {
    if (!showConnections) return []
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    return SUPPLY_CHAIN_CONNECTIONS.filter(
      conn => nodeIds.has(conn.from) && nodeIds.has(conn.to)
    )
  }, [filteredNodes, showConnections])

  // Highlight connections when a node is selected
  const highlightedConnections = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const connections = getConnectionsForNode(selectedNode.id)
    const ids = new Set<string>()
    connections.forEach(conn => {
      ids.add(`${conn.from}-${conn.to}`)
    })
    return ids
  }, [selectedNode])

  // Connected node IDs for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const connections = getConnectionsForNode(selectedNode.id)
    const ids = new Set<string>()
    connections.forEach(conn => {
      ids.add(conn.from)
      ids.add(conn.to)
    })
    return ids
  }, [selectedNode])

  // Create GeoJSON for connection lines
  const connectionsGeoJSON: FeatureCollection<LineString> = useMemo(() => {
    const features: Feature<LineString>[] = []

    for (const conn of visibleConnections) {
      const fromNode = getNodeById(conn.from)
      const toNode = getNodeById(conn.to)
      if (!fromNode || !toNode) continue

      const isHighlighted = highlightedConnections.has(`${conn.from}-${conn.to}`)

      features.push({
        type: 'Feature',
        properties: {
          id: `${conn.from}-${conn.to}`,
          type: conn.type,
          highlighted: isHighlighted,
          color: CONNECTION_COLORS[conn.type],
          opacity: selectedNode ? (isHighlighted ? 0.8 : 0.15) : 0.4,
          width: isHighlighted ? 2 : 1,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            fromNode.coordinates,
            toNode.coordinates,
          ],
        },
      })
    }

    return {
      type: 'FeatureCollection',
      features,
    }
  }, [visibleConnections, highlightedConnections, selectedNode])

  const connectionLayerStyle: LayerProps = {
    id: 'connections',
    type: 'line',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ['get', 'width'],
      'line-opacity': ['get', 'opacity'],
    },
  }

  const handleToggleNodeType = useCallback((type: NodeType) => {
    setActiveNodeTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }, [])

  const handleToggleRiskLevel = useCallback((level: RiskLevel) => {
    setActiveRiskLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }, [])

  const handleResetFilters = useCallback(() => {
    setActiveNodeTypes(NODE_TYPE_OPTIONS.map(opt => opt.value))
    setActiveRiskLevels(RISK_LEVEL_OPTIONS.map(opt => opt.value))
    setShowConnections(true)
  }, [])

  const upstreamNodes = selectedNode ? getUpstreamNodes(selectedNode.id) : []
  const downstreamNodes = selectedNode ? getDownstreamNodes(selectedNode.id) : []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle py-8">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber">
              Interactive Tool
            </Badge>
            <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-4">
              Supply Chain Chokepoints
            </h1>
            <p className="text-lg text-text-muted max-w-2xl">
              Mapping the physical vulnerability of the digital world. Explore {SUPPLY_CHAIN_NODES.length} critical nodes across the global semiconductor supply chain.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="bg-stone-charcoal border-border-subtle py-5">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-text-primary">
                  <ClipboardList className="w-5 h-5 text-stone-teal" />
                  Exposure Diagnostic
                </CardTitle>
                <CardDescription>
                  Adjust the operating context to see which chokepoints matter most for this organisation.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-wider text-text-muted">Industry context</span>
                  <select
                    value={exposureProfile.industry}
                    onChange={(event) => setExposureProfile(prev => ({
                      ...prev,
                      industry: event.target.value as IndustrySector,
                    }))}
                    className="h-10 w-full rounded-md border border-border-subtle bg-slate-deep px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-silicon-amber"
                  >
                    {INDUSTRY_SECTOR_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-wider text-text-muted">Critical chip class</span>
                  <select
                    value={exposureProfile.chipExposure}
                    onChange={(event) => setExposureProfile(prev => ({
                      ...prev,
                      chipExposure: event.target.value as ChipExposure,
                    }))}
                    className="h-10 w-full rounded-md border border-border-subtle bg-slate-deep px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-silicon-amber"
                  >
                    {CHIP_EXPOSURE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-wider text-text-muted">Sourcing posture</span>
                  <select
                    value={exposureProfile.sourcingFlexibility}
                    onChange={(event) => setExposureProfile(prev => ({
                      ...prev,
                      sourcingFlexibility: event.target.value as SourcingFlexibility,
                    }))}
                    className="h-10 w-full rounded-md border border-border-subtle bg-slate-deep px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-silicon-amber"
                  >
                    {SOURCING_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-wider text-text-muted">Supply footprint</span>
                  <select
                    value={exposureProfile.geography}
                    onChange={(event) => setExposureProfile(prev => ({
                      ...prev,
                      geography: event.target.value,
                    }))}
                    className="h-10 w-full rounded-md border border-border-subtle bg-slate-deep px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-silicon-amber"
                  >
                    {GEOGRAPHY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </CardContent>
            </Card>

            <Card className="bg-stone-charcoal border-border-subtle py-5">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-text-primary">
                  <Activity className="w-5 h-5 text-silicon-amber" />
                  Stress Scenario
                </CardTitle>
                <CardDescription>{selectedScenario.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={selectedScenarioId}
                  onChange={(event) => setSelectedScenarioId(event.target.value as ScenarioId)}
                  className="h-10 w-full rounded-md border border-border-subtle bg-slate-deep px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-silicon-amber"
                >
                  {SUPPLY_CHAIN_SCENARIOS.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                  ))}
                </select>
                <div className="grid gap-2 sm:grid-cols-3">
                  {selectedScenario.responseMoves.slice(0, 3).map(move => (
                    <div key={move} className="rounded-md border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-text-muted">
                      {move}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <MapFilters
              activeNodeTypes={activeNodeTypes}
              activeRiskLevels={activeRiskLevels}
              showConnections={showConnections}
              onToggleNodeType={handleToggleNodeType}
              onToggleRiskLevel={handleToggleRiskLevel}
              onToggleConnections={() => setShowConnections(prev => !prev)}
              onReset={handleResetFilters}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Container */}
            <div className="lg:col-span-2 bg-stone-charcoal/50 border border-border-subtle rounded-xl overflow-hidden relative h-[400px] md:h-[600px]">
              <Map
                initialViewState={{
                  longitude: 20,
                  latitude: 30,
                  zoom: 1.5,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={MAP_STYLE}
                attributionControl={false}
              >
                <NavigationControl position="top-right" />

                {/* Connection Lines */}
                <Source id="connections" type="geojson" data={connectionsGeoJSON}>
                  <Layer {...connectionLayerStyle} />
                </Source>

                {/* Node Markers */}
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id
                  const isConnected = connectedNodeIds.has(node.id)
                  const nodeExposureScore = scoreNodeForExposure(node, exposureProfile, selectedScenarioId)
                  const markerSize = isSelected ? 22 : nodeExposureScore >= 8 ? 17 : 14
                  const ringSize = isSelected ? 30 : nodeExposureScore >= 8 ? 24 : 20
                  const opacity = selectedNode
                    ? (isSelected || isConnected) ? 1 : 0.3
                    : 1

                  return (
                    <Marker
                      key={node.id}
                      longitude={node.coordinates[0]}
                      latitude={node.coordinates[1]}
                      anchor="center"
                      onClick={(e) => {
                        e.originalEvent.stopPropagation()
                        handleSelectNode(node)
                      }}
                    >
                      <div
                        className="cursor-pointer transition-all duration-300"
                        style={{ opacity }}
                        data-tooltip-id="map-tooltip"
                        data-tooltip-content={`${node.name} (${node.type}) · exposure ${nodeExposureScore}/10`}
                      >
                        {/* Risk ring */}
                        <div
                          className="absolute rounded-full transition-all duration-300"
                          style={{
                            width: ringSize,
                            height: ringSize,
                            border: `2px solid ${RISK_COLORS[node.risk]}`,
                            transform: 'translate(-50%, -50%)',
                            left: '50%',
                            top: '50%',
                          }}
                        />
                        {/* Node type fill */}
                        <div
                          className="rounded-full border-2 border-white transition-all duration-300"
                          style={{
                            width: markerSize,
                            height: markerSize,
                            backgroundColor: NODE_COLORS[node.type],
                          }}
                        />
                        {/* Selection indicator */}
                        {isSelected && (
                          <div
                            className="absolute rounded-full border border-white animate-spin"
                            style={{
                              width: 36,
                              height: 36,
                              borderStyle: 'dashed',
                              animationDuration: '8s',
                              transform: 'translate(-50%, -50%)',
                              left: '50%',
                              top: '50%',
                            }}
                          />
                        )}
                      </div>
                    </Marker>
                  )
                })}
              </Map>
              <Tooltip id="map-tooltip" />

              {/* Legend */}
              <div className="absolute bottom-4 left-4">
                <MapLegend />
              </div>

              {/* Stats */}
              <div className="absolute top-4 left-4 bg-stone-charcoal/90 rounded-lg px-3 py-2 text-xs text-text-muted">
                <span className="text-text-primary font-medium">{filteredNodes.length}</span> nodes shown
                {showConnections && (
                  <> &middot; <span className="text-text-primary font-medium">{visibleConnections.length}</span> connections</>
                )}
              </div>
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-1">
              <Card className="mb-4 bg-stone-charcoal border-border-subtle py-5">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-text-muted">
                    <Gauge className="w-4 h-4 text-silicon-amber" />
                    Top Exposure Nodes
                  </CardTitle>
                  <CardDescription>
                    {getIndustrySectorLabel(exposureProfile.industry)} under {selectedScenario.name.toLowerCase()} conditions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topExposureNodes.map(node => (
                    <button
                      key={node.id}
                      onClick={() => handleSelectNode(node)}
                      className="w-full rounded-md border border-border-subtle bg-surface-elevated px-3 py-2 text-left transition-colors hover:border-stone-teal/60 hover:bg-stone-teal/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-text-primary">{node.name}</span>
                        <span className="font-mono text-sm text-silicon-amber">{node.exposureScore}/10</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: NODE_COLORS[node.type] }}
                        />
                        {node.type} · {node.country}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <AnimatePresence mode="wait">
                {selectedNode ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    key={selectedNode.id}
                    className="space-y-4"
                  >
                    <Card className="bg-stone-charcoal border-border-subtle">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Badge
                            className="w-fit mb-2"
                            style={{
                              backgroundColor: `${RISK_COLORS[selectedNode.risk]}20`,
                              color: RISK_COLORS[selectedNode.risk],
                              borderColor: `${RISK_COLORS[selectedNode.risk]}40`,
                            }}
                          >
                            {selectedNode.risk} Risk
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedNode(null)}
                            className="h-6 w-6 text-text-muted hover:text-text-primary"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardTitle className="text-xl text-text-primary">{selectedNode.name}</CardTitle>
                        <div className="flex items-center gap-2 text-text-muted font-mono text-sm">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: NODE_COLORS[selectedNode.type] }}
                          />
                          {selectedNode.type} &middot; {selectedNode.country}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Analysis
                          </h4>
                          <p className="text-text-primary">{selectedNode.details}</p>
                        </div>

                        {selectedNode.marketShare && (
                          <div className="bg-surface-elevated px-3 py-2 rounded-lg border border-border-subtle">
                            <span className="text-xs text-text-muted uppercase">Market Position</span>
                            <p className="text-silicon-amber font-medium">{selectedNode.marketShare}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2">
                            <span className="text-xs uppercase text-text-muted">Scenario Score</span>
                            <p className="font-mono text-2xl text-silicon-amber">{selectedNodeScenarioScore}/10</p>
                          </div>
                          <div className="rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2">
                            <span className="text-xs uppercase text-text-muted">Your Exposure</span>
                            <p className="font-mono text-2xl text-stone-teal">{selectedNodeExposureScore}/10</p>
                          </div>
                        </div>

                        {selectedNodeRiskProfile && (
                          <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-elevated p-3">
                            {[
                              ['Exposure', selectedNodeRiskProfile.exposure],
                              ['Substitution difficulty', selectedNodeRiskProfile.substitutability],
                              ['Lead-time pressure', selectedNodeRiskProfile.leadTime],
                              ['Geopolitical pressure', selectedNodeRiskProfile.geopolitical],
                            ].map(([label, value]) => (
                              <div key={label}>
                                <div className="mb-1 flex justify-between text-xs text-text-muted">
                                  <span>{label}</span>
                                  <span>{value}/10</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-deep">
                                  <div
                                    className="h-1.5 rounded-full bg-silicon-amber"
                                    style={{ width: `${Number(value) * 10}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="bg-alert-red/10 border border-alert-red/20 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-alert-red uppercase tracking-wider mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Failure Impact
                          </h4>
                          <p className="text-text-primary">{selectedNode.impact}</p>
                        </div>

                        {(selectedNode.leadTime || selectedNode.substitutability) && (
                          <div className="grid gap-2">
                            {selectedNode.leadTime && (
                              <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3">
                                <span className="text-xs uppercase text-text-muted">Lead-Time Reality</span>
                                <p className="mt-1 text-sm text-text-primary">{selectedNode.leadTime}</p>
                              </div>
                            )}
                            {selectedNode.substitutability && (
                              <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3">
                                <span className="text-xs uppercase text-text-muted">Substitutability</span>
                                <p className="mt-1 text-sm text-text-primary">{selectedNode.substitutability}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedNode.mitigationOptions && (
                          <div>
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-teal">
                              <ShieldCheck className="w-4 h-4" />
                              Mitigation Moves
                            </h4>
                            <ul className="space-y-2">
                              {selectedNode.mitigationOptions.map(item => (
                                <li key={item} className="rounded-md bg-surface-elevated px-3 py-2 text-sm text-text-primary">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedNode.supplierQuestions && (
                          <div>
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-silicon-amber">
                              <FileText className="w-4 h-4" />
                              Supplier Questions
                            </h4>
                            <ul className="space-y-2">
                              {selectedNode.supplierQuestions.map(item => (
                                <li key={item} className="rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedNode.signalsToWatch && (
                          <div>
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
                              <Activity className="w-4 h-4" />
                              Signals To Watch
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedNode.signalsToWatch.map(item => (
                                <Badge key={item} variant="outline" className="border-border-subtle text-text-muted">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-border-subtle pt-3">
                          <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
                            <span>Evidence</span>
                            <span>{selectedNode.confidence ?? 'Medium'} confidence · reviewed {selectedNode.lastReviewed ?? '2026-05-11'}</span>
                          </div>
                          {selectedNode.evidence?.length ? (
                            <div className="space-y-1">
                              {selectedNode.evidence.map(source => (
                                <a
                                  key={source.url}
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-stone-teal hover:text-silicon-amber"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {source.label}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted">Curated Silicon & Stone assessment. Source references pending detailed review.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dependencies */}
                    {(upstreamNodes.length > 0 || downstreamNodes.length > 0) && (
                      <Card className="bg-stone-charcoal border-border-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-text-muted uppercase tracking-wider flex items-center gap-2">
                            <Network className="w-4 h-4 text-stone-teal" />
                            Supply Chain Position
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {upstreamNodes.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                                <ArrowRight className="w-3 h-3" />
                                Depends On
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {upstreamNodes.map(node => (
                                  <button
                                    key={node.id}
                                    onClick={() => handleSelectNode(node)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated rounded text-xs text-text-primary hover:bg-stone-teal/20 transition-colors"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: NODE_COLORS[node.type] }}
                                    />
                                    {node.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {downstreamNodes.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                                <ArrowLeft className="w-3 h-3" />
                                Supplies To
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {downstreamNodes.map(node => (
                                  <button
                                    key={node.id}
                                    onClick={() => handleSelectNode(node)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated rounded text-xs text-text-primary hover:bg-stone-teal/20 transition-colors"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: NODE_COLORS[node.type] }}
                                    />
                                    {node.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex items-center justify-center text-center p-8 border border-dashed border-border-subtle rounded-xl text-text-muted min-h-[300px]"
                  >
                    <div>
                      <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-xl mb-2">Select a Node</p>
                      <p className="text-sm">
                        Click on any supply chain node on the map to analyse its strategic significance and dependencies.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Card className="mt-6 bg-stone-charcoal border-border-subtle">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-text-primary">Exposure Report Snapshot</CardTitle>
                  <CardDescription>
                    A concise starting point for the supply-chain conversation. Scores are directional and designed to identify where to ask better questions.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyMarkdownButton
                    toolName="Supply Chain Mapper"
                    filename={`supply-chain-snapshot-${new Date().toISOString().slice(0, 10)}.md`}
                    getMarkdown={() => supplyChainMapperMarkdown({
                      profile: exposureProfile,
                      scenario: selectedScenario,
                      topNodes: topExposureNodes,
                      selectedNode,
                      selectedNodeExposureScore,
                    })}
                  />
                  <Button
                    variant="outline"
                    onClick={requestBrief}
                    className="border-silicon-amber text-silicon-amber hover:bg-silicon-amber/10"
                  >
                    <Mail className="w-4 h-4" />
                    Email me the brief
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-text-muted">Highest Exposure</h3>
                <div className="space-y-2">
                  {topExposureNodes.slice(0, 3).map(node => (
                    <div key={node.id} className="rounded-md border border-border-subtle bg-surface-elevated px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-text-primary">{node.name}</span>
                        <span className="font-mono text-sm text-silicon-amber">{node.exposureScore}/10</span>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">{node.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-text-muted">First Response Moves</h3>
                <ul className="space-y-2">
                  {selectedScenario.responseMoves.map(move => (
                    <li key={move} className="rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary">
                      {move}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-text-muted">Questions For Procurement</h3>
                <ul className="space-y-2">
                  {topExposureNodes
                    .flatMap(node => node.supplierQuestions ?? [])
                    .slice(0, 3)
                    .map(question => (
                      <li key={question} className="rounded-md bg-surface-elevated px-3 py-2 text-sm text-text-primary">
                        {question}
                      </li>
                    ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex justify-center pt-8">
            <Link href="/services#contact">
              <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
                Request Supply Chain Exposure Report
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <EmailGateOverlay
        isOpen={showGate}
        onUnlock={unlock}
        onDismiss={dismiss}
        toolName="Supply Chain Mapper"
        resultLabel="the printable brief"
      />
    </div>
  )
}
