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
  90-day credit copy, Ladder box, `/products/success` both SKU
  variants, all §4 advisory changes (Exposure Diagnostic, founding rate,
  Baseline Month guarantee), unified subscribe copy, tool subscribe cards,
  footer LinkedIn placeholder.
  > **Superseded 2026-09-04:** this line used to include "guarantees". Every
  > refund promise was withdrawn that day — the 30-day money-back note under the
  > product CTAs and the Exposure Diagnostic's revision-or-50%-refund clause —
  > and `GuaranteeNote.tsx` was deleted with the `guaranteeNote` field, so the
  > promise cannot come back by accident. The **Baseline Month guarantee** on the
  > Drift Retainer is a different thing and deliberately survives.
- ✅ **P0 RESOLVED 2026-08-20 — the Kit key is valid and capture works.**
  The owner swapped the key; verified the same day against Kit's own API with a
  read-only `GET /v4/account` (creates nothing, touches no list): **HTTP 200**,
  account "SIlicon and Stone", key is 36 chars with the `kit_` prefix. The
  22-character legacy v3 key that had been in place for 142 days is gone.
  **No redeploy was needed** — this project reads env at request time.
  *Not yet proven end to end:* nobody has run a live `POST /api/subscribe`,
  because that puts a real subscriber on the list. The parts are verified; the
  whole path is not. History of the failure, kept because it explains the code
  shape:

- 🟠 ~~P0 nearly resolved — one owner step left (invalid Kit API key).~~
  Production subscribe was 503ing via the unconfigured Railway proxy. Code
  fix shipped and verified live: the subscribe route now posts **directly
  to Kit** and only proxies to Railway when `SUBSCRIBE_VIA_BACKEND=true`
  (`BACKEND_API_URL` stays in Vercel untouched — it also powers usage
  tracking, deep research, and the contact proxy). The direct path now
  fails with **Kit 401 "The API key is invalid"** (Vercel runtime logs,
  2026-07-19) — the stored `CONVERTKIT_API_KEY` is likely a legacy v3 key;
  `api.kit.com/v4` needs a **v4 API key**.
  **Owner fix:** Kit app → Settings → Developer → API Keys → create/copy
  the **v4 API Key** → Vercel → silicon-stone → Settings → Environment
  Variables → update `CONVERTKIT_API_KEY` (Production) → redeploy. Then
  verify: `POST /api/subscribe` with a test email returns
  `{"success":true}` and the subscriber appears in Kit.
  To hand subscribe back to the backend later: configure ConvertKit there,
  add `tags: string[]` support to its `/v1/subscribe`, then set
  `SUBSCRIBE_VIA_BACKEND=true`.
- ⏳ Everything in §0 below is owner setup that code cannot do (Kit tags,
  LS store, discount codes, booking URL, LinkedIn URL).

- 🟠 **Three Kit findings from the 2026-08-20 verification. The first is now
  closed; two remain open.**
  Read-only reconciliation of the live Kit account against production env:
  1. ~~**The form ID may be the wrong form.**~~ **Settled 2026-08-24: it is the
     right form, and it is the only one.** `CONVERTKIT_FORM_ID = 9270944` was
     named "Mills form", which read like a leftover from something unrelated;
     the August audit also reported a `9266701` "Newsletter site", which no
     longer exists in the account. With one form present, that form is the
     site's, and a live enquiry has since been proven to land in it with every
     custom field populated. **The owner renamed it "Silicon and Stone
     Briefing".** Renaming does not change the form ID, so `9270944` stays
     correct and nothing was redeployed. Do not create a second form: the
     architecture is one form site-wide, and every audience distinction is a
     tag.
  2. **Two env vars hold literal placeholder text**, not IDs:
     `CONVERTKIT_TOOL_LEAD_TAG_ID` = `your_tool_lead_tag_id` and
     `CONVERTKIT_WAYMARKPATH_TAG_ID` = `your_waymarkpath_tag_id`.
  3. **None of the launch tags exist yet, at either end.** The Kit account
     holds exactly two tags — "New contact" and "Imported March 31st, 2026" —
     and production defines four Kit ID variables against the ~18 that
     `src/lib/kit.ts` maps. So the §0 table below is not a paste job: the tags
     have to be created in Kit first. Subscribes still succeed (a missing ID is
     skipped by design); they simply arrive untagged, and no segmentation
     happens.

