// Supply Chain Mapper Data
// Global semiconductor supply chain nodes and connections

export type NodeType = 'Fab' | 'Material' | 'Equipment' | 'Design' | 'Packaging' | 'IP'
export type RiskLevel = 'High' | 'Medium' | 'Low'
export type ConnectionType = 'material' | 'equipment' | 'design' | 'product' | 'packaging' | 'ip'
export type ConfidenceLevel = 'High' | 'Medium' | 'Low'
export type ScenarioId = 'baseline' | 'taiwan-disruption' | 'euv-constraint' | 'hbm-shortage' | 'export-controls'
export type ChipExposure = 'ai-accelerators' | 'automotive-mcus' | 'industrial-control' | 'networking' | 'consumer-devices'
export type SourcingFlexibility = 'single-source' | 'dual-source' | 'multi-source'
export type IndustrySector =
  | 'industrial-manufacturing'
  | 'automotive'
  | 'ai-infrastructure'
  | 'cloud-data-center'
  | 'consumer-electronics'
  | 'defence-aerospace'
  | 'medical-devices'
  | 'telecom-networking'
  | 'energy-utilities'

export interface EvidenceSource {
  label: string
  url: string
}

export interface NodeRiskProfile {
  exposure: number
  substitutability: number
  leadTime: number
  geopolitical: number
}

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
  riskProfile?: NodeRiskProfile
  leadTime?: string
  substitutability?: string
  mitigationOptions?: string[]
  supplierQuestions?: string[]
  signalsToWatch?: string[]
  evidence?: EvidenceSource[]
  lastReviewed?: string
  confidence?: ConfidenceLevel
  affects?: ChipExposure[]
}

export interface SupplyChainConnection {
  from: string
  to: string
  type: ConnectionType
  label?: string
}

export interface SupplyChainScenario {
  id: ScenarioId
  name: string
  summary: string
  affectedCountries: string[]
  affectedTypes: NodeType[]
  nodeMultipliers: Partial<Record<string, number>>
  responseMoves: string[]
}

export interface ExposureProfile {
  industry: IndustrySector
  chipExposure: ChipExposure
  sourcingFlexibility: SourcingFlexibility
  geography: string
}

export const INDUSTRY_SECTOR_OPTIONS: { value: IndustrySector; label: string }[] = [
  { value: 'industrial-manufacturing', label: 'Industrial manufacturing' },
  { value: 'automotive', label: 'Automotive / mobility' },
  { value: 'ai-infrastructure', label: 'AI infrastructure / accelerator buyer' },
  { value: 'cloud-data-center', label: 'Cloud / data centre' },
  { value: 'consumer-electronics', label: 'Consumer electronics' },
  { value: 'defence-aerospace', label: 'Defence / aerospace' },
  { value: 'medical-devices', label: 'Medical devices' },
  { value: 'telecom-networking', label: 'Telecom / networking' },
  { value: 'energy-utilities', label: 'Energy / utilities' },
]

export function getIndustrySectorLabel(value: IndustrySector): string {
  return INDUSTRY_SECTOR_OPTIONS.find((option) => option.value === value)?.label ?? value
}

const SOURCE_OECD_2025: EvidenceSource = {
  label: 'OECD semiconductor value-chain mapping, 2025',
  url: 'https://www.oecd.org/en/publications/mapping-the-semiconductor-value-chain_4154cdbf-en.html',
}

const SOURCE_CSET: EvidenceSource = {
  label: 'CSET semiconductor supply chain assessment',
  url: 'https://cset.georgetown.edu/publication/the-semiconductor-supply-chain/',
}

const SOURCE_DELOITTE: EvidenceSource = {
  label: 'Deloitte semiconductor shortage analysis',
  url: 'https://www2.deloitte.com/us/en/insights/industry/technology/semiconductor-chip-shortage-supply-chain.html',
}

const DEFAULT_REVIEWED = '2026-05-11'

