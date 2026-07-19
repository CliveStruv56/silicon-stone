# LAUNCH.md — launch-day checklist

Pre-launch packaging spec, implemented 2026-07-19. While `NEXT_PUBLIC_PRE_LAUNCH`
is unset or `true`, every product CTA is a "Request Early Access" capture into
Kit and no Lemon Squeezy checkout is invoked anywhere. This file is the ordered
checklist to flip the site live.

All flags are env vars read by `src/lib/flags.ts`; flipping any of them is a
Vercel env change + redeploy — never a code edit.

## Current state (verified on production, 2026-07-19)

- ✅ Deployed and verified live on siliconandstone.com: pre-launch CTAs
  (early-access capture, zero LS checkout links), toolkit price table,
  90-day credit copy, guarantees, Ladder box, `/products/success` both SKU
  variants, all §4 advisory changes (Exposure Diagnostic, founding rate,
  Baseline Month guarantee), unified subscribe copy, tool subscribe cards,
  footer LinkedIn placeholder.
- 🔴 **P0 — subscribe is failing in production.** `POST /api/subscribe`
  returns **503 "Newsletter service not configured"** from the Railway
  backend proxy (pre-existing — reproduced with the legacy request shape,
  not caused by this release). Every subscribe form AND the early-access
  capture depend on this endpoint. Fix one of:
  1. set the ConvertKit env vars on the **Railway backend** (its
     `/v1/subscribe` handler reports itself unconfigured), **and** teach it
     to accept + apply the new `tags: string[]` field; or
  2. remove `BACKEND_API_URL` from Vercel so the Next route's built-in Kit
     fallback (`CONVERTKIT_API_KEY` + `CONVERTKIT_FORM_ID`, already in
     Vercel per project_summary) handles subscribe + tagging directly —
     the simpler option until the backend needs to own it.
- ⏳ Everything in §0 below is owner setup that code cannot do (Kit tags,
  LS store, discount codes, booking URL, LinkedIn URL).

## Go-live quick reference (the whole process in order)

1. Fix the P0 subscribe 503 above — nothing else matters until capture works.
2. Create the 14 Kit tags, paste IDs into Vercel env (§0 Kit table).
3. Create the 3 LS products in test mode: files attached, redirect URLs to
   `/products/success?product={sku}`, checkout links + variant IDs into env (§0 LS).
4. Configure the LS webhook with `order_created` + signing secret (§0 webhook).
5. Create the `LAUNCH48` and £20/90-day discount codes; test in LS test mode (§0 discounts).
6. Set `NEXT_PUBLIC_BOOKING_URL` and the real `NEXT_PUBLIC_LINKEDIN_URL` (§0 misc).
7. Launch day: `NEXT_PUBLIC_PRE_LAUNCH=false`, set `NEXT_PUBLIC_FREE_INTRO_END`,
   redeploy (§1).
8. Verify: one real £24 purchase end-to-end, tag checks in Kit, discount codes
   apply (§2). Announce `LAUNCH48` with its 48-hour window.
9. After five retainer clients: `NEXT_PUBLIC_FOUNDING_OFFER_ACTIVE=false`.

## 0. Before launch day (prep)

### Kit (ConvertKit)

- [ ] One form only, site-wide: confirm `CONVERTKIT_FORM_ID` points at the
      single briefing form. "Atlantic Drift" is a segment tag, not a second form.
- [ ] Create these tags in Kit and put each tag's numeric ID in the matching
      env var (Vercel, all environments). A missing ID never breaks subscribe —
      that tag is just skipped:

  | Kit tag | Env var |
  |---|---|
  | early-access | `CONVERTKIT_EARLY_ACCESS_TAG_ID` |
  | tier-checklist | `CONVERTKIT_TIER_CHECKLIST_TAG_ID` |
  | tier-toolkit-standard | `CONVERTKIT_TIER_TOOLKIT_STANDARD_TAG_ID` |
  | tier-toolkit-professional | `CONVERTKIT_TIER_TOOLKIT_PROFESSIONAL_TAG_ID` |
  | tier-sector-reports | `CONVERTKIT_TIER_SECTOR_REPORTS_TAG_ID` |
  | atlantic-drift | `CONVERTKIT_ATLANTIC_DRIFT_TAG_ID` |
  | eu-exposure | `CONVERTKIT_EU_EXPOSURE_TAG_ID` |
  | tool-compliance-checker | `CONVERTKIT_TOOL_COMPLIANCE_CHECKER_TAG_ID` |
  | tool-supply-chain-mapper | `CONVERTKIT_TOOL_SUPPLY_CHAIN_MAPPER_TAG_ID` |
  | tool-scenario-modeler | `CONVERTKIT_TOOL_SCENARIO_MODELER_TAG_ID` |
  | tool-policy-stress-test | `CONVERTKIT_TOOL_POLICY_STRESS_TEST_TAG_ID` |
  | buyer-checklist | `CONVERTKIT_BUYER_CHECKLIST_TAG_ID` |
  | buyer-toolkit-standard | `CONVERTKIT_BUYER_TOOLKIT_STANDARD_TAG_ID` |
  | buyer-toolkit-pro | `CONVERTKIT_BUYER_TOOLKIT_PRO_TAG_ID` |

- [ ] If the Railway backend proxy is live (`BACKEND_API_URL` set), its
      `/v1/subscribe` handler must accept the new `tags: string[]` field and
      apply the same tag mapping — the site forwards `tags` verbatim.
