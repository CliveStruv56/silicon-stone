# Silicon & Stone Mobile PWA — Phased Engineering Build Spec (Phases 0–3)

## How to read this spec

This turns the mobile-first UX component checklist (see companion doc *Mobile PWA: Teardown, Audit & Build Checklist*) into an engineering build spec for the **siliconandstone.com** stack as observed: **Next.js (App Router) + Sanity CMS + Plausible**, self-hosted fonts via `next/font`, dark mode already implemented.

**Phase goals**
- **Phase 0 — Installable Foundation:** the site becomes an installable, offline-capable PWA. Nothing user-facing changes much; the plumbing lands.
- **Phase 1 — App Shell:** the installed experience feels native (bottom tab bar, safe areas, filter sheet).
- **Phase 2 — Reading Product:** the best long-form phone reading experience among the peers (progress, Listen, offline save).
- **Phase 3 — Ladder & Monetisation:** the Read → Use → Buy → Engage gates, checkout, restrained push, and the paid Intelligence Series.

**Ticket format:** each ticket has an ID (`P{phase}-{n}`), a size, dependencies, scope, testable acceptance criteria (AC), and implementation notes.

**Size legend (rough, one engineer, not a delivery commitment):** `S` ≤ 1 day · `M` 2–3 days · `L` 4–5 days · `XL` > 1 week. Estimates are for sequencing sanity only — per your standing instruction, ordering is dependency-driven and quality-first, not date-driven.

**Global Definition of Done (applies to every ticket):**
1. All AC met and demoable.
2. Works in a normal browser tab **and** in installed standalone mode.
3. Verified on iOS Safari **and** Android Chrome (the two that matter for this audience).
4. Passes the three cross-cutting gates (Accessibility, Performance, Analytics) defined in the next section — no regressions.
5. No new cumulative layout shift; no console errors; feature-flagged where rollout is risky.

## Cross-cutting engineering standards (apply to every phase)

These three tracks are not a final phase — they are acceptance gates on every ticket. Defined once here; referenced as "meets X-A11y / X-Perf / X-Analytics" throughout.

### X-A11y — Accessibility (WCAG 2.2 AA)
- Contrast ≥ 4.5:1 body / ≥ 3:1 large text — **explicitly re-verify amber-on-dark and teal-on-paper**, the two brand combos most at risk.
- Full keyboard operability; visible `:focus-visible` states; correct semantics (`<main>`, `<article>`, `<nav>`, roles, `aria-current`, `aria-expanded`).
- Respect `prefers-reduced-motion` for every animation (header condense, sheets, progress).
- Honour dynamic type / user font-scaling; content reflows at 320px width and 200% zoom with no loss (WCAG 1.4.10).
- Any audio (Listen) ships a transcript or captions.
- **Gate:** automated `axe` scan clean on new components + one manual screen-reader pass (VoiceOver + TalkBack) per phase.

### X-Perf — Core Web Vitals budgets
- Targets on a **mid-range Android over 4G**: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- App-shell cached so repeat/offline loads are near-instant.
- Images AVIF/WebP with responsive `srcset`, lazy-loaded below the fold; Sanity image CDN params tuned.
- Fonts: `font-display: swap`, subset, preloaded (already self-hosting via `next/font`).
- Skeleton loaders for feed and article to mask latency.
- **Gate:** Lighthouse CI performance budget not regressed by the ticket; field CWV monitored.

### X-Analytics — Plausible instrumentation
- Every meaningful interaction emits a Plausible custom event; ladder steps are registered **goals**: `install`, `email_capture`, `tool_start`, `tool_complete`, `product_view`, `product_purchase`, `call_booked`, `series_unlock`, `push_optin`, `offline_read`, `article_listen`.
- Assemble a **Read → Use → Buy → Engage funnel** view to see where mobile drops off.
- **Gate:** new interactions in the ticket fire their event and appear in Plausible before the ticket closes.

## Phase 0 — Installable Foundation