- 🟠 **The Kit sending address is unverified.** `clive.struver@gmail.com` has
  status **pending**, and its `from_name` is the raw email address. Subscribing
  over the API is unaffected, but a broadcast cannot be sent from an unverified
  address, and a newsletter arriving from a gmail address with no from-name is a
  deliverability and presentation problem. Fix before the first send, not after.

**Re-verified 2026-08-05** (no owner steps taken since; step 1 still blocks the
other eight):

- Pre-launch state unchanged and correct — `/products/ai-act-toolkit` serves
  8× "Request Early Access" and zero checkout links.
- `NEXT_PUBLIC_BOOKING_URL` still unset: `/advisory` shows the "Book a
  25-minute conversation" CTA with no calendar link behind it.
- Plausible **is** live (`script.tagged-events.js` served on production).
- The product files in §0 are **already built** — see the paths added below.
- ~~The Kit 401 has not been re-tested since 2026-07-19~~ — re-tested and
  **resolved 2026-08-20**, see above.

## Go-live quick reference (the whole process in order)

1. ~~Fix the P0 above: set a valid **Kit v4 API key**~~ — **done 2026-08-20.**
   Optional last step: one live `POST /api/subscribe` with a throwaway address,
   then delete the subscriber, to prove the whole path rather than its parts.
2. ~~Confirm `CONVERTKIT_FORM_ID` is the intended form~~ — **done 2026-08-24**,
   it is the only form and is now named "Silicon and Stone Briefing". Remaining:
   create the 14 Kit tags and paste IDs into Vercel env (§0 Kit table). **The
   tags do not exist in Kit yet**; creating them is the whole of this step.
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

- [x] **One form only, site-wide — settled 2026-08-24.**
      `CONVERTKIT_FORM_ID = 9270944` is the account's only form, renamed by the
      owner from "Mills form" to **"Silicon and Stone Briefing"**. The
      `9266701` "Newsletter site" reported by the August audit no longer exists.
      Renaming leaves the ID untouched, so no env change and no redeploy.
      A live enquiry has been proven to land in it with all four custom fields
      populated. "Atlantic Drift" is a segment tag, not a second form — **do not
      create another form**; every audience distinction here is a tag.
- [ ] Check that form's own settings before real traffic, since they apply to
      every subscriber the site creates: double opt-in vs single (it decides
      whether people are active immediately and what the welcome sequence
      triggers on), the incentive/confirmation email (Kit's default carries Kit's
      wording and branding), and any redirect — the site handles its own success
      states, so one set here is redundant at best.
- [ ] Create these tags in Kit and put each tag's numeric ID in the matching
      env var (Vercel, all environments). A missing ID never breaks subscribe —
      that tag is just skipped:

  **Status 2026-08-20: none of these tags exist in Kit.** The account holds
  only "New contact" and "Imported March 31st, 2026", and four of the env vars
  below are set (two of those to placeholder strings). Create the tag, then
  paste its ID.

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

The files are **already built** and live in `deliverables/dist/` (gitignored —
regenerate with `deliverables/src/assemble-toolkit.mjs` and
`build-spreadsheets.mjs`; the sources are committed):

- [ ] **AI Audit Checklist Pack — £24.** Attach `Quick Compliance Gap
      Analysis.pdf`, `Board-Ready Risk Summary.pdf`, `Vendor Dependency
      Scorecard.xlsx`, `AI Systems Inventory Template.xlsx` (the 2 PDFs +
      2 spreadsheets) so LS's native order email delivers them.
