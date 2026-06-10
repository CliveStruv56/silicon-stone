# Project Review Report

**Project:** silicon-and-stone-web (Silicon & Stone — siliconandstone.com)
**Date:** 2026-06-09
**Review Mode:** B — Documented Project (no PLAID docs; intent inferred from `project_summary.md`, `docs/intelligence-portal-specification.md`, and the SEO build brief)
**Tech Stack:** Next.js 15.5 (App Router) + React 19, TypeScript strict, Tailwind 4, Sanity CMS v4, FastAPI backend (Railway), Anthropic/Exa/OpenAI/Pinecone, ConvertKit (Kit), Upstash rate limiting
**Project Type:** SSR web app (Vercel) + separate logic backend (Railway), live in production

---

## Executive Summary

The project is in genuinely good shape: the June 8 security remediation is real (every claimed protection was located and verified at file level), type safety is exemplary (zero `any` in 27.7k LOC), and the documented scope is ~85% built — what remains is mostly founder configuration (Lemon Squeezy store, Plausible account, content publishing) rather than code. The one finding with teeth is confirming the production `ADMIN_PASSWORD` was rotated away from the value burned into git history. The most pressing *maintenance* issue is that `project_summary.md` — the session handoff backbone — is stale on the Phase A/B route consolidation that is now merged to `main`.

**Overall Health:** Healthy

---

## 1. Security & Vulnerability Findings

### Critical Issues

No critical security issues found.

### High Priority

**H1 — The original admin password exists in git history; confirm production rotation.**
The short default admin password used at launch was committed in `docs/authoring-guide.md` and `project_summary.md` until removed in commit `278df92`; it remains recoverable from history (private repo, which contains the exposure — value deliberately not repeated here). Local notes still record it as current. If the Vercel `ADMIN_PASSWORD` is still this value, a single short dictionary-adjacent password guards the whole admin surface — including the paid Claude/Exa/OpenAI generation pipeline — and the login limiter degrades to per-lambda in-memory when Upstash is unreachable (`src/lib/durable-rate-limit.ts:113-118`), making distributed guessing feasible.
**Fix:** Verify/rotate `ADMIN_PASSWORD` in Vercel to a long random value; treat the history value as burned. If already rotated, this downgrades to informational.

### Medium Priority

**M1 — CSP `script-src` includes `'unsafe-inline'`** (`next.config.ts:5-10`). The CSP is a load-source allowlist only; it provides no script-injection protection. Standard Next.js trade-off; nonce-based CSP via middleware would close it and make M2 moot.

**M2 — JSON-LD rendered without `</script>` escaping.** `src/components/seo/JsonLd.tsx:12` and `src/app/(website)/page.tsx:95` use `dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}`. A CMS string containing `</script><script>` breaks out of the tag. Requires Sanity write access to exploit, so low likelihood. One-line fix: `.replace(/</g, '\\u003c')`.

**M3 — Backend shared-key compare is not constant-time.** `backend/main.py:168` uses `!=`; the frontend equivalent uses `crypto.timingSafeEqual`. Use `hmac.compare_digest`.

**M4 — Backend `/v1/subscribe` and `/v1/contact` rate limits are in-memory per-process.** `backend/main.py:106,134-148` — limits reset on redeploy and multiply per replica. Redis is already provisioned for deep-research; reuse it. Mitigated by the shared-key requirement and the Vercel proxy's durable limits.

### Low Priority

