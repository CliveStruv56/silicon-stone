// Supply Chain Mapper Data
// Global semiconductor supply chain nodes and connections

export type NodeType = 'Fab' | 'Material' | 'Equipment' | 'Design'
export type RiskLevel = 'High' | 'Medium' | 'Low'
export type ConnectionType = 'material' | 'equipment' | 'design' | 'product'

export interface SupplyChainNode {
  id: string
  name: string
  coordinates: [number, number] // [longitude, latitude]
  type: NodeType
  risk: RiskLevel
  details: string
  impact: string
  dependencies?: string[] // IDs of nodes this depends on
  marketShare?: string
  country: string
}

export interface SupplyChainConnection {
  from: string
  to: string
  type: ConnectionType
  label?: string
}

// --- Node Locations ---

export const SUPPLY_CHAIN_NODES: SupplyChainNode[] = [
  // === FABS ===
  {
    id: 'tsmc-hsinchu',
    name: 'TSMC Hsinchu',
    coordinates: [120.9675, 24.8138],
    type: 'Fab',
    risk: 'High',
    details: "World's most advanced logic foundry. Produces over 90% of the world's most advanced chips (<7nm).",
    impact: 'Global shutdown of AI accelerators, smartphones, and advanced computing.',
    marketShare: '56% of global foundry market',
    country: 'Taiwan',
    dependencies: ['asml-veldhoven', 'neon-ukraine', 'sumco-japan'],
  },
  {
    id: 'tsmc-tainan',
    name: 'TSMC Tainan (Fab 18)',
    coordinates: [120.2513, 22.9908],
    type: 'Fab',
    risk: 'High',
    details: 'Primary 5nm/3nm production facility. Key supplier for Apple, Nvidia, AMD.',
    impact: 'Critical shortage of leading-edge processors.',
    marketShare: 'Primary 3nm node globally',
    country: 'Taiwan',
    dependencies: ['asml-veldhoven', 'neon-ukraine'],
  },
  {
    id: 'samsung-pyeongtaek',
    name: 'Samsung Pyeongtaek',
    coordinates: [127.0892, 37.0892],
    type: 'Fab',
    risk: 'High',
    details: "World's largest semiconductor complex. Memory and logic production.",
    impact: 'DRAM/NAND shortage affecting data centres and consumer electronics.',
    marketShare: '40% of global DRAM',
    country: 'South Korea',
    dependencies: ['asml-veldhoven', 'neon-ukraine', 'palladium-russia'],
  },
  {
    id: 'sk-hynix-icheon',
    name: 'SK Hynix Icheon',
    coordinates: [127.4350, 37.2795],
    type: 'Fab',
    risk: 'High',
    details: 'Major DRAM producer. Critical for HBM (High Bandwidth Memory) for AI.',
    impact: 'AI training hardware shortage, memory price spikes.',
    marketShare: '28% of global DRAM',
    country: 'South Korea',
    dependencies: ['asml-veldhoven', 'neon-ukraine'],
  },
  {
    id: 'intel-ireland',
    name: 'Intel Leixlip',
    coordinates: [-6.4967, 53.3658],
    type: 'Fab',
    risk: 'Medium',
    details: "Intel's European manufacturing hub. Advanced logic production.",
    impact: 'EU chip supply disruption, Intel processor shortages.',
    marketShare: 'Key EU production node',
    country: 'Ireland',
    dependencies: ['asml-veldhoven', 'amat-santaclara'],
  },
  {
    id: 'intel-oregon',
    name: 'Intel Hillsboro',
    coordinates: [-122.9365, 45.5428],
    type: 'Fab',
    risk: 'Low',
    details: 'Intel D1X R&D fab. Process technology development.',
    impact: 'Slowed Intel node development, competitive disadvantage.',
    country: 'USA',
    dependencies: ['asml-veldhoven', 'amat-santaclara'],
  },
  {
    id: 'globalfoundries-dresden',
    name: 'GlobalFoundries Dresden',
    coordinates: [13.7373, 51.0504],
    type: 'Fab',
    risk: 'Medium',
    details: "EU's largest mature-node fab. Automotive and industrial chips.",
    impact: 'European automotive chip shortage.',
    marketShare: 'Key automotive supplier',
    country: 'Germany',
    dependencies: ['asml-veldhoven', 'amat-santaclara'],
  },
  {
    id: 'tsmc-arizona',
    name: 'TSMC Arizona',
    coordinates: [-112.0740, 33.4484],
    type: 'Fab',
    risk: 'Low',
    details: 'US reshoring initiative. 4nm production planned.',
    impact: 'Delayed US chip sovereignty timeline.',
    marketShare: 'Future capacity',
    country: 'USA',
    dependencies: ['asml-veldhoven', 'amat-santaclara'],
  },
  {
    id: 'micron-hiroshima',
    name: 'Micron Hiroshima',
    coordinates: [132.4553, 34.3853],
    type: 'Fab',
    risk: 'Medium',
    details: 'Advanced DRAM development and production facility.',
    impact: 'DRAM technology development slowdown.',
    country: 'Japan',
    dependencies: ['tokyo-electron', 'sumco-japan'],
  },

  // === MATERIALS ===
  {
    id: 'neon-ukraine',
    name: 'Neon Gas (Odessa/Mariupol)',
    coordinates: [30.7233, 46.4825],
    type: 'Material',
    risk: 'High',
    details: 'Critical noble gas for laser lithography. 50%+ of global supply pre-2022.',
    impact: 'Laser etching disruption, demonstrated in 2022 supply shock.',
    marketShare: '50% of purified neon (pre-war)',
    country: 'Ukraine',
  },
  {
    id: 'palladium-russia',
    name: 'Palladium (Norilsk)',
    coordinates: [88.2090, 69.3535],
    type: 'Material',
    risk: 'High',
    details: 'Critical for MLCC (capacitors) and plating. 40% of global supply.',
    impact: 'Capacitor shortage affecting all electronics.',
    marketShare: '40% of global palladium',
    country: 'Russia',
  },
  {
    id: 'rare-earths-china',
    name: 'Rare Earth Processing',
    coordinates: [109.7813, 40.6584],
    type: 'Material',
    risk: 'High',
    details: 'Baotou refining. 60%+ of global rare earth processing.',
    impact: 'Magnet and electronics materials crisis.',
    marketShare: '60% of global processing',
    country: 'China',
  },
  {
    id: 'sumco-japan',
    name: 'SUMCO Silicon Wafers',
    coordinates: [130.4017, 33.5902],
    type: 'Material',
    risk: 'Medium',
    details: 'Major silicon wafer supplier. Critical substrate material.',
    impact: 'Fab production slowdown, wafer price increases.',
    marketShare: '25% of global wafers',
    country: 'Japan',
  },
  {
    id: 'photoresist-japan',
    name: 'JSR/TOK Photoresists',
    coordinates: [139.6917, 35.6895],
    type: 'Material',
    risk: 'High',
    details: 'EUV photoresist suppliers. Japan controls 90% of market.',
    impact: 'Advanced lithography halt, node development freeze.',
    marketShare: '90% of EUV photoresist',
    country: 'Japan',
  },
  {
    id: 'siltronic-germany',
    name: 'Siltronic Wafers',
    coordinates: [12.0958, 48.8777],
    type: 'Material',
    risk: 'Medium',
    details: 'Major European silicon wafer producer.',
    impact: 'European fab supply chain disruption.',
    marketShare: '15% of global wafers',
    country: 'Germany',
  },

  // === EQUIPMENT ===
  {
    id: 'asml-veldhoven',
    name: 'ASML Veldhoven',
    coordinates: [5.4100, 51.4100],
    type: 'Equipment',
    risk: 'High',
    details: 'Sole source for EUV lithography machines. No alternative exists.',
    impact: 'Complete halt of advanced node development globally.',
    marketShare: '100% of EUV systems',
    country: 'Netherlands',
    dependencies: ['zeiss-oberkochen', 'trumpf-germany'],
  },
  {
    id: 'amat-santaclara',
    name: 'Applied Materials',
    coordinates: [-121.9552, 37.3861],
    type: 'Equipment',
    risk: 'Medium',
    details: 'Leading deposition and etch equipment supplier.',
    impact: 'Fab expansion and maintenance delays.',
    marketShare: '20% of wafer fab equipment',
    country: 'USA',
  },
  {
    id: 'lam-fremont',
    name: 'Lam Research',
    coordinates: [-121.9886, 37.5485],
    type: 'Equipment',
    risk: 'Medium',
    details: 'Leading etch and deposition equipment for memory.',
    impact: 'Memory fab capacity constraints.',
    marketShare: '15% of wafer fab equipment',
    country: 'USA',
  },
  {
    id: 'tokyo-electron',
    name: 'Tokyo Electron',
    coordinates: [139.7690, 35.6804],
    type: 'Equipment',
    risk: 'Medium',
    details: 'Major equipment supplier for coater/developer and etch.',
    impact: 'Fab tooling shortages.',
    marketShare: '15% of wafer fab equipment',
    country: 'Japan',
  },
  {
    id: 'zeiss-oberkochen',
    name: 'ZEISS Oberkochen',
    coordinates: [10.0958, 48.7837],
    type: 'Equipment',
    risk: 'High',
    details: 'Sole supplier of EUV optics for ASML. Extreme precision manufacturing.',
    impact: "ASML's EUV production halts without ZEISS optics.",
    marketShare: '100% of EUV optics',
    country: 'Germany',
  },
  {
    id: 'trumpf-germany',
    name: 'TRUMPF Lasers',
    coordinates: [9.1770, 48.7758],
    type: 'Equipment',
    risk: 'High',
    details: 'Sole supplier of EUV light source lasers for ASML.',
    impact: 'EUV system production impossible without TRUMPF lasers.',
    marketShare: '100% of EUV lasers',
    country: 'Germany',
  },

  // === DESIGN ===
  {
    id: 'nvidia-santaclara',
    name: 'Nvidia Santa Clara',
    coordinates: [-121.9681, 37.3541],
    type: 'Design',
    risk: 'Low',
    details: 'AI accelerator architecture monopoly. GPU and AI chip design.',
    impact: 'AI development slowdown, market volatility.',
    marketShare: '80%+ of AI accelerators',
    country: 'USA',
    dependencies: ['tsmc-hsinchu', 'sk-hynix-icheon'],
  },
  {
    id: 'amd-santaclara',
    name: 'AMD Santa Clara',
    coordinates: [-121.9778, 37.3818],
    type: 'Design',
    risk: 'Low',
    details: 'CPU and GPU design. Key competitor to Intel and Nvidia.',
    impact: 'Reduced competition in processor market.',
    country: 'USA',
    dependencies: ['tsmc-hsinchu'],
  },
  {
    id: 'arm-cambridge',
    name: 'ARM Cambridge',
    coordinates: [0.1218, 52.2053],
    type: 'Design',
    risk: 'Medium',
    details: 'Dominant mobile/embedded CPU architecture. 99% of smartphones.',
    impact: 'Mobile and IoT chip design disruption.',
    marketShare: '99% of mobile CPUs',
    country: 'UK',
  },
  {
    id: 'qualcomm-sandiego',
    name: 'Qualcomm San Diego',
    coordinates: [-117.1611, 32.7157],
    type: 'Design',
    risk: 'Low',
    details: 'Mobile SoC and modem design. 5G IP leader.',
    impact: 'Mobile connectivity and SoC supply issues.',
    marketShare: '30% of mobile SoCs',
    country: 'USA',
    dependencies: ['tsmc-hsinchu', 'samsung-pyeongtaek'],
  },
  {
    id: 'broadcom-sanjose',
    name: 'Broadcom San Jose',
    coordinates: [-121.8863, 37.3382],
    type: 'Design',
    risk: 'Low',
    details: 'Networking and infrastructure chip design.',
    impact: 'Data centre and networking equipment delays.',
    country: 'USA',
    dependencies: ['tsmc-hsinchu'],
  },
]