**Goal:** siliconandstone.com is installable and offline-capable. This phase is a hard prerequisite for offline reading (Phase 2) and push (Phase 3).

| ID | Ticket | Size | Depends on |
|----|--------|------|-----------|
| P0-1 | Web App Manifest | S | — |
| P0-2 | Icon, splash & theme-color assets | M | P0-1 |
| P0-3 | Service worker + build integration | M | — |
| P0-4 | Runtime caching strategies | M | P0-3 |
| P0-5 | Custom install-prompt UX | M | P0-1, P0-2 |
| P0-6 | HTTPS headers + Lighthouse PWA CI gate | S | P0-1→P0-4 |

---

**P0-1 · Web App Manifest** — *Size: S · Deps: none*
Scope: Add `app/manifest.ts` (`MetadataRoute.Manifest`) with `name`, `short_name` (≤ 12 chars, e.g. "S&S"), `description`, `start_url` (`/?source=pwa`), `scope: "/"`, `display: "standalone"`, `orientation: "portrait"`, `background_color`, `theme_color`, `id`, `categories`, and **app shortcuts** (Intelligence, Tools, Saved).
Acceptance criteria:
- Manifest served and valid; Chrome DevTools → Application → Manifest shows no errors.
- Long-press on the installed icon surfaces the shortcuts and they deep-link correctly.
- `scope` covers the whole site; `start_url` carries a `source=pwa` param visible in Plausible.
Notes: App Router serves this at `/manifest.webmanifest` automatically — no static file needed.

**P0-2 · Icon, splash & theme-color assets** — *Size: M · Deps: P0-1*
Scope: Produce maskable icons (192, 512, plus `purpose: "maskable"` variants), `apple-touch-icon` (180), iOS splash screens, and light/dark `theme_color` via the Next `viewport` export (`themeColor` array with `media` queries).
Acceptance criteria:
- Icons pass the maskable safe-zone check (no clipping of the S&S mark).
- iOS home-screen icon renders correctly (no default screenshot fallback).
- Installed status bar / chrome uses the brand `theme-color` and switches with light/dark.
- No 404s for any icon/splash asset.
Notes: reuse the existing SVG mark; export raster sizes from it. iOS ignores manifest icons for A2HS — the `apple-touch-icon` link is required.

**P0-3 · Service worker + build integration** — *Size: M · Deps: none*
Scope: Adopt **Serwist (`@serwist/next`)** — the maintained App-Router-friendly successor to `next-pwa` (fallback: `next-pwa` if Serwist blocked). Register the SW, precache the app shell, set an update strategy (`skipWaiting` + `clientsClaim` with a user "refresh to update" prompt), and disable SW in development.
Acceptance criteria:
- SW registers in production only; `next dev` unaffected.
- Build emits a precache manifest for the shell.
- With network disabled, a previously visited route returns the app shell (not the browser dinosaur).
- A new deploy updates the SW cleanly — no stale-forever cache; user sees an update affordance.
Notes: keep RSC/data responses out of aggressive precache to avoid serving stale personalised content.

**P0-4 · Runtime caching strategies** — *Size: M · Deps: P0-3*
Scope: Define Workbox runtime routes: static assets & fonts `CacheFirst` (long TTL); Sanity images (`cdn.sanity.io`) `StaleWhileRevalidate` with expiration cap; Next data/RSC & GROQ/API `NetworkFirst` with short timeout; never cache authenticated/personalised responses.
Acceptance criteria:
- Repeat visits serve static assets and Sanity images from cache (verified in DevTools).
- Cache size is bounded (expiration plugin) — no unbounded growth.
- No personalised/authenticated payloads are cached.
- Confirm the exact Sanity CDN host allowlist before shipping.

