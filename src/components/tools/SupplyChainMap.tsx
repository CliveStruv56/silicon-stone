'use client'

import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre'
import type { LayerProps } from 'react-map-gl/maplibre'
import type { FeatureCollection, LineString } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  scoreNodeForExposure,
  NODE_COLORS,
  RISK_COLORS,
  type SupplyChainNode,
  type ScenarioId,
  type ExposureProfile,
} from '@/lib/supply-chain-data'

// Free dark map style from MapTiler (no API key required for limited use)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const connectionLayerStyle: LayerProps = {
  id: 'connections',
  type: 'line',
  paint: {
    'line-color': ['get', 'color'],
    'line-width': ['get', 'width'],
    'line-opacity': ['get', 'opacity'],
  },
}

interface SupplyChainMapProps {
  connectionsGeoJSON: FeatureCollection<LineString>
  filteredNodes: SupplyChainNode[]
  selectedNode: SupplyChainNode | null
  connectedNodeIds: Set<string>
  exposureProfile: ExposureProfile
  selectedScenarioId: ScenarioId
  onSelectNode: (node: SupplyChainNode) => void
}

/**
 * The maplibre portion of the supply-chain mapper, split out so the page can
 * load it via next/dynamic (ssr: false) — maplibre-gl is the single heaviest
 * dependency on this route and shouldn't block first paint or hydration.
 */
export function SupplyChainMap({
  connectionsGeoJSON,
  filteredNodes,
  selectedNode,
  connectedNodeIds,
  exposureProfile,
  selectedScenarioId,
  onSelectNode,
}: SupplyChainMapProps) {
  return (
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
              onSelectNode(node)
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
  )
}
