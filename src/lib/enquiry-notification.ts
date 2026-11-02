/**
 * The owner-facing notification for an advisory enquiry.
 *
 * `/api/contact` records an enquiry on a Standfirst contact. On its own that
 * tells nobody, so this module builds the owner's email; `email.ts` sends it.
 *
 * Two decisions worth keeping:
 *
 *  1. **The email carries the whole enquiry, not a "you have a new enquiry"
 *     ping.** It is the backstop copy. When the Standfirst write fails — the one case
 *     where the enquiry would otherwise be lost outright — the notification is
 *     the only surviving record of it, so it has to be complete enough to act
 *     on and to re-enter by hand.
 *  2. **`stored: false` changes the subject line, not just the body.** A failure
 *     that reads identically to a success in the inbox list is a failure nobody
 *     acts on.
 *
 * Pure and separately tested, on the `publish-preflight.ts` pattern: what the
 * operator is told cannot drift from what the route decided, because the route
 * has no copy of its own.
 */

/** The five fields `/api/contact` accepts, after its own normalisation. */
export interface Enquiry {
  name: string
  email: string
  company: string
  interest: string
  message: string
}

export interface EnquiryNotification {
  subject: string
  text: string
  /** Set as Reply-To so a reply from the inbox reaches the enquirer directly. */
  replyTo: string
}

/**
 * Collapse to a single line and cap.
 *
 * `normalizeField()` in the route trims and truncates but does **not** strip
 * newlines, and `company` / `interest` are attacker-controlled strings that end
 * up in a mail Subject. A newline in a header is the classic injection shape.
 * Resend takes JSON and builds the MIME itself, so this is defence in depth
 * rather than the only thing standing in the way — but a header field is never
 * legitimately multi-line, so there is nothing to weigh up.
 */
export function singleLine(value: string, max = 120): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

/** How the enquiry fared in Standfirst. */
export type StorageOutcome = 'stored' | 'failed'

/**
 * Build the notification. `outcome` is what actually happened to the enquiry
 * downstream, not what the visitor was told.
 */
export function buildEnquiryNotification(
  enquiry: Enquiry,
  outcome: StorageOutcome,
): EnquiryNotification {
  const failed = outcome === 'failed'

  // Whoever it is from, in the words most useful in an inbox list: the company
  // if they gave one, otherwise the person.
  const who = singleLine(enquiry.company) || singleLine(enquiry.name) || enquiry.email
  const interest = singleLine(enquiry.interest) || 'General enquiry'

  const subject = failed
    ? `[NOT SAVED] Enquiry — ${interest} — ${who}`
    : `Enquiry — ${interest} — ${who}`

  const lines = [
    failed
      ? 'THIS ENQUIRY WAS NOT SAVED. The Standfirst write failed, so this email is the\n' +
        'only copy. Re-enter it by hand or reply to the sender directly.'
      : 'A new enquiry came in through the site.',
    '',
    `Name:     ${enquiry.name || '—'}`,
    `Email:    ${enquiry.email}`,
    `Company:  ${enquiry.company || '—'}`,
    `Interest: ${enquiry.interest || '—'}`,
    '',
    'Message:',
    enquiry.message || '(no message)',
    '',
    '—',
    failed
      ? 'Saved to Standfirst: NO — this copy is the record.'
      : 'Saved to Standfirst: yes. Reply to this email to answer the sender.',
  ]

  return { subject, text: lines.join('\n'), replyTo: enquiry.email }
}
