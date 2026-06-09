/**
 * Persona definitions for Silicon & Stone Intelligence Portal
 * Based on content-focus-areas.md persona specifications
 */

export type PersonaSlug = 'clara' | 'ian' | 'sofia' | 'robert' | 'positional' | 'citizen'

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
  /** Optional routing override. Defaults to /briefings?persona=<slug>. */
  href?: string
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
  positional: {
    slug: 'positional',
    name: 'Positional',
    role: 'Senior Practitioner',
    icon: 'compass',
    color: 'sister-indigo',
    avatar: '/personas/citizen.jpg',
    href: '/waymarkpath',
    ctaCopy: 'Where the durable bets are in a redrawn labour market.',
    description: 'Reading every shift for its impact on your own position and career',
    contentNeeds: [
      'Skill-demand signals',
      'Role-resilience analysis',
      'Capability transition paths',
      'Labour-market scenarios',
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

export const PERSONA_ORDER: PersonaSlug[] = ['clara', 'ian', 'sofia', 'robert', 'positional', 'citizen']

/**
 * Personas that filter the briefings content feed. Excludes any persona with an
 * `href` override (e.g. Positional, which routes to WaymarkPath rather than a
 * briefings filter and has no content of its own).
 */
export const BRIEFINGS_PERSONA_ORDER: PersonaSlug[] = PERSONA_ORDER.filter(
  (slug) => !PERSONAS[slug].href,
)

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
 * Complete, static Tailwind classes for a persona badge (border + text).
 * These are written as full literals so Tailwind's compiler can see and emit
 * them. NEVER build these by interpolating a token into `border-${x}` — Tailwind
 * v4 only generates classes it sees as complete strings.
 */
const PERSONA_BADGE_CLASSES: Record<PersonaSlug, string> = {
  clara: 'border-silicon-amber/50 text-silicon-amber',
  ian: 'border-stone-teal/50 text-stone-teal',
  sofia: 'border-tier-pulse/50 text-tier-pulse',
  robert: 'border-alert-red/50 text-alert-red',
  positional: 'border-sister-indigo/50 text-sister-indigo',
  citizen: 'border-border-subtle text-text-muted',
}

export function getPersonaBadgeClasses(slug: string): string {
  return PERSONA_BADGE_CLASSES[slug as PersonaSlug] || 'border-border-subtle text-text-muted'
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
    positional: {
      headline: 'Positional Intelligence',
      subheadline: 'Read every shift for your own position. Where the durable bets are in a redrawn labour market.',
    },
    citizen: {
      headline: 'Weekly Explainer',
      subheadline: 'Complex tech-policy issues made accessible. No jargon, just clarity.',
    },
  }

  return ctaMap[activePersona as PersonaSlug]
}
