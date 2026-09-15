# Next Phase Brief

**Project:** silicon-and-stone-web (Silicon & Stone — siliconandstone.com)
**Generated:** 2026-09-15
**Based on:** Review Report 2026-09-15 (`docs/review-report-2026-09-15.md`)
**Review Mode:** B

---

## Context

Silicon & Stone is a live Next.js 15 + Sanity v4 intelligence and advisory site (Vercel, with a FastAPI logic backend on Railway) with four email-gated tools, a versioned AI Act rule pack and Compliance Checker (v1 live, v2 built and dark), a six-instrument regulatory corpus, a knowledge system, a PWA layer, and a fully templated advisory and products catalogue. Since the June review the engineering findings have all but closed: 82 test files and 1,584 tests, eleven CI guards, a security audit shipped, accessibility and error-handling gaps fixed. Roughly 90% of the code-side scope is built. What is not built is the commercial side: no Lemon Squeezy store, zero Kit tags, no booking link, no purchasable product; and the two handover documents have grown large and contradictory enough to mislead sessions. One critical dependency patch (Next.js image optimiser RCE) is available inside the permitted v15 line and must ship first.

This phase is therefore: one same-day patch, two owner console actions, a documentation reconciliation and restructure, a handful of small hardening tasks the audit surfaced, the one v2 release criterion that is code (report email delivery), and the owner runbook for the store and tags run to completion.

**Current state:** live in production; code scope ~90% complete; owner/config scope ~25–30% complete.

**Constraints (load-bearing, from `CLAUDE.md`):** do NOT upgrade `sanity` past v4 or `next-sanity` to v12; do NOT run `npm audit fix --force`; never edit a rule-pack file without a version bump; every price is `gbp(AMOUNTS.x)`; `publishedAt` is written only through `publishedAtPatch()`; a failing manual check is a signal, never something to loosen. Push to `origin main` after each commit (Vercel auto-deploys); run `npx next lint` before pushing (Vercel lints as a separate gate). CHANGELOG entries live in `project_summary.md` §9 and commit with the code they describe.

---

## Pre-Build Fixes

### FIX-001 — Patch Next.js, sharp, and close the image optimiser's open remote pattern
**Severity:** Critical
**Files:** `package.json`, `package-lock.json`, `next.config.ts` (~line 60), `CLAUDE.md` (dependency section), `README.md` (checks paragraph)
**Problem:** Installed `next@15.5.23` carries GHSA-2xp9-vwfh-vxw4 (unauthenticated RCE in the Image Optimization API via AVIF) and GHSA-p293-qw3h-jr36 (Windows-only). `next.config.ts` allows `remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }]` with no `pathname`, so the optimiser accepts assets from *any* Sanity project, not just `3q59mpd7`. `sharp` is overridden to `^0.35.3`, one patch below the libheif (HEIF/AVIF decoder) fix in 0.35.4.
**Action:**
1. `npm install next@15.5.25 eslint-config-next@15.5.25` (if `eslint-config-next@15.5.25` is not published, use the highest 15.5.x that is). Stay on 15.x.
2. In `package.json` `overrides`, change `"sharp": "^0.35.3"` to `"^0.35.4"`; `npm install`.
3. In `next.config.ts` add `pathname: '/images/3q59mpd7/production/**'` to the `cdn.sanity.io` remote pattern. Grep `src/` for any other Sanity image host or project id before committing (`grep -rn "cdn.sanity.io" src`).
4. `npm run check && npm test && npm run build`.
5. Re-verify the image path as `CLAUDE.md` prescribes: with `npm run start`, fetch `/_next/image?url=<a real cdn.sanity.io asset from a published article>&w=640&q=75` once plain and once with `Accept: image/webp`; expect a resized image and a WebP. Confirm a URL under a *different* Sanity project id is now rejected (400).
6. Update the `CLAUDE.md` sentence that says `next@15.5.23` declares `sharp: ^0.34.3` — `15.5.24+` declares `^0.34.3 || ^0.35.3`, so the override no longer contradicts a declared range; keep the "re-verify the image path if the override moves" instruction.
**Verification:** `npm audit` no longer lists `next` or `sharp`; the six image checks above pass; production deploy green; a published article's hero renders.

