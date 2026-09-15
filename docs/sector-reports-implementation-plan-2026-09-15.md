# Sector reports: preview, pricing and monthly updates

Prepared 15 September 2026. Public preview implementation and CMS records completed locally; checkout and monthly purchaser delivery are not yet activated. See `sector-reports-operations.md` for the implemented scope and remaining launch work.

## 1. Recommendation

Position each sector report as a reference guide with monthly updates for 12 months. Give it a permanent public product page containing the full contents and the opening Executive Summary paragraph. Use AI and European Manufacturing as the first instance of a reusable report template.

Confirmed by Clive: one payment for one named reader, covering the current PDF and all monthly editions released during the following 12 months, delivered through emailed links to updated PDFs. Renewal is optional, with no automatic renewal. Team use will have a separate price. Scope includes both paid sector-report pages and relevant free intelligence articles.

Clive subsequently confirmed the £149 individual price. Team licence size and price also remain to be set. The plan recommends that downloaded editions remain theirs to keep. Do not promise a fixed number of additional PDFs until the publication schedule and entitlement boundary are agreed.

## 2. Review of the supplied report and existing site

Source: `docs/ai-and-european-manufacturing-edition-1-dossier-october-2026-verified-15-septemb.md`.

| Existing site or source detail | Proposed treatment |
|---|---|
| Site advertises 15–20 pages; dossier identifies a 60-page subscriber PDF | Describe a substantial monthly reference guide. Display 60 pages only after checking the actual final PDF; the PDF was not supplied for this review. Keep page count edition-specific. |
| Site promises three key findings | Manufacturing has six findings. Use report-specific copy. |
| Site promises a 90-day checklist | No standalone 90-day checklist appears in this Markdown. Remove that promise for this report unless the deliverable is added. The reader-specific action strips are not the same deliverable. |
| Site calls scenarios low, medium and high friction | Use the actual scenario names: Managed fragmentation; Escalation with European collateral; Rare-earth squeeze. |
| Site shows £39 each / three for £99 | Replace with a price and explicit 12-month update term after the commercial decision. |
| Manufacturing card is not linked | Link its title and a clear “View contents and preview” CTA to its own page. |
| Entire catalogue is “Coming Soon”; manufacturing says “First release” | Use report-level availability. Show “Preview available” while fulfilment is being prepared, and “Available now” only once buyers can receive the report. |
| Other cards contain Q3/Q4 2026 promises | Confirm their release schedule; otherwise use “In preparation”. Do not silently shift dates. |
| Markdown has no standalone Index/Contents section | Reconstruct the complete contents from all reader-facing headings, including numbered subsections, tables appendices, methodology and evidence headings. A proposed full contents list is appended below. |
| October 2026 edition has a 15 September verification cut-off | Display edition month and evidence cut-off as separate fields. Neither is the actual publication date, which is still to be confirmed. Edition 2 is described as due in November, with a 10 November cut-off. |
| Broad opening verification claim; Appendix B identifies 214 verified, 22 thin-evidence, 15 position and 60 carried-forward entries | Prefer “Evidence cut-off: 15 September 2026. Sources, evidence limitations and carried-forward claims are identified in the report.” Resolve the stronger source wording before publication. This review has not independently re-verified the report's legal or market claims. |
| Dossier references an external full claim ledger | Promise the **claim ledger summary** included in Appendix B. Do not promise access to the full external table unless that is explicitly part of the purchase. |
| Internal status notes contain table/thread IDs and editorial corrections | Exclude the internal production preamble from the public preview. Retain reader-facing corrections, evidence notes and glossary headings in the contents. |

The core selling point is the combination of regulation, industrial adoption, supply dependencies and workforce constraints, interpreted for operations, compliance and market-entry readers. Monthly re-verification, change summaries and a review calendar explain the continuing value.

## 3. Proposed Sector Reports page

Keep the existing `/products/sector-reports` address.

### Hero copy

**Sector Reports**

In-depth guides to AI adoption, regulation and geopolitical risk in your industry. Each purchase includes the current report and monthly updates for 12 months.

Use “Monthly editions · 12 months of updates included” beside the catalogue introduction. Once pricing is agreed, show “£149 per report, including 12 months of updates” rather than an ambiguous “£149/year” for a non-renewing purchase.

