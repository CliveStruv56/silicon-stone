/**
 * Permanent (301) redirects for article slugs that have been renamed.
 *
 * WHY: some early articles have auto-generated slugs truncated mid-word with a
 * numeric suffix (e.g. `…-include-the-fda--1761`). When such a slug is renamed
 * to a clean editorial one in Sanity, add the old→new pair here so inbound links
 * and prior search-index entries 301 to the new URL instead of 404ing.
 *
 * PROCEDURE (do both together, or the old URL breaks):
 *   1. Rename `slug.current` on the article in Sanity to the clean slug.
 *   2. Add `{ from: '<old>', to: '<new>' }` below (slugs only, no `/analysis/`).
 *
 * Kept intentionally empty until the renames are approved — adding a redirect
 * for a slug that is still live would send a working URL to a 404.
 */
export const ARTICLE_SLUG_REDIRECTS: Array<{ from: string; to: string }> = [
  // { from: 'recent-ai-developments-in-the-usa-include-the-fda--1761', to: 'us-ai-policy-fda-shift' },
]

/** Expand into Next.js redirect rules under the /analysis/ path. */
export function articleRedirectRules() {
  return ARTICLE_SLUG_REDIRECTS.map(({ from, to }) => ({
    source: `/analysis/${from}`,
    destination: `/analysis/${to}`,
    permanent: true,
  }))
}
