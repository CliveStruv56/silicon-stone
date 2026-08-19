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
 * Chapter I's application date, which is what Article 4's AI literacy duty runs
 * from. The pack labels the entry for the prohibitions because those are the
 * headline, but Article 113(a) applies it to the whole of Chapters I and II and
 * the entry's `detail` names the literacy duty explicitly.
 */
export const AI_LITERACY_APPLIES = 'Prohibited practices and AI literacy'

/**
 * The Regulation's *general* application date — Article 113, second paragraph.
 *
 * The pack labels this entry for the Article 50 transparency duties, because
 * those are what most readers meet on that day. Its `basis` is the general rule,
 * though, and any provision Article 113's carve-outs do not reach runs from it.
 * Article 86 is one such: it sits in Chapter IX, which points (a) to (d) do not
 * mention. Aliased rather than reused under the transparency name so a finding
 * about the right to an explanation does not appear to cite Article 50.
 */
export const GENERAL_APPLICATION_APPLIES = TRANSPARENCY_APPLIES

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
