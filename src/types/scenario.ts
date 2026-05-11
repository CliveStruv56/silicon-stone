// Scenario Modeler Types
// Geopolitical scenario modelling aligned with "Scenario-Based Drift Modelling" methodology

export type FrictionLevel = 'low' | 'medium' | 'high'
export type ImpactSeverity = 'positive' | 'neutral' | 'negative' | 'severe'
export type ScenarioConfidence = 'Low' | 'Medium' | 'High'
export type ExposureSector = 'automotive' | 'industrial' | 'ai-cloud' | 'healthcare' | 'financial-services' | 'consumer-tech'
export type ExposureGeography = 'europe' | 'north-america' | 'asia' | 'global'
export type ExposureDependency = 'advanced-chips' | 'cloud-ai' | 'regulated-ai' | 'connected-products' | 'data-services'
export type SourcingFlexibility = 'single-source' | 'dual-source' | 'diversified'

export interface SectorImpact {
  sector: string
  valueAtStake: string           // Euro value at risk
  valueNumeric: number           // For chart rendering
  severity: ImpactSeverity
  description: string
}

export interface CascadeEffect {
  primary: string
  secondary: string
  tertiary: string
}

export interface EvidenceNote {
  fact: string
  implication: string
}

export interface BoardBrief {
  firstImpact: string
  ninetyDayAction: string
  twelveMonthHedge: string
  escalationTrigger: string
}

export interface ExposureProfile {
  sector: ExposureSector
  geography: ExposureGeography
  dependency: ExposureDependency
  sourcing: SourcingFlexibility
}

export interface ExposureWeights {
  sectors: Partial<Record<ExposureSector, number>>
  geographies: Partial<Record<ExposureGeography, number>>
  dependencies: Partial<Record<ExposureDependency, number>>
  sourcing: Partial<Record<SourcingFlexibility, number>>
}

export interface Scenario {
  id: string
  name: string
  shortName: string              // For compact display
  frictionLevel: FrictionLevel
  triggerEvent: string
  timeframe: string
  probability: string            // Subjective probability estimate
  description: string
  impacts: SectorImpact[]
  cascade: CascadeEffect
  keyIndicators: string[]        // Early warning signals
  mitigationOptions: string[]
  confidence: ScenarioConfidence
  evidenceNotes: EvidenceNote[]
  boardBrief: BoardBrief
  exposureWeights: ExposureWeights
}

export interface ScenarioCategory {
  name: string
  scenarios: Scenario[]
}
