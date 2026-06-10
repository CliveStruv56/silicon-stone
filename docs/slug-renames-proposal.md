# Legacy Slug Renames — Proposal for Sign-off

**Generated:** 2026-06-10 (from live Sanity production data, 11 published articles)
**Status:** ✅ **EXECUTED 2026-06-10** — Clive approved the Recommended column; all 7 renamed in Sanity (transaction `6NJ7ZhgUZlEpRSet3iu2B0`), `ARTICLE_SLUG_REDIRECTS` populated, and verified on production: every old URL 301s to its new URL, all new URLs 200, sitemap and canonicals carry the new slugs. Optional follow-up: request reindexing of the 7 new URLs in Google Search Console.

7 published articles carry legacy slugs that truncate mid-word and/or end in a
4-digit suffix. The redirect mechanism (`src/lib/slug-redirects.ts` →
`next.config.ts` 301s) shipped in the June 8 SEO sprint and is waiting for
these pairs.

Two options per article: **Mechanical** is today's `slugify(title)` output
(60-char word-boundary cap); **Recommended** is a hand-tuned slug — shorter,
keyword-led, no dangling connector words. Mark up / strike through as you
prefer; mixed choices are fine.

| # | Current (legacy) slug | Mechanical `slugify(title)` | Recommended |
|---|---|---|---|
| 1 | `eu-ai-act-enforcement-august-2026-compliance-readi-6378` | `eu-ai-act-compliance-chasm-widens-as-august-2026-deadline` | `eu-ai-act-compliance-chasm-august-2026` |
| 2 | `impact-of-helium-shortages-on-semiconductor-amarke-2035` | `helium-scarcity-is-quietly-strangling-semiconductor` | `helium-scarcity-semiconductor-production` |
| 3 | `impacts-of-the-war-in-iran-on-global-technology-su-0690` | `iran-conflict-how-a-middle-eastern-war-becomes-a-european` | `iran-conflict-european-technology-supply-crisis` |
| 4 | `korean-memory-fab-capacity-squeeze-2027-3756` | `korean-memory-fab-capacity-squeeze-2027-a-forensic` | `korean-memory-fab-capacity-squeeze-2027` |
| 5 | `recent-ai-developments-in-the-usa-include-the-fda--1761` | `us-accelerates-national-ai-policy-substance-or-election` | `us-national-ai-policy-acceleration` |
| 6 | `semiconductor-testing-is-emerging-as-a-critical-bo-5189` | `semiconductor-testing-bottleneck-why-the-ai-accelerator` | `semiconductor-testing-bottleneck-ai-accelerators` |
| 7 | `us-foreign-policy-changes-on-european-tech-industr-3833` | `atlantic-fault-lines-deepen-us-tech-policies-threaten-eu` | `atlantic-fault-lines-us-tech-policy-eu-autonomy` |

Clean already (no change): `greenland-critical-minerals-transatlantic-scramble`,
`open-source-sovereignty`, `tariff-enforcement-collision`,
`welcome-to-silicon-and-stone`.

## Execution plan (after sign-off — do these together in one session)

1. For each approved pair, update the article's `slug.current` in Sanity
   (Studio, or MCP patch).
2. Add each `'old-slug': 'new-slug'` pair to `ARTICLE_SLUG_REDIRECTS` in
   `src/lib/slug-redirects.ts` — the 301s wire up automatically via
   `next.config.ts`.
3. Commit + push (Vercel deploy picks up the redirects).
4. Verify: each old URL returns 301 to the new URL; new URLs 200; sitemap
   regenerates with the new slugs (`_updatedAt` bumps `lastmod`).
5. Optional: request reindexing of the renamed URLs in Google Search Console.

**Ordering caveat:** deploy the redirect map in the *same* window as the Sanity
renames. A renamed slug with no redirect 404s the old URL; a redirect for a
still-live slug 404s the new one. Doing both within minutes is fine — Sanity
publish + Vercel deploy.