- **L1** — Rate limiter deliberately degrades to in-memory when Upstash is down (`durable-rate-limit.ts:99-118`). Documented availability trade-off; acceptable, but it multiplies H1.
- **L2** — No session revocation: `jti` issued but untracked (`src/lib/session.ts`); stolen cookie valid 24h even after password rotation. Consider binding token to a hash of `ADMIN_PASSWORD`.
- **L3** — `backend/main.py:633-635` `/v1/topology` (architecture info-leak) and `:827-833` `/v1/hermes/events` (unauthenticated POST, currently a no-op) — add key auth before wiring hermes to anything real.
- **L4** — Subscriber email can reach logs via 500-char upstream error bodies (`api/contact/route.ts`, `api/subscribe/route.ts`, `backend/main.py:699-703,787-791`). GDPR hygiene: truncate/redact.
- **L5** — HSTS lacks `preload` (`next.config.ts:86-88`).
- **L6** — ~~`SANITY_REVALIDATE_SECRET` dead env var / missing `/api/revalidate` route~~ **Withdrawn (false finding):** the route exists at `src/app/(website)/api/revalidate/route.ts` (route group doesn't affect the URL) and is properly secured — Sanity webhook signature verification via `next-sanity/webhook` `parseBody`, 50KB size cap, and post-Phase-B revalidation targets. The original scan only looked under `src/app/api/`.
- **L7** — `/api/draft-mode/disable` is unauthenticated/CSRF-able; worst case disables your own preview mode. By design.

### Verified protections (claimed in the June 8 remediation → confirmed present)

Middleware gating of all admin surfaces (`src/middleware.ts:7-38`); `requireAdmin()` in all 8 admin action files plus in-band checks on gated API routes; HS256 JWT session with constant-time compare, pinned alg, 24h expiry, ≥32-char secret enforcement (`src/lib/session.ts`); hardened login cookie + fail-closed login rate limiting (`(auth)/login/actions.ts`); `safeInternalPath` open-redirect fix (`src/lib/utils.ts:13-20`) + slug allowlist on draft-mode enable; `timingSafeEqual` + rate-limit-before-auth on `/api/vectorize`; trusted-IP derivation (`src/lib/rate-limit.ts:16-31`); `import 'server-only'` in 11 server libs; prompt-injection fencing (`src/lib/prompts.ts:14-19,96,109-131`); backend CORS allowlist validation (`backend/main.py:596-619`); shared-key auth failing closed on all backend writes; request size limits everywhere; security headers incl. HSTS/X-Frame-Options/nosniff (`next.config.ts:56-91`); OAuth `state` CSRF protection on Inoreader; `.gitignore`/git history clean of live secrets; Lemon Squeezy hosted checkout only (no card data); API docs and debug logging disabled in production; path-traversal guards regression-tested by `scripts/security-checks.ts`.

### Security Summary

| Category | Status |
|---|---|
| Secrets & Credentials | Issues Found (H1 — historical password, rotation to confirm) |
| Dependencies | 13 moderate (all transitive `uuid` via Sanity; documented baseline, fix blocked on Sanity upstream — do **not** `npm audit fix --force`) |
| Authentication | Solid |
| Input Validation | Solid (M2 one-liner outstanding) |
| Data Exposure | Minor issues (L4) |
| Network Security | Configured (M1 nonce-CSP improvement available) |
| PWA Security | N/A |
| Mobile Security | N/A |
| Infrastructure | Solid (M4 backend limiter durability) |
| Third-Party | Clean |

---

## 2. Code Quality Assessment

| Category | Score | Key Finding |
|---|---|---|
| Architecture | Strong | Clean route groups, GROQ centralised in `src/sanity/lib/queries.ts`, 39 focused lib modules |
| Type Safety | Strong | `strict: true`, **zero** type-level `any` in src/ |
| Error Handling | Adequate | Boundaries in all route groups; no `loading.tsx` anywhere, no `global-error.tsx` |
| State Management | Strong | Local `useState` only — correct for this scale |
| Performance | Adequate | No raw `<img>`; zero `next/dynamic` — maplibre statically imported in its (route-split) page |
| Testing | Needs Work | Zero unit tests; CI runs lint + typecheck + 4 invariant scripts |
| Accessibility | Needs Work | Hover-only nav dropdowns; email-gate modal lacks dialog semantics/focus trap |
| Code Hygiene | Strong | 1 TODO, clean console discipline, no dead code; one stray file (`explorer-size.css`) |
| Developer Experience | Strong | Good scripts, exemplary `.env.example`, CI present; no Prettier; CI doesn't run `next build` |
| PWA Compliance | N/A | Not a PWA |
| Mobile Readiness | Strong | Heavy breakpoint usage, dedicated mobile nav |
| Cross-Platform | N/A | — |

### Detailed Findings

**Testing — Needs Work.** No `*.test.*`/`*.spec.*` files exist. What does exist — `scripts/{security,style-rules,evidence-index,knowledge-inbox}-checks.ts`, all wired into `.github/workflows/check.yml` — is a genuine invariant safety net and better than nothing. The gap that matters: `src/lib/ai-act-rules.ts` (1,047 lines) and `ai-act-assessment.ts` encode regulatory decision logic users act on via the compliance checker. This is pure-function territory — cheap, high-leverage unit-test material. Same for `slugify`/`slug-redirects` and `markdown-to-portable-text.ts`. Recommendation: vitest + ~3 spec files, `npm test` added to CI. Don't chase coverage.

**Accessibility — Needs Work.**
- `src/components/layout/Header.tsx`: desktop Tools/Products dropdowns are hover-only (`opacity-0 ... group-hover:opacity-100`, ~line 87) with no `group-focus-within:` variant — keyboard users tab through invisible links. Hamburger lacks `aria-expanded`/`aria-controls`. (Credit: `aria-current`, `sr-only` labels present.)
- `src/components/tools/EmailGateOverlay.tsx`: no `role="dialog"`/`aria-modal`, no focus trap, no Escape-to-dismiss, email input has placeholder only (no label), error text not `aria-live`. This sits on the lead-gen critical path.
Both fixes are small and localised.

**Error handling / performance (Adequate, quick wins):** add a `loading.tsx` for `(website)` (the 608-line `/intelligence` page does multiple Sanity fetches with no streaming fallback) and a root `global-error.tsx`; wrap the maplibre map in `next/dynamic({ ssr: false })` in `tools/supply-chain-mapper/page.tsx` (886-line client component currently blocks that route's hydration on ~250KB+ of map lib).

**Notable:** no Sanity TypeGen — GROQ result types are hand-maintained and can drift; revisit `sanity typegen generate` after the Next 16 / Sanity v5 upgrade. `backend/main.py` is a single 932-line file — acceptable now, split if it grows.

---

## 3. Progress & Alignment (Mode B)

**Estimated Completion: ~85% of documented scope.** Intelligence-portal spec: 100% (and exceeded — topic filter, 6th persona, hub consolidation). project_summary code-side priorities: ~90%. SEO brief: Sprint 0 100%, Sprint 1 ~70%, Sprints 2–3 0% (Sprint 3 intentionally gated on YouTube launch).

| Documented Feature | Status |
|---|---|
| Tiered Intelligence (Pulse/Briefing/Audit) + persona + topic filters | ✅ Built (exceeds spec) |
| Methodology 3×2 matrix + checklist component | ✅ Built (spec still describes old 4-pillar model) |
| 4 interactive tools, email-gated | ✅ Built |
| Pulse header (impact score, persona, Stone Truth), Dynamic CTA | ✅ Built |
| Product sales pages + checkout | 🔄 Partial — pages live; Lemon Squeezy store + actual product files (Toolkit PDF, Checklist pack) outstanding |
| Advisory page + booking | 🔄 Partial — page live; Calendly/Cal.com embed not started (zero references in src/) |
| SEO: technical foundations | ✅ Sprint 0 done; Sprint 1 ~70% |
| SEO: author/E-E-A-T layer, legacy-slug 301s, pillar pages | ❌ Not started (author layer blocked on Clive's byline info; slug map shipped but empty pending sign-off) |
| Premium tier (auth, billing, gating) | ❌ Not started (explicitly future) |
| Atlantic Drift lead-magnet PDF | ❌ Outline only |

**Undocumented features found in code** (absent from project_summary's structural sections; some exist only as Section 9 changelog prose): `/waymarkpath` public page; admin `/analytics` dashboard (+ `usage.ts`, `pricing.ts`, `metrics/`); admin `/knowledge` editorial inbox (+ `/api/knowledge/*`); Pinecone semantic-search stack (`/api/search/semantic`, `/api/vectorize`); Railway endpoints `/v1/topology`, `/v1/hermes/events`, `/v1/research/deep`, `/v1/usage`; durable rate limiting; SEO surface routes (`robots.ts`, `sitemap.ts`, `rss.xml`, `llms.txt`, `opengraph-image.tsx`).

**Stale documentation:**

| File | What's wrong |
|---|---|
| `project_summary.md` | **Highest priority.** Section 3 route table pre-dates Phase B (`/briefings`→`/intelligence`, `/services`→`/advisory`, `/products/briefings`→`/products/sector-reports`, `/analysis` index removed; `/generate` listed but deleted); `/waymarkpath`, `/analytics`, `/knowledge` + 9 API/metadata routes missing. Section 9 marks Phase A/B "_pending_/unmerged" but both are on `main` (`231d29c`, `b7cb6f5`). Section 10 "no test step" is wrong (4 CI suites). "50 routes" vs 59+. Section 1 diagram omits Railway/Pinecone/Plausible. |
| `docs/intelligence-portal-specification.md` | Historical artefact: 4-pillar methodology, `/briefings` route, 5 personas. Mark superseded or refresh. |
| `docs/SiliconandStoneSEOreport.md` | Untracked in git; its audit findings are now mostly fixed — annotate Sprint 0/1 status and commit it. |

**Scope drift:** none concerning — the work beyond spec (knowledge inbox, analytics dashboard, deep-research backend) is coherent with the product direction, just under-documented.

---

## 4. Risk Assessment

**Risk 1: Admin credential** — Impact: High / Likelihood: Low–Medium. The password in git history (H1) guards a surface that can spend real API money and publish content under the brand. Mitigation: rotate now; 10 minutes.

**Risk 2: Documentation drift undermines the session-handoff model.** Impact: Medium / Likelihood: High. The whole workflow depends on `project_summary.md` being trustworthy; it's now wrong about routes, merge status, and CI. Future sessions (human or agent) will act on stale facts. Mitigation: NEXT-001 in the brief; keep the existing "update proactively" rule.

**Risk 3: Untested regulatory decision logic.** Impact: Medium / Likelihood: Medium. The AI Act engine (1,047 lines of rules) is the most-touched, most-trusted tool output and has been edited repeatedly (Article 50 coverage, scoring changes) with no regression net. A silent scoring regression damages exactly the credibility the brand sells. Mitigation: vitest specs over the engine.

**Risk 4: Revenue path not closed.** Impact: Medium (business) / Likelihood: certain until acted on. Sales pages are live but there's no store, no product files, no booking embed — the funnel ends in an enquiry form. Mitigation: the founder-task list (Lemon Squeezy store + product files + Calendly) is the highest-ROI non-code work available.

**Risk 5: Sanity v4 ceiling.** Impact: Medium / Likelihood: Low (managed). The pinned Sanity/next-sanity versions accumulate the 13 moderate advisories and block TypeGen. Mitigation: already documented — wait for Next 16 stable, upgrade together. No action now.

**Risk 6: CI doesn't build.** Impact: Low–Medium / Likelihood: Medium. `check.yml` runs lint/typecheck/invariants but not `next build`, so a server/client-boundary breakage can pass CI and fail on Vercel (i.e., be discovered as a failed production deploy). Mitigation: add a build step.

### Launch Readiness

The site is already launched; this table reads as "operate-in-production readiness":

| Requirement | Status |
|---|---|
| Security vulnerabilities resolved | ✅ (pending H1 rotation confirmation) |
| Error handling complete | ✅ (loading/global-error are polish) |
| Environment config separated | ✅ |
| Monitoring in place | ❌ (no error monitoring — Sentry or similar absent; Vercel logs only) |
| Analytics tracking | 🔄 code complete, account/env not configured |
| Performance acceptable | ✅ |
| Accessibility baseline | ❌ (two localised fixes needed) |
| Core user flows working | ✅ |

**Verdict:** Live and stable — 3 items to resolve to be fully operationally sound (H1 confirmation, a11y pair, error monitoring decision).

---

## 5. Metrics Snapshot

| Metric | Value |
|---|---|
| Total source files (src/, .ts/.tsx) | 203 |
| Lines of code (src/, approx) | ~27,700 |
| Dependencies (production) | 29 |
| Dependencies (dev) | 19 |
| Known vulnerabilities | 13 moderate (all transitive `uuid` via Sanity; accepted baseline) |
| Test files | 0 (+4 CI invariant scripts) |
| TODO/FIXME count | 1 (inside a generated content string) |
| `console.log` count | 28 (only 5 outside `src/scripts/`) |
| TypeScript `any` count | 0 |
| Largest file | `src/lib/ai-act-rules.ts` (1,047 lines) |
| Files over 300 lines | 23 (top offenders are static data files — benign — plus 4 tool pages at 567–886 lines) |

---

## 6. Recommendations Summary

### Do Now (before any further development)
1. Confirm/rotate production `ADMIN_PASSWORD` in Vercel (H1).
2. Update `project_summary.md` to post-Phase-B reality (routes, merge status, CI, diagram).

### Do This Phase
1. JSON-LD `<` escaping in `src/components/seo/JsonLd.tsx` + `(website)/page.tsx` (M2).
2. `hmac.compare_digest` in `backend/main.py:168` (M3).
3. EmailGateOverlay dialog semantics + Header keyboard dropdowns (a11y pair).
4. Vitest + specs for `ai-act-rules`/`ai-act-assessment`, `markdown-to-portable-text`, `slugify`.
5. Add `next build` to `.github/workflows/check.yml`.
6. Delete stray `explorer-size.css` (it's an Obsidian snippet — belongs in the vault's `.obsidian/snippets/`); commit `docs/SiliconandStoneSEOreport.md`.
7. Founder tasks: Lemon Squeezy store, Plausible account, Inoreader redirect URI, publish the 2 draft articles, draft the 7 clean-slug renames for sign-off.

### Do Soon
1. Backend subscribe/contact limits onto the existing Redis (M4).
2. `loading.tsx` for `(website)`, root `global-error.tsx`, `next/dynamic` the maplibre map.
3. Calendly/Cal.com embed on `/advisory`.
4. Error monitoring decision (Sentry or equivalent).
5. Populate the legacy-slug 301 map once slugs are signed off; mark `intelligence-portal-specification.md` superseded.
6. ~~Resolve the `/api/revalidate` discrepancy (L6)~~ — resolved during execution: route exists at `src/app/(website)/api/revalidate/route.ts`, properly secured; no action needed.

### Do When Convenient
1. Nonce-based CSP (M1); HSTS `preload` (L5); session binding to password hash (L2); redact emails from upstream-error logs (L4); key-auth `/v1/hermes/events` (L3).
2. SEO Sprint 2 (pillar pages, internal-linking module); author/E-E-A-T layer when byline info is available.
3. Sanity TypeGen + v5 upgrade after Next 16 stable.
4. Optional: adopt PLAID docs (vision/PRD/roadmap) if you want checkbox-tracked phases; `project_summary.md` currently serves this role adequately when kept current.

---

*This review was generated by the project-review skill. Previous reviews are preserved with date suffixes.*
