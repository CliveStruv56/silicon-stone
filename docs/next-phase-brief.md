# Next Phase Brief

**Project:** silicon-and-stone-web (Silicon & Stone — siliconandstone.com)
**Generated:** 2026-06-09
**Based on:** Review Report 2026-06-09 (`docs/review-report.md`)
**Review Mode:** B

---

## Context

Silicon & Stone is a live Next.js 15 + Sanity v4 intelligence portal (Vercel frontend, Railway FastAPI logic backend) selling "Forensic Technopolitics" analysis, with 4 email-gated interactive tools, product sales pages, an AI content pipeline, and an embedded Studio. The 2026-06-09 review found it **Healthy**: the June 8 security remediation is verified real, type safety is exemplary, and ~85% of documented scope is built. This phase is a hardening-and-housekeeping sweep: one credential confirmation, a handful of small security/a11y/CI fixes, a first unit-test net over the AI Act decision engine, and bringing the stale handoff doc back in line with the merged Phase A/B route consolidation. No new product features — the biggest remaining gaps (store setup, product files, analytics account) are founder configuration, listed at the end.

**Current state:** Live in production; ~85% of documented scope complete.

**Constraints (load-bearing):** Do NOT upgrade `sanity` past v4 or `next-sanity` to v12 (CLAUDE.md). The 13 moderate npm audit findings are an accepted transitive baseline — do NOT run `npm audit fix --force`. Push to `origin main` after each commit (Vercel auto-deploys).

---

## Pre-Build Fixes

### FIX-001 — Confirm/rotate production `ADMIN_PASSWORD`
**Severity:** High
**Files:** none (Vercel dashboard) — founder action
**Problem:** The historical launch-era admin password is recoverable from git history (removed from docs in `278df92` but present in earlier commits; value deliberately not repeated here) and local notes still record it as current. It guards the admin surface including paid AI generation, and the login limiter degrades to per-instance in-memory when Upstash is down.
**Action:** In Vercel project settings, set `ADMIN_PASSWORD` to a long random value (24+ chars). Update any password manager entry. Treat the old value as burned.
**Verification:** Log in at `/login` with the new password; old password rejected.

### FIX-002 — Escape `<` in JSON-LD output
**Severity:** Medium (one-line)
**Files:** `src/components/seo/JsonLd.tsx` (~line 12), `src/app/(website)/page.tsx` (~line 95)
**Problem:** `dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}` doesn't escape `</script>`; a CMS string containing `</script><script>` escapes the tag (requires Sanity write access, so low likelihood — but the fix is trivial).
**Action:** Replace with `JSON.stringify(data).replace(/</g, '\\u003c')` in both locations (or have `page.tsx` use the shared `JsonLd` component).
**Verification:** View source of `/` and an article page — JSON-LD still parses (paste into a JSON-LD validator); a test string with `<` renders as `<`.

### FIX-003 — Constant-time backend key compare
**Severity:** Medium (one-line)
**Files:** `backend/main.py` (~line 168)
**Problem:** `if provided_key != expected_key` is a direct string compare, inconsistent with the frontend's `timingSafeEqual` standard.
**Action:** `import hmac`; use `if not hmac.compare_digest(provided_key, expected_key)`.
**Verification:** Backend tests still pass (FastAPI TestClient auth-guard checks); redeploy Railway.

---

## Task List

### NEXT-001 — Bring `project_summary.md` back to reality
**Files:** `project_summary.md`
**Context:** The session-handoff doc is the backbone of the workflow and is now wrong about merged work. Section 9 marks Phase A/B "_pending_/unmerged" but `231d29c` and `b7cb6f5` are on `main`.
**Action:** (1) Section 9: replace the two "_(pending)_" placeholders with the real commit hashes and note both are merged/deployed. (2) Section 3 route table: `/briefings`→`/intelligence`, `/services`→`/advisory`, `/products/briefings`→`/products/sector-reports`, remove the `/analysis` index row (slug + category routes kept), remove `/generate` (deleted), add `/waymarkpath`, admin `/analytics` and `/knowledge`, and the API/metadata routes (`/api/draft-mode/*`, `/api/search/semantic`, `/api/vectorize`, `/api/knowledge/*`, `rss.xml`, `llms.txt`, `robots.ts`, `sitemap.ts`). (3) Section 8: fix `briefings/page.tsx`/`services/page.tsx` paths. (4) Section 10: correct "no test step" (CI runs 4 invariant suites); (5) Sections 2/13: route count; (6) Section 1 diagram: add Railway backend, Pinecone, Plausible; update the nav description.
**Acceptance:** Every route in the Section 3 table corresponds to a real `page.tsx`/`route.ts` under `src/app/` and vice versa for public+admin surfaces.
**PLAID ref:** N/A

