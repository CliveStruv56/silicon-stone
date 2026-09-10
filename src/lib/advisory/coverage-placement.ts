import { ENGAGEMENTS, MODULES } from '@/lib/offering'

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
 * Engagements qualify only if they have a page of their own — the footer's
 * rule. `board-level` is an anchor on the hub, and a strip has nowhere to
 * render there; a checkbox that places an article nowhere is the silent
 * failure this field exists to remove. `coverage-placement.test.ts` insists
 * every value here is fetched by its page.
 *
 * Kept free of `server-only` because the Sanity schema imports it and Studio
 * runs in the browser.
 */
export const COVERAGE_PLACEMENTS: ReadonlyArray<{ value: string; title: string }> = [
  ...MODULES.map(module => ({ value: module.id, title: `${module.name} (specialist project)` })),
  ...ENGAGEMENTS.filter(engagement => !engagement.href.includes('#')).map(engagement => ({
    value: engagement.id,
    title: engagement.name,
  })),
]

export function isCoveragePlacement(value: string): boolean {
  return COVERAGE_PLACEMENTS.some(placement => placement.value === value)
}