- [ ] **AI Act Compliance Toolkit — Standard — £79.** Attach `AI Act Compliance
      Toolkit.pdf` + `AI Systems Register.xlsx` + `Compliance Tracker.xlsx`.
- [ ] **AI Act Compliance Toolkit — Professional — £275.** Same three files plus
      the 30-minute video walkthrough — **not yet recorded**; this is the only
      product asset still missing (file or unlisted link in the delivery note).
- [ ] Set each product's **receipt / redirect ("Continue") URL**. Use the **bare
      apex** — `src/lib/site.ts` makes the apex canonical and `www` 308s to it
      (reversed from the June decision on 2026-08-06), so a `www` URL adds a
      redirect hop through the payment callback:
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

### Sanity — the in-article commerce gate

The env vars above only light up the three **product pages**. The end-of-article
gate is a *second* surface with its own source of truth: the `product` documents
in Sanity. It already renders a commerce upsell on most published articles (the
`auto` mode matches an article's categories against a product's `topics`), but
with `checkoutUrl` blank it links to the product page rather than to checkout —
one extra click between a reader and a payment.

- [ ] In Studio → Products, paste the same three checkout links into
      **Lemon Squeezy checkout URL** on the matching document:
  - `product-ai-audit-checklist` ← the checklist link
  - `product-ai-act-toolkit` ← the **Standard** link (the gate advertises
    "From £79", so Standard is the right target)
  - `product-sector-reports` — leave blank until the reports exist. Its
    `topics` were **deliberately cleared on 2026-08-15** so the automatic
    upsell can never select it: with topics set, three published articles
    advertised "Get it — From £39" for a product whose page is a waitlist.
    **Restore `semiconductors`, `us-technopolitics` and `atlantic-drift` when
    the first sector report is actually on sale** — until then those articles
    correctly fall back to the newsletter gate.
- [ ] **Do not retype a `priceLabel` in Studio.** `npm run test:sanity-prices`
      fails CI when a published product document's `priceLabel`, `name` or
      `productPath` disagrees with `SANITY_PRODUCTS` in `src/lib/offering.ts`.
      A price change is two edits, in this order: `AMOUNTS` in the catalogue
      (which moves every page at once), then the matching Studio document.
- [ ] `lemonVariantId` is only read for Model-B on-site unlock. All three
      products are `deliveryModel: download`, so leave it blank.
- [x] ~~Four published articles have no categories and fall back to the
      newsletter gate.~~ **Done — verified 2026-08-20.** All four now carry two
      or three categories, and no published article has an empty `categories`.
      `eu-ai-act-compliance-chasm-august-2026` is tagged `ai-act` +
      `european-sovereignty`, so the flagship piece does now intersect the
      toolkit's topics. Kept for the rule, which still holds: an article only
      gets a commerce gate if its `categories` intersect a product's `topics`.

### Sanity webhooks — the config that lives nowhere in this repo

**Three webhooks make the site work, and all three exist only in the Sanity
dashboard.** Nothing in the repo provisions or verifies them, and nothing fails
if they are missing — a fresh environment publishes articles that are never
indexed, never audited and never announced, silently. This section is the only
record.

Sanity project → **API → Webhooks**. For each: `POST`, dataset `production`,
trigger on **create / update / publish**, and a projection that **must** include
`_id` and `_type`.

Filters differ, and the difference matters:

| Webhook | Filter |
|---|---|
| `/api/vectorize`, `/api/on-publish` | `_type == "article"` — both act on articles only |
| `/api/revalidate` | **`_type in ["article", "series"]`** |

A **series** is a published document with its own page (`/intelligence/series/<slug>`),
and that page is cached until `revalidateTag('sanity')` frees it. If the
revalidate filter is left at `_type == "article"`, editing or reordering a series
fires nothing at all: the page sits stale, indefinitely, with no error anywhere.
The route already knows what to do with a `series` payload — the filter is the
only thing standing between it and being asked.