### NEXT-002 — Repo housekeeping: stray file + untracked docs
**Files:** `explorer-size.css`, `docs/SiliconandStoneSEOreport.md`, `docs/Silicon_and_Stone_Homepage_Positioning_Options.docx`
**Context:** `explorer-size.css` is an Obsidian file-explorer snippet, referenced nowhere in the repo — it belongs in the Ideaverse vault's `.obsidian/snippets/`. The SEO report and homepage-positioning docx are untracked but referenced by shipped work.
**Action:** Move `explorer-size.css` to the vault snippets directory (or delete if already there); `git add` the two docs files; commit.
**Acceptance:** `git status` clean of those three entries; `explorer-size.css` gone from repo root.
**PLAID ref:** N/A

### NEXT-003 — EmailGateOverlay dialog accessibility
**Files:** `src/components/tools/EmailGateOverlay.tsx`
**Context:** The email gate is the lead-gen critical path on all 4 tools and currently has no modal semantics.
**Action:** Add `role="dialog"`, `aria-modal="true"`, and `aria-label` to the overlay container; move focus to the email input on open and return focus on dismiss; add Escape-key dismiss (same path as "No thanks"); give the email input an `aria-label` (or visually-hidden `<label>`); add `aria-live="polite"` to the error message element.
**Acceptance:** Keyboard-only walkthrough on one tool: tab lands in the modal, Escape dismisses, error state is announced; existing submit/success/dismiss behaviour unchanged.
**PLAID ref:** N/A

### NEXT-004 — Header keyboard-accessible dropdowns
**Files:** `src/components/layout/Header.tsx`
**Context:** Desktop Products dropdown is hover-only (`group-hover:opacity-100`, ~line 87); keyboard users tab through invisible links.
**Action:** Add `group-focus-within:opacity-100 group-focus-within:pointer-events-auto` (and matching translate/visibility variants) alongside the `group-hover:` classes; add `aria-expanded` + `aria-controls` to the mobile hamburger button and flip its `sr-only` text between Open/Close.
**Acceptance:** Tabbing through the desktop nav makes dropdown items visible when focused; hamburger announces expanded state.
**PLAID ref:** N/A

### NEXT-005 — Add `next build` to CI
**Files:** `.github/workflows/check.yml`
**Context:** CI runs lint/typecheck/invariant scripts but not a build, so server/client-boundary breakage is discovered as a failed Vercel deploy.
**Action:** Add a build step after the checks (`npm run build`), supplying dummy-but-valid env vars as needed (the build already tolerates missing optional vars; `NEXT_PUBLIC_SANITY_PROJECT_ID`/`DATASET` may need to be set — use the real public values, they are not secrets).
**Acceptance:** CI green on a no-op PR; intentionally breaking a server/client boundary locally fails `npm run build` the same way CI would.
**PLAID ref:** N/A

### NEXT-006 — Vitest scaffold + AI Act engine regression tests
**Files:** new `vitest.config.ts`, `src/lib/ai-act-rules.test.ts`, `src/lib/ai-act-assessment.test.ts`, `package.json`, `.github/workflows/check.yml`
**Context:** 1,047 lines of regulatory decision logic with no regression net, repeatedly edited (Article 50 coverage, scope short-circuit, scoring). A silent scoring regression damages the product's core credibility.
**Action:** `npm i -D vitest`; add `"test": "vitest run"`; write table-driven specs covering: prohibited-practice classification, Annex III high-risk default, the scope short-circuit, Article 50 chatbot transparency case, and 3–4 representative limited/minimal-risk profiles (derive expected outputs from the current engine and lock them in). Add `npm test` to CI.
**Acceptance:** `npm test` passes; deliberately flipping one rule constant makes a test fail.
**PLAID ref:** N/A

