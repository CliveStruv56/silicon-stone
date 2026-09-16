# Sector reports: implementation and monthly publishing

## Implemented, 15 September 2026

- `/products/sector-reports`: manufacturing panel, linked preview, current price and update terms; forthcoming reports labelled without speculative release dates.
- `/products/sector-reports/ai-and-european-manufacturing`: real Edition 1 cover, confirmed 60-page count, evidence cut-off, exact opening summary and full contents. The PDF's expanded Part I heading is used; subsections and sector cards from the dossier are also listed.
- Standard price: **£149**, one named reader, one payment, emailed PDF links and all monthly editions released over the next 12 months; optional renewal. Team pricing is separate and remains undecided. Old three-report bundle removed.
- Selected existing free articles carry a preview invitation; existing article gates remain. Explicit `none` gates suppress the invitation, and an existing promotion to the same report is not duplicated.
- Published Sanity records: `sector-report-ai-and-european-manufacturing` and `sector-report-ai-and-european-manufacturing-2026-10`. The generic sector product price is synchronised with `src/lib/offering.ts`.
- Source PDF verified at `/Users/clivestruver/Downloads/Silicon-and-Stone_AI-and-European-Manufacturing_Edition-1_Oct-2026.pdf`. Only its cover was exported to `public/reports`; the paid PDF is not published by the application.
- Site code has not been deployed by this implementation task. CMS preview data and price are published; the new pages become public when this code is deployed.

## Monthly public preview workflow

1. Prepare and verify the next PDF. Preserve the previous edition as an immutable file.
2. In Studio, create a **Sector report edition**. Set the month, edition number, evidence cut-off, verified page count, opening thesis, first summary paragraph, full contents and “What changed” bullets. These fields are public: do not paste the full report or add a paid download URL.
3. Publish the edition, then update the **Sector report**'s `currentEdition` reference and publish it. Keep the report's slug unchanged.
4. Use **Promote this preview on these articles** to select related briefings. This is explicit editorial placement, not broad category matching.
5. Check the public page after the five-minute cache interval. Published CMS records override the initial checked-in preview. Turning **Show public preview** off hides the report; deleting the initial CMS record allows the checked-in fallback to return.
6. The current checkout status is deliberately preview-only. Publishing a CMS edition does not enable sales or send email.

The initial seed command is `npx tsx scripts/seed-sector-report.ts`; add `--write` to create missing records and synchronise the generic product price. It reads `.env.local` through Next's environment loader. It does not overwrite existing report/edition content. Do not use it to publish subsequent editions.

## Purchaser delivery — remaining launch work

> **Owner decision 2026-09-15: the report goes on sale before the entitlement
> store exists.** What ships instead, and what it does not do:
>
> - Checkout is a one-time Lemon Squeezy variant; the current PDF is the
>   variant's attached file, so Lemon Squeezy's own receipt email delivers it.
> - The signed `order_created` webhook applies the Kit tag
>   `buyer-sector-report-manufacturing` (per report, never shared). That tag is
>   outside the public subscribe allow-list, so it is evidence of a paid order —
>   it is still a mailing segment, not an entitlement record.
> - Monthly editions are a Kit broadcast to that tag; the 12-month cut-off is
>   read from the Lemon Squeezy order date and applied by hand each month
>   (`docs/owner-setup-lemonsqueezy-kit.md` §12).
> - Not built: durable per-buyer entitlements, download-time eligibility checks,
>   automated expiry, renewal handling. Items 2 to 5 below remain the design for
>   that; item 6 has been done (`currentGateProduct` now opens the checkout once
>   both launch gates clear).

The local environment contains no Lemon Squeezy configuration, and no sale date has been supplied. The existing webhook handles toolkit buyer tags, not report entitlements. The public pages therefore use launch notifications. No paid download route, annual buyer entitlement store or monthly delivery automation was added in the preview implementation.

Before enabling report checkout:

1. Set the first sale date and monthly publication day. Configure the report's one-off GBP checkout at the agreed price and establish the customer-facing tax treatment.
2. Establish protected file delivery. Do not place the full report under `/public`, attach it to a public Sanity record or assume changing a commerce product file enforces an annual update cut-off.
3. Implement durable report-specific paid entitlements: order, buyer, licence, payment date, update expiry and refund/renewal state. Eligibility must be checked for downloads as well as emails. Never accept a public newsletter tag as proof of purchase.
4. Implement the initial receipt/download and monthly update email. Each eligible buyer receives an updated PDF link and change summary; newsletter subscription is separate from paid service delivery. Decide access to previous editions after expiry and finalise the retained-copy wording.
5. Test paid purchase, duplicate/retried events, refunds, renewal, expiry and multiple reports bought on different dates. Confirm expired buyers cannot obtain new editions using an old link.
6. Only then replace preview-only CTAs, update `currentGateProduct`'s report checkout guard and update availability copy. The present guard intentionally discards any stale CMS checkout URL.

The wider fulfilment design remains in `sector-reports-implementation-plan-2026-09-15.md`. This document distinguishes finished public pages from the unimplemented purchase service so that a preview release cannot be mistaken for a sales launch.

## Verification completed

- 35 focused tests passed (report excerpt/contents integrity, editorial article placement, offering prices and legacy gate behaviour).
- ESLint, TypeScript and published Sanity price checks passed.
- Production build and all 21 operator-manual checks passed; new report page and sitemap entries generated successfully.
- Browser checks covered catalogue navigation, full contents anchors, report-specific canonical URL, mobile overflow, light/dark presentation, launch-form expansion, relevant article promotion and unknown-report handling. No purchase or newsletter email was sent.
- Production build is available locally on port 3100 for review. Public deployment remains a separate step.
