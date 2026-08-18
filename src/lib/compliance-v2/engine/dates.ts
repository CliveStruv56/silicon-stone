import { RULE_PACK } from '@/lib/rulepack'

/**
 * Application dates, read from the pinned pack rather than written here.
 *
 * §9.4: "Every legal duty must carry an effective date or a rulepack
 * declaration that it is currently applicable. The display layer must calculate
 * status using the assessment date and must never label a future duty
 * 'immediate.'"
 *
 * The lookup is by the pack's own label and it **throws** when the label is
 * missing. That is deliberate: a pack that renamed a timeline entry would
 * otherwise silently drop the date out of every finding that depended on it,
 * and a finding with no date is exactly the one that gets read as "now".
 */

const MONTHS: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
}

export interface ApplicationDate {
  /** As the pack writes it, for display: "2 December 2027". */
  display: string
  /** ISO, for comparison against the assessment date. */
  iso: string
  inForce: boolean
}

function parse(display: string): string {
  const [day, month, year] = display.split(' ')
  const monthIndex = MONTHS[month]
  if (monthIndex === undefined) throw new Error(`Unparseable pack date "${display}"`)
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
}

export function packDate(label: string): ApplicationDate {
  const entry = RULE_PACK.timeline.find((item) => item.label === label)
  if (!entry) {
    throw new Error(
      `Rule pack ${RULE_PACK.manifest.version} has no timeline entry labelled "${label}". ` +
        `A finding without its date reads as "now", so this fails rather than degrades.`,
    )
  }
  return { display: entry.date, iso: parse(entry.date), inForce: entry.status === 'in-force' }
}

/** The labels the engine depends on. Named so a pack rename fails in one place. */
export const ANNEX_III_APPLIES = 'Standalone high-risk systems'
export const ANNEX_I_APPLIES = 'Embedded product-safety high-risk systems'
export const TRANSPARENCY_APPLIES = 'Article 50 transparency, GPAI enforcement, and penalties'
export const NEW_PROHIBITIONS_APPLY = 'New prohibitions, and machine-readable marking'

/**
 * Is a duty in application on the assessment date?
 *
 * `assessedAt` is passed in rather than read from the clock so a result is
 * reproducible from its stored record — §15.1's whole purpose — and so tests
 * are not a hostage to the day they run on.
 */
export function isInApplication(date: ApplicationDate | undefined, assessedAt: string): boolean {
  if (!date) return true
  return assessedAt >= date.iso
}
