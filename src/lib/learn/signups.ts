/**
 * What a Learn waitlist signup means in Standfirst. Pure: no env, no
 * server-only, so the rules are testable and readable in one place — the
 * pattern of `src/lib/standfirst-signups.ts`, which owns the newsletter forms.
 *
 * **The `learn-` prefix is a sixth family in the Standfirst tag contract**
 * (beside `list-`, `source-`, `interest-`, `buyer-`, `topic-`). It records what
 * someone asked to hear about from Learn, nothing else:
 *
 *   learn-waitlist           every Learn signup
 *   learn-track-<track>      "What would you like first?"
 *   learn-course-<2-2>       a course page's Notify me
 *   learn-role-<route>       "Your role" — one of the route slugs
 *   learn-team               "For my team": also alerts the owner, as a lead
 *   learn-source-<page>      where on the site they signed up
 *
 * The brief wrote these as `learn:waitlist` etc.; Standfirst slugifies every
 * tag (`[^a-z0-9]+` → `-`), so that is the same tag. Writing the stored form
 * here means the code and the CRM agree on what a tag is called.
 *
 * Consent is a separate matter from tags. The waitlist goes through its own
 * Standfirst form, `learn-waitlist`, which owns the double opt-in and its
 * wording. The Stone Briefing is a different consent and goes through the
 * `briefing` form — only when its own unticked box is ticked.
 */

import { COURSE_CODE, ROUTE_SLUGS, TRACK_SLUGS, codeSlug } from './model'

/** The Standfirst form that owns the waitlist's double opt-in. Must exist in the workspace. */
export const LEARN_FORM_SLUG = 'learn-waitlist'

export const LEARN_SOURCES = [
  'hub',
  'start',
  'track',
  'course',
  'teams',
  'schedule',
  'home',
  'tool',
  'article',
  'glossary',
  'persona',
] as const
export type LearnSource = (typeof LEARN_SOURCES)[number]

export const LEARN_TAG = {
  waitlist: 'learn-waitlist',
  team: 'learn-team',
  track: (slug: string) => `learn-track-${slug}`,
  course: (code: string) => `learn-course-${codeSlug(code)}`,
  role: (slug: string) => `learn-role-${slug}`,
  source: (source: string) => `learn-source-${source}`,
} as const

/**
 * Every tag the public waitlist route may apply, except course tags, which
 * are checked by pattern (`COURSE_CODE`) because the catalogue lives in Sanity.
 * Never add `list-` or `buyer-` here: `scripts/security-checks.ts` fails if you do.
 */
export const LEARN_TAGS: readonly string[] = [
  LEARN_TAG.waitlist,
  LEARN_TAG.team,
  ...TRACK_SLUGS.map(LEARN_TAG.track),
  ...ROUTE_SLUGS.map(LEARN_TAG.role),
  ...LEARN_SOURCES.map(LEARN_TAG.source),
]

/**
 * Waitlist, team, every track, one course, one role, one source. Standfirst
 * accepts twenty; the cap is the most a valid form can ask for.
 */
export const MAX_LEARN_TAGS = 2 + TRACK_SLUGS.length + 3

export interface LearnSignup {
  tags: string[]
  /** "For my team" — a sales lead, so the owner is told. */
  team: boolean
  /** The unticked Stone Briefing box. Anything but literal `true` is no. */
  briefing: boolean
  tracks: string[]
  role: string | null
  course: string | null
  source: LearnSource
}

const pick = <T extends string>(allowed: readonly T[], value: unknown): T | null =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null

/**
 * Read an untrusted waitlist body. Unknown values are dropped rather than
 * failing the signup, so a stale cached page or a queued offline signup still
 * reaches the list — the same rule `resolveSignup()` follows.
 */
export function resolveLearnSignup(body: Record<string, unknown>): LearnSignup {
  const tracks = Array.isArray(body.tracks)
    ? [...new Set(body.tracks.map((t) => pick(TRACK_SLUGS, t)).filter((t): t is (typeof TRACK_SLUGS)[number] => !!t))]
    : []
  const role = pick(ROUTE_SLUGS, body.role)
  const course = typeof body.course === 'string' && COURSE_CODE.test(body.course) ? body.course : null
  const source = pick(LEARN_SOURCES, body.source) ?? 'hub'
  const team = body.audience === 'team'
  // Consent must be affirmative. A truthy string, a 1, "on": none of them is
  // somebody ticking a box we render, so none of them counts.
  const briefing = body.briefing === true

  const tags = [
    LEARN_TAG.waitlist,
    ...tracks.map(LEARN_TAG.track),
    ...(course ? [LEARN_TAG.course(course)] : []),
    ...(role ? [LEARN_TAG.role(role)] : []),
    ...(team ? [LEARN_TAG.team] : []),
    LEARN_TAG.source(source),
  ].slice(0, MAX_LEARN_TAGS)

  return { tags, team, briefing, tracks, role, course, source }
}

/** The body of the owner's alert for a team lead. Plain text; no free text from the visitor. */
export function teamLeadSummary(signup: LearnSignup): string {
  return [
    'Someone joined the Silicon & Stone Learning waitlist for their team.',
    '',
    `Tracks: ${signup.tracks.length ? signup.tracks.join(', ') : 'none chosen'}`,
    `Role: ${signup.role ?? 'not given'}`,
    `Course: ${signup.course ?? 'none'}`,
    `Signed up on: ${signup.source}`,
    `Stone Briefing: ${signup.briefing ? 'asked for it' : 'not asked for'}`,
    '',
    'They still have to confirm the double opt-in before the tags reach the contact in Standfirst.',
  ].join('\n')
}