### Manufacturing panel — proposed copy

**AI and European Manufacturing**

*October 2026 edition · Evidence cut-off: 15 September 2026*

Europe is regulating factory AI faster than its factories are adopting it — and doing so on top of a supply chain it does not control.

Explore the EU and UK regulatory landscape, the vendors bringing AI to the shop floor, and dependencies on magnets, chips, cloud and model access. Includes workforce pressures, three scenarios to 2028, and implications for operations, compliance and market entry.

- EU regulation and a dedicated UK chapter
- Industrial AI vendors, adoption evidence and supply-chain risks
- Talent, historical lessons and three scenarios to 2028
- Market tables, evidence notes and a review trigger calendar

**Monthly updates included for 12 months.**

**View contents and preview →**

Target: `/products/sector-reports/ai-and-european-manufacturing`.

The thesis sentence is selected verbatim from the Executive Summary; the description and bullets are adapted from its findings and the document headings. The panel should keep its existing visual style, with a stronger featured position for the first report. Use a normal link with a visible keyboard focus state; avoid nested links if the entire card becomes clickable.

### Other catalogue changes

- Replace generic “Every Briefing Includes” promises with features actually common to all commissioned reports. Let individual report pages carry precise contents.
- Lead with the manufacturing report. Keep other sectors visible as forthcoming, with report-specific interest capture where practical.
- Explain the update package once above the cards and repeat its short form beside every price.
- Retain the existing launch interest form while the first product is being prepared. Do not label preview access as a purchase or require an email to read the preview.

## 4. Individual sector report page

Use a permanent report URL; update its current-edition metadata monthly without changing the link.

### Page order

1. Breadcrumb: Products → Sector Reports → AI and European Manufacturing.
2. Title, scope, edition month, evidence cut-off and availability. Show actual PDF page count when confirmed.
3. Purchase summary: price, licence scope, PDF format, 12-month update term and CTA. Until fulfilment is ready, use report-specific launch notification.
4. Who it is for: operations and supply-chain directors; legal and compliance officers; North American founders and executives entering Europe.
5. Executive Summary preview: the thesis and the first prose paragraph reproduced below. Do not expose the remaining findings or report body in page data, hidden HTML or downloadable assets.
6. Full contents, grouped by front matter, six Parts, appendices and reference material. Include every reader-facing heading. Make all groups readable by default, or provide accessible expand/collapse controls and “Expand all”. Headings identify paid contents; they must not pretend to link to unavailable chapters on the preview page.
7. What the purchase includes: current PDF, updated monthly PDFs, a “What changed” summary from Edition 2 onward, updated review calendar, and the evidence/claim-ledger summary within the report.
8. “How monthly updates work” and a concise FAQ: start/end date, delivery, optional renewal, retained downloads and permitted sharing.
9. Repeat purchase/notification CTA after the contents.

### Executive Summary preview — exact source text

**Europe is regulating factory AI faster than its factories are adopting it — and doing so on top of a supply chain it does not control.**

European manufacturers face a compliance calendar for artificial intelligence that runs two to three years ahead of measured adoption on the shop floor. The first of its obligations is already live; the heaviest arrive between January 2027 and August 2028. At the same time, the inputs that any adoption depends on — permanent magnets, mature-node chips, AI accelerators and, since June 2026, the frontier models themselves — sit under licensing regimes in Beijing and Washington that Brussels can monitor but not override. Europe's record with programmes of this kind suggests the regulation will arrive on time and the sovereign alternatives will not.

Treat the bold sentence as the opening thesis and the following prose as the requested first paragraph. Label this as an excerpt from the October edition, with its evidence cut-off, rather than undated website advice.

## 5. Existing individual intelligence briefing pages

Confirmed scope: include relevant `/analysis/[slug]` articles as well as the new paid-report pages.

Use the existing contextual product promotion at the end of an article. For relevant manufacturing articles, link directly to the manufacturing preview rather than only the general catalogue. Keep unrelated articles' existing product selection.

Proposed promotion:

**Go deeper: AI and European Manufacturing**

EU and UK regulation, industrial AI adoption, supply-chain dependencies and three scenarios to 2028. Includes monthly updates for 12 months.

**Explore the report →**