**P0-5 · Custom install-prompt UX** — *Size: M · Deps: P0-1, P0-2*
Scope: Capture `beforeinstallprompt`, defer it, and show a branded "Add to Home Screen" card **after a value threshold** (e.g. 2nd session or first completed article read). Provide an iOS Safari fallback (manual A2HS instructions — iOS has no `beforeinstallprompt`).
Acceptance criteria:
- Prompt never fires on first load.
- Branded UI shows; "Add" triggers the native prompt on supported browsers.
- iOS shows a manual share-sheet → Add-to-Home-Screen hint.
- Dismissal is remembered (localStorage); user is not re-nagged within a sensible window.
- Fires `install` goal (meets X-Analytics).

**P0-6 · HTTPS headers + Lighthouse PWA CI gate** — *Size: S · Deps: P0-1→P0-4*
Scope: Confirm HTTPS + security headers; add Lighthouse CI (or Unlighthouse) to the pipeline asserting installability + offline.
Acceptance criteria:
- CI fails if manifest, SW registration, or installability regress.
- A Lighthouse report artifact is stored per build.
- Baseline PWA + installable checks are green.

## Phase 1 — App Shell (native feel)

**Goal:** the mobile experience feels native, not like a bookmarked page. **Decision (11 Jul):** the bottom tab bar is **mobile-only** — desktop keeps the existing top nav.

| ID | Ticket | Size | Depends on |
|----|--------|------|-----------|
| P1-1 | Responsive shell + standalone niceties | M | P0-1 |
| P1-2 | Bottom tab bar (mobile viewports) | M | P1-1 |
| P1-3 | Safe-area insets | S | P1-2 |
| P1-4 | Condensing sticky header + back affordance | M | P1-1 |
| P1-5 | Intelligence filter bottom-sheet | L | — |

---

**P1-1 · Responsive shell + standalone niceties** — *Size: M · Deps: P0-1*
Scope: A responsive shell that renders the **bottom tab bar on mobile viewports** (e.g. < 768px) and the **existing top nav on desktop**. Separately detect installed/standalone (`matchMedia('(display-mode: standalone)')` + iOS `navigator.standalone`) to suppress the redundant install prompt and polish browser-style chrome. Prefer CSS media queries (`@media (max-width…)` and `@media (display-mode: standalone)`) to avoid hydration flash; JS only where CSS can't reach.
Acceptance criteria:
- On desktop the current top nav is unchanged; no bottom bar.
- On mobile (browser **or** installed) the bottom tab bar renders and the top nav collapses to the condensed header.
- No hydration mismatch / no flash of the wrong chrome on first paint.
- Meets X-A11y, X-Perf.
Notes: the bar is gated by **viewport (mobile)**, not by install state — it shows on mobile web as well as installed. Standalone detection is only for prompt suppression + chrome polish.