### FIX-002 — Owner: rotate and scope `ADMIN_PASSWORD`
**Severity:** High
**Files:** none (Vercel dashboard / CLI) — owner action
**Problem:** The only secret still classified Non-sensitive and scoped to Preview + Development. It guards the writer surface and the metered model pipeline. Twelve of thirteen were fixed on 2026-08-23; this one was left because the new value has to be shown to a person.
**Action:** Generate a 24+ character random value; in Vercel set `ADMIN_PASSWORD` as Sensitive, Production only (remove the Preview/Development copies per environment — `vercel env rm NAME production --yes` etc.; the bare `rm` fails with `multiple_envs`). Store it in the password manager. Pin `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` rather than running `vercel link` (it rewrites `.env.local`). Redeploy — env changes are inert until `vercel --prod`.
**Verification:** `vercel env ls` shows one Production, Sensitive entry; `/login` accepts the new value and rejects the old; the auto-memory note that records the password is updated. Never confirm from the CLI's own stdout — read the state back.

### FIX-003 — Owner: set the monthly AI spend ceiling
**Severity:** High
**Files:** none (Vercel) — owner action; reads happen in `src/lib/model-budget.ts`
**Problem:** `AI_MONTHLY_BUDGET_USD` is unset, so `checkMonthlyBudget()` is a no-op on the three unauthenticated compliance-checker model routes, and production and local share one Anthropic key.
**Action:** Set `AI_MONTHLY_BUDGET_USD` in Vercel Production to a figure the business can lose in a bad month (the review does not choose it); redeploy.
**Verification:** `vercel env ls` shows it; a request to `/api/tools/compliance-checker/intake` after the ceiling is exceeded returns the budget error the route already implements (test locally with a tiny value first).

---

## Task List

### NEXT-001 — Clear the non-major audit set and rewrite the baseline paragraphs
**Files:** `package.json`, `package-lock.json`, `README.md` ("Checks"), `CLAUDE.md` (dependency section)
**Context:** 36 findings today against a documented "13 moderate, all under the Sanity CLI". A plain `npm audit fix` (no `--force`) resolves `undici`, `tar`, `form-data`, `ip-address`, `js-yaml`, `brace-expansion`, `@xmldom/xmldom`, `dompurify`, `linkify-it`, `valibot`, `vitest`, `colord`, `json-2-csv`, `esbuild`, `baseline-browser-mapping`, `@humanfs/node` without touching the ceilings. Do this after FIX-001 so the two changes are separable.
**Action:** `npm audit fix` (never `--force`); confirm `sanity`, `next-sanity`, `next`, `react` versions unchanged in the lockfile; `npm run check && npm test && npm run build`; `npm audit` and record what remains. Rewrite the two baseline paragraphs to say what is actually left and why: `sanity@6` / `next-sanity@13` (ceiling), `puppeteer@25` (dev), `maplibre-gl@6` (major, static map data, scheduled), `exceljs@3` (dev). Add a line that `npm audit` must be re-read at each review rather than trusted from prose.
**Acceptance:** audit count falls to the major-gated residue only; suite and build green; the paragraphs name every remaining advisory's package and reason.
**PLAID ref:** N/A

### NEXT-002 — Reconcile the documented contradictions
**Files:** `CLAUDE.md`, `README.md`, `project_summary.md` (§3, §5.5, §10, §11), `LAUNCH.md`, `docs/advisory-page-copy.md`, `docs/site-revision-spec.md`, `docs/silicon-stone-website-build-brief-for-claude-code.md`, auto-memory `project_launch_decisions.md` and `project_compliance_checker_rebuild.md`
**Context:** The review verified twelve claims against code that are wrong; three of them are repeated in three places each. A future session acting on "criterion 16 is blocked" or "three modules" does wrong work.
**Action:** Fix each row of the review's "Stale or contradictory documentation" table: criterion 14 manual / 16 automated; four `MODULES`; provisions page count derived (now 28); audit baseline (after NEXT-001); README latest-session pointer and the "scaffold" wording; §3 route table (add the ~20 missing routes and the three missing redirects; drop the www and revalidate-webhook claims); §5.5 Checklist rung; §11 Article 27 / Evidence Pack / "§22 four remain"; §10 corpus count and Article 26; LAUNCH.md VAPID and Resend boxes and the Kit tag count (make `src/lib/kit.ts` the source and say so); a "figures superseded 2026-09-13, do not paste" banner on the three price-bearing docs; the two memory notes.
**Acceptance:** each corrected fact is grep-able in one place; `npm run test:manual` still green (the manual is not touched unless a fact moved); `git diff --stat` shows only doc files.
**PLAID ref:** N/A

