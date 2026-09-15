# Project Review Report

**Project:** silicon-and-stone-web (Silicon & Stone — siliconandstone.com)
**Date:** 2026-09-15
**Review Mode:** B — Documented Project (no PLAID docs; intent taken from `project_summary.md`, `CLAUDE.md`, `LAUNCH.md`, `docs/operator-manual.md`, `docs/compliance-checker-v2-state.md` and the value-proposition docs)
**Tech Stack:** Next.js 15.5.23 (App Router) + React 19.2, TypeScript strict, Tailwind 4, Sanity v4.22 (embedded Studio), Serwist PWA, FastAPI backend on Railway, Anthropic / OpenAI / Exa / Pinecone, Kit (ConvertKit) v4, Resend, Upstash, Lemon Squeezy (hosted checkout, store not yet created)
**Project Type:** SSR web app + installable PWA on Vercel, with a separate logic backend on Railway. Live in production since 2026-03-31; commercially pre-launch (`NEXT_PUBLIC_PRE_LAUNCH` not flipped, no purchasable product yet).
**Previous review:** 2026-06-09 (`docs/review-report.md`, `docs/next-phase-brief.md`)

---

## Executive Summary

Since the June review the codebase has more than tripled (478 commits, 818 files, +179k lines) and almost every engineering finding from that review has been closed: 82 test files and 1,584 tests where there were none, the accessibility pair fixed, CI now builds, the backend limiter is Redis-backed, the 2026-08-23 security audit shipped its code fixes, and eleven guard scripts hold load-bearing facts in place. The engineering side of the documented scope is roughly 90% built. Two things need attention. First, the installed Next.js 15.5.23 carries two **critical** advisories (an unauthenticated RCE in the image optimiser) whose fix is a patch release *inside* the v15 ceiling, and `next.config.ts` lets any `cdn.sanity.io` asset through that optimiser, so the fix should ship today. Second, the revenue path that the June brief flagged is still not closed three months on: no Lemon Squeezy store, zero Kit tags, no booking link, and no purchasable product; the owner-side scope is nearer 25–30% done. Recommendation: patch now, then spend the next phase on owner configuration and on reconciling the handover documents, which have grown to a size (62 KB `CLAUDE.md`, 670 KB `project_summary.md`) and a level of internal contradiction that now works against the session-handoff model they exist to support.

**Overall Health:** Healthy (engineering) / Needs Attention (commercial readiness and one critical dependency patch)

---

## Changes Since Last Review

| Previously Flagged (2026-06-09) | Status | Notes |
|---|---|---|
| H1 — production `ADMIN_PASSWORD` rotation | ⏳ In Progress | `SESSION_SECRET` was rotated 2026-08-23 (kills all sessions). `ADMIN_PASSWORD` itself is still marked Non-sensitive and scoped to Preview + Development in Vercel; the rotation script was prepared but not run because the new value must be shown to a person. Carried forward as H1 below. |
| M1 — CSP `script-src 'unsafe-inline'` | ⏳ Accepted risk | Formally accepted as M15 on 2026-08-23 with a documented reason (40 prerendered pages cannot carry a per-request nonce; `/studio` needs its own policy). **Review by 2026-11-21.** |
| M2 — JSON-LD `<` escaping | ✅ Resolved | `src/components/seo/JsonLd.tsx:15` escapes `<` as `<`. The only other `dangerouslySetInnerHTML` (`src/app/layout.tsx:92`) is a hard-coded theme bootstrap with no data interpolation. |
| M3 — backend key compare | ✅ Resolved | `backend/main.py:214` uses `hmac.compare_digest`. |
| M4 — backend in-memory rate limits | ✅ Resolved | Redis-backed with in-memory fallback (`backend/main.py:16-154`). |
| L2 — session revocation | ✅ Closed as documented | Reasoning at the top of `src/lib/session.ts`: rotating `SESSION_SECRET` is the kill switch; a denylist for one admin account is not worth a database on the hot path. |
| L3 — `/v1/topology`, `/v1/hermes/events` | ✅ Resolved | Both endpoints removed from `backend/main.py`. |
| L4 — emails in upstream-error logs | ✅ Resolved | `redactForLog()` in both Vercel routes; `_redact_log_snippet()` at `backend/main.py:114`. |
| L5 — HSTS `preload` | ❌ Not Addressed | `next.config.ts:137` still `max-age=31536000; includeSubDomains`. |
| L7 — `/api/draft-mode/disable` | — By design | Unchanged, accepted. |
| Testing: zero unit tests | ✅ Resolved | 82 `*.test.ts`, 1,584 tests, 2.9 s; `npm test` in CI. |
| A11y: EmailGateOverlay + Header | ✅ Resolved | Dialog semantics, focus trap, Escape, labelled input, `role="alert"`; `group-focus-within` dropdowns, `aria-expanded` hamburger. |
| `loading.tsx` / `global-error.tsx` | ✅ Resolved | Both exist, plus `error.tsx` in every route group. |
| Dynamic-import the maplibre map | ✅ Resolved | `tools/supply-chain-mapper/page.tsx:67-75`. |
| CI runs `next build` | ✅ Resolved | `check.yml` builds, then runs `test:pwa` against the build. |
| `project_summary.md` stale on routes | ⏳ In Progress | Updated on every session, but §3's route table is still missing ~20 routes and repeats several superseded facts (see §3 below). The file is now 9,184 lines. |
| Stray `explorer-size.css` / untracked SEO report | ✅ Resolved | Gone / committed. |
| Author E-E-A-T layer, legacy-slug 301s | ✅ Resolved | `/authors/[slug]`, `sameAs`; 7 pairs in `src/lib/slug-redirects.ts`. |
| Founder: Lemon Squeezy store + products | ❌ Not Addressed | Still no store. The product shape changed (one Toolkit, £79 Standard / £275 Professional; Checklist merged 2026-09-14; Evidence Pack withdrawn). |
| Founder: Plausible account + goals | 🔄 Partial | Account exists and script is live; goal names still unconfirmed. |
| Founder: Inoreader redirect URI | ❌ Not Addressed | Still points at localhost. |
| Founder: publish the 2 draft articles | ❌ Not Addressed | Drafts have grown to 9–10 against 16 published; 8 of 16 published lack `mainImage`. |
| Founder: Toolkit / Checklist product files | ✅ Built | `deliverables/dist/` (gitignored, sources committed); a scoring reconciliation is noted before release. |
| Founder: Atlantic Drift PDF | ❌ Not Addressed | Still an outline. |
| Founder: Calendly / booking embed | ❌ Not Addressed | Only the `NEXT_PUBLIC_BOOKING_URL` flag exists (`src/lib/flags.ts:35`); no provider chosen. |
| Error monitoring decision | ❌ Not Addressed | No Sentry / Datadog / equivalent anywhere in `src/`, `package.json` or `next.config.ts`. |

