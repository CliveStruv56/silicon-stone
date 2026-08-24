import 'server-only'

import { RESEND_TIMEOUT_MS } from './timeouts'
import {
  buildEnquiryNotification,
  type Enquiry,
  type StorageOutcome,
} from './enquiry-notification'

/**
 * Transactional email. One sender, one message type, and a hard rule that it
 * can never fail a request.
 *
 * Resend is reached over plain `fetch` rather than through the `resend` package,
 * for the same two reasons every other upstream here is: `AbortSignal.timeout`
 * gives a real bound that the SDK does not expose, and this project's
 * dependency ceilings (see CLAUDE.md) make a new runtime dependency a cost worth
 * avoiding for fifteen lines of HTTP.
 *
 * **This is advisory, exactly like the draft-time editorial guards.** The
 * enquiry has already been written to Kit by the time we get here. An email
 * that fails must never turn a submitted enquiry into an error page for the
 * visitor — so every path returns a status instead of throwing, and the caller
 * logs it.
 */

const RESEND_API = 'https://api.resend.com/emails'

const API_KEY = process.env.RESEND_API_KEY || ''
/** Where enquiry notifications go. Unset = the feature is off. */
const NOTIFY_TO = process.env.ENQUIRY_NOTIFY_TO || ''
/** Must be an address on a domain verified in Resend, or Resend rejects it. */
const NOTIFY_FROM = process.env.ENQUIRY_NOTIFY_FROM || ''

export type NotifyStatus = 'sent' | 'unconfigured' | 'failed'

export function emailConfigured(): boolean {
  return Boolean(API_KEY && NOTIFY_TO && NOTIFY_FROM)
}

/**
 * Email the owner about one enquiry. Returns what happened; never throws.
 *
 * `outcome` is whether the enquiry actually reached Kit — see
 * `enquiry-notification.ts` for why that changes the subject line rather than
 * only the body.
 */
export async function notifyEnquiry(
  enquiry: Enquiry,
  outcome: StorageOutcome,
): Promise<NotifyStatus> {
  if (!emailConfigured()) {
    // Deliberately not an error: the site ran without this for months, and a
    // half-configured environment should degrade to the old behaviour rather
    // than start 500ing a public form. Named vars so the log says which.
    console.info('[enquiry-notify] not configured; skipping', {
      hasKey: Boolean(API_KEY),
      hasTo: Boolean(NOTIFY_TO),
      hasFrom: Boolean(NOTIFY_FROM),
    })
    return 'unconfigured'
  }

  const { subject, text, replyTo } = buildEnquiryNotification(enquiry, outcome)

  // Built before the call rather than inline, so `signal:` stays within twelve
  // lines of the outbound call. `scripts/security-checks.ts` reads that window
  // looking for the bound, and a payload long enough to push it out reads as
  // unbounded to the guard even when it is not.
  //
  // `reply_to` is snake_case: Resend ignores unknown keys rather than
  // rejecting them, so `replyTo` would silently send replies to ourselves.
  const payload = JSON.stringify({
    from: NOTIFY_FROM,
    to: [NOTIFY_TO],
    reply_to: replyTo,
    subject,
    text,
  })

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: payload,
      cache: 'no-store',
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    })

    if (!res.ok) {
      // Status only. The body echoes the payload, which is the enquirer's own
      // message — it does not belong in a log line.
      console.error('[enquiry-notify] Resend rejected the send:', res.status)
      return 'failed'
    }
    return 'sent'
  } catch (error) {
    console.error(
      '[enquiry-notify] send failed:',
      error instanceof Error ? error.message : 'unknown error',
    )
    return 'failed'
  }
}
