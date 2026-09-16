# Owner setup: Lemon Squeezy and Kit, end to end

**Written 15 September 2026, from the code as it stands that day.** This is the
one guide for standing up payments and the mailing list so that every product
on the site can be bought, every buyer lands in Kit with the right tag, and every
enquiry and signup is segmented. It replaces the Lemon Squeezy and Kit sections
of `LAUNCH.md` and the whole of `docs/lemonsqueezy-setup.md`, both of which had
drifted from the code. The sources of truth it is written from:

- `src/lib/kit-tags.ts` — every Kit tag and its env var (17 tags).
- `src/lib/lemonsqueezy-variants.ts` — which Lemon Squeezy variant earns which buyer tag (4).
- `src/lib/checkout.ts` — the four checkout links and the two gates in front of every Buy button.
- `src/lib/offering.ts` — every price (`AMOUNTS`).

Where this guide and one of those files disagree, the file is right and the
guide needs fixing. `npm run test:kit-tags` checks the Kit half against the
live account; there is no equivalent for the Lemon Squeezy half, so the
test-mode checklist in §10 is the proof.

---

## 1. Before you start

### What is wired

Four things are for sale, each a **one-time** Lemon Squeezy variant, each with
its own Buy button, success page, and Kit buyer tag:

| Product | Price | Buy button lives on | Success page `product=` | Kit buyer tag |
|---|---|---|---|---|
| AI Act Compliance Toolkit — Standard | £79 | `/products/ai-act-toolkit` and the end-of-article gate | `toolkit-standard` | `buyer-toolkit-standard` |
| AI Act Compliance Toolkit — Professional | £275 | `/products/ai-act-toolkit` | `toolkit-pro` | `buyer-toolkit-pro` |
| Sector Report: AI and European Manufacturing | £149 | `/products/sector-reports/ai-and-european-manufacturing`, the index page, and the end-of-article gate | `sector-report-manufacturing` | `buyer-sector-report-manufacturing` |
| Advisory Briefing | £450 | `/advisory/advisory-briefing` (pricing section; the enquiry form stays) | `advisory-briefing` | `buyer-advisory-briefing` |

Everything else on the site is an enquiry form (the scoped-fee engagements
and the four modules) or a free email capture. Nothing is a subscription.

### The two switches in front of every Buy button

A Buy button appears only when **both** are true, and `src/lib/checkout.ts` is
the one place that checks:

1. `NEXT_PUBLIC_PRE_LAUNCH` is `false` in Vercel. It is unset today, which means
   `true`: every product CTA is a "Notify me" capture into Kit and no checkout
   is ever opened. Flipping it is the go-live act in §11.
2. The product's `NEXT_PUBLIC_LEMONSQUEEZY_*_URL` is set to a real link. A value
   containing `example.com` counts as unset. Production holds `example.com`
   placeholders for the two Toolkit links today.

So you can complete every step in this guide, in test mode, with the site
still safely in pre-launch. Nothing becomes visible to a visitor until §11.

### Who does what

- **You, in a dashboard:** create the Kit sending identity, the Lemon Squeezy
  account, store, products and webhook, the Cal.com booking page, and attach
  files. These need your identity, your business details and your payout
  account, and nobody else can do them.
- **Claude, from the terminal:** creates the 17 Kit tags and the custom fields
  through the Kit API, sets every Vercel and Railway variable from the values
  you hand back, and runs the checks. The production Kit API key is marked
  *sensitive* in Vercel, so the CLI cannot read it: for the tag step you run one
  command yourself with the key in your shell (§3), and the key never enters the
  chat or a file.

### Two things to know before you sign up to Lemon Squeezy

- **Lemon Squeezy is Merchant of Record.** It is the legal seller, charges and
  files VAT in every country, issues the receipt, and decides refunds. That is
  why the site has no tax logic and why `/terms` says what it says. Its fee is
  a percentage plus a fixed amount per order; check the current figure on
  their pricing page when you sign up.
- **Store activation is a review, and it favours digital goods.** Their own
  documentation says they approve stores selling files Lemon Squeezy itself
  delivers (PDFs, ebooks) and "typically do not approve stores selling services
  ... fulfilled outside of Lemon Squeezy". Three of the four products are files.
  The Advisory Briefing is a service. Describe the store honestly in the
  activation questionnaire as a publisher of digital reports and toolkits with
  one paid consultation attached to them. If they decline the Briefing variant
  specifically, it reverts to the enquiry form, which still works; the other
  three are unaffected. Do not describe the whole business as consulting.