### NEXT-003 — Guard the `CLAUDE.md` facts most likely to rot
**Files:** `scripts/manual-checks.ts` (or a sibling `scripts/claude-md-checks.ts` wired into `prebuild` and CI the same way), `CLAUDE.md`
**Context:** The operator's manual stopped rotting the day 21 facts were guarded. `CLAUDE.md` has the same failure mode and no guard. Guard facts, not prose.
**Action:** Add checks that read from code and assert `CLAUDE.md` still states: `MODULES.length`, `ENGAGEMENTS.length`, the count of `manual`/`blocked` criteria in `release/acceptance.ts`, `coveredArticles().length`, the latest rule-pack version directory, the `PRIOR_COVERAGE_SCORE_FLOOR` value, the `sharp` override range. Every extractor must throw when its anchor is missing. **Mutation-test each one** (change the code value, watch it go red, revert) and say so in the commit message.
**Acceptance:** new checks pass; each has been seen failing once; `prebuild` runs them.
**PLAID ref:** N/A

### NEXT-004 — Restructure the two handover documents
**Files:** `CLAUDE.md`, `project_summary.md`, new `docs/decisions/*.md`, new `docs/handover/` (index + dated archives)
**Context:** 62 KB loaded into every session and a 670 KB file no tool can read whole. Most of `CLAUDE.md` is narrative about how a rule was learned, not the rule.
**Action:** (1) For each `CLAUDE.md` section, keep the invariants, the "do not undo" bullets and the file pointers; move the dated narrative ("bit once", what the failure looked like, who decided when) into `docs/decisions/<section-slug>.md` with a one-line pointer back. Target under 25 KB. (2) Split `project_summary.md`: a new two-to-three page `project_summary.md` holding §1 (what it is), §5 (what is on sale), the open-items list and a pointer table; move §9's dated entries into `docs/handover/2026-Q2.md`, `2026-Q3.md` etc., and the rest of the long sections into `docs/handover/<topic>.md`. Do not delete anything; move it. (3) Update `README.md`, `CLAUDE.md`'s header and the auto-memory pointer that names `project_summary.md` as the handoff doc. Do this *after* NEXT-002 so you are not moving wrong facts.
**Acceptance:** `wc -c CLAUDE.md` under 25,600; `project_summary.md` under 600 lines; every section that moved is reachable from the index; `npm run test:manual` and NEXT-003's checks green; a fresh session can answer "what is on sale and what is open" from the summary alone.
**PLAID ref:** N/A

### NEXT-005 — Error-monitoring decision (raise, do not install unilaterally)
**Files:** decision recorded in `project_summary.md` / `docs/decisions/`; if approved, `package.json`, `next.config.ts` (CSP `connect-src`), `src/app/global-error.tsx`, `src/app/error.tsx`
**Context:** No error monitoring exists anywhere. Failures in the compliance intake, the publish webhook or the enquiry notification surface only in Vercel logs nobody reads. The June brief said raise it with the owner; it was not raised.
**Action:** Put a plain numbered question to the owner (the picker does not work for this user): (1) Sentry free tier via `@sentry/nextjs` — the standard choice, one new dependency, one CSP host, must exclude `/studio`; (2) Vercel's built-in Observability / Runtime Logs alerts only — no code, weaker; (3) defer. Recommend (1). If approved: install, wrap the two error boundaries, add the ingest host to `connect-src`, set `NEXT_PUBLIC_SENTRY_DSN` in Vercel Production only, confirm a thrown test error arrives, and add the DSN to `.env.example`.
**Acceptance:** decision recorded with date; if built, one deliberately thrown error is visible in the tool within a minute and `npm run test:security` still passes (the outbound-bound check will see the new `fetch`; commit the file before running it).
**PLAID ref:** N/A

