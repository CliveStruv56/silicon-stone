/**
 * WaymarkPath — the sister product's facts, in one place.
 *
 * Three surfaces describe the same seven capabilities: the Products-page band
 * (`src/app/(website)/products/page.tsx`), the `/waymarkpath` page, and the
 * flow motif shared between them. They were drifting apart in prose, so the
 * copy lives here and each surface reads it, the same way every price on the
 * site comes from `src/lib/offering.ts`.
 *
 * The `feeds` relationships are not decoration. WaymarkPath's actual claim is
 * that these seven share context rather than sitting side by side, and `feeds`
 * is what the diagram draws — so the page demonstrates the claim instead of
 * asserting it. Keep them accurate to the product.
 *
 * NOT here, deliberately: the Kit tag and the Plausible goal name. Both are
 * configured externally by exact string and belong next to the form that fires
 * them, where they are visible to anyone editing it.
 */

export type WaymarkPathCapabilityId =
  | 'profile'
  | 'skills'
  | 'gaps'
  | 'learning'
  | 'resume'
  | 'jobs'
  | 'checkins'

export interface WaymarkPathCapability {
  id: WaymarkPathCapabilityId
  /** Two-digit index used as the mono step marker. */
  step: string
  name: string
  /** Compact label for the ribbon, where the full name will not fit. */
  short: string
  /** One line, shown under the name. What this stage settles. */
  promise: string
  /** Two or three sentences, shown when the node is selected. */
  detail: string
  /** Which stages receive this one's output. Drawn as connectors. */
  feeds: WaymarkPathCapabilityId[]
}

export const WAYMARKPATH_CAPABILITIES: readonly WaymarkPathCapability[] = [
  {
    id: 'profile',
    step: '01',
    name: 'Profile & Goals',
    short: 'Profile',
    promise: 'Where you are, and where you intend to be.',
    detail:
      'A guided intake that fixes the target role, the timeline and the constraints you are actually working under. Target roles resolve against ESCO occupations rather than free text, so everything downstream compares like with like.',
    feeds: ['skills'],
  },
  {
    id: 'skills',
    step: '02',
    name: 'Skills Inventory',
    short: 'Skills',
    promise: 'What you already bring, at the level you bring it.',
    detail:
      'Your existing skills catalogued with proficiency and years behind them. This is the half most people underestimate: a transition rarely fails because the skills are absent, but because nobody has written them down in terms the target role recognises.',
    feeds: ['gaps'],
  },
  {
    id: 'gaps',
    step: '03',
    name: 'Gap Analysis',
    short: 'Gaps',
    promise: 'The distance between the two, ranked.',
    detail:
      'Your inventory compared against what the target occupation requires, splitting the result into transferable strengths and genuine gaps, each with a priority. It reads across ESCO and O*NET, so a European skills profile still lines up against US job-market vocabulary.',
    feeds: ['learning', 'resume'],
  },
  {
    id: 'learning',
    step: '04',
    name: 'Learning Path',
    short: 'Learning',
    promise: 'What to close first, and what can wait.',
    detail:
      'The ranked gaps become a sequence with milestones and progress tracking, rather than a reading list. Priority comes from the gap analysis, so effort goes to the shortfalls that actually block the move.',
    feeds: ['checkins'],
  },
  {
    id: 'resume',
    step: '05',
    name: 'Resume Hub',
    short: 'Resume',
    promise: 'A CV that survives the filter and reads as deliberate.',
    detail:
      'Your CV parsed into sections and scored against applicant tracking systems, with the formatting faults that cause silent rejections called out. Career-change mode reframes existing experience for the target industry, drawing on the strengths the gap analysis already identified.',
    feeds: ['jobs'],
  },
  {
    id: 'jobs',
    step: '06',
    name: 'Job Tracker',
    short: 'Jobs',
    promise: 'Every application, and how well it actually fits.',
    detail:
      'A pipeline from saved to offer, with roles added by URL and parsed automatically. Each one can be matched against your profile before you spend an evening on it, and cover letters start from what the system already knows about you.',
    feeds: ['checkins'],
  },
  {
    id: 'checkins',
    step: '07',
    name: 'Daily Check-ins',
    short: 'Check-ins',
    promise: 'The part that makes the other six survive contact with a working week.',
    detail:
      'A short daily conversation with a coach that has your goals, your gaps and your live applications in front of it — so it does not start cold each time. Commitments and streaks are the accountability layer that career changers otherwise pay a coach by the hour for.',
    feeds: ['gaps'],
  },
] as const

/** Lookup by id, for the connector maths. */
export const WAYMARKPATH_CAPABILITY_INDEX: Record<WaymarkPathCapabilityId, number> =
  WAYMARKPATH_CAPABILITIES.reduce(
    (acc, cap, i) => {
      acc[cap.id] = i
      return acc
    },
    {} as Record<WaymarkPathCapabilityId, number>,
  )

/**
 * Where "See WaymarkPath" points.
 *
 * Internal today: the app's own deployment is not currently in a state worth
 * sending readers to, and this page carries the early-access capture. When that
 * changes this becomes the app URL and nothing else has to move — which is why
 * `NEXT_PUBLIC_WAYMARKPATH_URL` is still not read anywhere in `src`.
 */
export const WAYMARKPATH_HREF = '/waymarkpath'

/**
 * The evidence the page leans on, rather than testimonials it does not have.
 * ESCO is the European Commission's multilingual classification of skills,
 * competences and occupations; the 13,890 figure is the published skills count.
 */
export const WAYMARKPATH_PROOF = [
  {
    label: 'ESCO',
    value: '13,890 skills',
    note: 'The European Commission’s occupation and skills classification — the comparison runs against a public standard, not a model’s guess.',
  },
  {
    label: 'O*NET bridging',
    value: 'EU ↔ US',
    note: 'European competency labels translated to US job-market vocabulary, so a profile built here still reads correctly to an American employer.',
  },
  {
    label: 'Built for',
    value: 'Mid-career change',
    note: 'Not job search with extra steps. The assumption throughout is that the target role is not the one you currently hold.',
  },
] as const
