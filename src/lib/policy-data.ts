// Policy Stress-Test Data
// Comparative policy analysis aligned with "Comparative Policy Stress-Testing" methodology

import type { Policy, Jurisdiction, Relevance, IndustryImpact, Priority } from '@/types/policy'

export const POLICIES: Policy[] = [
  {
    id: 'eu-ai-act',
    name: 'EU AI Act',
    shortName: 'AI Act',
    jurisdiction: 'EU',
    effectiveDate: 'Phased application; transparency rules from 2 Aug 2026. Under the Digital Omnibus, standalone (Annex III) high-risk obligations move to 2 Dec 2027 and product-integrated (Annex I) to 2 Aug 2028.',
    status: 'Phasing In',
    description: 'World\'s first comprehensive AI regulation, establishing risk-based classification and mandatory requirements for high-risk AI systems.',
    scope: 'All AI systems placed on EU market or affecting EU residents',
    keyProvisions: [
      'Prohibited AI practices (social scoring, manipulation)',
      'High-risk AI conformity assessment',
      'Transparency requirements for AI interactions',
      'GPAI model obligations for foundation models',
      'Fundamental Rights Impact Assessment',
    ],
    industryImpacts: {
      'AI/ML': {
        relevance: 'high',
        requirements: [
          'Risk classification for all AI systems',
          'Technical documentation and conformity assessment for high-risk',
          'Transparency labeling for chatbots and synthetic content',
          'GPAI compliance for foundation models',
        ],
        frictionScore: 8,
        complianceCost: '€500K - €5M',
        actions: [
          { priority: 'immediate', action: 'Conduct AI system inventory and risk classification' },
          { priority: '30-days', action: 'Begin FRIA for high-risk systems' },
          { priority: '90-days', action: 'Implement technical documentation framework' },
          { priority: '180-days', action: 'Engage notified body for conformity assessment' },
        ],
        keyDeadlines: [
          '2 Feb 2025: prohibited practices and AI literacy obligations apply',
          '2 Aug 2025: governance rules and GPAI obligations apply',
          '2 Aug 2026: transparency obligations remain relevant',
          'Digital Omnibus: standalone (Annex III) high-risk obligations move to 2 Dec 2027',
        ],
      },
      'Healthcare': {
        relevance: 'high',
        requirements: [
          'Medical AI dual regulation (AI Act + MDR)',
          'High-risk classification for diagnostic AI',
          'Clinical evidence requirements',
        ],
        frictionScore: 9,
        complianceCost: '€1M - €10M',
        actions: [
          { priority: 'immediate', action: 'Map AI Act requirements to existing MDR compliance' },
          { priority: '30-days', action: 'Assess dual-regulation gaps' },
          { priority: '90-days', action: 'Update quality management systems' },
        ],
        keyDeadlines: ['Digital Omnibus: product-integrated (Annex I) high-risk obligations move to 2 Aug 2028'],
      },
      'Financial Services': {
        relevance: 'high',
        requirements: [
          'Credit scoring systems classified as high-risk',
          'Fraud detection impact assessment',
          'Explainability requirements',
        ],
        frictionScore: 7,
        complianceCost: '€300K - €3M',
        actions: [
          { priority: 'immediate', action: 'Inventory AI in credit and insurance decisions' },
          { priority: '30-days', action: 'Assess explainability gaps' },
          { priority: '90-days', action: 'Implement human oversight mechanisms' },
        ],
      },
      'Automotive': {
        relevance: 'high',
        requirements: [
          'ADAS and autonomous driving as high-risk',
          'Safety component conformity assessment',
          'Vehicle type approval integration',
        ],
        frictionScore: 8,
        complianceCost: '€2M - €20M',
        actions: [
          { priority: 'immediate', action: 'Map AI systems in vehicle safety chain' },
          { priority: '90-days', action: 'Align AI Act with UNECE regulations' },
          { priority: '180-days', action: 'Update type approval documentation' },
        ],
        keyDeadlines: ['Digital Omnibus: product-integrated (Annex I) high-risk obligations move to 2 Aug 2028'],
      },
      'Manufacturing': {
        relevance: 'medium',
        requirements: [
          'Safety-component AI classification',
          'Machinery Regulation alignment',
          'Worker safety AI oversight',
        ],
        frictionScore: 5,
        complianceCost: '€100K - €1M',
        actions: [
          { priority: '30-days', action: 'Identify AI in safety-critical systems' },
          { priority: '90-days', action: 'Assess Machinery Regulation overlap' },
        ],
      },
      'Retail/E-commerce': {
        relevance: 'low',
        requirements: [
          'Transparency for AI-powered recommendations',
          'Chatbot disclosure requirements',
        ],
        frictionScore: 3,
        complianceCost: '€50K - €200K',
        actions: [
          { priority: '90-days', action: 'Add AI disclosure notices' },
          { priority: '180-days', action: 'Review recommendation system transparency' },
        ],
      },
    },
    penaltyRange: 'Up to €35M or 7% of global annual turnover',
    enforcementBody: 'AI Office (EU) + National Market Surveillance Authorities',
    relatedPolicies: ['gdpr', 'eu-chips-act'],
    sourceUrl: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
    sourceLabel: 'European Commission AI Act timeline',
    lastReviewed: '2 June 2026',
  },
  {
    id: 'us-export-controls',
    name: 'US Semiconductor Export Controls',
    shortName: 'Export Controls',
    jurisdiction: 'US',
    effectiveDate: 'October 2022 (ongoing updates)',
    status: 'Active',
    description: 'Export restrictions on advanced semiconductors, manufacturing equipment, high-bandwidth memory, and related technology to China and other countries of concern.',
    scope: 'US persons, US-origin items, foreign-produced items with US content',
    keyProvisions: [
      'Advanced chip export restrictions to China',
      'EUV and advanced DUV equipment controls',
      'US person employment restrictions',
      'Entity List designations',
      'De minimis rule enforcement',
      'Foundry due-diligence and diversion controls',
    ],
    industryImpacts: {
      'Semiconductors': {
        relevance: 'high',
        requirements: [
          'Export licence requirements for advanced chips',
          'End-use and end-user verification',
          'Technology transfer restrictions',
        ],
        frictionScore: 9,
        complianceCost: '€1M - €10M',
        actions: [
          { priority: 'immediate', action: 'Audit China-related supply chains' },
          { priority: 'immediate', action: 'Review Entity List customer exposure' },
          { priority: '30-days', action: 'Implement export classification procedures' },
          { priority: '90-days', action: 'Develop China-independent revenue strategy' },
        ],
      },
      'AI/ML': {
        relevance: 'high',
        requirements: [
          'AI accelerator export restrictions',
          'Cloud computing and model-training access controls',
          'Model weight export considerations',
        ],
        frictionScore: 7,
        complianceCost: '€500K - €5M',
        actions: [
          { priority: 'immediate', action: 'Review AI chip procurement and deployment' },
          { priority: '30-days', action: 'Assess cloud service China exposure' },
          { priority: '90-days', action: 'Develop compliance training for AI teams' },
        ],
      },
      'Equipment': {
        relevance: 'high',
        requirements: [
          'EUV export prohibition to China',
          'Advanced DUV restrictions',
          'Service and support limitations',
        ],
        frictionScore: 8,
        complianceCost: '€2M - €20M',
        actions: [
          { priority: 'immediate', action: 'Halt restricted equipment shipments' },
          { priority: '30-days', action: 'Review service contract obligations' },
          { priority: '90-days', action: 'Diversify customer base away from China' },
        ],
      },
      'Data Centers': {
        relevance: 'medium',
        requirements: [
          'Server and accelerator import restrictions',
          'Cloud computing deemed export rules',
        ],
        frictionScore: 5,
        complianceCost: '€200K - €2M',
        actions: [
          { priority: '30-days', action: 'Audit hardware procurement sources' },
          { priority: '90-days', action: 'Review cloud service customer locations' },
        ],
      },
      'Automotive': {
        relevance: 'low',
        requirements: [
          'Limited impact for most automotive chips',
          'Connected vehicle data considerations',
        ],
        frictionScore: 3,
        complianceCost: '€100K - €500K',
        actions: [
          { priority: '90-days', action: 'Review chip supply chain for restricted items' },
        ],
      },
    },
    penaltyRange: 'Up to $1M per violation + criminal penalties',
    enforcementBody: 'Bureau of Industry and Security (BIS)',
    relatedPolicies: ['us-chips-act'],
    sourceUrl: 'https://www.bis.gov/press-release/commerce-strengthens-export-controls-restrict-chinas-capability-produce-advanced-semiconductors-military',
    sourceLabel: 'BIS semiconductor export-control updates',
    lastReviewed: 'May 2026',
  },
  {
    id: 'eu-chips-act',
    name: 'EU Chips Act',
    shortName: 'EU Chips',
    jurisdiction: 'EU',
    effectiveDate: 'September 2023',
    status: 'Active',
    description: 'Strategic initiative to strengthen EU semiconductor ecosystem with €43B in public and private investment, supply chain monitoring, and crisis response mechanisms.',
    scope: 'Semiconductor manufacturing, research, and supply chain in EU',
    keyProvisions: [
      '€43B investment mobilization',
      'First-of-a-kind facility fast-track',
      'Supply chain monitoring and early warning',
      'Crisis response toolkit',
      'International partnerships framework',
    ],
    industryImpacts: {
      'Semiconductors': {
        relevance: 'high',
        requirements: [
          'Supply chain information reporting',
          'Crisis response participation',
          'Subsidy compliance for recipients',
        ],
        frictionScore: 4,
        complianceCost: '€100K - €1M (offset by subsidies)',
        actions: [
          { priority: 'immediate', action: 'Assess eligibility for EU Chips funding' },
          { priority: '30-days', action: 'Register for supply chain monitoring' },
          { priority: '90-days', action: 'Prepare subsidy application materials' },
        ],
      },
      'Automotive': {
        relevance: 'medium',
        requirements: [
          'Chip demand forecasting obligations',
          'Priority customer designation possibility',
        ],
        frictionScore: 2,
        complianceCost: '€50K - €200K',
        actions: [
          { priority: '30-days', action: 'Engage with EU semiconductor coordinators' },
          { priority: '90-days', action: 'Establish priority customer relationships' },
        ],
      },
      'Manufacturing': {
        relevance: 'medium',
        requirements: [
          'Industrial chip supply reporting',
          'Crisis response planning',
        ],
        frictionScore: 2,
        complianceCost: '€50K - €200K',
        actions: [
          { priority: '90-days', action: 'Map chip dependencies for industrial equipment' },
        ],
      },
      'Equipment': {
        relevance: 'medium',
        requirements: [
          'Participation in EU chip ecosystem',
          'R&D funding opportunities',
        ],
        frictionScore: 1,
        complianceCost: 'Net positive (funding available)',
        actions: [
          { priority: '30-days', action: 'Apply for Chips Joint Undertaking funding' },
          { priority: '90-days', action: 'Partner with EU research institutions' },
        ],
      },
    },
    penaltyRange: 'Administrative penalties for non-reporting',
    enforcementBody: 'European Commission + Member State Authorities',
    relatedPolicies: ['eu-ai-act'],
    sourceUrl: 'https://www.consilium.europa.eu/en/press/press-releases/2023/07/25/chips-act-council-gives-its-final-approval/',
    sourceLabel: 'Council of the EU Chips Act approval',
    lastReviewed: 'May 2026',
  },
  {
    id: 'us-chips-act',
    name: 'US CHIPS and Science Act',
    shortName: 'US CHIPS',
    jurisdiction: 'US',
    effectiveDate: 'August 2022',
    status: 'Active',
    description: '$52.7B package for domestic semiconductor manufacturing, research, and workforce development, with guardrails limiting recipients\' China activities.',
    scope: 'US semiconductor manufacturing and research',
    keyProvisions: [
      '$39B manufacturing incentives',
      '$13.2B R&D and workforce funding',
      'Guardrails on China expansion',
      'National security provisions',
      'Advanced packaging incentives',
    ],
    industryImpacts: {
      'Semiconductors': {
        relevance: 'high',
        requirements: [
          'China expansion guardrails for recipients',
          'Workforce development commitments',
          'Clawback provisions for violations',
        ],
        frictionScore: 5,
        complianceCost: 'Net positive (substantial subsidies)',
        actions: [
          { priority: 'immediate', action: 'Apply for CHIPS funding if eligible' },
          { priority: '30-days', action: 'Assess China guardrail impact on business' },
          { priority: '90-days', action: 'Develop workforce development proposals' },
        ],
      },
      'AI/ML': {
        relevance: 'medium',
        requirements: [
          'AI chip development funding available',
          'Advanced packaging research support',
        ],
        frictionScore: 2,
        complianceCost: 'Net positive',
        actions: [
          { priority: '30-days', action: 'Explore CHIPS R&D funding opportunities' },
          { priority: '90-days', action: 'Partner with CHIPS-funded facilities' },
        ],
      },
      'Data Centers': {
        relevance: 'low',
        requirements: [
          'Indirect benefit from increased domestic supply',
        ],
        frictionScore: 1,
        complianceCost: 'N/A',
        actions: [
          { priority: '90-days', action: 'Monitor domestic chip availability improvements' },
        ],
      },
    },
    penaltyRange: 'Clawback of funding for guardrail violations',
    enforcementBody: 'Department of Commerce',
    relatedPolicies: ['us-export-controls'],
    sourceUrl: 'https://www.commerce.gov/news/press-releases/2023/03/commerce-department-outlines-proposed-national-security-guardrails',
    sourceLabel: 'US Commerce CHIPS guardrails',
    lastReviewed: 'May 2026',
  },
  {
    id: 'gdpr',
    name: 'General Data Protection Regulation',
    shortName: 'GDPR',
    jurisdiction: 'EU',
    effectiveDate: 'May 25, 2018',
    status: 'Active',
    description: 'Comprehensive data protection regulation governing the processing of personal data of EU residents, with implications for AI training and deployment.',
    scope: 'Processing of personal data of EU data subjects',
    keyProvisions: [
      'Lawful basis for processing',
      'Data subject rights (access, erasure, portability)',
      'Data Protection Impact Assessment',
      'Automated decision-making restrictions (Article 22)',
      'International data transfer mechanisms',
    ],
    industryImpacts: {
      'AI/ML': {
        relevance: 'high',
        requirements: [
          'Lawful basis for training data',
          'Right to explanation for automated decisions',
          'DPIA for high-risk AI processing',
        ],
        frictionScore: 7,
        complianceCost: '€200K - €2M',
        actions: [
          { priority: 'immediate', action: 'Audit training data for GDPR compliance' },
          { priority: '30-days', action: 'Implement Article 22 safeguards' },
          { priority: '90-days', action: 'Update privacy notices for AI processing' },
        ],
      },
      'Healthcare': {
        relevance: 'high',
        requirements: [
          'Special category data protections',
          'Patient consent mechanisms',
          'Health data processing restrictions',
        ],
        frictionScore: 8,
        complianceCost: '€300K - €3M',
        actions: [
          { priority: 'immediate', action: 'Review consent mechanisms for AI health data' },
          { priority: '30-days', action: 'Ensure special category data protections' },
        ],
      },
      'Financial Services': {
        relevance: 'high',
        requirements: [
          'Automated credit decision transparency',
          'Customer data access requests',
        ],
        frictionScore: 6,
        complianceCost: '€200K - €1M',
        actions: [
          { priority: '30-days', action: 'Ensure credit decision explainability' },
          { priority: '90-days', action: 'Streamline DSAR processes' },
        ],
      },
      'Retail/E-commerce': {
        relevance: 'medium',
        requirements: [
          'Marketing consent management',
          'Cookie and tracking compliance',
        ],
        frictionScore: 4,
        complianceCost: '€50K - €500K',
        actions: [
          { priority: '30-days', action: 'Audit consent management platforms' },
          { priority: '90-days', action: 'Review personalization data flows' },
        ],
      },
      'Manufacturing': {
        relevance: 'low',
        requirements: [
          'Employee data processing',
          'B2B contact compliance',
        ],
        frictionScore: 2,
        complianceCost: '€30K - €100K',
        actions: [
          { priority: '90-days', action: 'Review employee monitoring practices' },
        ],
      },
    },
    penaltyRange: 'Up to €20M or 4% of global annual turnover',
    enforcementBody: 'Data Protection Authorities (National)',
    relatedPolicies: ['eu-ai-act'],
    sourceUrl: 'https://gdpr-library.com/article/83',
    sourceLabel: 'GDPR Article 83 fine framework',
    lastReviewed: 'May 2026',
  },
  {
    id: 'dma',
    name: 'Digital Markets Act',
    shortName: 'DMA',
    jurisdiction: 'EU',
    effectiveDate: 'March 2024 (full compliance)',
    status: 'Active',
    description: 'Regulation targeting large digital platforms (gatekeepers) with obligations for fair competition, interoperability, and data access.',
    scope: 'Designated gatekeeper platforms in EU',
    keyProvisions: [
      'Gatekeeper designation criteria',
      'Interoperability obligations',
      'Self-preferencing prohibition',
      'Data portability and access',
      'Sideloading and app store requirements',
    ],
    industryImpacts: {
      'Big Tech': {
        relevance: 'high',
        requirements: [
          'Core platform service compliance',
          'Interoperability implementation',
          'Data sharing with business users',
        ],
        frictionScore: 9,
        complianceCost: '€10M - €100M+',
        actions: [
          { priority: 'immediate', action: 'Implement gatekeeper obligations' },
          { priority: '30-days', action: 'Enable third-party app stores (if applicable)' },
          { priority: '90-days', action: 'Develop data sharing frameworks' },
        ],
      },
      'AI/ML': {
        relevance: 'medium',
        requirements: [
          'Algorithm transparency for ranking',
          'Access to AI-generated insights for business users',
        ],
        frictionScore: 5,
        complianceCost: '€500K - €5M',
        actions: [
          { priority: '30-days', action: 'Assess DMA applicability to AI services' },
          { priority: '90-days', action: 'Prepare ranking transparency documentation' },
        ],
      },
      'Retail/E-commerce': {
        relevance: 'medium',
        requirements: [
          'Marketplace fairness obligations',
          'No self-preferencing in rankings',
        ],
        frictionScore: 4,
        complianceCost: '€100K - €1M',
        actions: [
          { priority: '30-days', action: 'Review marketplace ranking algorithms' },
          { priority: '90-days', action: 'Ensure seller data access compliance' },
        ],
      },
      'Advertising': {
        relevance: 'medium',
        requirements: [
          'Ad tech transparency',
          'Cross-platform tracking limitations',
        ],
        frictionScore: 5,
        complianceCost: '€200K - €2M',
        actions: [
          { priority: '30-days', action: 'Audit ad targeting data flows' },
          { priority: '90-days', action: 'Implement measurement transparency' },
        ],
      },
    },
    penaltyRange: 'Up to 10% of global turnover (20% for repeat)',
    enforcementBody: 'European Commission (DG COMP)',
    relatedPolicies: ['gdpr'],
    sourceUrl: 'https://digital-markets-act.ec.europa.eu/designated-gatekeepers-must-now-comply-all-obligations-under-digital-markets-act-2024-03-07_mt',
    sourceLabel: 'European Commission DMA compliance notice',
    lastReviewed: 'May 2026',
  },
  {
    id: 'eu-data-act',
    name: 'EU Data Act',
    shortName: 'Data Act',
    jurisdiction: 'EU',
    effectiveDate: 'September 12, 2025',
    status: 'Active',
    description: 'EU rules giving users greater control over data generated by connected products and services, with obligations around access, sharing, and cloud switching.',
    scope: 'Connected products, related services, business data sharing, and cloud/data-processing services in the EU',
    keyProvisions: [
      'User access to connected-product data',
      'Business-to-business data sharing rules',
      'Cloud switching and interoperability obligations',
      'Protection against unfair contractual terms',
      'Public-sector access in exceptional need',
    ],
    industryImpacts: {
      'Automotive': {
        relevance: 'high',
        requirements: [
          'Vehicle-generated data access for users and third parties',
          'Contract review for aftersales and data-sharing models',
          'Technical interface planning for secure data access',
        ],
        frictionScore: 7,
        complianceCost: '€300K - €3M',
        actions: [
          { priority: 'immediate', action: 'Map vehicle and connected-service data flows' },
          { priority: '30-days', action: 'Review data-access terms with dealers, fleets, and service partners' },
          { priority: '90-days', action: 'Define secure APIs or export channels for user data access' },
        ],
      },
      'Manufacturing': {
        relevance: 'high',
        requirements: [
          'Industrial-machine data access for business users',
          'Trade-secret controls when sharing operational data',
          'Contract updates for equipment and maintenance services',
        ],
        frictionScore: 6,
        complianceCost: '€200K - €2M',
        actions: [
          { priority: 'immediate', action: 'Identify connected products that generate customer-use data' },
          { priority: '30-days', action: 'Review service contracts for Data Act access rights' },
          { priority: '90-days', action: 'Create a data-sharing playbook for sales and support teams' },
        ],
      },
      'Data Centers': {
        relevance: 'high',
        requirements: [
          'Cloud-switching support',
          'Contract and exit-fee review',
          'Interoperability and data portability processes',
        ],
        frictionScore: 6,
        complianceCost: '€200K - €2M',
        actions: [
          { priority: 'immediate', action: 'Assess cloud-switching and portability obligations' },
          { priority: '30-days', action: 'Review customer exit terms and technical migration support' },
          { priority: '90-days', action: 'Document switching process and support commitments' },
        ],
      },
      'Retail/E-commerce': {
        relevance: 'medium',
        requirements: [
          'Connected-device data access where products generate usage data',
          'Contract controls for third-party data recipients',
        ],
        frictionScore: 3,
        complianceCost: '€50K - €500K',
        actions: [
          { priority: '90-days', action: 'Check whether sold or bundled connected products create Data Act obligations' },
        ],
      },
    },
    penaltyRange: 'Member State penalties; varies by national implementation',
    enforcementBody: 'Member State competent authorities',
    relatedPolicies: ['gdpr'],
    sourceUrl: 'https://digital-strategy.ec.europa.eu/en/policies/data-act',
    sourceLabel: 'European Commission Data Act overview',
    lastReviewed: 'May 2026',
  },
]

