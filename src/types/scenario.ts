// Scenario Modeler Types
// Geopolitical scenario modelling aligned with "Scenario-Based Drift Modelling" methodology

export type FrictionLevel = 'low' | 'medium' | 'high'
export type ImpactSeverity = 'positive' | 'neutral' | 'negative' | 'severe'

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
}

export interface ScenarioCategory {
  name: string
  scenarios: Scenario[]
}
