/**
 * When is a regulatory corpus instrument's review due?
 *
 * `reg:check` fails the build the day after an instrument's `reviewBy` date.
 * That hard stop is deliberate and stays — automation can break silently,
 * `prebuild` cannot. What it lacked was any warning: the weekly drift watcher
 * could run green every Monday and the build still fall off a cliff on a
 * Wednesday, because nothing in a green run says a review is coming. This is
 * the one definition of "coming", shared by the build check (a log line) and the
 * weekly workflow (an issue), so the two can never disagree about it.
 *
 * Pure on purpose: dates in, verdict out. No clock, no filesystem.
 */

/** How far ahead of the lapse date the warning starts. Three Mondays of notice. */
export const REVIEW_WARNING_DAYS = 21

export type ReviewState = 'current' | 'due' | 'lapsed' | 'missing'

export interface ReviewStatus {
  state: ReviewState
  /** Whole days from `today` to `reviewBy`; negative once lapsed, null when missing. */
  daysLeft: number | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function utcDay(iso: string): number {
  if (!ISO_DATE.test(iso)) throw new Error(`Not an ISO date: "${iso}"`)
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000
}

/**
 * `lapsed` means exactly what `reg:check` fails on: today is after `reviewBy`.
 * The review date itself is still a working day, so it reads `due` with 0 left.
 */
export function reviewStatus(
  reviewBy: string | undefined,
  today: string,
  warningDays: number = REVIEW_WARNING_DAYS,
): ReviewStatus {
  if (!reviewBy) return { state: 'missing', daysLeft: null }
  const daysLeft = utcDay(reviewBy) - utcDay(today)
  if (daysLeft < 0) return { state: 'lapsed', daysLeft }
  if (daysLeft <= warningDays) return { state: 'due', daysLeft }
  return { state: 'current', daysLeft }
}