### NEXT-006 — `.env.example` completeness with a guard
**Files:** `.env.example`, new `scripts/env-example-checks.ts`, `package.json` (`test:env-example`), `.github/workflows/check.yml`
**Context:** 16 variables the code reads are absent, including `CONTACT_VIA_BACKEND`, `RESEND_API_KEY`, `ENQUIRY_NOTIFY_FROM/TO`, `PINECONE_KNOWLEDGE_INDEX_NAME`, `AI_MONTHLY_BUDGET_USD`, `KV_REST_API_URL/TOKEN`, `NEXT_PUBLIC_COMPLIANCE_CHECKER_V2`, `NEXT_PUBLIC_RULEPACK_VERSION`, `ANTHROPIC_MODEL` / `_INTAKE_MODEL` / `_REPORT_MODEL`, `AI_WRITER_ROOT`, `REGULATORY_RETRIEVAL_DISABLED`.
**Action:** Add each with a one-line comment (and the "no default floor may be added" note beside `KNOWLEDGE_SCORE_FLOOR` if it is not already there). Write the guard: `git ls-files 'src/**/*.ts' 'src/**/*.tsx' 'scripts/**'` → regex `process\.env\.([A-Z0-9_]+)` → set difference against the keys in `.env.example`, ignoring `NODE_ENV`, `VERCEL*`, `CI`. Fail loudly if the regex matches nothing. Wire into CI next to `test:security`.
**Acceptance:** guard passes; deleting one line from `.env.example` makes it fail; the review's 16 names are all present.
**PLAID ref:** N/A

### NEXT-007 — Report email delivery for the Compliance Checker
**Files:** `src/lib/email.ts`, `src/app/api/tools/compliance-checker/report/route.ts` (the `onEmailCaptured` hook, ~line 27), `src/app/api/tools/compliance-checker/v2/report/route.ts`, `src/lib/compliance-v2/report/store.ts` (read the signed-link builder), new `src/lib/report-email.test.ts`
**Context:** §22.1/22.2 were decided on 2026-08-19: delivery-only email, no marketing. The report is already delivered on screen by signed link; the email send is the one v2 release criterion that is code, and v1 has the same hook. Resend is live for enquiries (`notifyEnquiry`), called over plain `fetch` with an `AbortSignal` bound.
**Action:** Add `sendReportLink({ to, reportUrl, tier, expiresAt })` to `email.ts` on the same pattern as `notifyEnquiry`: returns a status, never throws, `unconfigured` when env is absent, single-line subject, plain-text body with the signed URL and the expiry, no legal content in the mail (the report is the report). Call it from both routes after the record is stored and the link minted; log the status; never let it fail the response. Do not add the email address to `AnswerRecordV2` or to any prompt. Tests: the four properties above, mirroring `enquiry-notification.test.ts`.
**Acceptance:** with `RESEND_API_KEY` set locally a real report request produces one email whose link opens the report; with it unset the route still returns 200 and logs `unconfigured`; `npm run checker-v2:release` shows the delivery criterion passing; `docs/compliance-checker-v2-state.md` "no mail sender" line updated.
**PLAID ref:** N/A

### NEXT-008 — Service worker and middleware share one protected-prefix list
**Files:** new `src/lib/protected-paths.ts`, `src/middleware.ts` (lines 7–16), `src/app/sw.ts` (lines 62–69), new `src/lib/protected-paths.test.ts`
**Context:** The SW's NetworkOnly list names three prefixes; the middleware protects nine. Admin HTML for `/create`, `/editor`, `/knowledge` etc. can be cached by Serwist's default page handler.
**Action:** Export `PROTECTED_PAGE_PREFIXES` and `PROTECTED_API_PATHS` from the new module (no `server-only` — the SW imports it); the middleware builds its `protectedPaths` and `matcher` from them (the matcher must remain a static array literal for Next — generate it and assert equality in the test rather than computing it at runtime); the SW's NetworkOnly matcher iterates the page list plus `/studio` and `/login`. Test: every middleware prefix is NetworkOnly in the SW source, and `/api/studio-session` is in neither.
**Acceptance:** `npm run build` then `npm run test:pwa` green; DevTools on `/create` shows no SW cache entry after navigation; the test fails if a prefix is added to one list only.
**PLAID ref:** N/A

