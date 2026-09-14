# Toolkit Professional review setup

Agreed 2026-09-14: Standard £79; Professional £275; verified upgrade £196.
Professional adds preparation, one 45-minute Zoom discussion for up to three AI
systems in one organisation, and a personalised written action summary. No video.

## Current state

The site journey and terms are implemented. Booking and private file submission
are deliberately placeholders: the owner has not selected either service.
`/products/ai-act-toolkit/review` accepts no files and exposes no private link.
Checkout remains subject to the existing pre-launch flag and configured URLs.
Do not enable Professional sales before the following setup is complete.

## Booking provider — PLACEHOLDER

- Select the service and create a 45-minute Toolkit Professional appointment type.
- Allow internal colleagues to attend; include the Zoom meeting details.
- Verify the Professional receipt (or Standard receipt and paid upgrade) before
  releasing booking access. A success-page query string is not purchase evidence.
- Book within 90 days of purchase/upgrade; allow three working days between
  submission and the meeting. Reserve preparation and follow-up time separately.
- Replace the booking placeholder and its matching success-page copy only after
  the real workflow is tested. Do not reuse the general introductory-call link.

## Private file-request provider — PLACEHOLDER

- Choose private storage with encryption in transit and at rest, restricted
  access, file-request links that do not permit browsing other clients' files,
  revocation and deletion controls, and suitable handling of spreadsheet files.
- Issue a separate request to each verified Professional buyer; do not place a
  shared storage link or upload credential in public code or NEXT_PUBLIC env.
- Ask for the workbook, company/sector context, selected system IDs and questions.
  Ask buyers to omit credentials and unnecessary personal or source data.
- Restrict access to Clive and the service providers needed for the review. Ensure
  backups/trash retention is consistent with the stated retention period before
  advertising deletion. Identify the provider in /privacy before opening uploads.
- Delete workbooks from the review service 30 days after the meeting. Establish a
  deletion process for cancelled/no-show reviews as part of provider setup.
- Remove the placeholder only after testing permitted upload/download, revoked
  access, blocked access to another buyer's files and deletion. No sensitive
  workbook should pass through the general contact form or public Sanity assets.

## Delivery and follow-up

- LS supplies download links and the correct return URL. Kit buyer tags distinguish
  Standard and Professional; keep update communications separate from newsletter
  consent. Include the review preparation page in Professional delivery notes.
- For Standard upgrades, verify the original receipt before arranging the £196
  payment. Preserve the original update expiry; start the review booking window
  from the upgrade date. Never publish an unrestricted discounted checkout.
- Track purchase date, update expiry, review booking, submission and deletion
  dates in the chosen service. A tier tag alone does not enforce a 12-month term.
- Both editions receive 12 months of updated files and quarterly update emails;
  distribute material corrections when ready. No automatic renewal. An optional
  update renewal does not include another review.

## Written action summary template

Organisation / meeting date / attendees / system IDs reviewed

1. Main findings and decisions
2. Priority actions: system ID, action, owner, target date, evidence needed
3. Unresolved questions and who will investigate them
4. Next review point and any separately scoped work

The discussion is implementation support, not a full audit or certification.
