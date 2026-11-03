import { defineArrayMember } from 'sanity'

/**
 * An ordered list of WEAK course references, shared by `track` and `learnRoute`.
 *
 * Weak for the reason `series.entries` is weak: a published track lays out
 * courses that are still drafts, and a strong reference to a document that is
 * not in the published dataset is refused. Unpublishing a course must also not
 * collapse the list and renumber the route — a weak ref stops resolving and its
 * slot survives.
 */
export const weakCourseRef = defineArrayMember({
  type: 'reference',
  weak: true,
  to: [{ type: 'course' }],
  options: { disableNew: true },
})

/**
 * Duplicate check by `_ref`, NOT `rule.unique()` — see the long note in
 * `series.ts`: a reference Studio writes to a draft carries `_weak` and
 * `_strengthenOnPublish`, the key-count guard short-circuits, and the duplicate
 * goes undetected.
 */
export function noDuplicateRefs(message: string) {
  return (entries?: Array<{ _key?: string; _ref?: string }>) => {
    if (!Array.isArray(entries)) return true
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const entry of entries) {
      const ref = entry?._ref
      if (!ref) continue
      if (seen.has(ref)) {
        if (entry._key) duplicates.push(entry._key)
      } else {
        seen.add(ref)
      }
    }
    if (duplicates.length === 0) return true
    return { message, paths: duplicates.map((key) => [{ _key: key }]) }
  }
}

/** `"2027-01"`. A month, because the schedule promises months, never days. */
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