**New since June and not previously reviewed:** Compliance Checker v1 rebuild and v2 (all eight phases, dark), the versioned AI Act rule pack (four versions, 27 Articles + Annex III), the six-instrument regulatory corpus with weekly drift watcher, the knowledge system (waves 0–4a, retrieval lane dark), PWA phases 0–3, article series, the four-engagement advisory template and offerings map, enquiry notifications via Resend, publication-date rule, the operator's manual with its 21-fact guard, the Studio session bridge, and the 2026-08-23 security audit with its dataset-access guard.

---

## 1. Security & Vulnerability Findings

### Critical Issues

**C1 — Next.js 15.5.23 carries two critical advisories; the fix is a patch release inside the v15 ceiling.**
`package.json` pins `next: ^15.5.23`; installed is 15.5.23. `npm audit` reports GHSA-2xp9-vwfh-vxw4 (*Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used*, vulnerable `<15.5.24`) and GHSA-p293-qw3h-jr36 (RCE on Windows-hosted servers, not applicable on Vercel). The image optimiser is in use: 18 files import `next/image`, and `next.config.ts:60-66` allows `remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }]` **with no `pathname`**, so `/_next/image?url=https://cdn.sanity.io/images/<any-project>/…` is accepted for any Sanity project's public asset, not just this one's. An attacker therefore needs no write access to this dataset: a free Sanity project of their own is enough to serve an AVIF into this site's optimiser. The site sets no `images.formats`, and no AVIF asset is committed, which narrows but does not close the path. `sharp` 0.35.3 (the override in `package.json`) is also below the libheif fix (GHSA-rgj7-g3m4-5g8c, fixed in 0.35.4); libheif is the HEIF/AVIF decoder, so the two go together.
**Fix:** upgrade to `next@15.5.25` (latest 15.x; `15.5.24` also declares `sharp: ^0.34.3 || ^0.35.3`, so the override no longer contradicts a declared range — update the sentence in `CLAUDE.md`'s dependency section that says it does); move the `sharp` override to `^0.35.4`; add `pathname: '/images/3q59mpd7/production/**'` to the remote pattern. Then re-verify the image path the way `CLAUDE.md` prescribes: fetch `/_next/image` for a real Sanity asset on the plain path and with a browser `Accept` header and confirm a resized image and a WebP. Do not touch `sanity` or `next-sanity`. This is the only finding in this review that should ship before anything else.

### High Priority

**H1 — `ADMIN_PASSWORD` is still the one wide-scoped, Non-sensitive secret in Vercel** (carried from June). Twelve of thirteen secrets were re-classified and scoped to Production on 2026-08-23; this one was left for the owner because the new value has to be shown to a person, not a transcript. It guards the whole writer surface, including metered Claude / Exa / OpenAI calls. **Fix:** owner runs the rotation (new 24+ char value, Sensitive, Production only), confirms by reading the state back with `vercel env ls`, then redeploys — env changes are inert until `vercel --prod`.

**H2 — `AI_MONTHLY_BUDGET_USD` is unset in production, so the spend ceiling is a no-op.** `src/lib/model-budget.ts` implements `checkMonthlyBudget()`, and the 2026-08-23 audit recorded that on the compliance intake it is *the only ceiling IP rotation cannot defeat*. Production and local share one Anthropic key; a runaway on either exhausts both. **Fix:** set the variable in Vercel Production (a number the owner is comfortable losing in a bad month), read it back, redeploy.

### Medium Priority

**M1 — The documented `npm audit` baseline no longer describes reality.** `README.md` and `CLAUDE.md` say the remaining findings "all sit under the sanity CLI/export toolchain". Today: **36 findings (3 critical, 18 high, 14 moderate, 1 low)**, and `next` itself is one of the criticals (C1). A plain `npm audit fix` (no `--force`) resolves the non-major set — `next`, `sharp`, `undici`, `tar`, `form-data`, `ip-address`, `js-yaml`, `brace-expansion`, `@xmldom/xmldom`, `dompurify`, `linkify-it`, `valibot`, `vitest`, `colord`, `json-2-csv`, `esbuild`, `baseline-browser-mapping`, `@humanfs/node` — without touching the ceilings. What remains after that genuinely needs a major (`sanity@6`, `next-sanity@13`, `puppeteer@25`, `maplibre-gl@6`, `exceljs@3`) and is build/dev-time except `maplibre-gl` (see M2). Most of the transitive highs run only in the Sanity CLI, `@sanity/export`, or Puppeteer, never in the Vercel function runtime. **Fix:** run the non-force fix, run the full suite and build, and rewrite the two baseline paragraphs to name the true residue and its reason.

**M2 — `maplibre-gl` 5.17.0 has a critical-rated XSS sanitizer bypass (GHSA-jrc7-96c5-q579), fix requires 6.9.1.** Exploitation needs attacker-controlled HTML reaching the map's DOM. The Supply Chain Mapper renders static data from `src/lib/supply-chain-data.ts`; no `Popup`, `setHTML` or `dangerouslySetInnerHTML` is used in the tool. Rated Medium here because the input is trusted and static. **Fix:** schedule the `maplibre-gl` + `react-map-gl` major together; keep map content static until then.

**M3 — Two accepted risks come up for review on 2026-11-21.** M13 (static `x-sanity-webhook-secret` header on `/api/vectorize` and `/api/on-publish` rather than an HMAC signature) and M15 (CSP `'unsafe-inline'`). Both have written re-open triggers. Neither needs action now; the date needs to be on a calendar.

**M4 — `.env.example` omits 16 variables the code reads**, several of them load-bearing per `CLAUDE.md`: `CONTACT_VIA_BACKEND`, `RESEND_API_KEY`, `ENQUIRY_NOTIFY_FROM/TO`, `PINECONE_KNOWLEDGE_INDEX_NAME`, `AI_MONTHLY_BUDGET_USD`, `KV_REST_API_URL/TOKEN`, `NEXT_PUBLIC_COMPLIANCE_CHECKER_V2`, `NEXT_PUBLIC_RULEPACK_VERSION`, `ANTHROPIC_MODEL` / `_INTAKE_MODEL` / `_REPORT_MODEL`, `AI_WRITER_ROOT`, `REGULATORY_RETRIEVAL_DISABLED`. A fresh environment set up from the example silently runs without the enquiry notification and without the spend ceiling. **Fix:** add them with comments, and a guard script that diffs `process.env.X` reads against the example so the list cannot drift again.

### Low Priority

- **L1 — HSTS still lacks `preload`** (`next.config.ts:137`). `www` 308s to the apex over HTTPS, so adding it is safe; submit to the preload list afterwards.
- **L2 — The public site's data-access control lives in a console.** Documented and CI-guarded (`test:dataset-access`), but the stronger control — a private dataset with a read token — is still open, and a new internal document type is anonymously readable until someone blocks it. Not urgent; noted so it is not forgotten.
- **L3 — Two page files survive behind 301s.** `src/app/(website)/eu-exposure/page.tsx` and `products/ai-audit-checklist/page.tsx` still exist while `next.config.ts` redirects both. Dead code, not a leak; delete once tests referencing them are checked.
- **L4 — `NEXT_PUBLIC_PRE_LAUNCH` still on.** "Buy Now" CTAs capture email rather than sell. Owner's decision on 2026-08-11 with the note that it "expires the moment the site is promoted". Recorded so the flag is not forgotten at launch.
- **L5 — The service worker's NetworkOnly list covers three of the nine protected prefixes.** `src/app/sw.ts:62-69` excludes `/studio`, `/admin` and `/login` from caching, then spreads Serwist's `defaultCache`, whose page handler caches same-origin navigations. The middleware (`src/middleware.ts:7-16`) protects six more: `/create`, `/editor`, `/research`, `/knowledge`, `/content`, `/context`, `/import`, `/analytics`. Their HTML can land in the page cache on a shared machine. `/api/*` is correctly NetworkOnly. **Fix:** export the prefix array from one module and have both the middleware and the SW read it; a test asserting the two agree.
- **L6 — Web-push subscribe stores any endpoint URL.** `src/app/api/push/subscribe/route.ts:53-56` checks only presence; `src/lib/push/send.ts` then POSTs a VAPID-signed request to it on every admin send. Blind server-side request with no response exposure, rate-limited and 4 KB-capped, so Low. **Fix:** require `https:` and allowlist the push-service hosts (`fcm.googleapis.com`, `*.push.apple.com`, `updates.push.services.mozilla.com`, `*.notify.windows.com`).
- **L7 — Three prompt builders embed fetched or user text without the shared fence.** `src/lib/prompt-fence.ts` provides `fenceUntrusted()` and a `SECURITY:` clause, used by `prompts.ts` and `research.ts`. `src/lib/fact-check.ts:322` interpolates Exa titles, URLs and snippets into the verifier prompt with no data/instruction boundary, and its verdict is patched onto the Sanity article (advisory and human-reviewed, so bounded). `src/lib/intake/extract.ts:89` wraps user text in `<description>` but does not strip a literal closing tag; `src/lib/report/generate.ts` and `compliance-v2/report/generate.ts` carry no explicit untrusted-data instruction. **Fix:** reuse the fence and clause in all four; strip closing tags in intake.

### API surface (36 routes, verified this review)

Legend: **A** admin cookie checked in-band, **M** in the middleware matcher, **S** shared secret or signature, **T** signed token, **I** ingest bearer (sha256 + `timingSafeEqual`), **RL** durable Upstash limiter (in-memory fallback, never throws).

| Route | Auth | RL | Body cap | Spends / writes |
|---|---|---|---|---|
| `/api/revalidate` | S (webhook signature) | – | 50 KB | cache only (no webhook can exist on the current plan) |
| `/api/auth/callback/inoreader` | A + CSRF state | – | – | Inoreader token |
| `/api/briefings`, `/api/categories` | public read | – | – | read only |
| `/api/contact`, `/api/subscribe` | – | ✓ | ✓ | Kit write; contact also Resend |
| `/api/draft-mode/enable` / `disable` | A+M / – (disable only) | – | – | – |
| `/api/fact-check`, `/api/image-prompts` | A+M | ✓ | 4 KB | Anthropic (+ Exa, Sanity write for fact-check) |
| `/api/knowledge/candidates`, `sources` | A+M | – | ✓ | Sanity write |
| `/api/knowledge/capture`, `inbox`, `record/[id]` | I | ✓ | 200 KB | Sanity draft write / read |
| `/api/knowledge/evidence`, `review` | A+M | ✓ | 4 KB | OpenAI embed, Pinecone, Sanity |
| `/api/mcp` | I (`withMcpAuth required`) | ✓ per token | 500 KB | Sanity draft write only |
| `/api/on-publish`, `/api/vectorize` | S (header secret, `timingSafeEqual`) | ✓ | 1 MB | Sanity patch, web-push / OpenAI, Pinecone |
| `/api/push/send`, `stats` | A+M | – | 4 KB | web-push |
| `/api/push/subscribe`, `unsubscribe`, `topics` | – | ✓ | 4 KB | Redis (L6) |
| `/api/search/semantic` | A+M | ✓ | – | OpenAI, Pinecone |
| `/api/studio-session` | Sanity administrator role | ✓ before token | – | Sanity identity call |
| `/api/tools/compliance-checker/intake`, `report`, `v2/report` | – | ✓ + monthly budget | 8 / 20 / 60 KB | **Anthropic** (the only unauthenticated spend; H2 makes the budget real) |
| `…/report/[id]`, `…/v2/report/[id]` | T (HMAC over `SESSION_SECRET`) | – | – | Redis read |
| `…/session` | httpOnly random cookie | ✓ | 20 KB | Redis |
| `/api/webhooks/lemonsqueezy` | S (HMAC over raw body) | – | 100 KB | Kit tag |
| `llms.txt`, `rss.xml` | public | – | – | – |

All twelve exported server actions across the seven `(admin)` action files call `requireAdmin()`; every middleware-protected API route also checks in-band. No unauthenticated route writes to Sanity or Pinecone.

### Verified protections

Middleware gates every admin surface and deliberately excludes `/api/studio-session` (`src/middleware.ts:84-90`); the Studio session bridge resolves identity on the project-scoped host `https://<projectId>.api.sanity.io` (`src/lib/sanity-identity.ts:99`), requires the administrator role, and fails closed, each asserted in `sanity-identity.test.ts`. Lemon Squeezy webhook verifies an HMAC-SHA256 over the raw body with `timingSafeEqual` (`src/lib/lemonsqueezy.ts:34-43`). `vectorize` and `on-publish` compare their header secret with `timingSafeEqual` and are rate-limited and body-capped. `server-only` is imported in 74 files, covering every module that reads a secret (no gaps found). Zero `div/span onClick`, two `dangerouslySetInnerHTML` (both safe). JSON-LD escaped. Backend key compare is constant-time and the limiter is Redis-backed. The compliance report route re-runs the classification engine server-side; the email address is not part of `AnswerRecordV2` so it cannot reach a prompt. Every security-relevant invariant in `CLAUDE.md` that was checked in this review still holds in code.

### Security Summary

| Category | Status |
|---|---|
| Secrets & Credentials | Issues Found (H1 carried; no plaintext secrets in tracked files) |
| Dependencies | **36 vulnerabilities** (3 critical / 18 high / 14 moderate / 1 low); C1 actionable today, most of the rest build-time or major-gated |
| Authentication | Solid |
| Input Validation | Solid |
| Data Exposure | Clean (L2 is a strengthening item) |
| Network Security | Configured (CSP accepted risk M15; HSTS preload outstanding) |
| PWA Security | Clean (SW caches `cdn.sanity.io` reads and the offline shell only) |
| Mobile Security | N/A |
| Infrastructure | Gaps Found (H2 spend ceiling unset; no error monitoring) |
| Third-Party | Clean |

---

## 2. Code Quality Assessment

| Category | Score | Key Finding |
|---|---|---|
| Architecture | Strong | 82 top-level `src/lib` modules + 12 sub-packages with enforced seams (`regulatory-index-checks` forbids the report/rulepack lanes from touching the editorial corpus); invariants are executable guards, not prose. |
| Type Safety | Strong | `strict: true`; **0** `any`, 0 `@ts-ignore`; 5 `@ts-expect-error` (3 deliberate in tests, 2 for a `defineQuery` inference gap in `search/page.tsx:47,52`). |
| Error Handling | Strong | `global-error.tsx`, root `error.tsx`, `error.tsx` in all three route groups, `(website)/loading.tsx`, `not-found.tsx`. Only gap: no `(admin)/loading.tsx`. |
| State Management | Adequate | Local `useState` only, no context — right for the site, but four tool pages of 900–1,181 lines each hold a large state machine with no reducer. |
| Performance | Adequate | Maplibre is now dynamic, but that is the *only* `next/dynamic`; the four tool pages ship whole as client components. |
| Testing | Strong | 0 → 82 test files / 1,584 tests; 10 invariant scripts; CI runs 11 gates plus build. Untested: `prompts.ts` (783), `fact-check.ts` (560), `session.ts`, `rate-limit.ts`, `seo.ts`, `research.ts`, `draft-pipeline.ts`. |
| Accessibility | Adequate | June pair fixed; checker-v2 uses native `fieldset/legend/label`; offerings map has `role="img"` + list fallback. 21 decorative inline SVGs lack `aria-hidden`; desktop nav triggers lack `aria-haspopup`. |
| Code Hygiene | Adequate | 5 TODOs (all owner-scoped), 5 `console.log` (all `research.ts`), no commented-out code. Three tracked-but-unreferenced root files, two dead `src/scripts`, two shadowed page files. |
| Developer Experience | Adequate | Good `.env.example` but 16 vars missing (M4); 56 npm scripts with no index; no Prettier; no `CHANGELOG.md` (the changelog lives in `project_summary.md` §9). |
| PWA Compliance | Strong | Serwist SW, manifest, offline fallback, saved-articles shell, `test:pwa` in CI after build. |
| Mobile Readiness | Strong | `viewportFit: cover`, 13 safe-area usages, bottom tab bar, install prompt, offline banner, explicit narrow-screen paths on the map and checker. |
| Cross-Platform | N/A | — |

### Detailed Findings

**Handover documents have outgrown the handoff model (the one maintainability finding that matters).** `CLAUDE.md` is 969 lines / 61.8 KB and is loaded into every agent session — roughly 15k tokens before any work starts, most of it narrative ("bit once", dates, what the failure looked like) rather than rules. `project_summary.md` is 9,184 lines / 670 KB and cannot be read whole by any tool in one call. `docs/operator-manual.md` is 1,527 lines but is guarded, so it stays honest. The consequence is visible in this review: at least ten places where a document contradicts the code or another document (§3 below). **Recommendation:** cut `CLAUDE.md` to invariants and pointers (target under 25 KB), move the "why / when / what it looked like" narrative to `docs/decisions/<topic>.md` one file per section, and split `project_summary.md` into a two-page current-state index plus dated archives. The guard pattern already exists (`manual-checks.ts`); extend it to the handful of numeric facts in `CLAUDE.md` most likely to rot (module count, corpus count, criterion states).

**Performance — the four tool pages.** `tools/compliance-checker/page.tsx` (1,181 lines), `scenario-modeler` (983), `supply-chain-mapper` (938), `policy-stress-test` (902) are single `'use client'` files. The offering pages already follow the better pattern (thin async server `page.tsx`, content in a sibling Client Component). Apply it here and `dynamic()` the post-submit result/report panels, which only render after interaction.

**Accessibility residue.** Decorative SVGs at `methodology/page.tsx` (36, 59, 82, 109, 132, 191), `about/page.tsx` (283, 300, 317, 391, 400), `components/home/ToolsGrid.tsx` (24, 39, 54, 69), `search/SearchForm.tsx:39`, `briefings/PersonaFilter.tsx:115`, `Header.tsx` (278, 308, 367), and the score ring at `tools/policy-stress-test/page.tsx:204` need `aria-hidden="true"` (the ring also needs its number as text). Desktop dropdown triggers (`Header.tsx:190-202`) need `aria-haspopup`/`aria-expanded`.

**Hygiene.** Tracked and referenced nowhere: `pinecone_quickstart.py`, `business-overview.json` (the code imports `context/core/business-profile.json`, a different file), `content-audit-ai-act-dates.md`. Dead: `src/scripts/test-pinecone-setup.ts`, `src/scripts/test-semantic-search.ts`. The four-copy intelligence-feed GROQ (`intelligence/page.tsx:28`, `api/briefings/route.ts:19`, `queries.ts:12`, `backend/main.py:53`) is confirmed and held together by `briefings-query.test.ts` — a mitigation, not a fix.

---

## 3. Progress & Alignment

### Mode B — Documentation Alignment

**Estimated Completion:** code-side documented scope **~90%**; owner/configuration scope **~25–30%**. The site is live and stable but cannot yet take a payment or tag a lead.

| Documented Feature | Status |
|---|---|
| Tiered intelligence feed, personas, topic filters, series | ✅ Built |
| Four interactive tools, email-gated, each with a follow-on offering | ✅ Built |
| Compliance Checker v1 (rule pack, agentic intake, verified report) | ✅ Built and live |
| Compliance Checker v2 (8 phases; no score decides a tier) | 🔄 Built, dark — blocked on counsel review, usability testing, report email delivery, §22 session-recovery decision |
| Regulatory corpus (6 instruments) + drift watcher | ✅ Built; next `reviewBy` 2026-11-11 (AI Act) / 2026-11-13 (others) |
| Knowledge system (waves 0–4a) | 🔄 Capture, review, indexing live; drafting-lane retrieval dark until ≥15 records and `knowledge:calibrate` |
| PWA phases 0–3 (offline, saved, push, gate) | ✅ Built; push has 0 subscribers |
| Advisory: four engagements on one template, four specialist modules, offerings map | ✅ Built |
| Products: Toolkit £79 / £275, sector reports, Professional review | 🔄 Pages built; **no store, no checkout URL, review providers are placeholders** |
| Enquiry notifications (Resend) | ✅ Built, verified on production 2026-08-24 |
| Publication dates, pricing catalogue, series | ✅ Built, guarded |
| Author E-E-A-T, legacy 301s, SEO surface | ✅ Built |
| SEO Sprint 2 pillar pages, article specs (`docs/article-specs-todo.md`) | ❌ Not started |
| Atlantic Drift lead-magnet PDF | ❌ Not started |
| Booking link on advisory pages | ❌ Not started (flag only) |
| Error monitoring | ❌ Not started |
| Next 16 / Sanity v5 upgrade | ⏳ Blocked on Next 16 stable (clears ~19 audit findings) |

**Owner-side items still open (none need a commit):** Lemon Squeezy store, product, variants, webhook secret, upgrade path and digital-goods consent step; Sanity `product.checkoutUrl`; Kit launch tags (0 of 12–17 exist; two env vars hold literal placeholders); Kit sender verification; `NEXT_PUBLIC_BOOKING_URL`; `NEXT_PUBLIC_LINKEDIN_URL`; Inoreader redirect URI (localhost since June); Plausible goal names; `AI_MONTHLY_BUDGET_USD`; `ADMIN_PASSWORD` rotation; Railway `CONVERTKIT_*` values unverified; regulatory review stamp reinstated with a real date; solicitor review of `/terms`; counsel review of the v2 decision matrix; usability testing; `PRE_LAUNCH` flip; 8 of 16 published articles without `mainImage`; 9–10 unpublished drafts.

**Undocumented in `project_summary.md` §3 (exists in code):** `/digital-omnibus`, `/products/ai-act-toolkit/review`, all four `/advisory/modules/*`, `/login`, `/studio`; API routes `fact-check`, `image-prompts`, `knowledge/{capture,inbox,record,review}`, `mcp`, `on-publish`, `studio-session`, all six `tools/compliance-checker/*`, `webhooks/lemonsqueezy`; redirects for `/eu-exposure` and the two Sovereign Architecture URLs.

**Stale or contradictory documentation (verified against code):**

| Where | Claim | Reality |
|---|---|---|
| `CLAUDE.md` (Checker v2 §20) | "criterion 14 is `manual` and 16 is `blocked`" | `acceptance.ts:402` — only 14 is `manual`; 16 became automated 2026-08-19. `project_summary.md` §11 and the memory note repeat the stale claim. |
| `CLAUDE.md` (three places) | "three `MODULES`", "the other three tools" | `offering.ts` `MODULES` has **four** (European Procurement Readiness added). |
| `CLAUDE.md` | "25 statically prerendered" provisions pages | Pack `2026-08-19b` has 28 corpus files; the count is derived and is now 28. |
| `CLAUDE.md` | `next@15.5.23` declares `sharp: ^0.34.3`, so the override contradicts it | True today; `15.5.24` declares `^0.34.3 \|\| ^0.35.3`. Goes stale with C1. |
| `README.md` / `CLAUDE.md` | audit residue "all under the sanity CLI/export toolchain" | `next` and `maplibre-gl` are the criticals (M1). |
| `README.md` | "Start at Latest session — 9 September" | Latest is 14 September. Also calls the backend a "scaffold" and points at two June deployment docs with no superseded banner. |
| `project_summary.md` §5.5 | "£24 Checklist → £20 off the Toolkit" | Checklist merged into the Toolkit 2026-09-14; no checklist figure in `AMOUNTS`. |
| `project_summary.md` §11 | Article 27 "not approved / not in the corpus"; "£39 Evidence Pack"; "§22 four remain" | Article 27 is in pack `2026-08-19b`; Evidence Pack withdrawn 2026-09-14 (zero references in `src/`); two §22 items remain. |
| `project_summary.md` §10 | "24 Articles and Annex III", "rest of Article 26" a gap | 27 Articles + Annex III; Article 26 complete. |
| `project_summary.md` §3 | `/api/revalidate` webhook "until it widens"; "www canonical host" | `LAUNCH.md` established 2026-09-04 that no revalidate webhook can exist on the plan's two slots; canonical is the apex. |
| `LAUNCH.md` | VAPID `[ ]`; Resend four `[ ]` | VAPID done 2026-08-21 (§11); Resend "verified end to end on production 2026-08-24" on the same page. |
| `LAUNCH.md` / §11 / `kit.ts` | 12 tags / 14 tags / 17 `*_TAG_ID` vars | Three different counts of the same list. |
| `docs/advisory-page-copy.md`, `site-revision-spec.md`, build brief banner | £2,000/mo, £2,500, £8,000, £3,500 | All replaced by "fee agreed after scoping" 2026-09-13. |
| Memory `project_launch_decisions.md` | Toolkit "£79/£149", Calendly on "Services page" | £79/£275; `/services` is a 301. |

**Scope drift:** none concerning. The work beyond the June scope (rule pack, corpora, knowledge system, series, offerings map) is coherent with the product and is documented — at times over-documented — in `project_summary.md`.

---

## 4. Risk Assessment

### Top Risks

**Risk 1: An unpatched critical in the framework, reachable without credentials.**
**Impact:** Critical **Likelihood:** Medium
**Detail:** C1. The image optimiser accepts any `cdn.sanity.io` path, the advisory is public, and the patch is trivial. The longer the gap between advisory and patch, the more likely automated scanning finds it first.
**Mitigation:** FIX-001 in the brief; ship today.

**Risk 2: The revenue path is still open three months after it was flagged.**
**Impact:** High **Likelihood:** Certain until acted on
**Detail:** Every sales page, follow-on band, credit rule and pricing guard is built and tested, and the funnel still ends in an email capture: no store, no checkout URL, no tags, no booking link. The engineering has run well ahead of the commercial setup; further site polish has diminishing return until money can change hands.
**Mitigation:** Treat `LAUNCH.md` steps 3–9 as the phase's primary deliverable, owner-driven, with an agent preparing each console step and reading the state back.

**Risk 3: The handover documents are now a liability as well as an asset.**
**Impact:** Medium **Likelihood:** High
**Detail:** 62 KB of `CLAUDE.md` in every session and a 670 KB summary no tool can read whole, with a dozen verified contradictions. Future sessions — human or agent — will act on stale facts (this review found the criterion-16 claim repeated in three places). The guard pattern that stopped the operator's manual rotting has not been applied to these two files.
**Mitigation:** NEXT-003 / NEXT-004 in the brief: reconcile, then restructure and guard.

**Risk 4: Metered spend has no ceiling and failures have no monitor.**
**Impact:** High **Likelihood:** Low–Medium
**Detail:** `AI_MONTHLY_BUDGET_USD` unset (H2), production and local share one Anthropic key, and there is no error monitoring; a stuck loop or a scripted abuse of the compliance intake is discovered by an invoice.
**Mitigation:** FIX-003 (2 minutes); NEXT-005 for the monitoring decision.

**Risk 5: The dependency ceilings are accumulating debt.**
**Impact:** Medium **Likelihood:** Medium
**Detail:** 36 audit findings today against 13 in June; `sanity@4` / `next-sanity@11` / `maplibre-gl@5` all wait on majors. The Next 16 + Sanity v5 upgrade is correctly deferred, but it is now a real project (Studio, TypeGen, `useEffectEvent`, CSP for Studio) rather than a version bump.
**Mitigation:** NEXT-001 clears the non-major set now; scope the upgrade as its own phase once Next 16 is stable.

**Risk 6: Legal content published without professional review.**
**Impact:** Medium **Likelihood:** Low
**Detail:** `/terms` refunds section is explicitly unreviewed by a solicitor; the v2 decision matrix awaits counsel; the regulatory review stamp was removed from four pages on 2026-08-11 and not reinstated. The brand sells regulatory precision.
**Mitigation:** Owner tasks in the brief; none is code.

### Launch Readiness

| Requirement | Status |
|---|---|
| Security vulnerabilities resolved | ❌ C1 outstanding (patch available); H1, H2 owner actions |
| Error handling complete | ✅ |
| Environment config separated | ✅ (12/13 secrets scoped; `.env.example` gaps M4) |
| Monitoring in place | ❌ No error monitoring; no spend ceiling |
| Analytics tracking | 🔄 Plausible live; goal names unconfirmed |
| Performance acceptable | ✅ (tool-page splitting is polish) |
| Accessibility baseline | ✅ (residual SVG labelling) |
| Core user flows working | 🔄 Read / Use / Engage work; **Buy does not exist yet** |

**Launch verdict:** Operationally live and stable; **commercially not ready** — the store, tags, booking link and two owner-side secrets stand between the site and its first sale. Nothing in code blocks launch except C1, which is a one-line patch.

---

## 5. Metrics Snapshot

| Metric | 2026-06-09 | 2026-09-15 |
|---|---|---|
| Total source files (`src/`, .ts/.tsx) | 203 | 571 |
| Lines of code (`src/`, approx) | ~27,700 | ~95,400 |
| `page.tsx` / `route.ts` | — | 57 / 36 |
| Dependencies (production / dev) | 29 / 19 | 37 / 22 |
| Known vulnerabilities | 13 moderate | 36: 3 critical, 18 high, 14 moderate, 1 low |
| Test files / tests | 0 | 82 / 1,584 (2.9 s) |
| Invariant scripts in CI | 4 | 11 (+ 5 in `prebuild`) |
| TODO/FIXME | 1 | 5 (all owner-scoped) |
| `console.log` outside scripts/tests | 5 | 5 (all `research.ts`) |
| TypeScript `any` | 0 | 0 |
| Largest file | `ai-act-rules.ts` (1,047) | `ai-act-rules.ts` (2,000) |
| Files over 300 / 600 lines | 23 / — | 71 / 21 |
| `CLAUDE.md` / `project_summary.md` | — | 61.8 KB / 670 KB |
| `backend/main.py` | 932 lines | 996 lines, one file |
| Commits since last review | — | 478 (818 files, +179,002 / −6,081) |

Suite results this review: `npm test` 1,584 passed; `next lint` clean; `tsc` clean; `test:security`, `test:style-rules`, `test:manual` (21 facts), `test:knowledge-inbox`, `test:evidence-index`, `test:regulatory-index` (1,422 chunks), `rulepack:check` (4 packs), `reg:check` (6 instruments, vintages agree), `test:checker-v2` (80 questions, 58 propositions) all green. Production deploy `Ready` 12 h before review.

---

## 6. Recommendations Summary

### Do Now (before any further development)
1. **Patch Next.js to 15.5.25, `sharp` override to `^0.35.4`, add `pathname` to the Sanity remote pattern; re-verify the image path** (C1).
2. **Owner: rotate and scope `ADMIN_PASSWORD`; set `AI_MONTHLY_BUDGET_USD`; redeploy** (H1, H2).

### Do This Phase
1. `npm audit fix` (never `--force`), full suite + build, rewrite the audit-baseline paragraphs in `README.md` and `CLAUDE.md` (M1).
2. Reconcile the dozen documented contradictions (§3 table), starting with `CLAUDE.md` and `README.md`.
3. Restructure `CLAUDE.md` (invariants + pointers) and `project_summary.md` (index + archives); guard the facts most likely to rot.
4. `.env.example` completeness + guard script (M4).
5. Wire report email delivery for the Compliance Checker through the existing Resend client — the one release criterion for v2 that is code.
6. Owner: `LAUNCH.md` steps 3–9 (store, tags, booking URL, sender verification, Inoreader URI, `PRE_LAUNCH`), with each console change read back rather than trusted.
7. Error-monitoring decision (NEXT-005).

### Do Soon
0. Service worker NetworkOnly list derived from the middleware's protected prefixes (L5); push endpoint `https:` + host allowlist (L6); `fenceUntrusted()` in the fact-check, intake and two report prompt builders (L7).
1. Tests for `session.ts`, `rate-limit.ts`, `seo.ts` (`breadcrumbList`), `fact-check.ts` (never-throws contract); enable vitest coverage reporting.
2. Split the four tool pages into server shell + client component; `dynamic()` post-submit panels.
3. `aria-hidden` on the 21 decorative SVGs; `aria-haspopup` on nav triggers; `(admin)/loading.tsx`.
4. Housekeeping: delete `pinecone_quickstart.py`, the two dead `src/scripts/test-*.ts`, the two shadowed page files; relocate the two root docs; superseded banners on the June deployment docs; `docs/scripts.md` index.
5. HSTS `preload` (L1).
6. Calendar: 2026-11-11 / 11-13 corpus `reviewBy`; 2026-11-21 accepted-risk review (M13, M15).

### Do When Convenient
1. Next 16 + Sanity v5 + `next-sanity` v12/13 + `maplibre-gl` 6 as one scoped phase once Next 16 is stable (clears ~19 findings, unblocks TypeGen).
2. Private dataset + read token for the public site (L2).
3. Content: pillar pages / article specs, Atlantic Drift PDF, cover images on 8 articles, the 9–10 drafts.
4. Knowledge lane: reach 15 reviewed records, `knowledge:calibrate`, light the retrieval lane.
5. Prettier decision; structured logger; `backend/main.py` split if it grows past ~1,200 lines.

---

*This review was generated by the project-review skill. Previous reviews are preserved with date suffixes (`docs/review-report.md` = 2026-06-09).*