---

## 2. Kit: the parts only you can do

The account already exists (free plan, 1,000-subscriber cap), the v4 API key in
Vercel is valid, and the one form the site posts to is `9270944` "Silicon and
Stone Briefing". Do not create a second form; every audience distinction is a
tag.

1. **Verify the sending address.** Settings → Email → Sending. The address on
   the account was `pending` at the last check, with the from-name set to the
   raw address. Until it is verified you cannot send a broadcast, which is how
   monthly report editions go out (§12). Set the from-name to *Silicon & Stone*.
2. **Check the form's settings** (Grow → Landing Pages & Forms → the form):
   - Opt-in: choose *single* or *double*. Double means a buyer of a report who
     was not already subscribed still gets a confirmation email before Kit
     considers them active; buyers created by the webhook are created as
     subscribers, not through the form, so they are unaffected either way.
   - Confirmation/incentive email: rewrite Kit's default wording.
   - Redirect after submit: leave blank. The site renders its own success state.
3. **Upgrade plan timing.** Free caps at 1,000 subscribers. Watch the count.

Custom fields the contact form writes (`company`, `interest`, `message`,
`source`) were confirmed present on 24 August; the tag script re-checks them.

---

## 3. Kit tags: one command, run by you

The site can apply 17 tags. Each has an env var holding its numeric Kit ID; a
missing ID never breaks a signup, that tag is simply skipped, which is exactly
why this went unnoticed for months.

Run this from your own terminal in the repo (or type `! ` before it in Claude
Code so it runs in this session), pasting the production Kit key from Vercel →
Settings → Environment Variables → `CONVERTKIT_API_KEY` (click the eye icon):

```
CONVERTKIT_API_KEY=kit_… npm run test:kit-tags -- --create
```

What it does, in order: reads the account, lists live tags, creates any of the
17 that are missing, creates any of the four custom fields that are missing,
audits every `CONVERTKIT_*_TAG_ID` in your shell against the live names, and
prints one `CONVERTKIT_…_TAG_ID=<id>` line per tag. **It never subscribes
anyone and never prints the key.** Without `--create` it only reports.

Copy the printed block into the chat. IDs are not secrets. Claude then sets
them in Vercel (production) and the three the Railway backend also reads
(`CONVERTKIT_TOOL_LEAD_TAG_ID`, `CONVERTKIT_WAYMARKPATH_TAG_ID`,
`CONVERTKIT_CONTACT_TAG_ID`) on Railway, and re-runs the script against the
pulled production environment to prove every ID points at a tag of the right
name.

The 17, for reference (names are contracts with the pages that post them; do
not rename one in Kit):

| Tag | Applied when |
|---|---|
| `Tool_Lead` | A tool's result email gate |
| `WaymarkPath_Early_Access` | WaymarkPath waitlist |
| `early-access` | Any pre-launch "Notify me" |
| `tier-toolkit-standard` / `tier-toolkit-professional` / `tier-sector-reports` | Which product they asked about |
| `atlantic-drift` | Signed up from the US Executive's Guide |
| `eu-exposure` | Legacy; no live sender |
| `tool-compliance-checker` / `tool-supply-chain-mapper` / `tool-scenario-modeler` / `tool-policy-stress-test` | Subscribed from that tool's result |
| `buyer-toolkit-standard` / `buyer-toolkit-pro` / `buyer-sector-report-manufacturing` / `buyer-advisory-briefing` | **Only** by the signed Lemon Squeezy webhook after a paid order |
| `contact-enquiry` | Every advisory enquiry |

Buyer tags are deliberately absent from the public subscribe route's allow-list,
so holding one is evidence of an order and nothing on the site can mint one.

### Segments to build in Kit once the tags exist

Enquiries carry an `interest` custom field with an exact string. Build a
segment per value you want to watch. The values the site can send:
`Advisory Briefing`, `Exposure Diagnostic`, `Drift Retainer`,
`Strategic Assessment`, `Board-level engagement`, `Manufacturing Exposure Module`,
`Scenario Impact Analysis`, `Regulatory Friction Assessment`,
`European Procurement Readiness`. Blank is allowed.

Post-purchase sequences, if you want them, trigger off the four `buyer-*` tags.

---

## 4. Cal.com booking page

