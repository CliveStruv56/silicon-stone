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
 * Approved by Clive 2026-06-10 (docs/slug-renames-proposal.md) and renamed in
 * Sanity the same day — keep the pairs below in lockstep with `slug.current`.
 */
export const ARTICLE_SLUG_REDIRECTS: Array<{ from: string; to: string }> = [
  { from: 'eu-ai-act-enforcement-august-2026-compliance-readi-6378', to: 'eu-ai-act-compliance-chasm-august-2026' },
  { from: 'impact-of-helium-shortages-on-semiconductor-amarke-2035', to: 'helium-scarcity-semiconductor-production' },
  { from: 'impacts-of-the-war-in-iran-on-global-technology-su-0690', to: 'iran-conflict-european-technology-supply-crisis' },
  { from: 'korean-memory-fab-capacity-squeeze-2027-3756', to: 'korean-memory-fab-capacity-squeeze-2027' },
  { from: 'recent-ai-developments-in-the-usa-include-the-fda--1761', to: 'us-national-ai-policy-acceleration' },
  { from: 'semiconductor-testing-is-emerging-as-a-critical-bo-5189', to: 'semiconductor-testing-bottleneck-ai-accelerators' },
  { from: 'us-foreign-policy-changes-on-european-tech-industr-3833', to: 'atlantic-fault-lines-us-tech-policy-eu-autonomy' },
]

/** Expand into Next.js redirect rules under the /analysis/ path. */
export function articleRedirectRules() {
  return ARTICLE_SLUG_REDIRECTS.map(({ from, to }) => ({
    source: `/analysis/${from}`,
    destination: `/analysis/${to}`,
    // Explicit 301 (not permanent:true → Next's 308) to match the site's
    // route-consolidation redirects.
    statusCode: 301,
  }))
}