**P1-2 · Bottom tab bar (mobile viewports)** — *Size: M · Deps: P1-1*
Scope: Five-tab bar — Home · Intelligence (\"Read\") · Tools · Saved · Account — shown at mobile breakpoints, wired to App Router with per-tab scroll restoration.
Acceptance criteria:
- Present at mobile breakpoints; absent on desktop.
- Active tab reflects the current route; `aria-current` set.
- Tapping navigates; back/forward keeps state; scroll position restored per tab.
- Correct styling in light and dark; keyboard + screen-reader operable.

**P1-3 · Safe-area insets** — *Size: S · Deps: P1-2*
Scope: Apply `env(safe-area-inset-*)` to tab bar, sticky header, and sheets; set `viewport-fit=cover`.
Acceptance criteria:
- On notch / home-indicator devices nothing is clipped or obscured.
- Verified iOS Safari + Android Chrome, portrait and landscape.

**P1-4 · Condensing sticky header + back affordance** — *Size: M · Deps: P1-1*
Scope: Shrink/hide-on-scroll top bar; back affordance on detail routes (article, product).
Acceptance criteria:
- Header condenses at 60fps with no layout shift (CLS ≈ 0).
- Back returns to the previous route and its prior scroll position.
- Respects `prefers-reduced-motion` (no motion → instant state change).

**P1-5 · Intelligence filter bottom-sheet** — *Size: L · Deps: none (parallelisable)*
Scope: Replace the stacked Topic/Tier/Perspective pills with a compact \"Filters\" trigger opening an accessible bottom sheet. Selections reflect into **URL query params** so filtered views are shareable and SSR-filterable.
Acceptance criteria:
- Sheet is focus-trapped, dismissible by scrim tap / swipe-down / Esc, and returns focus to the trigger.
- Filters update the list **and** the URL; deep-linking a filtered URL renders the filtered list server-side.
- Works against the cached list when offline (post-Phase-2).
- Persona filter maps to all five personas (Sofia, Ian, Clara, Global Citizen, Troy).
- Meets X-A11y, X-Analytics (filter-use event).

## Phase 2 — Reading Product

**Goal:** the best long-form phone reading experience among the peers. **Decisions (11 Jul):** Listen is **deferred**; offline is **device-local only** (no accounts → no cross-device sync), which drops P2-4 from XL to L.

| ID | Ticket | Size | Depends on |
|----|--------|------|-----------|
| P2-1 | Reading-progress indicator | S | P1-4 |
| P2-2 | Portrait body typography + text-size stepper | M | — |
| P2-3 | Listen / audio narration | — | **Deferred** |
| P2-4 | Save-for-later + offline article store (device-local) | L | P0-3, P0-4 |
| P2-5 | Offline state UI + fallback route | M | P2-4 |
| P2-6 | Offline action queue (retry on reconnect) | S | P2-4 |

---

**P2-1 · Reading-progress indicator** — *Size: S · Deps: P1-4*
Scope: Thin progress bar bound to article scroll depth.
Acceptance criteria:
- Accurate 0–100%; present only on article routes; hidden elsewhere.
- No jank on scroll; respects `prefers-reduced-motion`.

**P2-2 · Portrait body typography + text-size stepper** — *Size: M · Deps: none*
Scope: Tune body to 17–19px / line-height 1.5–1.65 / measure ~60–66ch; verify the display serif masthead vs the body face at 360–414px; add an A− / A / A+ text-size stepper persisted per device.
Acceptance criteria:
- Measured line length within range at common widths; no horizontal overflow.
- Stepper changes persist across sessions (localStorage).
- Reflow at 320px and 200% zoom passes (X-A11y).
Notes: peer benchmark — the FT re-engineered its face for narrow portrait (lower x-height, raised ascenders). Keep the serif for the masthead; confirm the body face survives a 390px column.

**P2-3 · Listen / audio narration** — ***DEFERRED (decision 11 Jul)***
Not being built now. Parked in the backlog. When revisited, decide **human recording vs TTS** — that choice drives the Sanity schema (an audio asset field vs a generated-audio pipeline) and the production workflow. Nothing else in Phase 2 depended on it, so deferring it removes scope cleanly with no knock-on.

**P2-4 · Save-for-later + offline article store (device-local)** — *Size: L (was XL) · Deps: P0-3, P0-4*
Scope: Bookmark action that persists the full article payload (Portable Text + referenced images) to **IndexedDB (via `idb`)**; the Saved tab lists offline-available items; associated images cached via the Cache API. **Device-local only — no cross-device sync, no server round-trip (no accounts).**
Acceptance criteria:
- Saving an article makes it **fully readable with the network disabled** (text + images).
- Saved list shows an \"Offline\" badge per item; unsave purges the cached payload.
- Storage quota handled gracefully (eviction messaging; no silent failure).
- Entirely on-device — **no account required**.
- Fires `offline_read` when a saved article is opened offline.
Notes: dropping cross-device sync (the no-auth decision) is exactly what takes this from XL to L. Store the rendered content model, not the live route, so reads never depend on network GROQ.

**P2-5 · Offline state UI + fallback route** — *Size: M · Deps: P2-4*
Scope: Global online/offline detection; non-blocking offline banner; a branded offline fallback page listing saved/available content.
Acceptance criteria:
- Going offline shows a non-blocking banner.
- Navigating to an uncached route shows a branded offline page linking to saved items (not a browser error).
- Reconnecting clears the state automatically.

**P2-6 · Offline action queue (retry on reconnect)** — *Size: S (was M) · Deps: P2-4*
Scope: Queue genuinely outbound offline submissions (Atlantic Drift signup; any tool-result submission) and flush on reconnect via Background Sync; immediate-write fallback where unsupported (Safari/iOS).
Acceptance criteria:
- Offline form submissions persist and send on reconnect; no duplicates.
- Graceful fallback when Background Sync is unavailable.
Notes: scope shrank (S) — with device-local saves there is no \"sync saved items to a server.\" This ticket now covers only true outbound submissions. Background Sync is Chromium-only, so the immediate-write fallback is mandatory for the iOS audience.

## Phase 3 — Ladder & Monetisation

**Goal:** the Read → Use → Buy → Engage gates, mobile checkout, restrained push, and the paid Intelligence Series. Free reading is never blocked. **Decisions (11 Jul):** payments run through **Lemon Squeezy** (Merchant of Record — it handles VAT/tax, receipts, and wallet payments), which is **not yet set up** (P3-0 stands it up). There are **no user accounts**, so paid content uses a **mix**: (A) buy → email/download delivery like the current products, and (B) on-site preview-then-unlock via a Lemon Squeezy **licence key** stored on-device.

| ID | Ticket | Size | Depends on |
|----|--------|------|-----------|
| P3-0 | Lemon Squeezy store + webhook setup | M | — |
| P3-1 | Reusable Gate component (3 modes) | L | — |
| P3-2 | In-read email capture (Atlantic Drift) | M | P3-1 |
| P3-3 | Contextual product upsell | M | P3-1, P3-0 |
| P3-4 | Lemon Squeezy checkout + fulfilment | L | P3-0 |
| P3-5 | Paid content: download + licence-key unlock (mix) | L | P3-1, P3-4 |
| P3-6 | Restrained Web Push (2 topics) | L | P0-3 |

---

**P3-0 · Lemon Squeezy store + webhook setup** — *Size: M · Deps: none (start early)*
Scope: Stand up the Lemon Squeezy store (currently not set up): create products/variants for the live £24 / £79 products and the Intelligence Series; generate an API key; configure a **signed webhook** endpoint as a Next route handler (`order_created`, subscription events, `license_key_created`); wire test mode.
Acceptance criteria:
- Products/variants exist in LS (test **and** live).
- The webhook endpoint verifies signatures and is idempotent (safe on retries).
- A test order triggers the webhook and is handled/logged.
- The API key is a server-side env secret, never client-exposed.
Notes: no PWA dependency — can start on day one, parallel to Phase 0.

**P3-1 · Reusable Gate component (3 modes)** — *Size: L · Deps: none*
Scope: One component, three modes — **email capture** (soft), **commerce/unlock** (paid), **lead** (book a call). Mode, trigger point, and copy driven by Sanity metadata. The unlock mode drives the licence-key flow in P3-5.
Acceptance criteria:
- A single component renders all three modes from data.
- Mode + copy come from Sanity; no hard-coded per-article gates.
- Fires an impression + interaction event per mode (X-Analytics).
- **Free articles are never blocked by any mode.**

**P3-2 · In-read email capture (Atlantic Drift)** — *Size: M · Deps: P3-1*
Scope: Surface the Atlantic Drift capture **after value** (scroll threshold / article end), never as an entry wall; integrate the existing email provider; suppress for people who've already subscribed.
Acceptance criteria:
- Capture appears post-value only; not on entry.
- Submit adds the contact to the list; success state shown.
- Not re-prompted once dismissed/subscribed — suppressed via a localStorage/cookie flag + provider-side dedupe (**no account to key off**).
- GDPR consent copy present; fires `email_capture`.

**P3-3 · Contextual product upsell** — *Size: M · Deps: P3-1, P3-0*
Scope: Map article topic → relevant Product / Sector Report (relation managed in Sanity); render an end-of-article upsell that opens the **Lemon Squeezy checkout overlay (Lemon.js)**.
Acceptance criteria:
- The relevant product shows per article topic; sensible default when no mapping exists.
- Click opens the LS checkout overlay; fires `product_view`.
- Editors can set the mapping in Sanity without a deploy.

**P3-4 · Lemon Squeezy checkout + fulfilment** — *Size: L · Deps: P3-0*
Scope: Integrate the **Lemon.js overlay checkout** (hosted by LS as Merchant of Record — VAT, receipts, and Apple Pay / Google Pay handled by LS). Fulfilment is driven by the P3-0 webhook: deliver a file/download link by email (Model A) and/or issue a licence key (Model B).
Acceptance criteria:
- Checkout overlay opens from a product/upsell and completes a purchase.
- LS (MoR) handles tax and emails the receipt.
- **Verify Apple Pay / Google Pay are enabled in the LS checkout** (LS-dashboard/plan-dependent — confirm; this replaces the earlier custom Payment-Request-API plan).
- On success, webhook fulfilment runs: Model-A products deliver a download link; Model-B products issue a licence key.
- No card data touches our servers.
- Fires `product_purchase`.

**P3-5 · Paid content: download + licence-key unlock (the \"mix\")** — *Size: L (was XL) · Deps: P3-1, P3-4*
Scope: Implement both delivery models per the decision:
- **Model A — download delivery:** Sector Reports / PDFs, bought → emailed/downloadable artefact (reuses P3-4 fulfilment). No on-site gate.
- **Model B — on-site unlock, no login:** Series pieces show a preview, then unlock via a Lemon Squeezy **licence key**. A post-checkout redirect carries the key (auto-activate) or the reader pastes it; validate/activate against the LS **Licence API** (`/v1/licenses/validate` + `/activate`); store the entitlement token in **localStorage/IndexedDB** (device-local). Full content is served from a **server route that re-validates the key per request**, so a non-entitled client never receives the full text.
Acceptance criteria:
- Model A: purchase delivers the artefact by email/download; nothing gated on-site.
- Model B: non-entitled readers see the configured preview + gate; a valid licence key unlocks full content on that device.
- Full paid text is **never** shipped to a client without a valid key (server-side re-validation, not client-side hiding).
- Activations are **capped** (limits casual key-sharing); expiry honoured; a gift / extra-seat path works (buy grants N activations, or buy-as-gift emails a key to a recipient).
- Fires `series_unlock`; gate copy is action-oriented (Economist A/B lesson).
Notes: with no accounts, the licence key is a **bearer credential** — acceptable for this content tier; mitigate sharing with activation caps + per-request server validation. Building on Lemon Squeezy's native licence keys (rather than a bespoke auth + entitlement backend) is what tightens this from XL to L.

**P3-6 · Restrained Web Push (2 topics)** — *Size: L · Deps: P0-3*
Scope: VAPID setup; SW `push` + `notificationclick` handlers; opt-in requested **after value**; exactly two topics — AI Act deadline alerts + new Audit-tier Deep Dives — with per-topic preferences and unsubscribe.
Acceptance criteria:
- Permission requested post-value only, never on first load.
- Subscribing stores the endpoint; server can send either topic; notification click deep-links correctly.
- Per-topic preferences + unsubscribe work.
- **iOS caveat documented & tested:** web push on iOS (16.4+) requires the PWA be installed to the Home Screen — set expectations in the opt-in copy.
- Fires `push_optin`.
Notes: with no accounts, push subscriptions are keyed to the device endpoint, not a user — fine for these two broadcast-style topics.

## Sequencing, critical path & parallelism

**Dependency-driven order (not a schedule). Updated for the 11 Jul decisions — both former XL tickets are now L, so the critical path is shorter.**

1. **Phase 0 is the critical-path root.** P0-3 (service worker) unblocks all offline (P2-4/5/6) and push (P3-6). Do P0-1 → P0-2 → P0-3 → P0-4 first; P0-5 and P0-6 follow.
2. **P3-0 (Lemon Squeezy setup) has no dependency — start it early, in parallel with Phase 0/1.** It unblocks P3-3, P3-4 and P3-5, and \"not yet set up\" means it's on the critical path for all monetisation, so front-load it.
3. **Phase 1** can start once P0-1 exists. P1-1 (responsive shell) gates P1-2 (bottom bar) → P1-3 (safe areas). **P1-5 (filter sheet) has no PWA dependency and can run in parallel from day one.**
4. **Phase 2** reading polish (P2-1, P2-2) has no offline dependency and can overlap Phase 1. **P2-3 (Listen) is deferred — removed from the path.** P2-4 (offline store, now **L**, device-local) needs P0-3/P0-4; P2-5 and P2-6 (now S) chain off it.
5. **Phase 3** gating: P3-1 (gate component) unblocks P3-2/P3-3. P3-4 (checkout) needs P3-0. **P3-5 (paid content, now L)** needs P3-1 + P3-4. P3-6 (push) only needs P0-3, so it can land any time after Phase 0.

**Suggested parallel tracks (two engineers):**
- *Track A (platform):* P0-1→P0-6 → P2-4→P2-6 → P3-6.
- *Track B (product/UI + commerce):* P3-0 + P1-5 (both early) → P1-1→P1-4 → P2-1, P2-2 → P3-1→P3-5.

**What changed the shape:** deferring Listen removed an L; device-local offline took P2-4 from XL→L; Lemon Squeezy licence keys took P3-5 from XL→L. The remaining long poles are P2-4 (offline store) and P3-5 (paid-content mix) — both now L, both well-scoped.

**Ship boundaries:** each phase is independently shippable. Phase 0 alone is a legitimate release (\"S&S is now installable\"); don't hold it behind later phases.

## Confirmed decisions, assumptions & residual risks

**Confirmed decisions (11 Jul 2026) — the five open questions are now closed:**
1. **Payments:** Lemon Squeezy (Merchant of Record), **not yet set up** → P3-0 stands up the store, checkout and webhooks. LS handles VAT/tax, receipts, and wallet payments.
2. **No client auth → simple purchases.** Consequences: offline reading is **device-local** (no cross-device sync); paid content uses a **mix** of download-delivery and on-device licence-key unlock; email/push suppression keys off localStorage/cookies + provider, not a user record.
3. **Listen/audio: deferred.** P2-3 parked; revisit human-vs-TTS later.
4. **Sanity image CDN:** allowlist **`cdn.sanity.io`** in the service worker (P0-4).
5. **Bottom tab bar:** **mobile viewports only**; desktop keeps the top nav (P1-1/P1-2).
6. **Paid content model:** **mix** of (A) buy → email/download and (B) on-site preview→licence-key unlock (P3-5).

**Assumptions**
- Stack is Next.js App Router + Sanity + Plausible with `next/font` self-hosting and existing dark mode (confirmed by live audit of the `<head>`), plus Lemon Squeezy for payments.
- The four tools and the £24/£79 products are live and self-serve; this spec adds the mobile surfaces + the LS checkout, not a new commerce backend.

**Residual risks / watch-items**
- **Verify Apple Pay / Google Pay are available inside the Lemon Squeezy checkout** (dashboard/plan-dependent) — the wallet-payment AC in P3-4 hinges on this.
- **Licence keys are bearer credentials** (no accounts): cap activations, validate server-side per request, and accept some sharing as a tolerable cost of the no-login simplicity.
- **iOS is the constraint surface:** web push requires an installed PWA (16.4+); Background Sync is unsupported → the P2-6 immediate-write fallback is mandatory.
- **Service-worker staleness** (P0-3 update strategy + visible \"refresh to update\") and **cache correctness** (never cache personalised/paid content) are load-bearing.
- **Entitlement leakage** (P3-5): full paid text must be served only after server-side key re-validation.

**Explicitly out of scope:** visual redlines / a full design-token spec, the narration workflow (deferred), any user-account system, and native app-store wrappers. Natural follow-ups if wanted.