### NEXT-009 — Push endpoint allowlist and prompt fencing
**Files:** `src/app/api/push/subscribe/route.ts` (~line 53), new `src/lib/push/endpoint.ts` + test; `src/lib/fact-check.ts` (~line 297–322), `src/lib/intake/extract.ts` (~line 48–89), `src/lib/report/generate.ts`, `src/lib/compliance-v2/report/generate.ts`, `src/lib/prompt-fence.ts`
**Context:** Two Low findings, small and testable. The push subscribe route stores any endpoint and the server later POSTs to it (blind SSRF). Three prompt builders embed fetched or user text without `fenceUntrusted()` and the shared `SECURITY:` clause that `prompts.ts` and `research.ts` already use.
**Action:** (1) `isAllowedPushEndpoint(url)`: `https:` only, host matches `fcm.googleapis.com`, `*.push.apple.com`, `updates.push.services.mozilla.com`, `*.notify.windows.com`; reject otherwise with 400; test both sides. (2) Wrap the Exa evidence block in `fact-check.ts` with `fenceUntrusted()` and add the clause to its system prompt; in `intake/extract.ts` strip `</description>` (case-insensitive) from the user text before wrapping; add the clause to both report generators' system prompts. Run the report verifier tests — the fence must not change what the schema accepts.
**Acceptance:** tests pass; an `http://` or off-list endpoint is rejected; `grep -c fenceUntrusted src/lib/fact-check.ts` ≥ 1; `npm run test:checker-v2` and the report tests green.
**PLAID ref:** N/A

### NEXT-010 — Tests for the four untested security-adjacent modules
**Files:** new `src/lib/session.test.ts`, `src/lib/rate-limit.test.ts`, `src/lib/seo.test.ts`, `src/lib/fact-check.test.ts`; `vitest.config.ts`
**Context:** Testing is now Strong overall; these four are the cheapest remaining gaps with the highest blast radius.
**Action:** `session.ts`: `issueSession` → `verifySession` round-trip, tampered payload rejected, expired token rejected, wrong secret rejected, `jti` present. `rate-limit.ts`: window rollover, limit boundary, trusted-IP derivation. `seo.ts`: `breadcrumbList()` shape for the four callers. `fact-check.ts`: the "never throws" contract at the public entry with a failing Exa and a failing model (mock `fetch`). Add `coverage: { reporter: ['text-summary'] }` to vitest so a number exists to track; do not set a threshold.
**Acceptance:** `npm test` green; each new file has at least one negative case; coverage summary prints.
**PLAID ref:** N/A

### NEXT-011 — Accessibility residue and admin loading state
**Files:** `src/app/(website)/methodology/page.tsx` (36, 59, 82, 109, 132, 191), `about/page.tsx` (283, 300, 317, 391, 400), `src/components/home/ToolsGrid.tsx` (24, 39, 54, 69), `search/SearchForm.tsx:39`, `briefings/PersonaFilter.tsx:115`, `src/components/layout/Header.tsx` (190–202, 278, 308, 367), `tools/policy-stress-test/page.tsx:204`, new `src/app/(admin)/loading.tsx`
**Action:** `aria-hidden="true"` + `focusable="false"` on each decorative SVG; confirm the policy score ring's number is rendered as text (add `sr-only` text if not); `aria-haspopup="true"` and `aria-expanded` bound to the open state on the desktop dropdown triggers; a brand-styled skeleton for `(admin)` modelled on `(website)/loading.tsx`.
**Acceptance:** `npm run checker-v2:a11y` still zero violations; a keyboard walk of the header announces the submenus; `/knowledge` shows the skeleton on a throttled navigation.
**PLAID ref:** N/A