| URL | Auth | What it does | Symptom if missing |
|---|---|---|---|
| `/api/vectorize` | header `x-sanity-webhook-secret` = `SANITY_WEBHOOK_SECRET` | Embeds the article, writes back Related Articles | No semantic search hit, no related articles, no prior-coverage on future drafts |
| `/api/on-publish` | same header, same secret | Runs the pre-publish checks server-side and records anything wrong; sends the Audit-tier push | Nothing catches a publish made outside Studio; no push ever fires |
| `/api/revalidate` | `next-sanity` **signature** (`SANITY_REVALIDATE_SECRET`) | Invalidates the home page, `/intelligence`, the article page, and — on a `series` payload — the series index and that series' page | New articles do not appear until the next deploy; series edits never appear at all |

- [ ] All three created, with the secret set in Vercel.
- [ ] ⚠ **`/api/revalidate` includes `series` in its filter.** See the table
      above. This is the one filter that is not `_type == "article"`.
- [ ] ⚠ **The projection includes `_type`.** A payload without it is the
      *delete* shape: `/api/vectorize` will treat every delivery as a request to
      remove that article's vector.
- [ ] Verify by publishing one article and checking Sanity's own delivery log —
      that log is the only place a 401/429/503 from these routes ever surfaces.

### Web Push — VAPID keys

- [ ] `npx web-push generate-vapid-keys`
- [ ] Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and
      `VAPID_SUBJECT` (a `mailto:` you own) in Vercel.
- [ ] Until these exist, `/api/push/send` and the publish notification both
      answer 503 and no reader is ever notified, whatever they subscribed to.
- [ ] Upstash must also be configured: without it the publish notification
      **deliberately refuses to send**, because the one-shot marker that stops
      a re-publish notifying twice lives there.

### Lemon Squeezy — webhook

- [ ] Settings → Webhooks → URL
      `https://siliconandstone.com/api/webhooks/lemonsqueezy` (apex, not `www`), events at least
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

### Resend — enquiry notifications

Wired 2026-08-24. Before this, an advisory enquiry went into Kit custom fields
and **nobody was emailed** — a £2,500 Exposure Diagnostic enquiry waited in a
subscriber record until someone opened Kit. `/api/contact` now emails the owner
the whole enquiry, on both the Railway-proxy and direct-to-Kit paths.

Until these three are set the feature reports `unconfigured` and skips; the form
itself is unaffected either way.

- [ ] Create a Resend account and an API key → `RESEND_API_KEY` (**sensitive**).
- [ ] Verify `siliconandstone.com` in Resend (Domains → Add). This is a
      **separate** verification from Kit's DKIM — the same domain needs both, and
      the records do not overlap.
- [ ] `ENQUIRY_NOTIFY_FROM` — an address on that verified domain, with a display
      name: `Silicon & Stone <briefing@siliconandstone.com>`. Resend rejects a
      `from` on an unverified domain, which surfaces as `failed` in the logs and
      no email.
- [ ] `ENQUIRY_NOTIFY_TO` — where enquiries land. A real monitored inbox.
- [x] **Verified end to end on production, 2026-08-24.** Both directions:
      - The failure signal fired first, unplanned — the live test hit the
        Railway 503 below and the email arrived subject-prefixed `[NOT SAVED]`
        with the full enquiry intact. That prefix is the only thing standing
        between a lost enquiry and a lost enquiry nobody noticed, and it earned
        its place on day one.
      - After the direct-to-Kit fix, a second live POST returned
        `{"success":true}` and the email arrived **without** the prefix.
- [x] **Kit custom fields confirmed present, 2026-08-24.** `company`,
      `interest`, `message` and `source` all populated on the resulting
      subscriber. Kit silently drops custom fields that do not already exist, so
      an empty `message` would have meant every enquiry was losing its body
      text. It is not. This closes the open question in the Kit section above.

The same sender is what the Compliance Checker v2 report email will use when
§22.1's retention decision is settled. Nothing else is wired to it yet.

### Railway — the contact form was broken and is now bypassed

