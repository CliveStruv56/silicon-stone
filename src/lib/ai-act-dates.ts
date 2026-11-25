import type { PackTimelineEntry } from './rulepack'

/**
 * Date arithmetic for the AI Act application dates, shared by the v1 checker,
 * the v2 beta and every page that says whether a date has been reached.
 *
 * Every date comes from the pinned rule pack, written the way the pack writes
 * it ("2 December 2026"). Whether a date has been reached is worked out from an
 * assessment moment passed in by the caller, never from the `status` field the
 * pack carries: that field is true on the day the pack was cut and goes stale
 * the day a milestone passes.
 *
 * **A date does not start in one time zone.** The Regulation applies across the
 * whole Union, whose territory spans UTC-4 (Martinique, Guadeloupe, Saint-Martin)
 * to UTC+4 (Réunion). So there are three states, not two:
 *
 * - `not-yet`: the date has not begun in any EU zone. "Not yet" forms are safe.
 * - `between`: it has begun in the earliest zone but not the latest (about eight
 *   hours). Anything shown must make neither a "not yet" nor a "since" claim.
 * - `applies`: it has begun in every EU zone. "Since" forms are safe.
 *
 * Client and server use the same rule, so a reader's own zone never decides it.
 *
 * A moment is either an ISO day ("2026-12-02", read as the same day everywhere,
 * so it has no `between`: tests, stored records and the legacy baseline use it)
 * or an ISO instant ("2026-12-01T22:00:00Z", from `nowMoment`).
 */

const MONTHS: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
}

/** The first EU zone to begin any day: Réunion, UTC+4. */
export const EARLIEST_EU_ZONE = 'Indian/Reunion'
/** The last EU zones to begin any day: Martinique, Guadeloupe and Saint-Martin, UTC-4. */
export const LATEST_EU_ZONES = ['America/Martinique', 'America/Guadeloupe', 'America/Marigot'] as const

/** "2 December 2026" → "2026-12-02". Throws on anything else. */
export function packDateToIso(value: string): string {
  const match = /^(\d{1,2}) ([A-Z][a-z]+) (\d{4})$/.exec(value.trim())
  const month = match ? MONTHS[match[2]] : undefined
  if (!match || !month) {
    throw new Error(`Rule pack date "${value}" is not in the form "2 December 2026"`)
  }
  return `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`
}

/** The calendar day an instant falls on in an IANA time zone. */
export function dayIn(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/**
 * The current instant as a moment, truncated to the hour. Every EU zone's
 * offset is a whole number of hours, so no state changes inside an hour, and a
 * value that is stable for an hour is safe to read on every render.
 */
export function nowMoment(now: Date = new Date()): string {
  return `${now.toISOString().slice(0, 13)}:00:00Z`
}

/** The UTC calendar day of a moment, for display and for records. */
export function momentDay(moment: string): string {
  return moment.slice(0, 10)
}

export type Phase = 'not-yet' | 'between' | 'applies'

function phaseOnIso(targetIso: string, moment: string): Phase {
  if (moment.length === 10) return moment >= targetIso ? 'applies' : 'not-yet'
  const at = new Date(moment)
  const earliest = dayIn(at, EARLIEST_EU_ZONE)
  const latest = LATEST_EU_ZONES.map((zone) => dayIn(at, zone)).sort()[0]
  if (latest >= targetIso) return 'applies'
  if (earliest >= targetIso) return 'between'
  return 'not-yet'
}

/** Where a date, written as the pack writes it, stands at a moment. */
export function phaseOn(packDate: string, moment: string): Phase {
  return phaseOnIso(packDateToIso(packDate), moment)
}

/** Where the day after a date stands, for wording that turns past tense a day later. */
export function dayAfterPhaseOn(packDate: string, moment: string): Phase {
  const next = new Date(`${packDateToIso(packDate)}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return phaseOnIso(next.toISOString().slice(0, 10), moment)
}

/** A milestone's phase at a moment, from its date and not from the stored field. */
export function timelineStatusOn(entry: Pick<PackTimelineEntry, 'date'>, moment: string): Phase {
  return phaseOn(entry.date, moment)
}

/**
 * The earliest milestone not yet begun anywhere, or undefined once all have.
 * Also undefined while any milestone is `between`: a "next step is X" sentence
 * would be wrong in one direction or the other for part of the Union.
 */
export function nextMilestoneOn<T extends Pick<PackTimelineEntry, 'date'>>(
  timeline: readonly T[],
  moment: string,
): T | undefined {
  if (timeline.some((entry) => phaseOn(entry.date, moment) === 'between')) return undefined
  return [...timeline]
    .filter((entry) => phaseOn(entry.date, moment) === 'not-yet')
    .sort((a, b) => packDateToIso(a.date).localeCompare(packDateToIso(b.date)))[0]
}