const RISK_DEFAULTS: Record<RiskLevel, NodeRiskProfile> = {
  High: { exposure: 9, substitutability: 8, leadTime: 8, geopolitical: 8 },
  Medium: { exposure: 6, substitutability: 5, leadTime: 5, geopolitical: 5 },
  Low: { exposure: 3, substitutability: 3, leadTime: 3, geopolitical: 3 },
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
    riskProfile: { exposure: 10, substitutability: 9, leadTime: 9, geopolitical: 9 },
    leadTime: 'Meaningful alternative advanced-node capacity takes years, not quarters.',
    substitutability: 'Low for leading-edge logic and AI accelerator demand.',
    mitigationOptions: ['Identify package-level dependency on TSMC nodes', 'Separate mature-node and leading-edge exposure', 'Pre-negotiate allocation with design and EMS partners'],
    supplierQuestions: ['Which products depend on TSMC below 7nm?', 'Which second-source options are qualified today?', 'What allocation rights exist during foundry constraint?'],
    signalsToWatch: ['Taiwan Strait military activity', 'TSMC advanced-node capacity commentary', 'EUV tool delivery delays'],
    evidence: [SOURCE_OECD_2025, SOURCE_CSET],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'High',
    affects: ['ai-accelerators', 'consumer-devices', 'networking'],
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
    riskProfile: { exposure: 10, substitutability: 9, leadTime: 9, geopolitical: 9 },
    leadTime: 'Advanced-node substitution requires redesign, qualification, and committed capacity.',
    substitutability: 'Low for 5nm/3nm products already designed around TSMC processes.',
    mitigationOptions: ['Inventory product lines by process node', 'Prioritise revenue-critical SKUs for allocation planning', 'Model redesign cost for alternative nodes'],
    supplierQuestions: ['Which SKUs are on 5nm/3nm?', 'What is the foundry allocation path during disruption?', 'Can any designs be ported to mature or alternative nodes?'],
    signalsToWatch: ['TSMC 3nm/2nm ramp news', 'Taiwan power/water constraints', 'Cross-strait insurance and shipping signals'],
    evidence: [SOURCE_OECD_2025, SOURCE_CSET],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'High',
    affects: ['ai-accelerators', 'consumer-devices'],
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
    riskProfile: { exposure: 8, substitutability: 6, leadTime: 7, geopolitical: 6 },
    leadTime: 'Memory supply can reprice quickly; qualified alternatives still depend on package and controller compatibility.',
    substitutability: 'Medium for standard memory, lower for advanced HBM-adjacent needs.',
    mitigationOptions: ['Segment commodity DRAM from HBM exposure', 'Confirm approved vendor list breadth', 'Track memory price and allocation triggers'],
    supplierQuestions: ['Which products require Samsung-specific DRAM or NAND?', 'What alternates are qualified?', 'What inventory buffer exists for memory components?'],
    signalsToWatch: ['Korean memory capex signals', 'HBM allocation announcements', 'EUV memory layer demand'],
    evidence: [SOURCE_CSET, SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'Medium',
    affects: ['ai-accelerators', 'consumer-devices', 'networking'],
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
    riskProfile: { exposure: 9, substitutability: 7, leadTime: 8, geopolitical: 6 },
    leadTime: 'HBM commitments are capacity-constrained and usually locked far ahead of demand.',
    substitutability: 'Low for AI accelerator packages tied to specific HBM generations.',
    mitigationOptions: ['Map HBM generation exposure', 'Confirm allocation through accelerator vendor', 'Create fallbacks for non-HBM compute workloads'],
    supplierQuestions: ['Which accelerators require SK Hynix HBM?', 'Are HBM allocations committed or forecast-only?', 'What lower-memory alternatives preserve operations?'],
    signalsToWatch: ['HBM3E/HBM4 qualification news', 'Nvidia/SK Hynix supply agreements', 'Korean memory export and capex signals'],
    evidence: [SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'Medium',
    affects: ['ai-accelerators'],
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
    riskProfile: { exposure: 7, substitutability: 6, leadTime: 6, geopolitical: 9 },
    leadTime: 'Purification capacity can shift, but high-purity semiconductor qualification is not immediate.',
    substitutability: 'Medium; alternatives exist but require quality assurance and contract coverage.',
    mitigationOptions: ['Ask fabs about qualified noble gas sources', 'Confirm buffer stock assumptions', 'Track gas supplier geographic concentration'],
    supplierQuestions: ['Which noble gas suppliers support the fab process?', 'What purity and stockpile assumptions are in place?', 'Have alternate sources been qualified since 2022?'],
    signalsToWatch: ['Ukraine infrastructure disruptions', 'Rare gas price spikes', 'Fab notices on consumables'],
    evidence: [SOURCE_CSET, SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'Medium',
    affects: ['ai-accelerators', 'automotive-mcus', 'industrial-control', 'consumer-devices', 'networking'],
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
    riskProfile: { exposure: 8, substitutability: 8, leadTime: 7, geopolitical: 4 },
    leadTime: 'Material qualification is slow because process recipes are tightly tuned.',
    substitutability: 'Low for advanced EUV processes.',
    mitigationOptions: ['Confirm resist supplier diversity through foundry partners', 'Track Japan/Taiwan local production moves', 'Separate EUV and non-EUV product exposure'],
    supplierQuestions: ['Which photoresist family is used for critical layers?', 'Are second sources process-qualified?', 'What is the fab response plan for chemical allocation?'],
    signalsToWatch: ['Japanese chemical export rules', 'Photoresist capacity announcements', 'High-NA EUV material readiness'],
    evidence: [SOURCE_OECD_2025, SOURCE_CSET],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'Medium',
    affects: ['ai-accelerators', 'consumer-devices', 'networking'],
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
    riskProfile: { exposure: 10, substitutability: 10, leadTime: 10, geopolitical: 7 },
    leadTime: 'EUV capacity is governed by specialised machines, subcomponents, and long installation cycles.',
    substitutability: 'Very low; no practical alternative exists for advanced EUV lithography.',
    mitigationOptions: ['Separate EUV-dependent products from mature-node products', 'Track foundry tool allocation and install base', 'Model delayed node migration scenarios'],
    supplierQuestions: ['Which products require EUV layers?', 'What tool-capacity assumptions sit behind supplier forecasts?', 'What happens if node migration slips by 12-24 months?'],
    signalsToWatch: ['ASML backlog and shipment commentary', 'Export control changes', 'High-NA adoption timing'],
    evidence: [SOURCE_DELOITTE, SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'High',
    affects: ['ai-accelerators', 'consumer-devices', 'networking'],
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
    riskProfile: { exposure: 9, substitutability: 10, leadTime: 10, geopolitical: 3 },
    leadTime: 'Precision optics capacity cannot be duplicated quickly.',
    substitutability: 'Very low; effectively a sole-source EUV subsystem.',
    mitigationOptions: ['Treat ASML exposure as a sub-tier European dependency', 'Monitor optics capacity expansion', 'Avoid assuming foundry diversification removes EUV exposure'],
    supplierQuestions: ['Does foundry capacity rely on new EUV installs?', 'Which fabs are exposed to High-NA transition timing?', 'What mature-node fallback exists?'],
    signalsToWatch: ['ZEISS SMT capacity signals', 'ASML EUV shipment cadence', 'High-NA optics production updates'],
    evidence: [SOURCE_DELOITTE, SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'High',
    affects: ['ai-accelerators', 'consumer-devices', 'networking'],
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
    riskProfile: { exposure: 9, substitutability: 10, leadTime: 10, geopolitical: 3 },
    leadTime: 'EUV light-source production is a specialist bottleneck with long engineering cycles.',
    substitutability: 'Very low; EUV systems depend on specialised laser subsystems.',
    mitigationOptions: ['Include EUV subsystems in board-level risk narrative', 'Track laser supplier capacity and ASML install targets', 'Plan for tool delivery slippage'],
    supplierQuestions: ['Are supplier forecasts dependent on new EUV tools?', 'What lead-time assumptions are baked into capacity plans?', 'Which products can run on installed capacity only?'],
    signalsToWatch: ['TRUMPF laser production updates', 'ASML lead-time commentary', 'High-NA EUV ramp news'],
    evidence: [SOURCE_DELOITTE, SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'High',
    affects: ['ai-accelerators', 'consumer-devices', 'networking'],
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

  // === PACKAGING AND SUBSTRATES ===
  {
    id: 'tsmc-cowos',
    name: 'TSMC CoWoS Packaging',
    coordinates: [120.6839, 24.1477],
    type: 'Packaging',
    risk: 'High',
    details: 'Advanced packaging capacity for AI accelerators. Logic dies and HBM are integrated here, making packaging throughput a direct AI hardware constraint.',
    impact: 'AI accelerator supply is constrained even when front-end wafer capacity is available.',
    marketShare: 'Dominant advanced AI packaging route',
    country: 'Taiwan',
    dependencies: ['tsmc-hsinchu', 'sk-hynix-icheon', 'abf-substrates-japan'],
    riskProfile: { exposure: 10, substitutability: 8, leadTime: 9, geopolitical: 9 },
    leadTime: 'Advanced packaging capacity expansion requires specialist tools, substrate supply, and customer qualification.',
    substitutability: 'Low for accelerator designs already qualified on CoWoS-like flows.',
    mitigationOptions: ['Map accelerator exposure to packaging technology', 'Ask vendors whether constraint is wafer, HBM, or packaging', 'Prioritise workloads that can run on non-CoWoS hardware'],
    supplierQuestions: ['Which package technology does the accelerator use?', 'Is delivery constrained by CoWoS capacity?', 'What is the committed allocation versus forecast demand?'],
    signalsToWatch: ['TSMC advanced packaging capex', 'Nvidia and AMD accelerator allocation', 'Substrate shortage commentary'],
    evidence: [SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'Medium',
    affects: ['ai-accelerators'],
  },
  {
    id: 'abf-substrates-japan',
    name: 'ABF Substrate Film',
    coordinates: [139.7671, 35.6812],
    type: 'Material',
    risk: 'High',
    details: 'Critical build-up film used in high-performance chip packages. Substrate shortages can throttle server CPUs, GPUs, and networking silicon.',
    impact: 'Packaging bottlenecks and delayed high-end compute/networking hardware.',
    marketShare: 'Highly concentrated specialist material',
    country: 'Japan',
    riskProfile: { exposure: 8, substitutability: 8, leadTime: 8, geopolitical: 4 },
    leadTime: 'Substrate material and package qualification normally move on multi-quarter timelines.',
    substitutability: 'Low for already-qualified high-performance packages.',
    mitigationOptions: ['Ask suppliers about package substrate allocation', 'Separate standard PCB risk from advanced package substrate risk', 'Monitor substrate vendor expansion'],
    supplierQuestions: ['Which package substrate is used?', 'Are alternative substrate suppliers qualified?', 'What is the substrate allocation policy under shortage?'],
    signalsToWatch: ['ABF substrate pricing', 'Package substrate capex', 'AI server lead-time changes'],
    evidence: [SOURCE_OECD_2025, SOURCE_CSET],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'Medium',
    affects: ['ai-accelerators', 'networking'],
  },
  {
    id: 'hbm-korea',
    name: 'HBM Supply Cluster',
    coordinates: [127.7669, 35.9078],
    type: 'Packaging',
    risk: 'High',
    details: 'High Bandwidth Memory supply is concentrated among a small number of memory vendors and tightly coupled to AI accelerator packaging.',
    impact: 'AI systems become memory-bound or unavailable even when logic dies are manufactured.',
    marketShare: 'Concentrated HBM supply base',
    country: 'South Korea',
    dependencies: ['sk-hynix-icheon', 'samsung-pyeongtaek', 'micron-hiroshima'],
    riskProfile: { exposure: 10, substitutability: 7, leadTime: 8, geopolitical: 6 },
    leadTime: 'HBM generation changes require design qualification and package integration.',
    substitutability: 'Low for specific accelerator SKUs; medium across broader compute strategy.',
    mitigationOptions: ['Avoid planning solely around one accelerator SKU', 'Confirm HBM generation and allocation', 'Create workload fallbacks for lower-bandwidth hardware'],
    supplierQuestions: ['Which HBM generation is used?', 'Who owns memory allocation risk?', 'Can the workload run on alternative accelerators?'],
    signalsToWatch: ['HBM3E/HBM4 supply agreements', 'Memory vendor capex', 'AI accelerator shipment revisions'],
    evidence: [SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'Medium',
    affects: ['ai-accelerators'],
  },

  // === IP AND DESIGN SOFTWARE ===
  {
    id: 'eda-us',
    name: 'EDA Software Stack',
    coordinates: [-121.8949, 37.3394],
    type: 'IP',
    risk: 'High',
    details: 'Chip design depends on specialised electronic design automation tools and IP ecosystems concentrated in a small supplier base.',
    impact: 'Design schedules slip, export-controlled customers lose access, and silicon respins become harder.',
    marketShare: 'Concentrated US-led EDA ecosystem',
    country: 'USA',
    riskProfile: { exposure: 7, substitutability: 8, leadTime: 8, geopolitical: 8 },
    leadTime: 'EDA migration is a deep engineering change, not a procurement swap.',
    substitutability: 'Low for complex chips already built around specific toolchains.',
    mitigationOptions: ['Inventory design-tool dependency in strategic suppliers', 'Track export-control exposure', 'Ask ASIC vendors about toolchain continuity'],
    supplierQuestions: ['Which EDA tools and IP blocks are used?', 'Could export controls affect access?', 'What is the validated fallback flow?'],
    signalsToWatch: ['US export-control updates', 'EDA vendor licensing changes', 'China substitution policy'],
    evidence: [SOURCE_CSET, SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'High',
    affects: ['ai-accelerators', 'automotive-mcus', 'industrial-control', 'networking', 'consumer-devices'],
  },
  {
    id: 'gallium-germanium-china',
    name: 'Gallium/Germanium Processing',
    coordinates: [116.4074, 39.9042],
    type: 'Material',
    risk: 'High',
    details: 'Export-controlled critical materials used across compound semiconductors, optoelectronics, and adjacent electronics supply chains.',
    impact: 'Pressure on power electronics, RF, optical components, and strategic materials pricing.',
    marketShare: 'China-dominant processing leverage',
    country: 'China',
    riskProfile: { exposure: 7, substitutability: 7, leadTime: 7, geopolitical: 9 },
    leadTime: 'Alternative refining and qualification can take multiple quarters or longer.',
    substitutability: 'Medium to low depending on component class.',
    mitigationOptions: ['Identify compound semiconductor exposure', 'Track supplier country-of-origin declarations', 'Pre-qualify non-China material channels where possible'],
    supplierQuestions: ['Do components use gallium or germanium inputs?', 'What country-of-origin controls apply?', 'Are alternate material suppliers qualified?'],
    signalsToWatch: ['China export licensing changes', 'Critical minerals price spikes', 'EU/US strategic stockpile announcements'],
    evidence: [SOURCE_OECD_2025],
    lastReviewed: DEFAULT_REVIEWED,
    confidence: 'Medium',
    affects: ['automotive-mcus', 'industrial-control', 'networking'],
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

  // Foundry and package capacity to design houses
  { from: 'tsmc-hsinchu', to: 'nvidia-santaclara', type: 'product', label: 'GPU foundry capacity' },
  { from: 'tsmc-cowos', to: 'nvidia-santaclara', type: 'packaging', label: 'AI accelerator packaging' },
  { from: 'tsmc-hsinchu', to: 'amd-santaclara', type: 'product', label: 'CPU/GPU foundry capacity' },
  { from: 'tsmc-hsinchu', to: 'qualcomm-sandiego', type: 'product', label: 'Mobile SoC foundry capacity' },
  { from: 'samsung-pyeongtaek', to: 'qualcomm-sandiego', type: 'product', label: 'Mobile SoC foundry capacity' },
  { from: 'tsmc-hsinchu', to: 'broadcom-sanjose', type: 'product', label: 'Networking chip foundry capacity' },

  // HBM supply chain
  { from: 'sk-hynix-icheon', to: 'nvidia-santaclara', type: 'product', label: 'HBM memory' },
  { from: 'sk-hynix-icheon', to: 'hbm-korea', type: 'product', label: 'HBM dies' },
  { from: 'samsung-pyeongtaek', to: 'hbm-korea', type: 'product', label: 'HBM dies' },
  { from: 'micron-hiroshima', to: 'hbm-korea', type: 'product', label: 'HBM dies' },
  { from: 'hbm-korea', to: 'tsmc-cowos', type: 'packaging', label: 'HBM stacks' },
  { from: 'tsmc-hsinchu', to: 'tsmc-cowos', type: 'product', label: 'Logic dies' },
  { from: 'abf-substrates-japan', to: 'tsmc-cowos', type: 'material', label: 'Package substrates' },
  { from: 'eda-us', to: 'nvidia-santaclara', type: 'ip', label: 'Design toolchain' },
  { from: 'eda-us', to: 'amd-santaclara', type: 'ip', label: 'Design toolchain' },
  { from: 'eda-us', to: 'qualcomm-sandiego', type: 'ip', label: 'Design toolchain' },
  { from: 'eda-us', to: 'broadcom-sanjose', type: 'ip', label: 'Design toolchain' },
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

export function getNodeRiskProfile(node: SupplyChainNode): NodeRiskProfile {
  return node.riskProfile ?? RISK_DEFAULTS[node.risk]
}

export function getNodeRiskScore(node: SupplyChainNode): number {
  const profile = getNodeRiskProfile(node)
  return Math.round((profile.exposure + profile.substitutability + profile.leadTime + profile.geopolitical) / 4)
}

export function getScenarioMultiplier(node: SupplyChainNode, scenarioId: ScenarioId): number {
  const scenario = SUPPLY_CHAIN_SCENARIOS.find(item => item.id === scenarioId)
  if (!scenario || scenario.id === 'baseline') return 1
  return scenario.nodeMultipliers[node.id]
    ?? (scenario.affectedCountries.includes(node.country) ? 1.35 : 1)
    * (scenario.affectedTypes.includes(node.type) ? 1.2 : 1)
}

export function getScenarioAdjustedScore(node: SupplyChainNode, scenarioId: ScenarioId): number {
  return Math.min(10, Math.round(getNodeRiskScore(node) * getScenarioMultiplier(node, scenarioId)))
}

// Industry-sector weighting against node type. Values >1 raise relative exposure
// for a node when it sits in the bottleneck the sector actually depends on; <1
// damps nodes the sector cares less about. Designed to nudge top-N rankings,
// not to dominate them — chip class and scenario remain the primary drivers.
const INDUSTRY_NODE_TYPE_WEIGHTS: Record<IndustrySector, Partial<Record<NodeType, number>>> = {
  'industrial-manufacturing': { Material: 1.15, Equipment: 1.1, Fab: 1.05 },
  automotive: { Packaging: 1.15, Fab: 1.1, Material: 1.1 },
  'ai-infrastructure': { Packaging: 1.2, Fab: 1.15, Design: 1.15, IP: 1.05 },
  'cloud-data-center': { Fab: 1.15, Packaging: 1.15, Design: 1.1 },
  'consumer-electronics': { Fab: 1.1, Packaging: 1.05 },
  'defence-aerospace': { Material: 1.2, IP: 1.15, Equipment: 1.1, Fab: 1.05 },
  'medical-devices': { Material: 1.1, Equipment: 1.05 },
  'telecom-networking': { Fab: 1.1, Design: 1.1, IP: 1.05 },
  'energy-utilities': { Material: 1.15, Equipment: 1.1 },
}

// A few sectors care disproportionately about specific countries; allows targeted
// boosts (e.g., automotive on Japan/Germany for materials and analog).
const INDUSTRY_COUNTRY_WEIGHTS: Partial<Record<IndustrySector, Partial<Record<string, number>>>> = {
  automotive: { Germany: 1.1, Japan: 1.08 },
  'defence-aerospace': { USA: 1.08, Netherlands: 1.05 },
  'ai-infrastructure': { Taiwan: 1.1, 'South Korea': 1.08 },
  'cloud-data-center': { Taiwan: 1.08, 'South Korea': 1.05 },
}

function getIndustryMultiplier(node: SupplyChainNode, industry: IndustrySector): number {
  const typeWeight = INDUSTRY_NODE_TYPE_WEIGHTS[industry]?.[node.type] ?? 1
  const countryWeight = INDUSTRY_COUNTRY_WEIGHTS[industry]?.[node.country] ?? 1
  return typeWeight * countryWeight
}

export function scoreNodeForExposure(
  node: SupplyChainNode,
  profile: ExposureProfile,
  scenarioId: ScenarioId
): number {
  const baseScore = getScenarioAdjustedScore(node, scenarioId)
  const chipMatch = node.affects?.includes(profile.chipExposure) ? 1.25 : 1
  const sourcingMultiplier = profile.sourcingFlexibility === 'single-source'
    ? 1.25
    : profile.sourcingFlexibility === 'dual-source'
      ? 1.08
      : 0.92
  const geographyMultiplier = profile.geography === 'europe' && ['Netherlands', 'Germany', 'Ireland', 'UK'].includes(node.country)
    ? 1.12
    : profile.geography === 'asia' && ['Taiwan', 'South Korea', 'Japan', 'China'].includes(node.country)
      ? 1.12
      : 1
  const industryMultiplier = getIndustryMultiplier(node, profile.industry)

  return Math.min(10, Math.round(baseScore * chipMatch * sourcingMultiplier * geographyMultiplier * industryMultiplier))
}

export function getTopExposureNodes(
  profile: ExposureProfile,
  scenarioId: ScenarioId,
  limit = 5
): Array<SupplyChainNode & { exposureScore: number }> {
  return SUPPLY_CHAIN_NODES
    .map(node => ({ ...node, exposureScore: scoreNodeForExposure(node, profile, scenarioId) }))
    .sort((a, b) => b.exposureScore - a.exposureScore)
    .slice(0, limit)
}

export const SUPPLY_CHAIN_SCENARIOS: SupplyChainScenario[] = [
  {
    id: 'baseline',
    name: 'Baseline',
    summary: 'Normal volatility. Scores reflect structural concentration and substitution difficulty.',
    affectedCountries: [],
    affectedTypes: [],
    nodeMultipliers: {},
    responseMoves: ['Map single-source parts', 'Confirm qualified alternates', 'Review allocation rights'],
  },
  {
    id: 'taiwan-disruption',
    name: 'Taiwan Disruption',
    summary: 'A Taiwan Strait shock affects advanced logic, packaging, shipping, insurance, and customer allocation.',
    affectedCountries: ['Taiwan'],
    affectedTypes: ['Fab', 'Packaging'],
    nodeMultipliers: {
      'tsmc-hsinchu': 1.55,
      'tsmc-tainan': 1.55,
      'tsmc-cowos': 1.65,
      'nvidia-santaclara': 1.25,
      'amd-santaclara': 1.2,
      'qualcomm-sandiego': 1.15,
    },
    responseMoves: ['Rank products by Taiwan dependency', 'Separate front-end wafer and packaging exposure', 'Brief leadership on allocation and redesign options'],
  },
  {
    id: 'euv-constraint',
    name: 'EUV Constraint',
    summary: 'Lithography tool or subsystem constraints slow advanced-node capacity expansion and node migration.',
    affectedCountries: ['Netherlands', 'Germany'],
    affectedTypes: ['Equipment'],
    nodeMultipliers: {
      'asml-veldhoven': 1.55,
      'zeiss-oberkochen': 1.55,
      'trumpf-germany': 1.55,
      'tsmc-hsinchu': 1.2,
      'tsmc-tainan': 1.2,
      'samsung-pyeongtaek': 1.15,
      'sk-hynix-icheon': 1.15,
    },
    responseMoves: ['Test 12-24 month node migration delays', 'Identify mature-node fallbacks', 'Track tool delivery exposure in supplier forecasts'],
  },
  {
    id: 'hbm-shortage',
    name: 'HBM Shortage',
    summary: 'AI hardware availability is limited by memory stacks and advanced package integration.',
    affectedCountries: ['South Korea', 'Taiwan', 'Japan'],
    affectedTypes: ['Packaging', 'Fab'],
    nodeMultipliers: {
      'hbm-korea': 1.65,
      'sk-hynix-icheon': 1.45,
      'samsung-pyeongtaek': 1.25,
      'micron-hiroshima': 1.25,
      'tsmc-cowos': 1.45,
      'nvidia-santaclara': 1.35,
    },
    responseMoves: ['Classify workloads by HBM dependency', 'Ask accelerator vendors for allocation evidence', 'Create lower-bandwidth compute fallbacks'],
  },
  {
    id: 'export-controls',
    name: 'Export-Control Escalation',
    summary: 'Policy restrictions affect access to advanced tools, EDA, critical materials, or China-linked supply routes.',
    affectedCountries: ['China', 'USA', 'Netherlands'],
    affectedTypes: ['Equipment', 'IP', 'Material'],
    nodeMultipliers: {
      'eda-us': 1.5,
      'asml-veldhoven': 1.3,
      'rare-earths-china': 1.45,
      'gallium-germanium-china': 1.55,
      'photoresist-japan': 1.15,
    },
    responseMoves: ['Screen supplier exposure to controlled countries', 'Confirm licence dependencies', 'Build an export-control watchlist for critical components'],
  },
]

// --- Filter Options ---

export const NODE_TYPE_OPTIONS: { value: NodeType; label: string; color: string }[] = [
  { value: 'Fab', label: 'Fabrication', color: '#8b5cf6' },       // purple
  { value: 'Material', label: 'Materials', color: '#f59e0b' },    // amber
  { value: 'Equipment', label: 'Equipment', color: '#14b8a6' },   // teal
  { value: 'Design', label: 'Design', color: '#6b7280' },         // gray
  { value: 'Packaging', label: 'Packaging', color: '#38bdf8' },   // sky
  { value: 'IP', label: 'IP/EDA', color: '#f43f5e' },             // rose
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
  packaging: '#38bdf8',  // sky
  ip: '#f43f5e',         // rose
}

// Node colors by type
export const NODE_COLORS: Record<NodeType, string> = {
  Fab: '#8b5cf6',        // purple
  Material: '#f59e0b',   // amber
  Equipment: '#14b8a6',  // teal
  Design: '#6b7280',     // gray
  Packaging: '#38bdf8',  // sky
  IP: '#f43f5e',         // rose
}

// Risk indicator colors
export const RISK_COLORS: Record<RiskLevel, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#14b8a6',
}