Found 2026-08-24, by the enquiry notification on its first live run. A real POST
to production returned
`503 {"detail":"Newsletter service not configured"}` — the `detail` key is
FastAPI, so that was **Railway** answering, not Next.

`_kit_env()` in `backend/main.py` raises that 503 when its `CONVERTKIT_API_KEY`
or `CONVERTKIT_FORM_ID` is empty. Both names exist on the Railway
`silicon-stone` service, so at least one holds an empty string. **Railway's
copies are separate from Vercel's** — the 2026-08-20 key swap was Vercel only.

Newsletter subscribe was unaffected: it has posted direct to Kit since
2026-07-19. Contact never got that escape hatch, so it proxied unconditionally.
**Every advisory and EU-exposure enquiry submitted before 2026-08-24 returned an
error to the visitor and was stored nowhere.** How many were lost is unknowable —
nothing recorded them.

Code fix shipped: contact now posts **direct to Kit** unless
`CONTACT_VIA_BACKEND=true`, mirroring subscribe exactly.

- [x] Owner set `CONVERTKIT_API_KEY` and `CONVERTKIT_FORM_ID` on the Railway
      `silicon-stone` service (Struver Stack project, production), 2026-08-24 —
      a variable-change redeploy of the same commit is recorded at 15:47 UTC.
      **The values are unverified.** Railway returns them redacted, and every
      Kit-using endpoint sits behind `X-Backend-Api-Key`, so nothing outside the
      dashboard can tell "set correctly" from "set to something wrong". Not
      urgent — the website no longer touches this endpoint — but the backend
      also carries subscribe, so prove it before anything relies on it:

      ```
      curl -s -w "\nHTTP %{http_code}\n" -X POST \
        https://silicon-stone-production.up.railway.app/v1/contact \
        -H 'Content-Type: application/json' \
        -H 'X-Backend-Api-Key: <the real key>' \
        -d '{"name":"T","email":"t@example.com","company":"T","interest":"T","message":"T"}'
      ```

      `503 {"detail":"Newsletter service not configured"}` means still empty;
      `200` means fixed, and has just created a Kit subscriber to delete. Keep
      the JSON on one line — a wrapped shell line puts a literal newline inside
      the string and FastAPI answers `422 json_invalid` without ever reaching
      the Kit check.
- [ ] Leave `CONTACT_VIA_BACKEND` **unset**. Only set it to `true` after the
      Railway variables are fixed *and* a live enquiry has been proven end to
      end through the proxy.

### Booking + misc

- [ ] Put the 25-minute-call calendar link (Cal.com/Calendly/etc.) in
      `NEXT_PUBLIC_BOOKING_URL` — the advisory enquiry form shows it
      immediately on successful submit.
- [ ] Replace the footer LinkedIn placeholder: set `NEXT_PUBLIC_LINKEDIN_URL`
      to the company/founder LinkedIn URL (falls back to
      `https://www.linkedin.com/` until set).

### Regulatory review stamp — reinstate before launch

The "Regulatory copy last reviewed: <date>" line was removed from all five
pages on 2026-08-11. It was stale (four pages said 30 June, `/eu-exposure` said
17 July) and a stale review date on a compliance product is worse than none.

- [ ] Re-read the regulatory copy on each page against the pinned corpus
      (CELEX `02024R1689-20260727`), then restore the stamp with the **real**
      review date. It is a credibility signal worth having once it is true —
      and one date, on every page, not five drifting ones. Consider sourcing it
      from a single constant so it cannot diverge again. Removed from:
      - `src/app/(website)/products/page.tsx` (hero, under the sub-heading)
      - `src/app/(website)/products/ai-audit-checklist/page.tsx` (under the first CTA)
      - `src/app/(website)/products/ai-act-toolkit/page.tsx` (under the price table — this said "under the guarantee" until 2026-09-04, when `GuaranteeNote` was deleted)
      - `src/app/(website)/advisory/page.tsx`
      - `src/app/(website)/eu-exposure/page.tsx`

## 1. Launch day — flip the flags

