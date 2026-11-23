import type { PackTimelineEntry } from './rulepack'

/**
 * Date arithmetic for the AI Act application dates, shared by the v1 checker,
 * the v2 beta and every page that says whether a date has passed.
 *
 * Every date comes from the pinned rule pack, written the way the pack writes
 * it ("2 December 2026"). Whether a date has passed is worked out from an
 * assessment date passed in by the caller, never from the `status` field the
 * pack carries: that field is true on the day the pack was cut and goes stale
 * the day a milestone passes.
 *
 * A date applies from the start of that calendar day in the reader's own time
 * zone, so `asOf` is the reader's local calendar date, not the UTC date: in an
 * EU country at UTC+2 the day starts two hours before UTC midnight. An ISO day
 * compares correctly as a plain string.
 */

const MONTHS: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
}

/** "2 December 2026" → "2026-12-02". Throws on anything else. */
export function packDateToIso(value: string): string {
  const match = /^(\d{1,2}) ([A-Z][a-z]+) (\d{4})$/.exec(value.trim())
  const month = match ? MONTHS[match[2]] : undefined
  if (!match || !month) {
    throw new Error(`Rule pack date "${value}" is not in the form "2 December 2026"`)
  }
  return `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`
}

/**
 * The zone used where there is no browser to ask: the server report routes.
 * Brussels is where the Regulation's dates are set, so a report requested on the
 * server agrees with the EU calendar day. It can differ by an hour or two from a
 * reader in another zone, and the on-screen result is the one that follows them.
 */
export const SERVER_TIME_ZONE = 'Europe/Brussels'

/**
 * Today as an ISO day in a time zone: the runtime's own zone when none is given
 * (in a browser, the reader's), otherwise the named IANA zone. This is the one
 * place the checker reads the clock; callers that need a reproducible result
 * pass their own `asOf`, and tests pass `now` and `timeZone`.
 */
export function todayIso(now: Date = new Date(), timeZone?: string): string {
  if (!timeZone) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Has the date, written as the pack writes it, been reached on `asOf`? */
export function inForceOn(packDate: string, asOf: string): boolean {
  return asOf >= packDateToIso(packDate)
}

export type TimelineStatus = PackTimelineEntry['status']

/** A milestone's status on `asOf`, from its date and not from the stored field. */
export function timelineStatusOn(entry: Pick<PackTimelineEntry, 'date'>, asOf: string): TimelineStatus {
  return inForceOn(entry.date, asOf) ? 'in-force' : 'upcoming'
}

/** The earliest milestone not yet reached on `asOf`, or undefined once all have been. */
export function nextMilestoneOn<T extends Pick<PackTimelineEntry, 'date'>>(
  timeline: readonly T[],
  asOf: string,
): T | undefined {
  return [...timeline]
    .filter((entry) => !inForceOn(entry.date, asOf))
    .sort((a, b) => packDateToIso(a.date).localeCompare(packDateToIso(b.date)))[0]
}