### NEXT-007 — Unit tests for slug + markdown utilities
**Files:** `src/lib/utils.test.ts` (slugify/safeInternalPath), `src/lib/markdown-to-portable-text.test.ts`
**Context:** Builds on NEXT-006's scaffold. `slugify` carries the 60-char word-boundary contract from the SEO sprint; `safeInternalPath` is a security control; the markdown converter feeds every generated draft.
**Action:** Specs for: slugify word-boundary truncation/never-empty/special chars; safeInternalPath rejects `//`, `/\`, external URLs, accepts normal paths; markdown converter handles links, inline code, italics, multi-line blockquotes, H1-demotion expectations.
**Acceptance:** `npm test` passes with the new files included.
**PLAID ref:** N/A

### NEXT-008 — `loading.tsx` + `global-error.tsx`
**Files:** new `src/app/(website)/loading.tsx`, new `src/app/global-error.tsx`
**Context:** No streaming fallback anywhere; `/intelligence` (608 lines, multiple Sanity fetches) renders nothing during navigation. Root-layout crashes fall through to Next's unstyled default.
**Action:** Add a brand-styled minimal skeleton (match the dark theme — reuse existing card/pulse styles) as `(website)/loading.tsx`; add `global-error.tsx` modelled on the existing `src/app/error.tsx` (must include its own `<html>/<body>`).
**Acceptance:** Throttled navigation to `/intelligence` shows the skeleton; `npm run build` passes.
**PLAID ref:** N/A

### NEXT-009 — Dynamic-import the supply-chain map
**Files:** `src/app/(website)/tools/supply-chain-mapper/page.tsx` (and a new extracted map component file)
**Context:** The 886-line client page statically imports `react-map-gl/maplibre` + CSS (~250KB+ gz), blocking that route's hydration. Route-level splitting already confines it to this page, so this is a single-route first-paint win.
**Action:** Extract the `<Map>` block into `src/components/tools/SupplyChainMap.tsx`; load it via `next/dynamic(() => import(...), { ssr: false, loading: <skeleton div> })`.
**Acceptance:** Tool behaves identically (markers, tooltips, email gate); map area shows skeleton before load; `npm run build` passes.
**PLAID ref:** N/A

### NEXT-010 — Backend: durable rate limits for subscribe/contact
**Files:** `backend/main.py`
**Context:** M4 — `/v1/subscribe` and `/v1/contact` use an in-process limiter that resets per deploy/replica; Redis is already provisioned for the deep-research job store.
**Action:** Route the existing limiter through Redis when `REDIS_URL` is set (fixed-window keys `ratelimit:{route}:{ip}:{window}` with TTL, mirroring the deep-research pattern), keeping the in-process fallback when Redis is absent. While in the file, add `_require_backend_api_key` to `POST /v1/hermes/events` (L3).
**Acceptance:** FastAPI TestClient checks pass; with Redis running, limits survive a process restart; hermes POST without key → 401/403.
**Verification note:** Redeploy Railway after merge.
**PLAID ref:** N/A

### NEXT-011 — Resolve the `/api/revalidate` discrepancy
**Status: RESOLVED during execution (2026-06-09) — false finding, no code change.** The route exists at `src/app/(website)/api/revalidate/route.ts` (the `(website)` route group doesn't affect the URL, so it serves `/api/revalidate`); it verifies the Sanity webhook signature via `next-sanity/webhook` `parseBody` with `SANITY_REVALIDATE_SECRET`, caps body size at 50KB, and revalidates the post-Phase-B paths (`/`, `/intelligence`, `/analysis/[slug]`). The review's L6 scan only looked under `src/app/api/`. Remaining follow-up folded into NEXT-001: document the route's actual location in `project_summary.md`.
**PLAID ref:** N/A

### NEXT-012 — Draft the legacy-slug rename proposal (sign-off artifact)
**Files:** output: a short markdown table (e.g. `docs/slug-renames-proposal.md`); later `src/lib/slug-redirects.ts`
**Context:** The 301 mechanism (`ARTICLE_SLUG_REDIRECTS` → `next.config.ts`) shipped empty by design; ~7 articles still have mid-word-truncated slugs (e.g. `…-include-the-fda--1761`). Renaming is outward-facing and awaits Clive's sign-off on the new strings.
**Action:** Query Sanity for all published article slugs; identify the truncated ones; propose clean replacements using the current `slugify` rules; write the old→new table to the proposal doc. Do NOT rename in Sanity or populate the map yet — that happens after sign-off.
**Acceptance:** Proposal doc lists every affected slug with its proposed replacement; no code/content changed.
**PLAID ref:** N/A

### NEXT-013 — Log-redaction pass (GDPR hygiene)
**Files:** `src/app/api/contact/route.ts`, `src/app/api/subscribe/route.ts`, `backend/main.py` (~lines 699-703, 787-791)
**Context:** L4 — upstream Kit error bodies (up to 500 chars, echoing subscriber emails) are logged verbatim.
**Action:** Truncate upstream error logging to status code + first 120 chars with emails masked (`s.replace(/[^@\s]+@/g, '***@')`), in all four sites.
**Acceptance:** Force a Kit failure locally (bad API key) — log shows status + masked snippet, no full email.
**PLAID ref:** N/A

---

## Architecture Notes

- Phase B route names are canonical now: `/intelligence`, `/advisory`, `/products/sector-reports`. Any new internal links must use these; never reintroduce `/briefings` or `/services` links.
- Server-only boundaries are enforced via `import 'server-only'` in 11 lib modules — preserve this when touching libs; client components import types only.
- All GROQ lives in `src/sanity/lib/queries.ts` (one known stray in `search/page.tsx`); keep it that way.
- The rate-limiting stack is layered (Vercel durable via Upstash/KV → in-memory degrade; backend per-process → NEXT-010 makes it Redis). Login is deliberately fail-closed; don't "fix" that.

## Testing Requirements

**Minimum testing for this phase:**
- [ ] AI Act engine regression specs (NEXT-006) — the non-negotiable
- [ ] slug/safeInternalPath/markdown specs (NEXT-007)
- [ ] `npm test` wired into `.github/workflows/check.yml`

**Testing pattern to establish:** Vitest, test files co-located as `src/lib/*.test.ts`, table-driven cases. Keep the existing `scripts/*-checks.ts` invariant suites as-is — they cover different ground.

## Dependencies & Setup

**New packages:** `npm i -D vitest`
**Environment variables:** none new. FIX-001 rotates the existing `ADMIN_PASSWORD` in Vercel. NEXT-011 may delete `SANITY_REVALIDATE_SECRET` or require setting it for real.

## Definition of Done

- [ ] FIX-001..003 resolved (FIX-001 confirmed by founder)
- [ ] NEXT-001..013 complete (NEXT-012 ends at the sign-off artifact, not the renames)
- [ ] `npm run check` + `npm test` + `npm run build` all pass locally and in CI
- [ ] Each logical change committed and pushed to `origin main` (Vercel deploys green)
- [ ] No new npm audit findings above the 13-moderate baseline
- [ ] `project_summary.md` Section 9 updated with this phase's entry

## Notes for the Developer / Agent

- **Founder tasks running in parallel (no code):** create the Lemon Squeezy store + 3 products and set the `NEXT_PUBLIC_LEMONSQUEEZY_*` env vars; create the Plausible account + 6 goals + `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`; update the Inoreader redirect URI to production; publish the 2 draft articles (need cover images); write the actual Toolkit/Checklist product files and the Atlantic Drift PDF. These unlock revenue and measurement; none block the task list above.
- Deliberately NOT in this phase: Sanity v5 / Next 16 upgrade (blocked, documented), nonce-based CSP (M1 — do alongside a future middleware change), SEO Sprint 2 pillar pages (content strategy work, schedule separately), author/E-E-A-T layer (blocked on Clive's byline/`sameAs` info), premium tier (explicitly future), error monitoring (needs a founder decision on Sentry vs alternatives — raise it, don't install unilaterally).
- The 13 moderate npm audit findings are the accepted baseline; anything *new* on top is real.
- CHANGELOG/doc updates commit atomically with the code they describe; push after every commit.

---

*This brief was generated from a project review. See `docs/review-report.md` for the full assessment.*