### NEXT-012 — Housekeeping: dead files, shadowed pages, superseded banners, scripts index
**Files:** delete `pinecone_quickstart.py`, `src/scripts/test-pinecone-setup.ts`, `src/scripts/test-semantic-search.ts`, `src/app/(website)/eu-exposure/page.tsx`, `src/app/(website)/products/ai-audit-checklist/page.tsx`; move `business-overview.json` → `context/` and `content-audit-ai-act-dates.md` → `docs/`; banners on `docs/struver-stack-deployment.md`, `docs/railway-vercel-next-steps.md`, `docs/intelligence-portal-specification.md`, `docs/pwa-phased-engineering-build-spec-phases-0-3.md`, `docs/monetisation_strategy.md`, `docs/homepage-hero-prd.md`; new `docs/scripts.md`
**Action:** Before deleting the two page files, grep tests and `sitemap.ts` for their paths and confirm the `next.config.ts` 301s cover both; grep `project_summary.md` for the two root files and update the references. Banners: one line at the top, "Superseded on <date> by <file>; kept for history". `docs/scripts.md`: a table of the 56 npm scripts grouped by prefix (`rulepack:`, `reg:`, `articles:`, `knowledge:`, `evidence:`, `checker-v2:`, `test:`, misc) with one line each, and a pointer from `README.md`.
**Acceptance:** `npm run check && npm test && npm run build` green; `/eu-exposure` and `/products/ai-audit-checklist` still 301 on the built app; `git ls-files` no longer lists the five deleted paths.
**PLAID ref:** N/A

### NEXT-013 — HSTS preload and the two calendar dates
**Files:** `next.config.ts` (line ~137); `project_summary.md` open-items list (or the new index from NEXT-004)
**Action:** Change the HSTS value to `max-age=31536000; includeSubDomains; preload` (www already 308s to the apex over HTTPS); after a deploy, submit at hstspreload.org. Record two review dates where the next session will see them: **2026-11-11 / 2026-11-13** — regulatory corpus `reviewBy` (the build fails after them; `npm run reg:drift` makes the review a restamp); **2026-11-21** — accepted risks M13 (static webhook header secret) and M15 (CSP `'unsafe-inline'`) with their written re-open triggers.
**Acceptance:** response header on production carries `preload`; the dates appear in the open-items list.
**PLAID ref:** N/A

### NEXT-014 — Owner runbook: `LAUNCH.md` steps 3–9, each read back
**Files:** `LAUNCH.md` (tick as done), Vercel / Kit / Lemon Squeezy / Sanity consoles — owner-driven, agent-prepared
**Context:** This is the phase's commercial deliverable and the one item that has been open since June. Nothing below is code.
**Action, in order:** (1) Kit: create the tags `src/lib/kit.ts` maps (it is the source of truth; the three documents disagree on the count), set the two placeholder `*_TAG_ID` vars, verify the sending address, confirm form `9270944` settings. (2) Lemon Squeezy: store, the Toolkit product with Standard £79 / Professional £275 variants, `order_created` webhook with signing secret → `LEMONSQUEEZY_*` env vars, checkout URLs onto the three Sanity `product` documents (then `npm run test:sanity-prices`), the digital-goods consent step (`/terms` depends on it). (3) `NEXT_PUBLIC_BOOKING_URL` and `NEXT_PUBLIC_LINKEDIN_URL`. (4) Inoreader redirect URI → production. (5) Railway `CONVERTKIT_*` verified or leave `CONTACT_VIA_BACKEND` unset. (6) Regulatory review stamp reinstated with a real date. (7) Solicitor review of `/terms`; counsel review of the v2 matrix (release gate). (8) Flip `NEXT_PUBLIC_PRE_LAUNCH=false`, redeploy, run `LAUNCH.md` §2 launch-day verification in the owner's Chrome.
For every console change: read the state back (API or `vercel env ls`), never trust the command's own output.
**Acceptance:** a test purchase of the Standard Toolkit completes and tags the buyer; an enquiry from each engagement page arrives by email and lands tagged in Kit; `LAUNCH.md` shows steps 1–9 ticked with dates.
**PLAID ref:** N/A

---

## Architecture Notes

- **The guard pattern is the house style for facts.** Numbers, enum values, counts and field names that a document states are asserted by a script that reads the code; the script must fail loudly when its anchor disappears and must have been seen failing once. NEXT-003 and NEXT-006 extend it; NEXT-002 and NEXT-004 are what make it possible to keep up.
- **Two copies of the AI Act exist on purpose** (rule pack for the Checker, regulatory corpus for drafting). Nothing in this phase touches either; `test:regulatory-index` will say so if it does.
- **Offering pages are thin async server shells with a sibling Client Component.** Apply the same shape if you touch a tool page; do not add a fifth advisory template.
- **`server-only` in 74 files is the secret boundary.** `src/lib/protected-paths.ts` (NEXT-008) must *not* import it — the service worker consumes it.
- **Rate-limiting is layered and login is fail-closed.** Do not "fix" the in-memory fallback in `durable-rate-limit.ts`; it is a documented availability trade-off.

