// Scenario Modeler Data
// Geopolitical scenarios aligned with "Scenario-Based Drift Modelling" methodology.

import type {
  BoardBrief,
  ExposureDependency,
  ExposureProfile,
  ExposureSector,
  FrictionLevel,
  Scenario,
  SectorImpact,
} from '@/types/scenario'

export const DEFAULT_EXPOSURE_PROFILE: ExposureProfile = {
  sector: 'industrial',
  geography: 'europe',
  dependency: 'advanced-chips',
  sourcing: 'dual-source',
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'taiwan-strait',
    name: 'Taiwan Strait Advanced Logic & Packaging Shock',
    shortName: 'Taiwan Shock',
    frictionLevel: 'high',
    triggerEvent: 'Taiwan blockade, quarantine, or kinetic escalation disrupts leading-edge wafer output, CoWoS packaging, shipping, and insurance',
    timeframe: '2026-2028',
    probability: '15-25%',
    confidence: 'Medium',
    description: 'A Taiwan Strait shock remains the highest-severity technology value-chain scenario. The risk is no longer only front-end wafers: advanced packaging, HBM integration, freight insurance, and customer allocation would all become binding constraints.',
    impacts: [
      {
        sector: 'Semiconductors',
        valueAtStake: '€520B',
        valueNumeric: 520,
        severity: 'severe',
        description: 'Leading-edge wafers, CoWoS packaging, and foundry allocation become unavailable or politically rationed.',
      },
      {
        sector: 'AI/Cloud',
        valueAtStake: '€260B',
        valueNumeric: 260,
        severity: 'severe',
        description: 'Accelerator deliveries stall as logic dies, HBM stacks, and advanced packaging cannot be recombined quickly elsewhere.',
      },
      {
        sector: 'Consumer Electronics',
        valueAtStake: '€240B',
        valueNumeric: 240,
        severity: 'severe',
        description: 'Premium phones, laptops, networking gear, and edge devices face immediate allocation pressure.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€170B',
        valueNumeric: 170,
        severity: 'severe',
        description: 'ADAS, infotainment, connectivity, and EV control systems suffer from both chip scarcity and logistics disruption.',
      },
      {
        sector: 'Defence',
        valueAtStake: '€90B',
        valueNumeric: 90,
        severity: 'severe',
        description: 'Advanced compute, secure communications, sensing, and weapons-system electronics face priority allocation conflicts.',
      },
      {
        sector: 'Medical Devices',
        valueAtStake: '€55B',
        valueNumeric: 55,
        severity: 'negative',
        description: 'Imaging, diagnostics, robotics, and connected-care platforms lose access to specialist components.',
      },
    ],
    cascade: {
      primary: 'Taiwan logistics and fab output constrained -> advanced logic and packaging allocation freezes',
      secondary: 'AI accelerators, premium electronics, and connected industrial products miss production windows',
      tertiary: 'Governments ration strategic supply -> accelerated allied fabs, stockpiles, and redesign mandates',
    },
    keyIndicators: [
      'PLA blockade rehearsal activity, quarantine language, or persistent grey-zone maritime disruption',
      'Shipping, air-cargo, and political-risk insurance repricing around Taiwan routes',
      'TSMC customer allocation commentary and advanced-packaging lead-time changes',
      'US, Japan, and EU emergency semiconductor-stockpile or export-priority measures',
    ],
    mitigationOptions: [
      'Separate product exposure into wafer, packaging, HBM, substrate, and logistics dependencies',
      'Qualify mature-node fallbacks for control systems and non-performance-critical functions',
      'Pre-negotiate allocation rights for strategic SKUs and service-level exceptions',
      'Build redesign pathways that reduce leading-edge and Taiwan-packaging dependency over 12-24 months',
    ],
    evidenceNotes: [
      {
        fact: 'TSMC reported that 7nm-and-below technologies remained the majority of wafer revenue in 2025, with 2nm entering high-volume manufacturing in Q4 2025.',
        implication: 'Taiwan concentration remains most acute exactly where AI, HPC, and premium electronics demand is growing.',
      },
      {
        fact: 'Recent AI-chip supply-chain work identifies CoWoS advanced packaging and HBM, not only logic dies, as binding accelerator constraints.',
        implication: 'Scenario impact should model packaging and memory integration, not just foundry wafer starts.',
      },
    ],
    boardBrief: {
      firstImpact: 'Allocation shock for advanced logic, CoWoS capacity, HBM-integrated accelerators, and Taiwan-linked logistics.',
      ninetyDayAction: 'Rank revenue-critical products by Taiwan wafer, packaging, HBM, substrate, and shipping dependency.',
      twelveMonthHedge: 'Fund redesigns that can run on qualified mature-node or non-Taiwan packaged alternatives where performance allows.',
      escalationTrigger: 'Persistent Taiwan route insurance repricing, quarantine language, or TSMC allocation restrictions.',
    },
    exposureWeights: {
      sectors: { 'ai-cloud': 1.35, automotive: 1.2, industrial: 1.1, healthcare: 1.05, 'consumer-tech': 1.25 },
      geographies: { asia: 1.25, global: 1.15, europe: 1.1, 'north-america': 1.05 },
      dependencies: { 'advanced-chips': 1.35, 'cloud-ai': 1.25, 'connected-products': 1.15 },
      sourcing: { 'single-source': 1.3, 'dual-source': 1.1, diversified: 0.85 },
    },
  },
  {
    id: 'us-export-controls',
    name: 'US-China Controls & Retaliation Spiral',
    shortName: 'Controls Spiral',
    frictionLevel: 'medium',
    triggerEvent: 'US advanced-computing, HBM, model-weight, equipment, and Entity List controls are expanded while China retaliates through minerals, procurement, or licensing',
    timeframe: '2026-2027',
    probability: '55-70%',
    confidence: 'High',
    description: 'The export-control scenario has already moved beyond the October 2022 baseline. The sharper 2026 risk is a rolling controls-and-retaliation cycle affecting AI accelerators, HBM, semiconductor equipment, EDA access, minerals, and customer due diligence.',
    impacts: [
      {
        sector: 'Semiconductors',
        valueAtStake: '€160B',
        valueNumeric: 160,
        severity: 'negative',
        description: 'Revenue, tooling, foundry, and compliance exposure rise as licenses and end-use checks tighten.',
      },
      {
        sector: 'AI/Cloud',
        valueAtStake: '€130B',
        valueNumeric: 130,
        severity: 'negative',
        description: 'Advanced accelerator sales, model deployment, and cloud capacity planning become jurisdiction-sensitive.',
      },
      {
        sector: 'Equipment & EDA',
        valueAtStake: '€75B',
        valueNumeric: 75,
        severity: 'negative',
        description: 'Toolmakers and design-stack providers face lower China access and more diversion liability.',
      },
      {
        sector: 'Materials',
        valueAtStake: '€55B',
        valueNumeric: 55,
        severity: 'negative',
        description: 'Rare earth, gallium, germanium, graphite, and magnet supply can be used as reciprocal leverage.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€45B',
        valueNumeric: 45,
        severity: 'neutral',
        description: 'EVs and connected vehicles face China sourcing exposure, but many mature-node dependencies are manageable.',
      },
      {
        sector: 'Industrial',
        valueAtStake: '€40B',
        valueNumeric: 40,
        severity: 'neutral',
        description: 'Factory automation and robotics absorb compliance cost while benefiting from selective reshoring demand.',
      },
    ],
    cascade: {
      primary: 'Controls expand -> advanced AI chips, HBM, equipment, and model assets require stricter licensing',
      secondary: 'China retaliation and diversion controls raise materials, procurement, and customer-screening costs',
      tertiary: 'Technology stacks regionalise -> dual product lines, dual clouds, and parallel compliance teams become normal',
    },
    keyIndicators: [
      'BIS updates to advanced-computing, HBM, AI model, foundry due-diligence, or Entity List rules',
      'Chinese rare-earth, magnet, graphite, gallium, or germanium licensing measures',
      'Allied alignment or disagreement from Japan, the Netherlands, South Korea, and Taiwan',
      'Major chip, cloud, or equipment-company disclosures on China revenue, inventory, and licenses',
    ],
    mitigationOptions: [
      'Build export-control classification and end-use screening into product release governance',
      'Separate China-permitted, allied-market, and restricted product configurations',
      'Map critical minerals and advanced-memory exposure before contract renewal cycles',
      'Prepare customer communications for license delays, substitution limits, and allocation decisions',
    ],
    evidenceNotes: [
      {
        fact: 'BIS strengthened China-focused semiconductor controls in December 2024, including HBM, equipment, software, red-flag guidance, and 140 Entity List additions.',
        implication: 'The scenario is no longer hypothetical expansion of 2022 controls; it is an active rolling policy instrument.',
      },
      {
        fact: 'January 2025 AI diffusion rules added advanced-computing and AI-model controls to the policy stack.',
        implication: 'AI value chains now need to track compute, model, cloud, and customer-location exposure together.',
      },
    ],
    boardBrief: {
      firstImpact: 'License delays, customer eligibility reviews, and uncertainty around China-linked revenue and supply inputs.',
      ninetyDayAction: 'Create a board-visible register of controlled products, customers, countries, suppliers, and minerals exposure.',
      twelveMonthHedge: 'Split product and cloud architectures so restricted and non-restricted markets can be served without ad hoc redesign.',
      escalationTrigger: 'New BIS controls paired with Chinese mineral licensing or procurement retaliation in the same quarter.',
    },
    exposureWeights: {
      sectors: { 'ai-cloud': 1.3, industrial: 1.1, automotive: 1.05, 'consumer-tech': 1.05 },
      geographies: { asia: 1.25, global: 1.15, 'north-america': 1.1, europe: 1.05 },
      dependencies: { 'advanced-chips': 1.25, 'cloud-ai': 1.25, 'connected-products': 1.1, 'data-services': 1.05 },
      sourcing: { 'single-source': 1.25, 'dual-source': 1.08, diversified: 0.9 },
    },
  },
  {
    id: 'eu-autonomy',
    name: 'EU Strategic Autonomy Execution Gap',
    shortName: 'EU Gap',
    frictionLevel: 'low',
    triggerEvent: 'EU Chips Act delivery continues, but advanced-node, packaging, skills, permitting, and project-delay gaps limit autonomy gains',
    timeframe: '2026-2030',
    probability: '65-80%',
    confidence: 'High',
    description: 'EU semiconductor autonomy is real but uneven. Dresden, IMEC, equipment champions, and power electronics matter, but delays to flagship projects and limited leading-edge volume mean resilience improves first in automotive, industrial, R&D, and specialty nodes rather than frontier AI compute.',
    impacts: [
      {
        sector: 'Automotive',
        valueAtStake: '€55B',
        valueNumeric: 55,
        severity: 'positive',
        description: 'European capacity at 28/22nm and 16/12nm improves resilience for automotive and embedded applications.',
      },
      {
        sector: 'Industrial',
        valueAtStake: '€45B',
        valueNumeric: 45,
        severity: 'positive',
        description: 'Power, sensing, control, and automation supply chains benefit from local capability.',
      },
      {
        sector: 'Equipment',
        valueAtStake: '€40B',
        valueNumeric: 40,
        severity: 'positive',
        description: 'ASML, optics, metrology, and research infrastructure remain strategic European strengths.',
      },
      {
        sector: 'Semiconductors',
        valueAtStake: '€35B',
        valueNumeric: 35,
        severity: 'neutral',
        description: 'New projects help, but leading-edge logic and advanced packaging dependence remains material.',
      },
      {
        sector: 'AI/Cloud',
        valueAtStake: '€30B',
        valueNumeric: 30,
        severity: 'neutral',
        description: 'Europe gains research and selective supply resilience but still imports most frontier AI accelerators.',
      },
      {
        sector: 'Materials & Skills',
        valueAtStake: '€25B',
        valueNumeric: 25,
        severity: 'negative',
        description: 'Permitting, power, water, skills, and supplier depth become the limiting factors for execution.',
      },
    ],
    cascade: {
      primary: 'Chips Act projects progress unevenly -> automotive and industrial capacity improves before frontier AI autonomy',
      secondary: 'Policy expectations outrun near-term capacity -> procurement claims require verification',
      tertiary: 'Europe shifts from full autonomy rhetoric to targeted dependency reduction and trusted interdependence',
    },
    keyIndicators: [
      'ESMC Dresden construction, equipment move-in, and late-2027 production milestones',
      'Intel Magdeburg reassessment, subsidy renegotiation, or cancellation signals',
      'EU pilot-line funding, advanced packaging initiatives, and skills-program delivery',
      'Public procurement or subsidy rules that attach local-content or resilience conditions',
    ],
    mitigationOptions: [
      'Treat EU sourcing as a resilience layer, not a full substitute for Asian leading-edge supply',
      'Prioritise European alternatives for automotive, industrial, power, sensing, and control workloads',
      'Audit supplier claims against node, package, capacity, qualification, and volume-readiness evidence',
      'Align subsidy applications with measurable supply resilience rather than autonomy slogans',
    ],
    evidenceNotes: [
      {
        fact: 'The European Chips Act aims to double the EU share of global semiconductor production to 20% by 2030, while the Chips for Europe Initiative is backed by EU budget funding.',
        implication: 'The policy direction is stable, but the practical question is which parts of the stack Europe can strengthen first.',
      },
      {
        fact: 'ESMC Dresden is focused on 28/22nm and 16/12nm capacity for automotive, industrial, IoT, and telecom, while Intel Magdeburg has been delayed.',
        implication: 'The near-term value is resilience in strategic mature and specialty nodes, not immediate independence in 2nm-class AI chips.',
      },
    ],
    boardBrief: {
      firstImpact: 'Procurement pressure to prove European resilience while actual qualified capacity remains workload-specific.',
      ninetyDayAction: 'Classify products by whether EU capacity can realistically support node, package, volume, and qualification needs.',
      twelveMonthHedge: 'Use EU suppliers for control, power, sensing, and industrial workloads while maintaining allied options for frontier compute.',
      escalationTrigger: 'A major EU fab delay, subsidy change, or local-content procurement rule affects committed sourcing plans.',
    },
    exposureWeights: {
      sectors: { automotive: 1.25, industrial: 1.25, 'ai-cloud': 1.05, healthcare: 1.05 },
      geographies: { europe: 1.25, global: 1.05 },
      dependencies: { 'advanced-chips': 1.05, 'connected-products': 1.2, 'cloud-ai': 1.05 },
      sourcing: { 'single-source': 1.2, 'dual-source': 1.05, diversified: 0.85 },
    },
  },
  {
    id: 'ai-act-enforcement',
    name: 'AI Act Enforcement & Digital Simplification',
    shortName: 'AI Act',
    frictionLevel: 'medium',
    triggerEvent: 'Transparency obligations in force since 2 August 2026 while the Digital Omnibus moves high-risk obligations to 2 December 2027 (Annex III) and 2 August 2028 (Annex I)',
    timeframe: '2026-2027',
    probability: '80-90%',
    confidence: 'High',
    description: 'The AI Act scenario remains high-probability, but the operational risk is not a single cliff edge. Businesses must manage staged applicability, high-risk classification, GPAI duties, transparency rules, standards availability, notified-body capacity, and possible simplification adjustments.',
    impacts: [
      {
        sector: 'AI/Cloud',
        valueAtStake: '€95B',
        valueNumeric: 95,
        severity: 'negative',
        description: 'GPAI, deployment documentation, transparency, and high-risk customer requirements reshape product release processes.',
      },
      {
        sector: 'Healthcare',
        valueAtStake: '€55B',
        valueNumeric: 55,
        severity: 'negative',
        description: 'Medical AI must reconcile AI Act obligations with MDR evidence, safety, and post-market monitoring.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€45B',
        valueNumeric: 45,
        severity: 'negative',
        description: 'ADAS, driver monitoring, predictive maintenance, and safety-adjacent AI face classification and evidence burdens.',
      },
      {
        sector: 'Financial Services',
        valueAtStake: '€40B',
        valueNumeric: 40,
        severity: 'negative',
        description: 'Credit, fraud, insurance, employment, and customer-risk systems require stronger traceability and oversight.',
      },
      {
        sector: 'Industrial',
        valueAtStake: '€30B',
        valueNumeric: 30,
        severity: 'neutral',
        description: 'Safety-component AI and worker-facing systems need controls, but many optimisation use cases remain manageable.',
      },
      {
        sector: 'Consumer Tech',
        valueAtStake: '€20B',
        valueNumeric: 20,
        severity: 'neutral',
        description: 'Transparency duties and content labelling matter, but many consumer use cases avoid high-risk treatment.',
      },
    ],
    cascade: {
      primary: 'AI Act obligations apply in stages -> product, legal, compliance, and data teams rush to classify systems',
      secondary: 'Standards and enforcement expectations remain uneven -> conservative customers demand extra evidence',
      tertiary: 'EU AI market matures -> trusted suppliers gain while undocumented systems lose procurement access',
    },
    keyIndicators: [
      'AI Office and national authority guidance on GPAI, high-risk systems, and transparency duties',
      'Digital Omnibus implementation and guidance on the revised high-risk timelines (Annex III: 2 Dec 2027; Annex I: 2 Aug 2028)',
      'CEN/CENELEC harmonised standards, common specifications, and notified-body capacity',
      'First national enforcement actions, procurement exclusions, or customer audit clauses',
    ],
    mitigationOptions: [
      'Inventory AI systems and classify by role: provider, deployer, importer, distributor, or product manufacturer',
      'Build evidence packs covering data governance, risk management, logging, human oversight, and monitoring',
      'Separate high-risk EU releases from lower-risk global features where architecture permits',
      'Use contractual controls to collect upstream model, data, and performance evidence from suppliers',
    ],
    evidenceNotes: [
      {
        fact: 'The AI Act has applied progressively: prohibitions and AI literacy since 2 February 2025, governance rules and GPAI obligations since 2 August 2025, and transparency rules since 2 August 2026 — all now in force.',
        implication: 'The tool should show staged operational exposure rather than implying one universal enforcement date.',
      },
      {
        fact: 'The Digital Omnibus on AI — Regulation (EU) 2026/1744, published in the Official Journal on 24 July 2026 and in force since 27 July 2026 — moves standalone (Annex III) high-risk obligations to 2 December 2027 and product-integrated (Annex I) systems to 2 August 2028.',
        implication: 'The scenario is an evidence-readiness risk, not a penalty-countdown story.',
      },
    ],
    boardBrief: {
      firstImpact: 'Customer and regulator requests for classification, technical documentation, risk management, and supplier evidence.',
      ninetyDayAction: 'Complete an AI-system inventory with risk category, legal role, data source, model supplier, and EU market exposure.',
      twelveMonthHedge: 'Create reusable AI Act evidence packs and release gates for high-risk, GPAI-dependent, and transparency-sensitive systems.',
      escalationTrigger: 'Guidance or enforcement confirms that a core product falls into Annex III high-risk treatment.',
    },
    exposureWeights: {
      sectors: { healthcare: 1.3, 'financial-services': 1.3, automotive: 1.2, 'ai-cloud': 1.25, industrial: 1.1, 'consumer-tech': 1.05 },
      geographies: { europe: 1.3, global: 1.1 },
      dependencies: { 'regulated-ai': 1.35, 'cloud-ai': 1.15, 'data-services': 1.1, 'connected-products': 1.1 },
      sourcing: { 'single-source': 1.15, 'dual-source': 1.05, diversified: 0.95 },
    },
  },
  {
    id: 'atlantic-bifurcation',
    name: 'Atlantic Tech Friction & Dual Compliance Drift',
    shortName: 'Atlantic Drift',
    frictionLevel: 'high',
    triggerEvent: 'US-EU trade stabilisation coexists with escalating friction over DMA enforcement, AI governance, data transfers, cloud sovereignty, tariffs, and export controls',
    timeframe: '2026-2030',
    probability: '25-40%',
    confidence: 'Medium',
    description: 'A full transatlantic technology split is less likely than persistent dual compliance. The live risk is a drift into incompatible operating assumptions: US innovation-first pressure, EU rights-and-competition enforcement, cloud/data sovereignty demands, and selective tariff or procurement leverage.',
    impacts: [
      {
        sector: 'AI/Cloud',
        valueAtStake: '€115B',
        valueNumeric: 115,
        severity: 'severe',
        description: 'AI safety, cloud sovereignty, procurement, and data-residency demands require EU-specific controls.',
      },
      {
        sector: 'Data Services',
        valueAtStake: '€85B',
        valueNumeric: 85,
        severity: 'severe',
        description: 'EU-US transfer, privacy, analytics, and lawful-access questions keep recurring in customer contracts.',
      },
      {
        sector: 'Platforms',
        valueAtStake: '€70B',
        valueNumeric: 70,
        severity: 'negative',
        description: 'DMA and DSA enforcement create product, ranking, app-store, advertising, and consent divergence.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€45B',
        valueNumeric: 45,
        severity: 'negative',
        description: 'Connected-vehicle data, software updates, cyber rules, and tariff exposure complicate transatlantic product plans.',
      },
      {
        sector: 'Semiconductors',
        valueAtStake: '€40B',
        valueNumeric: 40,
        severity: 'negative',
        description: 'Export-control coordination remains strategic but more exposed to trade bargaining and domestic politics.',
      },
      {
        sector: 'Financial Services',
        valueAtStake: '€30B',
        valueNumeric: 30,
        severity: 'neutral',
        description: 'Regulated data, AI, and outsourcing rules add friction but remain manageable through strong governance.',
      },
    ],
    cascade: {
      primary: 'US and EU rules diverge by enforcement culture -> product and data architectures need jurisdiction-aware controls',
      secondary: 'Procurement and customer contracts demand local assurance -> dual compliance becomes a sales prerequisite',
      tertiary: 'Firms maintain parallel operating models -> higher cost, slower release cycles, and fragmented user experiences',
    },
    keyIndicators: [
      'DMA/DSA enforcement against US-headquartered platforms and US political retaliation language',
      'EU-US Data Privacy Framework challenge activity, EDPB guidance, or Schrems-style litigation milestones',
      'EU-US tariff, automotive, semiconductor, pharmaceutical, or digital-services bargaining',
      'Cloud sovereignty procurement rules and public-sector restrictions on non-EU providers',
    ],
    mitigationOptions: [
      'Design jurisdiction-aware feature flags, consent flows, data residency, and audit logging',
      'Maintain a live US-EU regulatory friction register for product, legal, sales, and security teams',
      'Use modular data architectures so EU customer evidence can be produced without global redesign',
      'Prepare board-level thresholds for when dual compliance becomes a product-line decision',
    ],
    evidenceNotes: [
      {
        fact: 'The 2025 EU-US trade framework restored some tariff predictability, including a 15% ceiling for several categories.',
        implication: 'The credible scenario is not clean rupture; it is managed trade plus recurring digital-policy conflict.',
      },
      {
        fact: 'EU DMA enforcement against Apple and Meta in 2025 showed that Brussels is willing to act against major US platforms.',
        implication: 'Product and data-service firms should plan for continuing regulatory asymmetry even when trade diplomacy improves.',
      },
    ],
    boardBrief: {
      firstImpact: 'Sales, legal, and product teams face EU-specific contractual evidence, data-flow questions, and feature divergence.',
      ninetyDayAction: 'Map which product features, data flows, models, and subprocessors depend on US-EU interoperability assumptions.',
      twelveMonthHedge: 'Build modular EU control planes for data residency, consent, audit logs, and customer-facing compliance evidence.',
      escalationTrigger: 'A major DMA, data-transfer, cloud-sovereignty, or tariff dispute forces product changes or contract renegotiation.',
    },
    exposureWeights: {
      sectors: { 'ai-cloud': 1.3, 'financial-services': 1.15, automotive: 1.1, industrial: 1.05, 'consumer-tech': 1.2 },
      geographies: { europe: 1.25, 'north-america': 1.15, global: 1.2 },
      dependencies: { 'data-services': 1.35, 'cloud-ai': 1.25, 'regulated-ai': 1.2, 'connected-products': 1.15 },
      sourcing: { 'single-source': 1.18, 'dual-source': 1.05, diversified: 0.92 },
    },
  },
]

