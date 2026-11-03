/**
 * Hand-maintained result types for the Learn GROQ projections in
 * `src/sanity/lib/queries.ts` (this repo has no Sanity TypeGen), and the small
 * pure helpers the pages share.
 */

import type { LearnPriceKey } from '../offering'
import type { CourseStatus } from './model'

export interface CourseCardData {
  _id: string
  code: string
  title: string
  slug: string
  promise?: string
  duration: string
  durationMinutes?: number | null
  status: CourseStatus
  statusMonth?: string | null
  level?: number | null
  track?: string | null
}

/** A positional slot in an ordered list. `course` is null when the ref does not resolve. */
export interface CourseSlot {
  _key: string
  course: CourseCardData | null
}

export interface LevelData {
  number: number
  title: string
  summary?: string
}

export interface TrackData {
  _id: string
  title: string
  slug: string
  order: number
  intro: string
  priceKey: LearnPriceKey
  opens?: string | null
  courses: CourseSlot[] | null
}

export interface RouteData {
  _id?: string
  title: string
  slug: string
  personaSlug?: string | null
  bestSoldAs?: string | null
  courses: CourseSlot[] | null
}

export interface LearnHubData {
  levels: LevelData[]
  tracks: TrackData[]
  routes: RouteData[]
  courses: CourseCardData[]
}

export interface CourseModuleData {
  _key: string
  title: string
  core?: string
  goDeeper?: string
}

export interface CourseDetail extends CourseCardData {
  audience?: string[]
  priorKnowledge?: string
  outcomes?: string[]
  modules?: CourseModuleData[]
  exerciseTools?: string[]
  exercise?: string
  cohortDates?: string[]
  selfServeFrom?: string | null
  contentCheckedDate?: string | null
  levelTitle?: string
  trackDoc?: Omit<TrackData, '_id' | 'order' | 'intro'> | null
  relatedArticles?: Array<{ _id: string; title: string; slug: string; excerpt?: string }> | null
  nextCourse?: CourseCardData | null
  routes?: Array<{ title: string; slug: string }>
}

/** The courses that resolve, in order. Numbering must come from the slot index, not this. */
export function resolvedCourses(slots: CourseSlot[] | null | undefined): CourseCardData[] {
  return (slots ?? []).flatMap((slot) => (slot.course ? [slot.course] : []))
}

/**
 * "about 9 hours", "45 minutes". Totals only the courses whose minutes are
 * known, and says "at least" when any are missing rather than under-reporting
 * silently.
 */
export function totalTime(courses: CourseCardData[]): string | null {
  const known = courses.filter((c) => typeof c.durationMinutes === 'number')
  if (known.length === 0) return null
  const minutes = known.reduce((sum, c) => sum + (c.durationMinutes ?? 0), 0)
  const label =
    minutes < 60
      ? `${minutes} minutes`
      : `about ${Math.round(minutes / 30) / 2} ${minutes === 60 ? 'hour' : 'hours'}`
  return known.length < courses.length ? `at least ${label.replace(/^about /, '')}` : label
}

/** The URL of a course page. */
export const coursePath = (slug: string) => `/learn/courses/${slug}`
/** The URL of a track page. */
export const trackPath = (slug: string) => `/learn/paths/${slug}`