## Testing Requirements

**Minimum testing for this phase:**
- [ ] `session.test.ts`, `rate-limit.test.ts`, `seo.test.ts`, `fact-check.test.ts` (NEXT-010)
- [ ] `report-email.test.ts` with the four never-fail properties (NEXT-007)
- [ ] `protected-paths.test.ts` asserting middleware and SW agree (NEXT-008)
- [ ] `push/endpoint.test.ts` (NEXT-009)
- [ ] `env-example-checks.ts` in CI, mutation-tested (NEXT-006)
- [ ] `CLAUDE.md` fact checks, each seen red once (NEXT-003)

**Pattern:** Vitest, `src/**/*.test.ts` co-located, table-driven; invariant scripts in `scripts/*-checks.ts` wired into `check.yml`. Keep the browser walk-through for any flow change — it has caught a defect on every round of the checker work that the suite did not.

## Dependencies & Setup

**Package changes:** `next@15.5.25`, `eslint-config-next@15.5.25`, `sharp` override `^0.35.4` (FIX-001); `npm audit fix` residue (NEXT-001); optionally `@sentry/nextjs` (NEXT-005, only if approved).

**Environment variables (Vercel Production):**
```
ADMIN_PASSWORD=<rotated, Sensitive, Production only>      # FIX-002
AI_MONTHLY_BUDGET_USD=<owner's figure>                     # FIX-003
NEXT_PUBLIC_SENTRY_DSN=<if NEXT-005 approved>
```
Plus the `.env.example` additions in NEXT-006 (no new production values required for those).

## Definition of Done

- [ ] FIX-001 shipped and image path re-verified on production; FIX-002 and FIX-003 confirmed by reading Vercel state back
- [ ] NEXT-001 … NEXT-013 complete; NEXT-014 driven to a completed test purchase
- [ ] `npm run check`, `npm test`, `npm run build`, and every `test:*` script green locally and in CI; `npx next lint` clean before each push
- [ ] `npm audit` shows only the major-gated residue named in the rewritten baseline
- [ ] `CLAUDE.md` under 25 KB and `project_summary.md` under 600 lines, with nothing deleted, only moved
- [ ] Each change committed with its `project_summary.md` §9 entry and pushed to `origin main`; Vercel deploys green
- [ ] The three review dates (2026-11-11, 2026-11-13, 2026-11-21) recorded where the next session will see them

## Notes for the Developer / Agent

- **Order matters:** FIX-001 first and alone (one commit, one deploy, then the image verification). NEXT-001 second so its lockfile diff is separable. NEXT-002 before NEXT-004 so nothing wrong gets moved.
- **The owner's review loop for anything visible:** plan and numbered questions in plain text → build → screenshot the built page → wait for "commit" → verify on production in the owner's Chrome. Do not poll production with automated clients (Vercel's bot mitigation 403s them).
- **Bash-written files are discarded in the sandbox** unless the sandbox is disabled for that call; use the Write/Edit tools for project files.
- **Deliberately not in this phase:** the Next 16 + Sanity v5 + `next-sanity` + `maplibre-gl` 6 upgrade (its own phase once Next 16 is stable; clears ~19 audit findings and unblocks TypeGen); nonce-based CSP (accepted risk, review 2026-11-21); private dataset + read token; the knowledge retrieval lane (needs 15 records and a measured floor — no default may be added); tool-page splitting and the structured logger (polish); content work (pillar pages, Atlantic Drift PDF, cover images, the 9–10 drafts) — schedule with the owner separately.
- **The rule pack is a legal artefact.** If any task appears to need a pack change, stop: it is a version bump with a CELEX-verified figure, never an edit in place.

---

*This brief was generated from a project review. See `docs/review-report-2026-09-15.md` for the full assessment.*