// Utility functions

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id)
}

export function getScenariosByFriction(level: FrictionLevel): Scenario[] {
  return SCENARIOS.filter(s => s.frictionLevel === level)
}

export function getMaxImpactValue(): number {
  return Math.max(...SCENARIOS.flatMap(s => s.impacts.map(i => i.valueNumeric)))
}

export function getExposureMultiplier(scenario: Scenario, profile: ExposureProfile): number {
  const sector = scenario.exposureWeights.sectors[profile.sector] ?? 1
  const geography = scenario.exposureWeights.geographies[profile.geography] ?? 1
  const dependency = scenario.exposureWeights.dependencies[profile.dependency] ?? 1
  const sourcing = scenario.exposureWeights.sourcing[profile.sourcing] ?? 1

  return Math.max(0.65, Math.min(1.85, sector * geography * dependency * sourcing))
}

export function getExposureBand(multiplier: number): 'Low' | 'Moderate' | 'Elevated' | 'Critical' {
  if (multiplier >= 1.45) return 'Critical'
  if (multiplier >= 1.15) return 'Elevated'
  if (multiplier >= 0.9) return 'Moderate'
  return 'Low'
}

// Per-dependency overrides for the "first impact" line of the board brief.
// Keeps the rest of the brief stable while making the chosen dependency feel
// like it actually changes the read. Falls back to the scenario default.
const DEPENDENCY_FIRST_IMPACT: Record<string, Partial<Record<ExposureDependency, string>>> = {
  'taiwan-strait': {
    'advanced-chips': 'Foundry allocation freezes on leading-edge logic; orders shift to long lead-time qualified alternates.',
    'cloud-ai': 'Accelerator deliveries stall as logic, HBM, and advanced packaging cannot be recombined elsewhere quickly.',
    'connected-products': 'Bill-of-materials gaps appear in connected and automotive electronics within one to two quarters.',
    'regulated-ai': 'Customers escalate AI service-availability and continuity assurances tied to Taiwan-linked compute.',
    'data-services': 'Hyperscaler capacity tightens around AI workloads; pricing and SLA negotiations harden.',
  },
  'us-export-controls': {
    'advanced-chips': 'License delays and customer-eligibility reviews on advanced compute, HBM, and equipment.',
    'cloud-ai': 'AI deployment, model-weight, and cloud-region exposure require fresh end-use and customer screening.',
    'connected-products': 'Connected-product BOMs and aftermarket parts hit restricted-party and end-use friction.',
    'regulated-ai': 'AI customer due-diligence and end-use review become a release-gate, not just a sales check.',
    'data-services': 'Cloud, model, and analytics customer screening tightens; restricted-country exposure surfaces in audits.',
  },
  'eu-autonomy': {
    'advanced-chips': 'Procurement demands proof that European resilience covers your actual node, package, and volume.',
    'cloud-ai': 'Public procurement and customer assurance ask whether AI infrastructure is sovereign-eligible.',
    'connected-products': 'Industrial and automotive buyers ask for evidence of European supply for control and power electronics.',
    'regulated-ai': 'Regulated-AI customers ask whether the underlying stack is EU-sourced and audit-ready.',
    'data-services': 'Sovereign-cloud and data-residency questions appear in tenders earlier than expected.',
  },
  'ai-act-enforcement': {
    'regulated-ai': 'High-risk classification questions land first — from customers, partners, and procurement teams.',
    'cloud-ai': 'GPAI documentation, transparency, and provider-vs-deployer evidence requests arrive from EU customers.',
    'advanced-chips': 'Customer assurance for AI hardware now asks about Article 53 GPAI evidence, not only performance.',
    'connected-products': 'Embedded AI in regulated products triggers conformity, technical-file, and post-market obligations.',
    'data-services': 'AI Act overlay on data and analytics services creates new contractual evidence demands.',
  },
  'atlantic-bifurcation': {
    'data-services': 'EU-US data transfer, residency, and lawful-access questions recur in every renewal cycle.',
    'cloud-ai': 'EU cloud-sovereignty, AI safety, and procurement evidence demands force EU-specific control planes.',
    'regulated-ai': 'AI safety, transparency, and governance demands diverge from US-style expectations in EU sales.',
    'connected-products': 'Connected products face EU-specific consent, data-access, and update-management obligations.',
    'advanced-chips': 'Hardware exports get caught in selective tariff and procurement bargaining despite framework deals.',
  },
}

