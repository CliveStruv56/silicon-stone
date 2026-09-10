import { MODULES } from '@/lib/offering'

/**
 * The offerings an article can be placed under from Studio.
 *
 * `article.appearsUnder` is an array of these `value`s, and each offering page
 * that carries a "Further reading on this topic" strip queries for its own id.
 * The list is derived from the catalogue rather than typed into the schema so
 * an offering cannot be renamed or retired while articles stay filed under an
 * id nothing reads any more — and so the Studio checkbox cannot call an
 * offering something the rest of the site does not.
 *
 * Modules only, for now. The four engagement pages come off
 * `FocusedEngagementPage`, which has no slot for the strip yet, and a checkbox
 * that places an article nowhere is a silent failure of exactly the kind this
 * field exists to remove. When the engagement template gains the slot, add
 * `ENGAGEMENTS.filter(e => !e.href.includes('#'))` here (the footer's
 * has-a-page-of-its-own rule) and the test will insist every one is fetched.
 *
 * Kept free of `server-only` because the Sanity schema imports it and Studio
 * runs in the browser.
 */
export const COVERAGE_PLACEMENTS: ReadonlyArray<{ value: string; title: string }> = MODULES.map(
  module => ({ value: module.id, title: module.name }),
)

export function isCoveragePlacement(value: string): boolean {
  return COVERAGE_PLACEMENTS.some(placement => placement.value === value)
}
