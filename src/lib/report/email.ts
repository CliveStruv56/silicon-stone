/**
 * Email validation for the report gate.
 *
 * Pure and dependency-free so it can be tested directly — it is the only thing
 * standing between an open endpoint and a store full of junk addresses paired
 * with descriptions of people's AI systems.
 *
 * Note what is deliberately *not* here: a verification round-trip. The spec asks
 * for a short-lived verification link, and this build has no mail sender by
 * design ("do not integrate with any mailing platform"). Sending that link is
 * the first thing to build when one exists; until then the report is delivered
 * on screen and the address is captured unverified, which the consent text says.
 */

/**
 * The version of the consent wording the user actually saw. Stored alongside
 * the address: "they consented" is not a defensible record unless you can say
 * to what.
 */
export const CONSENT_TEXT_VERSION = '2026-08-10'

export const CONSENT_TEXT =
  'We will use this address to deliver your report and to contact you about it. We will not add you to any mailing list unless you separately opt in.'

/** A short, conventional address check — not RFC 5322, and not trying to be. */
const EMAIL_PATTERN = /^[^\s@,;:<>()[\]\\]+@[^\s@.,;:<>()[\]\\]+(?:\.[^\s@.,;:<>()[\]\\]+)+$/

export const MAX_EMAIL_CHARS = 254

/**
 * Throwaway providers, blocked because the whole point of the gate is a durable
 * way to reach the person the report is about. This list is short on purpose:
 * an exhaustive one is a maintenance treadmill, and the cost of missing an entry
 * is one junk record, not a security failure.
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'mailinator.com',
  'maildrop.cc',
  'yopmail.com',
  'temp-mail.org',
  'tempmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'dispostable.com',
  'fakeinbox.com',
  'spamgourmet.com',
  'mytemp.email',
  'moakt.com',
  'emailondeck.com',
])

export type EmailRejection = 'malformed' | 'too-long' | 'disposable'

export type EmailCheck =
  | { ok: true; email: string; domain: string }
  | { ok: false; reason: EmailRejection }

export function checkEmail(input: unknown): EmailCheck {
  if (typeof input !== 'string') return { ok: false, reason: 'malformed' }

  const email = input.trim().toLowerCase()
  if (email.length > MAX_EMAIL_CHARS) return { ok: false, reason: 'too-long' }
  if (!EMAIL_PATTERN.test(email)) return { ok: false, reason: 'malformed' }

  const domain = email.slice(email.lastIndexOf('@') + 1)
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: 'disposable' }

  return { ok: true, email, domain }
}

export const EMAIL_REJECTION_MESSAGE: Record<EmailRejection, string> = {
  malformed: 'That does not look like an email address.',
  'too-long': 'That address is too long.',
  disposable:
    'Disposable addresses are not accepted here — the report is worth having somewhere you can find it again.',
}
