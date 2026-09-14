/**
 * Site-wide launch flags (pre-launch packaging changes). All are NEXT_PUBLIC_
 * so server and client components read the same value; flipping one is an env
 * change + redeploy, never a code edit.
 *
 * - PRE_LAUNCH (default true): while true every product CTA is the
 *   "Request Early Access" Kit capture and no Lemon Squeezy checkout is
 *   invoked. Set NEXT_PUBLIC_PRE_LAUNCH=false at launch.
 * - FREE_INTRO_WINDOW (default **false** since 2026-09-13, owner decision):
 *   the "free 25-minute intro conversation, first ninety days" copy. It was
 *   on by default from launch packaging until the owner retired the
 *   launch-window wording everywhere. The 25-minute conversation itself is
 *   still bookable (BOOKING_URL); only the "free during our launch window"
 *   line and the intro row on /pricing are gated. NEXT_PUBLIC_FREE_INTRO_END
 *   still bounds the window if the flag is ever turned back on.
 */

function envFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue
  return value !== 'false' && value !== '0'
}

export const PRE_LAUNCH = envFlag(process.env.NEXT_PUBLIC_PRE_LAUNCH, true)

const FREE_INTRO_END = process.env.NEXT_PUBLIC_FREE_INTRO_END || ''

export const FREE_INTRO_WINDOW =
  envFlag(process.env.NEXT_PUBLIC_FREE_INTRO_WINDOW, false) &&
  (!FREE_INTRO_END || Date.now() < Date.parse(FREE_INTRO_END))

/**
 * Calendar/booking link for the 25-minute intro call, shown on enquiry-form
 * success. Empty until the owner configures it (see LAUNCH.md).
 */
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || ''

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
