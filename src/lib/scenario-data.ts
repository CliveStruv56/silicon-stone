// Scenario Modeler Data
// Geopolitical scenarios aligned with "Scenario-Based Drift Modeling" methodology

import type { Scenario, FrictionLevel } from '@/types/scenario'

export const SCENARIOS: Scenario[] = [
  {
    id: 'taiwan-strait',
    name: 'Taiwan Strait Disruption',
    shortName: 'Taiwan',
    frictionLevel: 'high',
    triggerEvent: 'Military blockade or invasion of Taiwan disrupting TSMC operations',
    timeframe: '2024-2027',
    probability: '15-25%',
    description: 'A military confrontation in the Taiwan Strait would immediately halt 90% of advanced chip production globally, triggering the most severe technology crisis since WWII.',
    impacts: [
      {
        sector: 'Semiconductors',
        valueAtStake: '€450B',
        valueNumeric: 450,
        severity: 'severe',
        description: 'Complete halt of <7nm chip production. No alternative capacity exists.',
      },
      {
        sector: 'Consumer Electronics',
        valueAtStake: '€320B',
        valueNumeric: 320,
        severity: 'severe',
        description: 'Smartphone, laptop, and tablet production collapses within weeks.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€180B',
        valueNumeric: 180,
        severity: 'severe',
        description: 'EV and advanced ADAS production halts. 2021 chip shortage was a preview.',
      },
      {
        sector: 'AI/Cloud',
        valueAtStake: '€150B',
        valueNumeric: 150,
        severity: 'severe',
        description: 'AI accelerator supply chain breaks. GPU availability drops 95%.',
      },
      {
        sector: 'Defense',
        valueAtStake: '€80B',
        valueNumeric: 80,
        severity: 'severe',
        description: 'Critical military systems depend on advanced chips from Taiwan.',
      },
      {
        sector: 'Medical Devices',
        valueAtStake: '€45B',
        valueNumeric: 45,
        severity: 'negative',
        description: 'Diagnostic and imaging equipment production severely impacted.',
      },
    ],
    cascade: {
      primary: 'TSMC production halts → 90% of advanced chips unavailable',
      secondary: 'Global electronics manufacturing stops → mass layoffs, economic contraction',
      tertiary: 'Technology sovereignty crisis → accelerated reshoring, new trade blocs',
    },
    keyIndicators: [
      'PLA military exercises near Taiwan',
      'US carrier group movements',
      'TSMC inventory level announcements',
      'Rare earth export restrictions from China',
    ],
    mitigationOptions: [
      'Accelerate Intel/Samsung advanced node development',
      'Strategic chip reserves (government stockpiles)',
      'Design redundancy for mature nodes',
      'Diversify to GlobalFoundries/Samsung for non-leading-edge',
    ],
  },
  {
    id: 'us-export-controls',
    name: 'US Export Control Expansion',
    shortName: 'Export Ban',
    frictionLevel: 'medium',
    triggerEvent: 'Extension of October 2022 controls to cover more chips, equipment, and allies',
    timeframe: '2024-2026',
    probability: '60-70%',
    description: 'Expanded US export controls force complete technology decoupling with China, creating two separate technology ecosystems with different standards and capabilities.',
    impacts: [
      {
        sector: 'Semiconductors',
        valueAtStake: '€120B',
        valueNumeric: 120,
        severity: 'negative',
        description: 'Lost China market access. Equipment makers face revenue collapse.',
      },
      {
        sector: 'AI/Cloud',
        valueAtStake: '€85B',
        valueNumeric: 85,
        severity: 'negative',
        description: 'Nvidia, AMD lose largest growth market. China develops alternatives.',
      },
      {
        sector: 'Telecom',
        valueAtStake: '€60B',
        valueNumeric: 60,
        severity: 'negative',
        description: 'Complete 5G ecosystem bifurcation. Dual compliance costs rise.',
      },
      {
        sector: 'Industrial',
        valueAtStake: '€40B',
        valueNumeric: 40,
        severity: 'neutral',
        description: 'Mixed impact. Some reshoring benefits offset China market loss.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€35B',
        valueNumeric: 35,
        severity: 'neutral',
        description: 'EV supply chains require restructuring but are manageable.',
      },
      {
        sector: 'Equipment (ASML)',
        valueAtStake: '€25B',
        valueNumeric: 25,
        severity: 'negative',
        description: 'DUV restrictions add to EUV ban. Chinese market access shrinks.',
      },
    ],
    cascade: {
      primary: 'Export controls expand → China accelerates indigenous development',
      secondary: 'Technology bifurcation deepens → dual supply chains become permanent',
      tertiary: 'Innovation slows globally → higher costs for all consumers',
    },
    keyIndicators: [
      'Commerce Department Entity List additions',
      'Allied semiconductor agreement progress',
      'Chinese memory chip capacity announcements',
      'ASML China revenue guidance',
    ],
    mitigationOptions: [
      'Develop China-independent revenue streams',
      'Invest in allied-nation manufacturing',
      'Prepare dual-product strategies (China/non-China)',
      'Engage in policy advocacy through industry associations',
    ],
  },
  {
    id: 'eu-autonomy',
    name: 'EU Strategic Autonomy Acceleration',
    shortName: 'EU Autonomy',
    frictionLevel: 'low',
    triggerEvent: 'EU Chips Act implementation accelerates, with localization requirements',
    timeframe: '2024-2030',
    probability: '70-80%',
    description: 'The EU doubles down on semiconductor sovereignty, offering massive subsidies with strings attached. Market access becomes conditional on local production.',
    impacts: [
      {
        sector: 'Semiconductors',
        valueAtStake: '€50B',
        valueNumeric: 50,
        severity: 'positive',
        description: 'New fab investments. Intel, TSMC, Samsung expand in EU.',
      },
      {
        sector: 'Equipment',
        valueAtStake: '€30B',
        valueNumeric: 30,
        severity: 'positive',
        description: 'ASML, ZEISS, Trumpf benefit from EU investment focus.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€25B',
        valueNumeric: 25,
        severity: 'positive',
        description: 'Localized chip supply reduces supply chain risk for EU OEMs.',
      },
      {
        sector: 'Industrial',
        valueAtStake: '€20B',
        valueNumeric: 20,
        severity: 'positive',
        description: 'Mature node capacity in EU supports industrial automation.',
      },
      {
        sector: 'AI/Cloud',
        valueAtStake: '€15B',
        valueNumeric: 15,
        severity: 'neutral',
        description: 'Advanced AI chips still imported, but packaging may localize.',
      },
      {
        sector: 'Materials',
        valueAtStake: '€10B',
        valueNumeric: 10,
        severity: 'neutral',
        description: 'Some materials localization but critical dependencies remain.',
      },
    ],
    cascade: {
      primary: 'EU subsidies flow → New fab construction accelerates',
      secondary: 'Local supply chains develop → Reduced import dependency',
      tertiary: 'EU chip sovereignty improves → Political leverage increases',
    },
    keyIndicators: [
      'EU Chips Act funding disbursements',
      'Intel, TSMC EU fab construction milestones',
      'Local content requirements in EU procurement',
      'Skilled workforce development programs',
    ],
    mitigationOptions: [
      'Position for EU subsidy access',
      'Develop EU-based R&D capabilities',
      'Partner with local educational institutions',
      'Build relationships with EU policymakers',
    ],
  },
  {
    id: 'ai-act-enforcement',
    name: 'AI Act Full Enforcement',
    shortName: 'AI Act',
    frictionLevel: 'medium',
    triggerEvent: 'August 2026 deadline with aggressive enforcement and high-profile penalties',
    timeframe: '2025-2027',
    probability: '85-95%',
    description: 'The EU AI Act enters full force with strict enforcement. High-risk AI systems require substantial documentation and conformity assessment. Non-compliance triggers market access bans.',
    impacts: [
      {
        sector: 'AI/Cloud',
        valueAtStake: '€80B',
        valueNumeric: 80,
        severity: 'negative',
        description: 'Compliance costs for high-risk AI. Some products withdrawn from EU.',
      },
      {
        sector: 'Healthcare',
        valueAtStake: '€45B',
        valueNumeric: 45,
        severity: 'negative',
        description: 'Medical AI faces dual regulation (AI Act + MDR). Innovation slows.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€35B',
        valueNumeric: 35,
        severity: 'negative',
        description: 'ADAS and autonomous systems require extensive conformity assessment.',
      },
      {
        sector: 'Financial Services',
        valueAtStake: '€30B',
        valueNumeric: 30,
        severity: 'negative',
        description: 'Credit scoring, fraud detection face high-risk classification.',
      },
      {
        sector: 'Industrial',
        valueAtStake: '€20B',
        valueNumeric: 20,
        severity: 'neutral',
        description: 'Safety-component AI regulated but mostly manageable.',
      },
      {
        sector: 'Consumer Tech',
        valueAtStake: '€15B',
        valueNumeric: 15,
        severity: 'neutral',
        description: 'Transparency requirements for GenAI. Limited business impact.',
      },
    ],
    cascade: {
      primary: 'AI Act enforcement begins → Compliance scramble for high-risk systems',
      secondary: 'Non-compliant products exit EU → Innovation shifts to less regulated markets',
      tertiary: 'EU AI market shrinks → Global standards fragment',
    },
    keyIndicators: [
      'AI Office guidance documents',
      'First enforcement actions announced',
      'Notified body capacity for AI conformity assessment',
      'Industry compliance spending disclosures',
    ],
    mitigationOptions: [
      'Begin compliance preparation immediately',
      'Conduct risk classification assessment for all AI systems',
      'Build documentation frameworks and data governance',
      'Engage with standardization bodies (CEN/CENELEC)',
    ],
  },
  {
    id: 'atlantic-bifurcation',
    name: 'Atlantic Tech Bifurcation',
    shortName: 'Atlantic Split',
    frictionLevel: 'high',
    triggerEvent: 'US-EU trade tensions escalate, leading to competing tech regulatory regimes',
    timeframe: '2025-2030',
    probability: '20-30%',
    description: 'A breakdown in transatlantic tech cooperation leads to incompatible regulatory regimes. Companies must choose between US and EU markets or maintain costly dual compliance.',
    impacts: [
      {
        sector: 'AI/Cloud',
        valueAtStake: '€100B',
        valueNumeric: 100,
        severity: 'severe',
        description: 'Incompatible AI regulations force product bifurcation.',
      },
      {
        sector: 'Data Services',
        valueAtStake: '€75B',
        valueNumeric: 75,
        severity: 'severe',
        description: 'Data localization requirements. GDPR vs US frameworks clash.',
      },
      {
        sector: 'Big Tech',
        valueAtStake: '€60B',
        valueNumeric: 60,
        severity: 'negative',
        description: 'Platform companies face contradictory US antitrust and EU DMA.',
      },
      {
        sector: 'Semiconductors',
        valueAtStake: '€40B',
        valueNumeric: 40,
        severity: 'negative',
        description: 'Export control coordination breaks down. Allied tech block fractures.',
      },
      {
        sector: 'Automotive',
        valueAtStake: '€35B',
        valueNumeric: 35,
        severity: 'negative',
        description: 'Connected car data regulations diverge. Compliance costs spike.',
      },
      {
        sector: 'Financial Services',
        valueAtStake: '€25B',
        valueNumeric: 25,
        severity: 'neutral',
        description: 'Cross-border fintech operations complicated but manageable.',
      },
    ],
    cascade: {
      primary: 'US-EU regulatory divergence → Dual compliance becomes necessary',
      secondary: 'Companies choose markets → Reduced competition in each bloc',
      tertiary: 'Innovation duplicated → Slower global tech advancement',
    },
    keyIndicators: [
      'EU-US Trade and Technology Council breakdown',
      'Digital Markets Act enforcement against US Big Tech',
      'Schrems III data transfer ruling',
      'Retaliatory tariffs or tech restrictions',
    ],
    mitigationOptions: [
      'Build modular product architectures for dual compliance',
      'Diversify market presence to reduce single-bloc dependency',
      'Engage in transatlantic policy advocacy',
      'Develop EU-first product strategies where needed',
    ],
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