Use an explicit report product reference for selected articles initially. The current resolver supports explicit products as well as category matching. Broad categories such as AI regulation should not automatically force every article to this manufacturing report. Add a report-specific Sanity product document; avoid changing the generic sector catalogue product into a manufacturing-only product.

The report CTA should lead through the preview so prospective buyers can assess its contents. Show the same price and update term as the catalogue and report page. A free newsletter subscription or launch interest tag is not a paid entitlement.

## 6. Pricing proposal

**Recommended standard starting price: £149 for one report with 12 months of updates, for one named reader.** This is a proposed test price, not an established willingness-to-pay finding. Decide the customer-facing tax presentation consistently with checkout before publishing it.

The current £39 amounts to £3.25 per month of included coverage; the three-for-£99 bundle amounts to £2.75 per report per month. At £149, the comparable arithmetic is approximately £12.42 per month, paid once. Sell the useful reference and continuing research, rather than pricing by page count or implying every monthly update is a wholly new report.

For context, independent technology analysis can support annual pricing: Benedict Evans lists his premium weekly newsletter at $150 annually. Its audience, frequency, scope and currency differ; it is an adjacent reference, not a direct price comparison or proof that £149 will convert. Source checked 15 September 2026: [Benedict Evans — Newsletter](https://www.ben-evans.com/newsletter/).

Suggested decisions:

- Use £149 as the standard price to test.
- If honouring the site's existing promise of a newsletter launch discount, consider £99 for the first 12 months, with a stated end date. Do not advertise a fictitious previous price or perpetual discount. This promotional price is optional, not part of the core proposal.
- Withdraw the current three-for-£99 offer from new sales. Revisit bundles when at least three reports are available and their update workload is known.
- Offer a separate team licence once the number of readers and internal sharing rights are agreed. Do not imply company-wide sharing at the individual price.
- Check for existing purchases or commitments before changing terms; preserve any entitlements already sold.
- Review conversion and contribution after launch: paid buyers by acquisition source, net receipts after fees/tax, monthly research and delivery cost, support load, update engagement and later renewal. Break-even buyers = annual report production/delivery cost divided by net annual contribution per buyer. No sales or production-cost data was supplied to validate the price.

## 7. Monthly delivery and entitlement

Proposed customer wording reflecting the confirmed payment, term and delivery model (retained-copy wording remains a recommendation):

> One payment includes the current report and monthly updates for 12 months from purchase. We will email you when each new edition is ready. Your downloaded editions are yours to keep. Renewal is optional; there is no automatic renewal.

### Implementation needed

The existing Lemon Squeezy webhook maps only toolkit variants to Kit buyer tags. Subscription events are logged rather than applied to access records. It does not yet implement report-specific 12-month update eligibility.

1. Create a report-specific checkout product/variant and map it to the permanent report ID.
2. Record paid order ID, buyer identity, report ID, licence scope, purchase date, update expiry and status in a durable entitlement store. Keep access records per report rather than one expiry field on an email subscriber.
3. Use a rolling 12-calendar-month term from successful payment. Define the exact boundary in UTC; future edition eligibility is determined by publication time. Handle renewals without losing remaining paid time, duplicate webhook retries, refunds and late/out-of-order events.
4. Deliver the purchased edition through the existing commerce delivery approach where suitable. Verify whether its downloadable-file mechanism can enforce the annual update cut-off before using it for future editions; do not assume a replaced product file prevents expired buyers retrieving new editions.
5. Keep paid files private and issue checked download links for eligible editions if provider-native controls are insufficient. Avoid publishing the full PDF in `/public` or using a publicly accessible CMS asset as the only access boundary.
6. Each month: finish verification and corrections; publish an immutable dated edition; publish a short “What changed” summary; update public edition metadata and contents; prepare an email for eligible buyers; record delivery and retries. Any external sends happen only as part of the authorised release workflow.
7. Use Kit tags for communication segments, not as the sole proof of payment or expiry. Separate service delivery from optional newsletter marketing and allow buyers to retrieve their purchased editions if they stop newsletter emails.
8. Stop eligibility for newly published editions after expiry unless renewed. Define and document access to previously eligible downloads, and keep the promise that copies already downloaded remain usable.

Interim correction notes are mentioned in the dossier. Establish their editorial trigger and delivery process before making them a broad public service promise.

## 8. Technical change map

| Area | Planned change |
|---|---|
| `src/app/(website)/products/sector-reports/page.tsx` | Featured manufacturing card, correct contents, linked preview, update explanation and report-level status. |
| `src/app/(website)/products/sector-reports/[slug]/page.tsx` (new) | Reusable server-rendered public report page with safe preview fields and report-specific metadata. Return 404 for unknown/unpublished reports. |
| `src/sanity/schemaTypes/sectorReport.ts` and `sectorReportEdition.ts` (new) | Permanent report identity plus dated editions; structured contents, excerpt, audience, status, cut-off, release date, page count and change summary. Keep protected delivery references server-side. Register schemas and add public-field-only queries. |
| `src/lib/offering.ts` | Single source of prices, offer terms, catalogue copy and Sanity price expectations. Existing prices are centrally enforced; do not hard-code them into cards. Revisit ascending-price ordering after the increase. |
| `src/app/(website)/products/page.tsx`, pricing page, navigation and related offering descriptions | Remove obsolete length/checklist/bundle/status claims; repeat the approved update term. |
| Sanity product documents and `src/sanity/lib/queries.ts` | Manufacturing-specific article promotion, product path, price label and public report fields. |
| `src/components/article/Gate.tsx` and `src/lib/gate.ts` | Reuse explicit product selection; adjust only where needed to display the update term and preview CTA. Retain unrelated promotions. |
| `src/app/api/webhooks/lemonsqueezy/route.ts`, `src/lib/kit.ts`, new entitlement/delivery module | Report purchase mapping, durable expiry, refund/renewal handling and eligible delivery segments. |
| `src/app/sitemap.ts`, sector layouts and report metadata | Include public report URLs; distinct canonical URLs, titles and social descriptions. Confirm parent layout metadata does not give every report the catalogue canonical. |
| Existing terms, success page and purchase emails | Make PDF delivery, licence, update period, renewal and retained-copy wording consistent. |

Prefer Sanity for monthly public edition updates because the site already uses it. Import an explicitly approved preview projection from the Markdown; do not load and send the full dossier to the browser. The current file uses inconsistent heading levels, so the initial import needs editorial grouping rather than a naive Markdown TOC generator.

## 9. Delivery sequence and acceptance checks

### Phase 1 — public preview

Create the shared report/edition model, import manufacturing preview content, build its public page, update the catalogue panel, then connect relevant article promotions. Keep purchase status honest while fulfilment is pending. Check the full contents against the supplied headings and the final PDF, and compare the excerpt verbatim with the source. Confirm mobile layout, keyboard operation, correct links, canonical URLs, and that no paid body content is present in public page data.

### Phase 2 — sale and monthly delivery

After commercial decisions are resolved, synchronise pricing across code, CMS and checkout; implement buyer entitlement and delivery; prepare actual receipt/update wording. Verify test purchase → initial PDF → eligible monthly edition → expiry, plus duplicate events, refund, renewal and two reports bought on different dates. Check direct download access, not just whether emails are suppressed. Validate that free sign-ups cannot obtain paid access.

### Phase 3 — launch and repeat

After the first PDF and fulfilment flow pass, switch manufacturing to available, update the related catalogue/navigation status and publish. Reuse the template for subsequent reports. Follow a repeatable monthly editorial and delivery checklist.

Run repository lint/typecheck, focused report and entitlement tests, existing offering/price checks and relevant browser verification for the implementation. A planning-only document change does not need application tests.

## 10. Confirmed decisions and remaining details

Confirmed by Clive:

- One payment includes the current edition and all monthly editions released during the next 12 months; renewal is optional, with no automatic renewal.
- Standard purchase covers one named reader, with emailed links to updated PDFs.
- Team use has a separate price.
- Implementation covers both paid sector-report pages and relevant existing free intelligence articles.

Before sale, resolve:

1. Any introductory offer and team licence size/pricing. The standard £149 price is confirmed.
2. Actual first publication date, final PDF/page count and regular monthly release day. The source names October Edition 1 and a 10 November cut-off for Edition 2, but does not give an exact delivery date.
3. Final customer wording for retained downloads and access to previously eligible editions after the update term ends.

## Appendix — Full proposed public contents

Derived from the supplied Markdown's reader-facing headings. No page numbers are invented. Internal production status and grouping labels are omitted; the actual reader-facing front matter, six Parts, appendices and closing reference sections are included. Repeated chapter-end headings remain under their own Part.

### Front matter

- About this edition
- How to read this guide
- Executive summary
  - What this means, by reader
- Market context: who supplies AI to European plants, and what it runs on
- The six Stone Truths of this edition
- EU obligations timeline, September 2026 → August 2028
- UK timeline
- Evidence notes — Executive summary and market context

### Part I — The EU regulatory stack

- Sector card — Machinery and Mittelstand engineering
- 1. Six questions a director must answer
- 2. The AI Act as amended by the Digital Omnibus
  - 2.1 The calendar
  - 2.2 The machinery move
  - 2.3 "Safety component" narrowed
  - 2.4 What was not carved out: AI that manages workers
  - 2.5 When a manufacturer becomes a provider
  - 2.6 The plant operator's list
  - 2.7 Industrial chatbots and copilots
  - 2.8 Guidance, standards and delegated acts
  - 2.9 Penalties
- 3. The Machinery Regulation
  - 3.1 Compulsory certification for learning safety functions
  - 3.2 Software integrity and tamper-evidence
  - 3.3 Digital instructions
  - 3.4 Harmonised standards
- 4. The Cyber Resilience Act
- 5. The network-security directive (NIS2)
- 6. The Data Act
- 7. The revised Product Liability Directive
- 8. Sustainability due diligence and reporting after Omnibus I
- 9. The carbon border adjustment mechanism
- 10. Export controls on dual-use items
- 11. The standards gap
- 12. The Tech Sovereignty Package
- 13. Role matrix — ten industrial scenarios
- 14. Conflicts and overlaps
- Methodology audit — Part I
- Three lenses
- Evidence notes — Part I

### Part II — The United Kingdom

- 1. The shape of the divergence
- 2. Product safety and machinery
- 3. Cyber
- 4. Data
- 5. Liability
- 6. Supply chain and sustainability
- 7. Adoption evidence
- 8. Export controls and investment screening
- 9. Side-by-side: eleven instrument pairs
- 10. What a UK manufacturer must still do for the EU market
- Methodology audit — Part II
- Three lenses
- Evidence notes — Part II

### Part III — Supply-chain risk

- Sector card — Chemicals, pharma and process
- Sector card — Electronics and defence-adjacent
- 1. Rare earths and permanent magnets
- 2. Legacy-node and industrial semiconductors
- 3. AI accelerators and the software layer
- 4. Automation and software vendor concentration
- 5. Chemicals and pharma
- 6. Chinese industrial competition
- 7. Logistics
- 8. Three scenarios to 2028
- Methodology audit — Part III
- Three lenses
- Evidence notes — Part III

### Part IV — Talent

- 1. Three shortages, not one
- 2. The synchronised demographic cliff
- 3. Policy responses
- 4. Where AI talent sits
- 5. Does shop-floor AI replace missing workers, or require new ones?
- Methodology audit — Part IV
- Three lenses
- Evidence notes — Part IV

### Part V — The Long-Memory Filter

- 1. Industrie 4.0
- 2. The 2021–23 semiconductor shortage
- 3. GAIA-X, Catena-X, Manufacturing-X
- 4. The Chips Act's 20%
- 5. Lisbon, Europe 2020 and Draghi
- 6. Earlier attempts at sovereign technology
- 7. Seven patterns the filter surfaces
- Methodology audit — Part V
- Three lenses
- Evidence notes — Part V

### Part VI — Forensic Technopolitics matrix and Stone Truth

- Supply Chain × Scenario Modelling
- Supply Chain × Long-Memory
- Policy × Scenario Modelling
- Policy × Long-Memory
- Talent × Scenario Modelling
- Talent × Long-Memory
- Stone Truth — Edition 1
- Closing strip

### Appendix A — Market tables

- A.1 Incumbent industrial software and automation
- A.2 Robotics
- A.3 European models with industrial positioning
- A.4 The US dependency layer
- A.5 Adoption evidence
- A.6 Pharma and process regulatory instruments for AI

### Appendix B — Claim ledger summary

- Carried-forward facts flagged for re-verification before Edition 2
- Thin-evidence entries (by chapter)

### Closing reference sections

- Review Trigger Calendar
- Corrections and superseded positions
- Glossary of instruments
- Sources by evidence class