// Sector context line appended to the 90-day action so the brief feels tuned
// without rewriting the whole scenario every time the lens changes.
const SECTOR_CONTEXT: Partial<Record<ExposureSector, string>> = {
  industrial: 'Treat industrial automation, controls, and power-electronics suppliers as the first ask.',
  automotive: 'Frame the work around the BOM, tier-1 disclosure, and homologation calendar.',
  'ai-cloud': 'Anchor the work on AI accelerator allocation, model assets, and cloud-region exposure.',
  healthcare: 'Tie the work into MDR/IVDR evidence and clinical-risk governance, not only IT compliance.',
  'financial-services': 'Run this through the model-risk, third-party, and regulatory-engagement governance you already have.',
  'consumer-tech': 'Sequence around launch windows, channel partners, and content/transparency obligations.',
}

export function getAdjustedBoardBrief(
  scenario: Scenario,
  profile: ExposureProfile,
): BoardBrief {
  const firstImpact =
    DEPENDENCY_FIRST_IMPACT[scenario.id]?.[profile.dependency] ?? scenario.boardBrief.firstImpact
  const sectorContext = SECTOR_CONTEXT[profile.sector]
  const ninetyDayAction = sectorContext
    ? `${scenario.boardBrief.ninetyDayAction} ${sectorContext}`
    : scenario.boardBrief.ninetyDayAction
  return {
    ...scenario.boardBrief,
    firstImpact,
    ninetyDayAction,
  }
}

export function getAdjustedImpacts(
  scenario: Scenario,
  profile: ExposureProfile
): SectorImpact[] {
  const multiplier = getExposureMultiplier(scenario, profile)

  return scenario.impacts.map(impact => {
    const adjustedValue = Math.round(impact.valueNumeric * multiplier)
    return {
      ...impact,
      valueNumeric: adjustedValue,
      valueAtStake: `€${adjustedValue}B`,
    }
  })
}

// Color mapping
export const FRICTION_COLORS: Record<FrictionLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-stone-teal/20', text: 'text-stone-teal', border: 'border-stone-teal/40' },
  medium: { bg: 'bg-silicon-amber/20', text: 'text-silicon-amber', border: 'border-silicon-amber/40' },
  high: { bg: 'bg-alert-red/20', text: 'text-alert-red', border: 'border-alert-red/40' },
}

export const SEVERITY_COLORS: Record<string, string> = {
  positive: '#14b8a6',  // teal
  neutral: '#6b7280',   // gray
  negative: '#f59e0b',  // amber
  severe: '#ef4444',    // red
}