// --- Supply Chain Connections ---

export const SUPPLY_CHAIN_CONNECTIONS: SupplyChainConnection[] = [
  // Materials to Fabs
  { from: 'neon-ukraine', to: 'tsmc-hsinchu', type: 'material', label: 'Neon gas' },
  { from: 'neon-ukraine', to: 'tsmc-tainan', type: 'material', label: 'Neon gas' },
  { from: 'neon-ukraine', to: 'samsung-pyeongtaek', type: 'material', label: 'Neon gas' },
  { from: 'neon-ukraine', to: 'sk-hynix-icheon', type: 'material', label: 'Neon gas' },
  { from: 'sumco-japan', to: 'tsmc-hsinchu', type: 'material', label: 'Silicon wafers' },
  { from: 'sumco-japan', to: 'micron-hiroshima', type: 'material', label: 'Silicon wafers' },
  { from: 'photoresist-japan', to: 'tsmc-hsinchu', type: 'material', label: 'EUV photoresist' },
  { from: 'photoresist-japan', to: 'samsung-pyeongtaek', type: 'material', label: 'EUV photoresist' },
  { from: 'siltronic-germany', to: 'globalfoundries-dresden', type: 'material', label: 'Silicon wafers' },
  { from: 'siltronic-germany', to: 'intel-ireland', type: 'material', label: 'Silicon wafers' },
  { from: 'palladium-russia', to: 'samsung-pyeongtaek', type: 'material', label: 'Palladium' },

  // Equipment to Fabs
  { from: 'asml-veldhoven', to: 'tsmc-hsinchu', type: 'equipment', label: 'EUV systems' },
  { from: 'asml-veldhoven', to: 'tsmc-tainan', type: 'equipment', label: 'EUV systems' },
  { from: 'asml-veldhoven', to: 'samsung-pyeongtaek', type: 'equipment', label: 'EUV systems' },
  { from: 'asml-veldhoven', to: 'intel-ireland', type: 'equipment', label: 'EUV systems' },
  { from: 'asml-veldhoven', to: 'intel-oregon', type: 'equipment', label: 'EUV systems' },
  { from: 'asml-veldhoven', to: 'sk-hynix-icheon', type: 'equipment', label: 'EUV systems' },
  { from: 'amat-santaclara', to: 'tsmc-hsinchu', type: 'equipment', label: 'Deposition/Etch' },
  { from: 'amat-santaclara', to: 'intel-ireland', type: 'equipment', label: 'Deposition/Etch' },
  { from: 'amat-santaclara', to: 'globalfoundries-dresden', type: 'equipment', label: 'Deposition/Etch' },
  { from: 'lam-fremont', to: 'samsung-pyeongtaek', type: 'equipment', label: 'Memory etch' },
  { from: 'lam-fremont', to: 'sk-hynix-icheon', type: 'equipment', label: 'Memory etch' },
  { from: 'lam-fremont', to: 'micron-hiroshima', type: 'equipment', label: 'Memory etch' },
  { from: 'tokyo-electron', to: 'tsmc-hsinchu', type: 'equipment', label: 'Coater/Developer' },
  { from: 'tokyo-electron', to: 'micron-hiroshima', type: 'equipment', label: 'Coater/Developer' },

  // ASML dependencies
  { from: 'zeiss-oberkochen', to: 'asml-veldhoven', type: 'equipment', label: 'EUV optics' },
  { from: 'trumpf-germany', to: 'asml-veldhoven', type: 'equipment', label: 'EUV lasers' },

  // Design to Fabs (manufacturing relationships)
  { from: 'nvidia-santaclara', to: 'tsmc-hsinchu', type: 'design', label: 'GPU production' },
  { from: 'amd-santaclara', to: 'tsmc-hsinchu', type: 'design', label: 'CPU/GPU production' },
  { from: 'qualcomm-sandiego', to: 'tsmc-hsinchu', type: 'design', label: 'Mobile SoC' },
  { from: 'qualcomm-sandiego', to: 'samsung-pyeongtaek', type: 'design', label: 'Mobile SoC' },
  { from: 'broadcom-sanjose', to: 'tsmc-hsinchu', type: 'design', label: 'Networking chips' },

  // HBM supply chain
  { from: 'sk-hynix-icheon', to: 'nvidia-santaclara', type: 'product', label: 'HBM memory' },
]

