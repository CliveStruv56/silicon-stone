# Lemon Squeezy setup (P3-0)

> **Superseded for launch (2026-07-19): follow `LAUNCH.md` at the repo root.**
> The pre-launch packaging release changed the store shape this doc describes:
> the Toolkit is now **two one-time variants** (Standard £79 / Professional
> £149), each product needs a **redirect URL** to
> `/products/success?product={sku}`, the `order_created` webhook now **tags
> buyers in Kit** (no longer a stub) via `LEMONSQUEEZY_VARIANT_ID_*` env vars,
> and two **discount codes** (`LAUNCH48`, £20/90-day) are required. This doc
> remains for the Intelligence Series / licence-key (Model B) background only.

Everything on the code side is built and verified. This is the manual checklist
to stand up the store so checkout (P3-4) and paid content (P3-5) can proceed.
Lemon Squeezy is the **Merchant of Record** — it handles VAT/tax, receipts, and
wallet payments (Apple Pay / Google Pay), so no card data ever touches our
servers.

## 1. Create the store (test mode first)

1. Sign up / sign in at <https://app.lemonsqueezy.com>.
2. Create a store. Note the **Store ID** (Settings → Stores).
3. Keep the store in **Test mode** until the end-to-end test below passes, then
   flip to live.

## 2. Create products / variants

Match the live catalogue (already seeded as Sanity `product` docs — the mapping
layer — but the **checkout** lives in LS):

| Product | Price | Delivery model | Licence keys |
|---|---|---|---|
| AI Audit Checklist Pack | £24 | Download (Model A) | off |
| AI Act Compliance Toolkit | from £79 | Download (Model A) | off |
| Sector Reports | from £39 | Download (Model A) | off |
| Intelligence Series | tbd | On-site unlock (Model B) | **on** |

For the **Intelligence Series** product, enable **License keys** on the variant
(Settings on the variant → "This product has license keys") and set an
**activation limit** (e.g. 3) — this caps casual key-sharing, per the P3-5
decision that the key is a bearer credential.

For each product, copy its **checkout URL** (Share → checkout link) into the
matching Sanity `product` doc's *Lemon Squeezy checkout URL* field — that makes
the end-of-article gate open checkout directly. Leaving it blank keeps the CTA
pointing at the product page (graceful fallback).

## 3. Generate the API key

Settings → API → create a key. This is a **server-side secret**.

## 4. Configure the signed webhook

Settings → Webhooks → **Add endpoint**:

- **URL:** `https://siliconandstone.com/api/webhooks/lemonsqueezy`
- **Signing secret:** generate a strong random string; you'll set it as an env
  var below (the endpoint rejects anything without a valid `X-Signature`).
- **Events:** `order_created`, `subscription_created`, `subscription_updated`,
  `subscription_cancelled`, `license_key_created`.

The endpoint (`src/app/api/webhooks/lemonsqueezy/route.ts`) verifies the HMAC
signature, drops duplicate retries (idempotent via Upstash), and dispatches by
event name. Fulfilment handlers are stubbed with `TODO(P3-4/P3-5)` markers and
currently log — enough for the test-order check below.

## 5. Set env vars

On Vercel (Production + Preview) **and** in local `.env.local` — none are
`NEXT_PUBLIC` except the series checkout URL:

```
LEMONSQUEEZY_API_KEY=...            # server secret (step 3)
LEMONSQUEEZY_STORE_ID=...           # store ID (step 1)
LEMONSQUEEZY_WEBHOOK_SECRET=...     # signing secret (step 4)
NEXT_PUBLIC_LEMONSQUEEZY_SERIES_URL=...   # Intelligence Series checkout URL (for the overlay)
```

The three existing product checkout URLs already live in env
(`NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_STANDARD_URL`, `..._PROFESSIONAL_URL`,
`..._CHECKLIST_URL`) and stay as they are.

Idempotency uses the existing Upstash/KV integration
(`KV_REST_API_URL` / `KV_REST_API_TOKEN`) — already configured; nothing to add.

## 6. End-to-end test (satisfies the P3-0 acceptance criteria)

1. With the store in test mode and env vars set, place a **test order** through
   a checkout link (LS provides test card numbers).
2. In Vercel logs, confirm a `[ls-webhook] order_created` line (and, for the
   series product, `license_key_created`).
3. Re-trigger the same webhook from the LS dashboard ("Send test event" or
   resend) and confirm the second delivery logs
   `duplicate delivery … — skipping` (idempotency).
4. Confirm the buyer receives the LS receipt email (MoR).

## 7. Verify wallet payments (P3-4 watch-item)

In the LS checkout, confirm **Apple Pay / Google Pay** appear on a supported
device/browser — this is dashboard/plan-dependent and the P3-4 wallet-payment
acceptance criterion hinges on it.

---

Once steps 1–6 pass, P3-4 (Lemon.js overlay + fulfilment) and P3-5 (licence-key
unlock) are unblocked. The licence validate/activate calls are already wired in
`src/lib/lemonsqueezy.ts` (`validateLicense` / `activateLicense`) for the P3-5
server-side per-request re-validation.
