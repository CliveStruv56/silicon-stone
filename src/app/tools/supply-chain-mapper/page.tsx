'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import { Tooltip } from 'react-tooltip'
import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// --- Data ---
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

type Location = {
    name: string
    coordinates: [number, number]
    type: 'Fab' | 'Material' | 'Design'
    risk: 'High' | 'Medium' | 'Low'
    details: string
    impact: string
}

const LOCATIONS: Location[] = [
    { name: "TSMC Hsinchu", coordinates: [120.9675, 24.8138], type: "Fab", risk: "High", details: "World's most advanced logic foundry. 90% of advanced chips.", impact: "Global shutdown of AI/Mobile." },
    { name: "ASML Veldhoven", coordinates: [5.4100, 51.4100], type: "Material", risk: "Medium", details: "Sole source for EUV lithography machines.", impact: "Stalling of Moore's Law globally." },
    { name: "Neon Gas, Odessa", coordinates: [30.7233, 46.4825], type: "Material", risk: "High", details: "Critical noble gases for laser etching.", impact: "Supply crunch involved in 2022 shock." },
    { name: "Nvidia, Santa Clara", coordinates: [-121.9681, 37.3541], type: "Design", risk: "Low", details: "AI Architecture Monopoly.", impact: "Market volatility." },
    { name: "Dresden Fab Cluster", coordinates: [13.7373, 51.0504], type: "Fab", risk: "Medium", details: "EU's Industrial Heartland.", impact: "Automotive chip shortage." },
    { name: "Arizona Fabs", coordinates: [-112.0740, 33.4484], type: "Fab", risk: "Low", details: "US Reshoring Hub.", impact: "Slow ramp-up insurance policy." },
]

const colorScale = scaleLinear<string>()
    .domain([0, 1])
    .range(["#ffedea", "#ff5233"])

// --- Component ---

export default function SupplyChainMapperPage() {
    const [selectedLoc, setSelectedLoc] = useState<Location | null>(null)

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 bg-background">
                <section className="bg-slate-deep border-b border-border-subtle py-8">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber">
                            Interactive Tool
                        </Badge>
                        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-4">
                            Supply Chain Chokepoints
                        </h1>
                        <p className="text-lg text-text-muted max-w-2xl">
                            Mapping the physical vulnerability of the digital world. Click on nodes to analyze failure points.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">

                        {/* Map Container */}
                        <div className="lg:col-span-2 bg-stone-charcoal/50 border border-border-subtle rounded-xl overflow-hidden relative">
                            <ComposableMap
                                projection="geoMercator"
                                projectionConfig={{
                                    scale: 140,
                                }}
                                className="w-full h-full"
                            >
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill="#334155"
                                                stroke="#1e293b"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { fill: "#475569", outline: "none" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        ))
                                    }
                                </Geographies>
                                {LOCATIONS.map((loc) => (
                                    <Marker
                                        key={loc.name}
                                        coordinates={loc.coordinates}
                                        onClick={() => setSelectedLoc(loc)}
                                        className="cursor-pointer"
                                    >
                                        <circle
                                            r={8}
                                            fill={loc.risk === 'High' ? '#ef4444' : loc.risk === 'Medium' ? '#f59e0b' : '#14b8a6'}
                                            stroke="#fff"
                                            strokeWidth={2}
                                            data-tooltip-id="map-tooltip"
                                            data-tooltip-content={loc.name}
                                        />
                                    </Marker>
                                ))}
                            </ComposableMap>
                            <Tooltip id="map-tooltip" />

                            <div className="absolute bottom-4 left-4 bg-stone-charcoal p-3 rounded-lg border border-border-subtle text-xs text-text-muted">
                                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-alert-red" /> High Risk</div>
                                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-silicon-amber" /> Medium Risk</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-stone-teal" /> Low Risk</div>
                            </div>
                        </div>

                        {/* Details Panel */}
                        <div className="lg:col-span-1">
                            {selectedLoc ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={selectedLoc.name}
                                >
                                    <Card className="bg-stone-charcoal border-border-subtle h-full">
                                        <CardHeader>
                                            <Badge className={`w-fit mb-2 ${selectedLoc.risk === 'High' ? 'bg-alert-red/20 text-alert-red hover:bg-alert-red/30' :
                                                    selectedLoc.risk === 'Medium' ? 'bg-silicon-amber/20 text-silicon-amber hover:bg-silicon-amber/30' :
                                                        'bg-stone-teal/20 text-stone-teal hover:bg-stone-teal/30'
                                                }`}>
                                                {selectedLoc.risk} Risk
                                            </Badge>
                                            <CardTitle className="text-2xl text-text-primary">{selectedLoc.name}</CardTitle>
                                            <div className="text-text-muted font-mono text-sm">{selectedLoc.type} Node</div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-2">Analysis</h4>
                                                <p className="text-text-muted text-lg">{selectedLoc.details}</p>
                                            </div>

                                            <div className="bg-surface-elevated p-4 rounded-lg border border-border-subtle">
                                                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-2">Failure Impact</h4>
                                                <p className="text-alert-red font-medium">{selectedLoc.impact}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center p-8 border border-dashed border-border-subtle rounded-xl text-text-muted">
                                    <div>
                                        <p className="text-xl mb-2">Select a Node</p>
                                        <p className="text-sm">Click on any supply chain node on the map to inspect its strategic significance.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