// --- Utility Functions ---

export function getNodeById(id: string): SupplyChainNode | undefined {
  return SUPPLY_CHAIN_NODES.find(node => node.id === id)
}

export function getConnectionsForNode(nodeId: string): SupplyChainConnection[] {
  return SUPPLY_CHAIN_CONNECTIONS.filter(
    conn => conn.from === nodeId || conn.to === nodeId
  )
}

export function getConnectedNodeIds(nodeId: string): string[] {
  const connections = getConnectionsForNode(nodeId)
  const ids = new Set<string>()
  connections.forEach(conn => {
    if (conn.from === nodeId) ids.add(conn.to)
    if (conn.to === nodeId) ids.add(conn.from)
  })
  return Array.from(ids)
}

export function getUpstreamNodes(nodeId: string): SupplyChainNode[] {
  const connections = SUPPLY_CHAIN_CONNECTIONS.filter(conn => conn.to === nodeId)
  return connections
    .map(conn => getNodeById(conn.from))
    .filter((node): node is SupplyChainNode => node !== undefined)
}

export function getDownstreamNodes(nodeId: string): SupplyChainNode[] {
  const connections = SUPPLY_CHAIN_CONNECTIONS.filter(conn => conn.from === nodeId)
  return connections
    .map(conn => getNodeById(conn.to))
    .filter((node): node is SupplyChainNode => node !== undefined)
}

