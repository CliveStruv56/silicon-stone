/**
 * Silicon & Stone Learning — the parts of the course model that code, not
 * Studio, must own. Pure: no env, no server-only, no Sanity client.
 *
 * Course *content* (titles, outcomes, modules, status) lives in Sanity so the
 * catalogue and its badges change without a deploy. What lives here is what a
 * Studio edit must never be able to break:
 *
 *  - the four status values and how each one reads on screen;
 *  - the track and route slugs, because the waitlist's tag allow-list is built
 *    from them and a tag nobody can route to is a tag nobody can email;
 *  - the exercise tools, because they are code and their URLs are routes.
 */

// Type-only: the model must stay importable from Studio schemas without
// pulling the offering catalogue's runtime into the Studio bundle.
import type { TOOL_JOURNEYS } from '../tool-journeys'

/* ------------------------------------------------------------------ status */

export const COURSE_STATUSES = ['open', 'founding-cohort', 'coming', 'in-development'] as const
export type CourseStatus = (typeof COURSE_STATUSES)[number]

export const COURSE_STATUS_TITLES: Record<CourseStatus, string> = {
  open: 'Open',
  'founding-cohort': 'Founding cohort',
  coming: 'Coming',
  'in-development': 'In development',
}

/** `"2027-01"` → `"January 2027"`. Returns null for anything that is not a month. */
export function formatMonth(month: string | null | undefined): string | null {
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null
  const [year, m] = month.split('-').map(Number)
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * The badge text. A `coming` course without a month says "Coming soon" rather
 * than inventing one — the schema requires the month, but a draft that slipped
 * through must not render a false date.
 */
export function statusLabel(status: CourseStatus, month?: string | null): string {
  if (status === 'coming') {
    const when = formatMonth(month)
    return when ? `Coming ${when}` : 'Coming soon'
  }
  return COURSE_STATUS_TITLES[status]
}

/* ------------------------------------------------------------------ tracks */

/** Track slugs, in release order (the `order` field on each track). `/learn/paths/<slug>`. */
export const TRACK_SLUGS = [
  'foundations',
  'eu-ai-act',
  'infrastructure-and-sovereignty',
  'practitioner',
  'electives',
  'security',
  'capstone',
] as const
export type TrackSlug = (typeof TRACK_SLUGS)[number]

/**
 * The labels the waitlist form shows. Sanity holds each track's title too; the
 * form cannot wait on a fetch to render its tick-boxes, so these are kept in
 * step with the documents by `catalogue-seed.test.ts`.
 */
export const TRACK_LABELS: Record<TrackSlug, string> = {
  foundations: 'Foundations',
  'infrastructure-and-sovereignty': 'Infrastructure and sovereignty',
  'eu-ai-act': 'EU AI Act Core',
  practitioner: 'Practitioner',
  security: 'Security',
  electives: 'Advanced and sector electives',
  capstone: 'Sovereignty capstone',
}

/* ------------------------------------------------------------------ routes */

/**
 * Routes by role, from the catalogue's "Routes by buyer" table. The slug is
 * also the waitlist's `learn-role-*` tag, so the step-two "Your role" list and
 * the route tabs are the same list.
 */
export const ROUTE_SLUGS = [
  'board-and-executive',
  'governance-and-compliance',
  'sme-owner',
  'supply-chain-and-operations',
  'technical',
  'privacy-and-legal',
  'all-staff-literacy',
  'moving-into-ai-governance',
] as const
export type RouteSlug = (typeof ROUTE_SLUGS)[number]

export const ROUTE_LABELS: Record<RouteSlug, string> = {
  'board-and-executive': 'Board and executive',
  'governance-and-compliance': 'Governance lead',
  'sme-owner': 'SME owner',
  'supply-chain-and-operations': 'Operations and supply chain',
  technical: 'Technical, IT and security',
  'privacy-and-legal': 'Privacy and legal',
  'all-staff-literacy': 'All-staff literacy',
  'moving-into-ai-governance': 'Moving into AI governance',
}

/* ------------------------------------------------------------- exercises */

export interface ExerciseTool {
  name: string
  href: string
  free: boolean
}

/**
 * Every Silicon & Stone tool a course exercise can use. The four free tools are
 * read from `TOOL_JOURNEYS` so a renamed tool cannot leave a course pointing at
 * the old name; the rest are pages, not tools, and are listed by hand.
 * `model.test.ts` asserts every `href` is a real page.
 */
export const EXERCISE_TOOLS = {
  'compliance-checker': { name: 'Compliance Checker', href: '/tools/compliance-checker', free: true },
  'checker-provisions': {
    name: 'Checker provisions corpus',
    href: '/tools/compliance-checker/provisions',
    free: true,
  },
  'supply-chain-mapper': { name: 'Supply Chain Mapper', href: '/tools/supply-chain-mapper', free: true },
  'scenario-modeler': { name: 'Scenario Modeler', href: '/tools/scenario-modeler', free: true },
  'policy-stress-test': { name: 'Policy Stress-Test', href: '/tools/policy-stress-test', free: true },
  'ai-act-toolkit': { name: 'AI Act Compliance Toolkit', href: '/products/ai-act-toolkit', free: false },
  'sector-reports': { name: 'Sector Reports', href: '/products/sector-reports', free: false },
} as const satisfies Record<string, ExerciseTool>

export type ExerciseToolKey = keyof typeof EXERCISE_TOOLS

/** Compile-time guard: every free tool with a journey is an exercise tool. */
const _everyJourneyIsAnExercise: Record<keyof typeof TOOL_JOURNEYS, ExerciseTool> = EXERCISE_TOOLS
void _everyJourneyIsAnExercise

/**
 * Which course teaches each free tool's result, for the quiet "learn to read
 * this result" line on each tool page.
 */
export const TOOL_COURSE: Record<keyof typeof TOOL_JOURNEYS, string> = {
  'compliance-checker': '4.3',
  'supply-chain-mapper': '2.3',
  'scenario-modeler': '2.3',
  'policy-stress-test': '2.4',
}

/* ------------------------------------------------------------------ codes */

/** `0.1` … `4.10`. Level digit, a dot, then one or two digits. */
export const COURSE_CODE = /^[0-5]\.\d{1,2}$/

/** `"2.2"` → `"2-2"`: the form a course code takes in a tag or an id. */
export function codeSlug(code: string): string {
  if (!COURSE_CODE.test(code)) throw new Error(`Not a course code: ${code}`)
  return code.replace('.', '-')
}

/** Sort course codes numerically: 4.2 before 4.10, which a string sort gets wrong. */
export function compareCodes(a: string, b: string): number {
  const [al, an] = a.split('.').map(Number)
  const [bl, bn] = b.split('.').map(Number)
  return al - bl || an - bn
}