Cal.com's free plan is for one user with unlimited event types and calendars;
Calendly's free plan allows one event type, and you need two. Cal.com can
import Calendly events in one click if you ever have any.

1. Sign up at cal.com with the address you take bookings on; connect your
   calendar and Zoom (Apps → Zoom).
2. Create two event types:
   - **Toolkit Professional review** — 45 minutes. Description: "Included with
     the Professional toolkit. Book within 90 days of purchase and send your
     workbook entries at least three working days beforehand."
   - **Advisory Briefing** — 60 minutes. Description: "Included with your
     Advisory Briefing. Reply to your receipt email with your result or system
     description before the call."
   Add a required booking question on both: *Order reference from your Lemon
   Squeezy receipt.* You verify the receipt before the call; a booking is not
   proof of purchase.
3. Copy your booking page URL (`https://cal.com/<username>`). That single
   page, listing both event types, is what goes into `NEXT_PUBLIC_BOOKING_URL`
   and is shown on the success page after a Professional or Briefing purchase.

---

## 5. Lemon Squeezy: account and store

1. Sign up at app.lemonsqueezy.com. The store starts in **test mode**; stay
   there until §10 is green.
2. Create the store: name *Silicon & Stone*, currency **GBP**, your business
   details. Settings → General: set the statement descriptor buyers will see on
   their card.
3. Note the **Store ID** (Settings → Stores). It goes in `LEMONSQUEEZY_STORE_ID`.
   The code does not read it today, but it is where every API call and webhook
   is scoped, and the variable is already documented.
4. Settings → API → create a key → `LEMONSQUEEZY_API_KEY`. The code does not
   call the API yet either (licence keys are a later phase); the variable exists
   for that. **Test-mode keys only work in test mode**; you create a live one in
   §11.
5. Do **not** activate the store yet. Activation (KYC, 2 to 3 business days) is
   the go-live step in §11, and products do not carry across automatically.

---

## 6. Lemon Squeezy: products and variants

Create **three products** with **four variants** in total. Every variant is a
**one-time** payment. Licence keys **off** on all of them. Attach a placeholder
PDF to each file-delivered variant for now (file downloads are disabled in test
mode anyway); the real files go on before §11.

| Product | Variant | Price | File | Redirect ("Continue" button) URL |
|---|---|---|---|---|
| AI Act Compliance Toolkit | Standard | £79 | handbook, workbook, four templates | `https://siliconandstone.com/products/success?product=toolkit-standard` |
| AI Act Compliance Toolkit | Professional | £275 | the same files | `https://siliconandstone.com/products/success?product=toolkit-pro` |
| Sector Report: AI and European Manufacturing | single | £149 | the current edition PDF | `https://siliconandstone.com/products/success?product=sector-report-manufacturing` |
| Advisory Briefing | single | £450 | none (a short PDF "what happens next" is fine) | `https://siliconandstone.com/products/success?product=advisory-briefing` |

For each product:

1. Products → New product. Name it exactly as above. In the description, paste
   the same terms the site shows (one-off payment; Toolkit: 12 months of
   updated files; Report: one named reader, monthly editions for 12 months, no
   automatic renewal; Briefing: one hour, one written follow-up).
2. Add the variants (Toolkit only) with the prices above.
3. **Confirmation modal → Button link:** paste the redirect URL. Lemon Squeezy
   then shows a "Continue" button on the receipt overlay that lands the buyer
   on the site's success page with the right `product=` value. Use the bare
   apex `siliconandstone.com`, never `www`.
4. Files: attach under the variant.
5. Publish the product (test mode: visible only to you).
6. Copy two things per variant into the hand-back table in §8:
   - the **checkout link** (Share → the `https://<store>.lemonsqueezy.com/buy/…` URL, or `checkout/buy/<variant id>`);
   - the **variant ID** (open the variant; the numeric ID is in the URL and the variant panel).

What **not** to create: a `LAUNCH48` code, any public discounted link, a
Checklist SKU, an "Intelligence Series" product, a subscription of any kind.
Standard → Professional upgrades are handled per buyer (§12).

### The consent question for `/terms`

