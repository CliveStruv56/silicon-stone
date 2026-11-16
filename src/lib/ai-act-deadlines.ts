import type { RulePack } from './rulepack'
import type { TimelineEntry } from './ai-act-timeline'

/**
 * Status arithmetic for the AI Act deadline tracker (`/ai-act-deadlines`).
 *
 * Every date comes from the pinned rule pack's `timeline.json`, written the way
 * the pack writes it ("2 December 2026"). Nothing here types a date: the page
 * asks these functions what is in force on the day it renders, so a milestone
 * moves from "upcoming" to "in force" on its date without a deploy, and a pack
 * that moves a date moves the page with it.
 *
 * Status is computed from the date, deliberately not read from the entry's own
 * `status` field: that field is true on the day the pack was cut and goes stale
 * the day a milestone passes.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2 December 2026" → 2026-12-02T00:00:00Z. Throws on anything else. */
export function parsePackDate(value: string): Date {
  const match = /^(\d{1,2}) ([A-Z][a-z]+) (\d{4})$/.exec(value.trim())
  const month = match ? MONTHS.indexOf(match[2]) : -1
  if (!match || month < 0) {
    throw new Error(`Rule pack date "${value}" is not in the form "2 December 2026"`)
  }
  return new Date(Date.UTC(Number(match[3]), month, Number(match[1])))
}

export type DeadlineStatus = 'in-force' | 'upcoming'

export interface Deadline {
  entry: TimelineEntry
  date: Date
  /** ISO day, for <time dateTime>. */
  iso: string
  status: DeadlineStatus
  /** Whole days from `today` to the date; 0 or negative once in force. */
  daysUntil: number
}

const DAY_MS = 86_400_000

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

/** Every milestone in date order, with its status on `today`. */
export function deadlinesOn(pack: RulePack, today: Date): Deadline[] {
  const day = startOfUtcDay(today).getTime()
  return pack.timeline
    .map((entry) => {
      const date = parsePackDate(entry.date)
      const daysUntil = Math.round((date.getTime() - day) / DAY_MS)
      return {
        entry,
        date,
        iso: date.toISOString().slice(0, 10),
        status: (daysUntil <= 0 ? 'in-force' : 'upcoming') as DeadlineStatus,
        daysUntil,
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** The next milestone still to come, or null once every date has passed. */
export function nextDeadline(deadlines: Deadline[]): Deadline | null {
  return deadlines.find((deadline) => deadline.status === 'upcoming') ?? null
}