// --- Filter Options ---

export const NODE_TYPE_OPTIONS: { value: NodeType; label: string; color: string }[] = [
  { value: 'Fab', label: 'Fabrication', color: '#8b5cf6' },       // purple
  { value: 'Material', label: 'Materials', color: '#f59e0b' },    // amber
  { value: 'Equipment', label: 'Equipment', color: '#14b8a6' },   // teal
  { value: 'Design', label: 'Design', color: '#6b7280' },         // gray
]

export const RISK_LEVEL_OPTIONS: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'High', label: 'High Risk', color: '#ef4444' },
  { value: 'Medium', label: 'Medium Risk', color: '#f59e0b' },
  { value: 'Low', label: 'Low Risk', color: '#14b8a6' },
]

export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  material: '#f59e0b',   // amber
  equipment: '#14b8a6',  // teal
  design: '#6b7280',     // gray
  product: '#8b5cf6',    // purple
}

// Node colors by type
export const NODE_COLORS: Record<NodeType, string> = {
  Fab: '#8b5cf6',        // purple
  Material: '#f59e0b',   // amber
  Equipment: '#14b8a6',  // teal
  Design: '#6b7280',     // gray
}

// Risk indicator colors
export const RISK_COLORS: Record<RiskLevel, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#14b8a6',
}
