/**
 * Site-wide launch flags (pre-launch packaging changes). All are NEXT_PUBLIC_
 * so server and client components read the same value; flipping one is an env
 * change + redeploy, never a code edit.
 *
 * - PRE_LAUNCH (default true): while true every product CTA is the
 *   "Request Early Access" Kit capture and no Lemon Squeezy checkout is
 *   invoked. Set NEXT_PUBLIC_PRE_LAUNCH=false at launch.
 * - FOUNDING_OFFER_ACTIVE (default true): shows the founding-rate block on the
 *   Drift Retainer (£1,500/mo for the first six months, first five clients).
 * - FREE_INTRO_WINDOW (default true): the free 25-minute intro conversation is
 *   offered for the first 90 days post-launch. NEXT_PUBLIC_FREE_INTRO_END is
 *   the window's end date (ISO, e.g. 2026-12-31); once past, the flag reads
 *   false at the next build/render without an env change.
 */

function envFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue
  return value !== 'false' && value !== '0'
}

export const PRE_LAUNCH = envFlag(process.env.NEXT_PUBLIC_PRE_LAUNCH, true)

export const FOUNDING_OFFER_ACTIVE = envFlag(
  process.env.NEXT_PUBLIC_FOUNDING_OFFER_ACTIVE,
  true,
)

const FREE_INTRO_END = process.env.NEXT_PUBLIC_FREE_INTRO_END || ''

export const FREE_INTRO_WINDOW =
  envFlag(process.env.NEXT_PUBLIC_FREE_INTRO_WINDOW, true) &&
  (!FREE_INTRO_END || Date.now() < Date.parse(FREE_INTRO_END))

/**
 * Calendar/booking link for the 25-minute intro call, shown on enquiry-form
 * success. Empty until the owner configures it (see LAUNCH.md).
 */
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || ''

/**
 * The £39 Evidence Pack — components 4–11 of the Compliance Checker report,
 * plus the £39 credit against the £79 toolkit.
 *
 * Default FALSE, unlike every other flag here. It stays dark until the Lemon
 * Squeezy store exists: the credit is a single-use code scoped to a SKU, and
 * advertising a paid upgrade that cannot be bought is worse than not mentioning
 * it. Turning this on is not sufficient on its own — checkout and code issuance
 * have to be built first. See LAUNCH.md and project_summary.md §11.
 */
export const EVIDENCE_PACK_ENABLED = envFlag(
  process.env.NEXT_PUBLIC_EVIDENCE_PACK_ENABLED,
  false,
)

/**
 * The Compliance Checker v2 rebuild (`docs/# EU AI Act Compliance Checker v2 —
 * Impl.md`). Default FALSE, and it stays false until the §20 release acceptance
 * criteria pass.
 *
 * v2 removes the score from legal classification, requires an exact Article 6 /
 * Annex route behind every high-risk result, and types every finding by role and
 * by whether it applies now, later or conditionally. v1 keeps serving users
 * until then — the flag exists so the two can be built side by side rather than
 * through a long-lived branch, and so v2 can be compared against v1 in shadow
 * mode (Phase 8) before anyone sees it.
 *
 * NEXT_PUBLIC_ like the rest: server and client must agree on which checker is
 * live within a single render.
 */
export const COMPLIANCE_CHECKER_V2 = envFlag(
  process.env.NEXT_PUBLIC_COMPLIANCE_CHECKER_V2,
  false,
)
