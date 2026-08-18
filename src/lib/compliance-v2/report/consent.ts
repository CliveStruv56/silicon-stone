/**
 * Consent for report delivery (§13.2).
 *
 * The rule that shapes this file: "Keep report-delivery consent separate from
 * marketing consent. Do not subscribe the user to marketing merely because they
 * request the report." So they are two fields, not one, and the type has no way
 * to express "agreed to both" as a single value — which is the shape that makes
 * the mistake unrepresentable rather than merely discouraged.
 *
 * §13.2 also requires the consent wording actually shown to be recorded, not
 * just the fact of agreement. A record that says "consented" without saying to
 * what is not evidence of anything, and the wording will change.
 */

export const CONSENT_VERSION = '2026-08-18'

export const DELIVERY_WORDING =
  'Send my report to this address. We use it to deliver the report and to let you know if the assessment behind it changes.'

export const MARKETING_WORDING =
  'Also send me occasional analysis on EU technology regulation. Separate from the report, and you can stop it at any time.'

export interface ReportConsent {
  email: string
  /** Required. Without it there is nowhere to send the report. */
  delivery: true
  /** Optional, and defaulted to false. Never inferred from `delivery`. */
  marketing: boolean
  /** The exact wording shown, so the record says what was agreed to. */
  wording: { delivery: string; marketing: string; version: string }
  capturedAt: string
}

export type ConsentProblem =
  | 'email-missing'
  | 'email-malformed'
  | 'delivery-consent-missing'

/**
 * Build a consent record, or say why not.
 *
 * `marketing` is a parameter with no default at the call site on purpose: a
 * caller has to decide, and the only way to get `true` is to pass it. There is
 * no path through this function where agreeing to delivery produces a marketing
 * opt-in.
 */
export function buildConsent(input: {
  email: string
  delivery: boolean
  marketing: boolean
  capturedAt: string
}): { consent: ReportConsent } | { problems: ConsentProblem[] } {
  const problems: ConsentProblem[] = []
  const email = input.email.trim()

  if (!email) problems.push('email-missing')
  // Deliberately loose. A stricter pattern rejects real addresses, and the only
  // authority on whether an address works is trying to send to it.
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push('email-malformed')

  if (!input.delivery) problems.push('delivery-consent-missing')

  if (problems.length) return { problems }

  return {
    consent: {
      email,
      delivery: true,
      marketing: input.marketing === true,
      wording: {
        delivery: DELIVERY_WORDING,
        marketing: MARKETING_WORDING,
        version: CONSENT_VERSION,
      },
      capturedAt: input.capturedAt,
    },
  }
}

/**
 * What may be logged about a consent record.
 *
 * §13.3 says to log rule ids and system errors, not unrestricted answer text —
 * and an email address is the most identifiable thing the assessment touches.
 * This is what a log line gets: that consent happened, to which wording, and
 * whether marketing was included. Never the address.
 */
export function loggableConsent(consent: ReportConsent): Record<string, string | boolean> {
  return {
    consentVersion: consent.wording.version,
    delivery: true,
    marketing: consent.marketing,
    capturedAt: consent.capturedAt,
  }
}
