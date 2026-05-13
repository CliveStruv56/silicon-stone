// Policy Stress-Test Types
// Comparative policy analysis aligned with "Comparative Policy Stress-Testing" methodology

export type Jurisdiction = 'EU' | 'US'
export type Relevance = 'high' | 'medium' | 'low' | 'none'
export type Priority = 'immediate' | '30-days' | '90-days' | '180-days'

export interface PolicyAction {
  priority: Priority
  action: string
}

export interface IndustryImpact {
  relevance: Relevance
  requirements: string[]
  frictionScore: number        // 1-10 scale
  complianceCost: string       // Estimated cost range
  actions: PolicyAction[]
  keyDeadlines?: string[]
}

export interface Policy {
  id: string
  name: string
  shortName: string
  jurisdiction: Jurisdiction
  effectiveDate: string
  status: 'Active' | 'Phasing In' | 'Proposed'
  description: string
  scope: string
  keyProvisions: string[]
  industryImpacts: Record<string, IndustryImpact>
  penaltyRange: string
  enforcementBody: string
  relatedPolicies: string[]    // IDs of related policies
  sourceUrl?: string
  sourceLabel?: string
  lastReviewed?: string
}

export interface UserContext {
  industry: string
  companySize: 'startup' | 'sme' | 'enterprise'
  regions: Jurisdiction[]
  useCase?: string
}

export interface ComparisonResult {
  euPolicy: Policy | null
  usPolicy: Policy | null
  industry: string
  overallFriction: number
  recommendations: PolicyAction[]
}