- [ ] `NEXT_PUBLIC_PRE_LAUNCH=false` → product CTAs become Buy buttons wired to
      LS checkout (a CTA whose checkout URL is still unconfigured stays in
      early-access mode as a safety net).
      > **Until this flips**, the pre-launch CTAs read "Buy Now" but collect an
      > email (owner's call, 2026-08-11 — the site is unpromoted and unindexed,
      > so nobody meets them). That reasoning expires the moment the site is
      > announced or indexed: launch, or put the wording back, before promoting
      > anything. The labels live on `<EarlyAccessCTA label=…>` in
      > `products/ai-audit-checklist/page.tsx` and `products/ai-act-toolkit/page.tsx`.
- [ ] `NEXT_PUBLIC_FREE_INTRO_END=<launch date + 90 days>` (ISO, e.g.
      `2026-10-19`) — the free-intro copy self-expires after that date; or flip
      `NEXT_PUBLIC_FREE_INTRO_WINDOW=false` manually.
- [ ] Leave `NEXT_PUBLIC_FOUNDING_OFFER_ACTIVE=true` until five retainer
      clients are signed, then set it to `false`.
- [ ] Redeploy (env changes need a new deployment).

- [ ] ⚠ **Checkout must capture express consent to immediate access.** Enable
      Lemon Squeezy's digital-goods consent step so the buyer actively confirms
      (a) they want access straight away and (b) they understand this ends their
      14-day cancellation right. `/terms` → *Refunds and Cancellation* states
      that the right is lost when the download begins **where the buyer has
      consented and acknowledged**. If the checkout never asks, the condition is
      not met, the 14-day right survives, and the site is describing a position
      it does not have. Written conditionally on purpose, so the sentence stays
      true either way — but it is only *useful* once the checkout asks.
      > Also outstanding: `/terms` has not been reviewed by a solicitor. The
      > Refunds section was written on 2026-09-04 to close the gap left when
      > every discretionary refund promise was withdrawn; it states statutory
      > rights and offers nothing beyond them. Get it read before the store opens.

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
- [ ] Open a published article tagged `ai-act` (e.g.
      `/analysis/welcome-to-silicon-and-stone`), scroll to the end-of-article
      gate, and confirm it reads "Go deeper: AI Act Compliance Toolkit / Get it
      — From £79" **and that the CTA now opens LS checkout**, not the product
      page. If it still goes to `/products/ai-act-toolkit`, the Sanity
      `checkoutUrl` above was not filled in.
- [ ] Run a tool (e.g. Compliance Checker) to the results screen, subscribe via
      the results block, confirm the subscriber lands in Kit tagged
      `tool-compliance-checker`.
- [ ] Subscribe once each from `/us-executive-guide` and `/eu-exposure`;
      confirm the `atlantic-drift` / `eu-exposure` tags.

      > The guide moved from `/atlantic-drift` to `/us-executive-guide` on
      > 2026-08-11 (the old path 301s) because "Atlantic Drift" is the
      > newsletter and the content category, not that page.
      >
      > **Settled — do not "fix" this.** The Kit tag stays `atlantic-drift` and
      > the Plausible goal stays "Atlantic Drift Signup" (owner decision,
      > 2026-08-11). Both are external identifiers with history attached: the
      > tag resolves through `CONVERTKIT_ATLANTIC_DRIFT_TAG_ID` to a tag that
      > already has subscribers, and the goal is matched by exact name in the
      > Plausible dashboard. Renaming either in code — without first creating
      > the replacement in Kit/Plausible — silently stops tagging signups and
      > stops recording the goal. The mismatch with the page's URL is
      > deliberate and costs nothing but a moment's confusion in reporting.
- [ ] `LAUNCH48` announced with its 48-hour window; verify it applies at
      checkout on Professional.

## 3. Optional Plausible goals (new events fired by this release)

`Early Access Request` · `Tool Results Subscribe` · `EU Exposure Signup`
(existing goals unchanged; create these in Plausible if you want them tracked —
names are exact, with spaces).
