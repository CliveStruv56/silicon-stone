/**
 * Persona definitions for Silicon & Stone Intelligence Portal
 * Based on content-focus-areas.md persona specifications
 */

export type PersonaSlug = 'clara' | 'ian' | 'sofia' | 'robert' | 'citizen'

export interface Persona {
  slug: PersonaSlug
  name: string
  role: string
  icon: string
  color: string
  /** Path to the persona avatar image in /public */
  avatar: string
  ctaCopy: string
  description: string
  contentNeeds: string[]
}

export const PERSONAS: Record<PersonaSlug, Persona> = {
  clara: {
    slug: 'clara',
    name: 'Compliance Clara',
    role: 'Legal/Compliance Officer',
    icon: 'shield-check',
    color: 'silicon-amber',
    avatar: '/personas/clara.jpg',
    ctaCopy: 'Stay ahead of compliance deadlines',
    description: 'Navigating regulatory obligations with tight deadlines',
    contentNeeds: [
      'Clear compliance checklists',
      'Deadline trackers',
      'Risk classification frameworks',
      'Board-ready briefings',
    ],
  },
  ian: {
    slug: 'ian',
    name: 'Industrial Ian',
    role: 'Operations/Supply Chain Manager',
    icon: 'truck',
    color: 'stone-teal',
    avatar: '/personas/ian.jpg',
    ctaCopy: 'Get supply chain alerts before they hit',
    description: 'Managing operational risk in complex supply chains',
    contentNeeds: [
      'Supply chain maps',
      'Risk assessment frameworks',
      'Chokepoint analysis',
      'Scenario planning tools',
    ],
  },
  sofia: {
    slug: 'sofia',
    name: 'Sovereign Sofia',
    role: 'Policy/Strategy Analyst',
    icon: 'globe',
    color: 'tier-pulse',
    avatar: '/personas/sofia.jpg',
    ctaCopy: 'Quantify the Atlantic Drift',
    description: 'Tracking regulatory divergence and digital sovereignty trends',
    contentNeeds: [
      'Comparative policy analysis',
      'Regulatory impact assessments',
      'Sovereignty scorecards',
      'Strategic forecasts',
    ],
  },
  robert: {
    slug: 'robert',
    name: 'Remote Robert',
    role: 'Regional Development Director',
    icon: 'map-pin',
    color: 'alert-red',
    avatar: '/personas/robert.jpg',
    ctaCopy: 'Where regional implications get read first',
    description: 'Building regional technology capacity and resilience',
    contentNeeds: [
      'Regional case studies',
      'Economic impact analysis',
      'Investment opportunity mapping',
      'Local implementation guides',
    ],
  },
  citizen: {
    slug: 'citizen',
    name: 'Global Citizen',
    role: 'Informed Observer',
    icon: 'user',
    color: 'text-muted',
    avatar: '/personas/citizen.jpg',
    ctaCopy: 'The weekly read for those tracking the bigger picture',
    description: 'Seeking accessible understanding of complex tech-policy issues',
    contentNeeds: [
      'Accessible explainers',
      'Impact summaries',
      'Historical context',
      'Jargon-free analysis',
    ],
  },
}

export const PERSONA_ORDER: PersonaSlug[] = ['clara', 'ian', 'sofia', 'robert', 'citizen']

/**
 * Get persona label for display
 */
export function getPersonaLabel(slug: string): string {
  const persona = PERSONAS[slug as PersonaSlug]
  return persona?.name || slug
}

/**
 * Get persona CTA copy
 */
export function getPersonaCTA(slug: string): string {
  const persona = PERSONAS[slug as PersonaSlug]
  return persona?.ctaCopy || 'Get weekly intelligence updates'
}

/**
 * Get persona Tailwind color class
 */
export function getPersonaColor(slug: string): string {
  const persona = PERSONAS[slug as PersonaSlug]
  return persona?.color || 'text-muted'
}

/**
 * Get persona by slug
 */
export function getPersona(slug: string): Persona | undefined {
  return PERSONAS[slug as PersonaSlug]
}

/**
 * Get CTA copy based on active persona filter
 */
export function getDynamicCTA(activePersona?: string | null): {
  headline: string
  subheadline: string
} {
  if (!activePersona || !PERSONAS[activePersona as PersonaSlug]) {
    return {
      headline: 'Weekly Intelligence Brief',
      subheadline: 'Cut through complexity in AI regulation, semiconductor supply chains, and digital sovereignty.',
    }
  }

  const ctaMap: Record<PersonaSlug, { headline: string; subheadline: string }> = {
    clara: {
      headline: 'Compliance Intelligence',
      subheadline: 'Secure your August 2nd AI Act signal. Deadline trackers and obligation breakdowns.',
    },
    ian: {
      headline: 'Supply Chain Alerts',
      subheadline: 'Track semiconductor chokepoints. Risk assessments before disruptions hit.',
    },
    sofia: {
      headline: 'Policy Intelligence',
      subheadline: 'Quantify the Atlantic Drift. Regulatory divergence analysis for strategic planning.',
    },
    robert: {
      headline: 'Regional Impact Analysis',
      subheadline: 'Local implementation insights. Economic impact data you won\'t find elsewhere.',
    },
    citizen: {
      headline: 'Weekly Explainer',
      subheadline: 'Complex tech-policy issues made accessible. No jargon, just clarity.',
    },
  }

  return ctaMap[activePersona as PersonaSlug]
}