// Industry options for selector
export const INDUSTRIES = [
  'AI/ML',
  'Healthcare',
  'Financial Services',
  'Automotive',
  'Manufacturing',
  'Semiconductors',
  'Equipment',
  'Data Centers',
  'Retail/E-commerce',
  'Big Tech',
  'Advertising',
]

// Company size options. (The friction adjustment lives in the page's
// SIZE_CONTEXT.modifier; the previous `multiplier` here was never read.)
export const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (<50 employees)' },
  { value: 'sme', label: 'SME (50-250 employees)' },
  { value: 'enterprise', label: 'Enterprise (250+ employees)' },
]

// Utility functions

export function getPolicyById(id: string): Policy | undefined {
  return POLICIES.find(p => p.id === id)
}

export function getPoliciesByJurisdiction(jurisdiction: Jurisdiction): Policy[] {
  return POLICIES.filter(p => p.jurisdiction === jurisdiction)
}

export function getIndustryImpact(policyId: string, industry: string): IndustryImpact | undefined {
  const policy = getPolicyById(policyId)
  return policy?.industryImpacts[industry]
}

export function calculateCombinedFriction(
  euPolicyId: string | null,
  usPolicyId: string | null,
  industry: string
): number {
  let total = 0
  let count = 0

  if (euPolicyId) {
    const impact = getIndustryImpact(euPolicyId, industry)
    if (impact) {
      total += impact.frictionScore
      count++
    }
  }

  if (usPolicyId) {
    const impact = getIndustryImpact(usPolicyId, industry)
    if (impact) {
      total += impact.frictionScore
      count++
    }
  }

  return count > 0 ? Math.round((total / count) * 10) / 10 : 0
}

// Color mappings
export const RELEVANCE_COLORS: Record<Relevance, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#14b8a6',
  none: '#6b7280',
}

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  immediate: { bg: 'bg-alert-red/10', text: 'text-alert-red', border: 'border-alert-red/30' },
  '30-days': { bg: 'bg-silicon-amber/10', text: 'text-silicon-amber', border: 'border-silicon-amber/30' },
  '90-days': { bg: 'bg-stone-teal/10', text: 'text-stone-teal', border: 'border-stone-teal/30' },
  '180-days': { bg: 'bg-text-muted/10', text: 'text-text-muted', border: 'border-text-muted/30' },
}

export const JURISDICTION_COLORS: Record<Jurisdiction, { bg: string; text: string; border: string }> = {
  EU: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  US: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
}
