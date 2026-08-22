/**
 * When an article was published, and who is allowed to say so.
 *
 * **The defect this exists to close.** `publishedAt` is optional in the schema
 * and `src/lib/sanity.ts` omits it when the generator writes a draft, with the
 * comment *"publisedAt removed to keep as draft"* — which is right. What was
 * missing was the other half: nothing ever filled it in when the article was
 * actually published. Neither the Studio publish action, nor `/api/on-publish`,
 * nor the preflight. On 2026-08-22, **ten of sixteen published articles had no
 * date at all**, and the six that did had it because somebody typed one into
 * Studio by hand.
 *
 * Nothing failed. The article went live, reached `/analysis/<slug>`, the
 * sitemap and the RSS feed, and simply carried no publication date into the
 * feeds that order by one and into the `schema.org` `datePublished` that
 * `src/lib/seo.ts` emits. That is the same shape as the `intelligenceTier`
 * defect closed on 2026-08-21: publishes cleanly, wrong everywhere downstream.
 *
 * **The rule is one sentence, and it lives here so the two writers cannot
 * disagree about it.** The Studio publish action stamps the draft on the way
 * out; `/api/on-publish` stamps the published document as a backstop for
 * anything that never touched Studio — a script, the CLI, the Sanity dashboard,
 * an MCP holding a write token. Both ask this function, so the second is a
 * no-op whenever the first did its job.
 */

/** Just the fields the rule reads. Deliberately narrow. */
export interface PublishedAtCandidate {
  publishedAt?: string | null
}

/**
 * The patch to apply, or `null` when there is nothing to do.
 *
 * **An existing date is never overwritten.** Re-publishing is not re-publication:
 * an article pulled back for a typo fix and published again was published when
 * it was first published, and moving the date would reorder every feed and
 * change the `datePublished` a search engine has already seen. Every edit
 * re-fires the publish webhook, so an overwriting rule would move the date on
 * every save.
 *
 * A blank or whitespace-only string counts as absent — Studio writes `undefined`
 * for an emptied datetime field, but a hand-edited document and an API write can
 * both leave an empty string behind, and "present but meaningless" must not
 * satisfy a check whose whole job is that the field means something.
 */
export function publishedAtPatch(
  doc: PublishedAtCandidate,
  now: Date,
): { publishedAt: string } | null {
  const current = doc.publishedAt
  if (typeof current === 'string' && current.trim() !== '') return null
  return { publishedAt: now.toISOString() }
}

/** Whether a document is missing a usable publication date. */
export function needsPublishedAt(doc: PublishedAtCandidate): boolean {
  return publishedAtPatch(doc, new Date(0)) !== null
}

/**
 * The one expression every article feed must order by.
 *
 * After the backfill of 2026-08-22 no published article lacks a date, so the
 * `coalesce` is purely a net for a future regression. It is still required, and
 * every copy must use *this* expression, because the queries had drifted into
 * three different answers: some ordered by bare `publishedAt desc`, some by
 * `coalesce(publishedAt, _updatedAt)`, and `src/lib/sanity.ts` projected
 * `coalesce(publishedAt, _createdAt)`. The same article therefore sorted
 * differently depending on which view rendered it.
 *
 * **`_updatedAt` rather than `_createdAt`, and the reason is the failure mode
 * rather than accuracy.** Neither is a publication date. A dateless article
 * falling back to `_updatedAt` surfaces at the top of the feed, where somebody
 * notices it; falling back to `_createdAt` buries it at its drafting date,
 * where nobody does. A net should be loud.
 *
 * **The backfill deliberately used `_createdAt` instead**, and that asymmetry is
 * not an oversight: backfilling ten historical articles is about preserving
 * their real chronology, and their `_updatedAt` values were bunched onto the
 * days somebody ran a bulk edit. Do not "harmonise" the two — they answer
 * different questions.
 *
 * This constant is not interpolated into the queries: `defineQuery` needs a
 * static string for Sanity's typegen, and `backend/main.py` cannot import from
 * TypeScript at all. `published-at-query.test.ts` asserts every copy matches
 * instead, which is the same answer `briefings-query.test.ts` gives to the same
 * problem.
 */
export const PUBLISHED_AT_ORDER = 'coalesce(publishedAt, _updatedAt)'