`/terms` says a consumer's 14-day cancellation right ends when the download
begins *where the buyer expressly asked for immediate access and acknowledged
losing the right at checkout*. Lemon Squeezy's hosted checkout has **no
documented setting** that adds that acknowledgement, and as Merchant of Record
Lemon Squeezy, not you, is the trader for refund purposes; its buyer terms say
refunds are at its discretion. The sentence on `/terms` is written
conditionally, so it is not false, but it should be reviewed by a solicitor
before live sales with two questions: whether it should simply defer to Lemon
Squeezy's buyer terms, and what the EU withdrawal-button rule that applied
from 19 June 2026 means when the merchant of record is a third party. This is
listed again in §11.

---

## 7. Lemon Squeezy: the webhook

Settings → Webhooks → **+**:

- URL: `https://siliconandstone.com/api/webhooks/lemonsqueezy` (apex, not www)
- Signing secret: generate a random string of 20 to 40 characters and keep it;
  it goes in `LEMONSQUEEZY_WEBHOOK_SECRET`. The endpoint returns 503 until it is
  set and 401 for any delivery whose signature does not match.
- Events: **`order_created`** is the only one the site acts on (it tags the
  buyer in Kit). Tick `order_refunded` too so refunds appear in the Vercel logs;
  the rest are optional and are only logged.

Test-mode and live-mode webhooks are **separate** in Lemon Squeezy. You create
this one now in test mode and create it again in live mode in §11, with the same
secret so nothing in Vercel changes.

The webhook reads only the buyer's email and the variant ID from the order. No
custom checkout fields are needed.

---

## 8. Hand-back table: what Claude sets in Vercel

Fill this in as you go and paste it into the chat. None of the values below
except the two secrets need protecting; paste the secrets the same way, Claude
sets them with `vercel env add` and they never land in a file.

| Value | From | Env var | What it lights up |
|---|---|---|---|
| Toolkit Standard checkout link | §6 | `NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_STANDARD_URL` | Buy Standard button; article gate |
| Toolkit Professional checkout link | §6 | `NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_PROFESSIONAL_URL` | Buy Professional button |
| Manufacturing report checkout link | §6 | `NEXT_PUBLIC_LEMONSQUEEZY_SECTOR_REPORT_MANUFACTURING_URL` | Report Buy buttons; article gate |
| Advisory Briefing checkout link | §6 | `NEXT_PUBLIC_LEMONSQUEEZY_ADVISORY_BRIEFING_URL` | Briefing Buy button |
| Toolkit Standard variant ID | §6 | `LEMONSQUEEZY_VARIANT_ID_TOOLKIT_STANDARD` | webhook → `buyer-toolkit-standard` |
| Toolkit Professional variant ID | §6 | `LEMONSQUEEZY_VARIANT_ID_TOOLKIT_PRO` | webhook → `buyer-toolkit-pro` |
| Manufacturing report variant ID | §6 | `LEMONSQUEEZY_VARIANT_ID_SECTOR_REPORT_MANUFACTURING` | webhook → `buyer-sector-report-manufacturing` |
| Advisory Briefing variant ID | §6 | `LEMONSQUEEZY_VARIANT_ID_ADVISORY_BRIEFING` | webhook → `buyer-advisory-briefing` |
| Webhook signing secret | §7 | `LEMONSQUEEZY_WEBHOOK_SECRET` | the webhook accepts deliveries |
| Store ID | §5 | `LEMONSQUEEZY_STORE_ID` | recorded; unused by code today |
| API key | §5 | `LEMONSQUEEZY_API_KEY` | recorded; unused by code today |
| Cal.com booking page | §4 | `NEXT_PUBLIC_BOOKING_URL` | success page after Professional or Briefing |
| 17 Kit tag IDs | §3 | `CONVERTKIT_*_TAG_ID` | every tag the site applies |

Three production variables are stale and get removed at the same time:
`NEXT_PUBLIC_LEMONSQUEEZY_CHECKLIST_URL`, `CONVERTKIT_BUYER_CHECKLIST_TAG_ID`,
`CONVERTKIT_TIER_CHECKLIST_TAG_ID` (the Checklist SKU was retired).

`NEXT_PUBLIC_*` values are inlined at build time, so after Claude sets them a
redeploy is needed for the buttons; the secrets and tag IDs are read at request
time and need none.

---

## 9. Sanity Studio: two fields

The end-of-article gate reads its checkout link from the `product` document,
not from env. In Studio:

- `product-ai-act-toolkit` → *Lemon Squeezy checkout URL* → the Standard link.
- `product-sector-reports` → *Lemon Squeezy checkout URL* → the Manufacturing
  report link.

