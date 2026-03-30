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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapFilters, MapLegend } from '@/components/tools/MapFilters'
import {
  SUPPLY_CHAIN_NODES,
  SUPPLY_CHAIN_CONNECTIONS,
  getNodeById,
  getConnectionsForNode,
  getUpstreamNodes,
  getDownstreamNodes,
  NODE_COLORS,
  RISK_COLORS,
  CONNECTION_COLORS,
  NODE_TYPE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  type SupplyChainNode,
  type NodeType,
  type RiskLevel,
} from '@/lib/supply-chain-data'
import { AlertTriangle, ArrowRight, ArrowLeft, Network, X } from 'lucide-react'

// Free dark map style from MapTiler (no API key required for limited use)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export default function SupplyChainMapperPage() {
  const [selectedNode, setSelectedNode] = useState<SupplyChainNode | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [pendingNode, setPendingNode] = useState<SupplyChainNode | null>(null)

  const handleSelectNode = useCallback((node: SupplyChainNode) => {
    if (isUnlocked) {
      setSelectedNode(node)
    } else {
      setPendingNode(node)
      setShowGate(true)
    }
  }, [isUnlocked])

  const handleGateUnlock = () => {
    setIsUnlocked(true)
    setShowGate(false)
    if (pendingNode) {
      setSelectedNode(pendingNode)
      setPendingNode(null)
    }
  }

  const [activeNodeTypes, setActiveNodeTypes] = useState<NodeType[]>(
    NODE_TYPE_OPTIONS.map(opt => opt.value)
  )
  const [activeRiskLevels, setActiveRiskLevels] = useState<RiskLevel[]>(
    RISK_LEVEL_OPTIONS.map(opt => opt.value)
  )
  const [showConnections, setShowConnections] = useState(true)

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
                        data-tooltip-content={`${node.name} (${node.type})`}
                      >
                        {/* Risk ring */}
                        <div
                          className="absolute rounded-full transition-all duration-300"
                          style={{
                            width: isSelected ? 28 : 20,
                            height: isSelected ? 28 : 20,
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
                            width: isSelected ? 20 : 14,
                            height: isSelected ? 20 : 14,
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

                        <div className="bg-alert-red/10 border border-alert-red/20 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-alert-red uppercase tracking-wider mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Failure Impact
                          </h4>
                          <p className="text-text-primary">{selectedNode.impact}</p>
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
                        Click on any supply chain node on the map to analyze its strategic significance and dependencies.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

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
        onUnlock={handleGateUnlock}
        toolName="Supply Chain Mapper"
        resultLabel="the node analysis"
      />
    </div>
  )
}