- [ ] Post-purchase sequences (built in Kit, out of the site's scope) trigger
      off the three `buyer-*` tags.

### Lemon Squeezy — products

Create **three one-time products** (LS is Merchant of Record — UK/EU VAT is
handled by LS; there is deliberately no tax logic in the site):

- [ ] **AI Audit Checklist Pack — £24.** Attach the deliverable files
      (2 spreadsheets + 2 PDFs) so LS's native order email delivers them.
- [ ] **AI Act Compliance Toolkit — Standard — £79.** Attach PDF guide +
      AI Systems Register + Compliance Tracker.
- [ ] **AI Act Compliance Toolkit — Professional — £149.** Same files plus the
      30-minute video walkthrough (file or unlisted link in the delivery note).
- [ ] Set each product's **receipt / redirect ("Continue") URL**:
  - Checklist → `https://siliconandstone.com/products/success?product=checklist`
  - Toolkit Standard → `https://siliconandstone.com/products/success?product=toolkit-standard`
  - Toolkit Professional → `https://siliconandstone.com/products/success?product=toolkit-pro`
- [ ] Copy each **checkout link** into:
  - `NEXT_PUBLIC_LEMONSQUEEZY_CHECKLIST_URL`
  - `NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_STANDARD_URL`
  - `NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_PROFESSIONAL_URL`
- [ ] Copy each **variant ID** (Products → variant → ID) into:
  - `LEMONSQUEEZY_VARIANT_ID_CHECKLIST`
  - `LEMONSQUEEZY_VARIANT_ID_TOOLKIT_STANDARD`
  - `LEMONSQUEEZY_VARIANT_ID_TOOLKIT_PRO`
- [ ] Set `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_API_KEY`.

### Lemon Squeezy — webhook

- [ ] Settings → Webhooks → URL
      `https://siliconandstone.com/api/webhooks/lemonsqueezy`, events at least
      `order_created`, signing secret into `LEMONSQUEEZY_WEBHOOK_SECRET`.
      (The route verifies HMAC signatures and is idempotent; on
      `order_created` it tags the buyer in Kit by variant ID.)

### Lemon Squeezy — discount codes

LS supports discount codes natively (Store → Discounts → New discount):

- [ ] **`LAUNCH48`** — fixed amount **£70 off**, restricted to the **Toolkit
      Professional** variant only (Professional at the Standard £79 price).
      Set **start/expiry dates spanning exactly 48 hours** from the launch
      announcement. Buy links already go through LS checkout, so the code
      field is available at checkout.
- [ ] **Per-buyer £20 Toolkit credit** — fixed amount **£20 off**, restricted
      to the **Toolkit Standard and Professional** variants, **expires 90 days**
      after creation (matches the "valid 90 days" site copy). Generate the code
      (single generic code or LS "generate unique codes") and include it in the
      **Checklist Pack's delivery email/download note** so every checklist buyer
      receives it with their files.
- [ ] Test both codes apply cleanly in LS **test mode** checkout.

### Booking + misc

- [ ] Put the 25-minute-call calendar link (Cal.com/Calendly/etc.) in
      `NEXT_PUBLIC_BOOKING_URL` — the advisory enquiry form shows it
      immediately on successful submit.
- [ ] Replace the footer LinkedIn placeholder: set `NEXT_PUBLIC_LINKEDIN_URL`
      to the company/founder LinkedIn URL (falls back to
      `https://www.linkedin.com/` until set).

## 1. Launch day — flip the flags

- [ ] `NEXT_PUBLIC_PRE_LAUNCH=false` → product CTAs become Buy buttons wired to
      LS checkout (a CTA whose checkout URL is still unconfigured stays in
      early-access mode as a safety net).
- [ ] `NEXT_PUBLIC_FREE_INTRO_END=<launch date + 90 days>` (ISO, e.g.
      `2026-10-19`) — the free-intro copy self-expires after that date; or flip
      `NEXT_PUBLIC_FREE_INTRO_WINDOW=false` manually.
- [ ] Leave `NEXT_PUBLIC_FOUNDING_OFFER_ACTIVE=true` until five retainer
      clients are signed, then set it to `false`.
- [ ] Redeploy (env changes need a new deployment).

## 2. Launch day — verification

- [ ] Switch LS out of test mode. Run **one real £24 Checklist purchase**:
  - LS delivery email arrives with the right files **and the £20 code**;
  - redirect lands on `/products/success?product=checklist` showing the
    £20-credit + "£83 total vs £103" block;
  - the buyer appears in Kit tagged `buyer-checklist` (webhook worked);
  - refund the test order in LS if desired.
- [ ] Test-mode (or real) purchases of both Toolkit variants: delivery email +
      `/products/success?product=toolkit-standard|toolkit-pro` showing the
      Advisory Briefing offer + Kit tags `buyer-toolkit-standard` /
      `buyer-toolkit-pro`.
- [ ] Run a tool (e.g. Compliance Checker) to the results screen, subscribe via
      the results block, confirm the subscriber lands in Kit tagged
      `tool-compliance-checker`.
- [ ] Subscribe once each from `/atlantic-drift` and `/eu-exposure`; confirm
      the `atlantic-drift` / `eu-exposure` tags.
- [ ] `LAUNCH48` announced with its 48-hour window; verify it applies at
      checkout on Professional.

## 3. Optional Plausible goals (new events fired by this release)

`Early Access Request` · `Tool Results Subscribe` · `EU Exposure Signup`
(existing goals unchanged; create these in Plausible if you want them tracked —
names are exact, with spaces).