**Never retype `priceLabel`, `name` or `productPath`** in Studio; a CI check
fails if they drift from the code. Leave `lemonVariantId` blank; it is for the
on-site unlock model that is not in use.

---

## 10. Test-mode verification, one order per variant

With the store in test mode, the webhook created, every §8 value set, and
`NEXT_PUBLIC_PRE_LAUNCH` still true, open each **checkout link directly** (the
site's buttons are still hidden by the flag) and buy with a test card:

- Visa `4242 4242 4242 4242`, any future expiry (`12/35`), any three-digit CVC.
- Test receipts go to you and your team, whatever email you enter at checkout.

For each of the four:

- [ ] Checkout completes; Apple Pay or Google Pay is offered where your browser supports it.
- [ ] The "Continue" button lands on `/products/success?product=<sku>` and the page names the right product. For Professional and the Briefing it shows the Cal.com button.
- [ ] Vercel → Logs shows `[ls-webhook] tagged buyer as buyer-…` within a minute. `order_created without mappable buyer tag` means the variant ID in Vercel does not match; `no Kit tag ID configured` means the tag ID is missing.
- [ ] In Kit, the test email now exists as a subscriber carrying that buyer tag.
- [ ] Lemon Squeezy → the order → Resend the `order_created` webhook. Logs show `duplicate delivery … skipping`.
- [ ] A receipt email arrives (test mode disables file downloads; that is expected).

Then: `npm run test:kit-tags` (report mode) is green, and one live enquiry
through `/advisory` lands in Kit tagged `contact-enquiry` with `interest` set.

Stop here. The site is unchanged for visitors. Everything above can be
re-run at any time.

---

## 11. Go live (a separate decision)

In this order:

1. Attach the real Toolkit files and the real report PDF to the test-mode
   products, and delete the placeholders.
2. Lemon Squeezy → Activate your store (questionnaire, identity). Wait for
   approval. Read §1's note on services before answering.
3. Each product → **Copy to Live Mode**. Copies get **new IDs and new checkout
   links**: repeat §6's copying step for all four and hand the new table to
   Claude. Re-enter the four redirect URLs on the live copies.
4. Settings → Webhooks in **live** mode: create the webhook again, same URL,
   same secret, same events.
5. Settings → API in live mode: create a live key → `LEMONSQUEEZY_API_KEY`.
6. Claude sets the new links and IDs, sets `NEXT_PUBLIC_PRE_LAUNCH=false`, and
   redeploys.
7. Place **one real order** yourself on the cheapest variant and refund it
   from the Lemon Squeezy dashboard: the live webhook, the live tag, the real
   file delivery and the refund path are all proven in one go.
8. Plausible → Goals: add `Buy Sector Report`, `Buy Advisory Briefing`,
   `Product Purchase`, `Early Access Request`, `Tool Results Subscribe`
   (exact names, spaces). `Buy Toolkit Standard` and `Buy Toolkit Professional` already exist.
9. Update the two remaining "preview" strings in code that are not gated:
   the Sector Reports `status` in `src/lib/offering.ts` and the header's
   `Preview available` note. Claude does this on the day.
10. Solicitor review of `/terms` → *Refunds and Cancellation* (see §6). It has
    not been reviewed, and the store opening is what makes it matter.

---

## 12. Monthly operations

- **Report editions.** When a new edition is published in Studio, send a Kit
  broadcast to the `buyer-sector-report-manufacturing` tag with the new PDF
  link (host the PDF as a Lemon Squeezy file update on the product, so the
  original download link keeps serving the current edition too). This is the
  whole delivery mechanism today; there is no automated entitlement store.
- **12-month expiry.** Each buyer's clock runs from the order date in Lemon
  Squeezy. Once a month, list orders older than 12 months for the report
  variant and remove the buyer tag from those subscribers in Kit; they stop
  receiving editions. Write before you do, offering renewal at the current
  price. Automating this is the next piece of code work
  (`docs/sector-reports-operations.md` records the design).
- **Standard → Professional upgrade.** A Standard buyer who wants the review
  pays the £196 difference: verify their Standard receipt, then create a
  **buyer-restricted** discount or a single-use checkout for the Professional
  variant at that price. Never publish a reusable discounted link. Add the
  `buyer-toolkit-pro` tag by hand in Kit; the webhook cannot infer an upgrade.
- **Briefing bookings.** Check the order reference on every Cal.com booking
  against Lemon Squeezy before the call.
