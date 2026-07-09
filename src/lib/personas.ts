/**
 * Persona definitions for Silicon & Stone Intelligence Portal
 * Based on content-focus-areas.md persona specifications
 */

export type PersonaSlug = 'clara' | 'ian' | 'sofia' | 'positional' | 'citizen' | 'troy'

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
  /** Optional routing override. Defaults to /intelligence?persona=<slug>. */
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
    ctaCopy: 'The twice-weekly read for those tracking the bigger picture',
    description: 'Seeking accessible understanding of complex tech-policy issues',
    contentNeeds: [
      'Accessible explainers',
      'Impact summaries',
      'Historical context',
      'Jargon-free analysis',
    ],
  },
  troy: {
    slug: 'troy',
    name: 'Transatlantic Troy',
    role: 'Founder / CEO',
    icon: 'plane',
    color: 'troy-blue',
    avatar: '/personas/troy.jpg',
    ctaCopy: 'Price the sovereignty cost of European entry',
    description: 'Decoding European compliance standards to compete across the Atlantic',
    contentNeeds: [
      'Market-entry compliance checklists',
      'Cost-of-compliance analysis',
      'EU regulatory timelines',
      'Certification and procurement requirements',
    ],
  },
}

export const PERSONA_ORDER: PersonaSlug[] = ['clara', 'ian', 'sofia', 'positional', 'citizen', 'troy']

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
  return persona?.ctaCopy || 'Get our twice-weekly briefings'
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
  positional: 'border-sister-indigo/50 text-sister-indigo',
  citizen: 'border-border-subtle text-text-muted',
  troy: 'border-troy-blue/50 text-troy-blue',
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
      headline: 'Two briefings a week, from the edge of Europe',
      subheadline: 'The Tuesday Stone Briefing on what just shifted in AI policy, semiconductors, supply chains, and digital sovereignty. The Friday Practical Move on what to do about it. Decision-grade, never breathless.',
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
    positional: {
      headline: 'Positional Intelligence',
      subheadline: 'Read every shift for your own position. Where the durable bets are in a redrawn labour market.',
    },
    citizen: {
      headline: 'Twice-Weekly Explainer',
      subheadline: 'Complex tech-policy issues made accessible. No jargon, just clarity.',
    },
    troy: {
      headline: 'Transatlantic Market Intelligence',
      subheadline: 'Decode European compliance before you commit. What sovereignty rules cost US and Canadian entrants.',
    },
  }

  return ctaMap[activePersona as PersonaSlug]
}
