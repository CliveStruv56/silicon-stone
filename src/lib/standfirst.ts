import 'server-only'

import { STANDFIRST_TIMEOUT_MS } from './timeouts'

/**
 * The site's client for Standfirst's `POST /v1/contacts`. Server-side only: the
 * key must never reach the browser, and this is why the CSP needs no change.
 *
 * Never throws and never logs an address. Each caller decides what a failure
 * means, because the right answer differs: a signup shows the visitor an error,
 * an enquiry falls back to the owner's email, and a purchase is retried.
 */

export interface StandfirstContact {
  email: string
  firstName?: string
  /** Through this form's double opt-in. Omit it, with `subscribe: false`, to record only. */
  formSlug?: string
  /** False records the person without subscribing them. An enquiry or a purchase is not consent. */
  subscribe?: false
  tags?: string[]
  source?: string
  fields?: Record<string, string>
  /** The visitor's request details, for the consent record. */
  consent?: {
    basis: 'consent' | 'legitimate_interest'
    wording?: string
    ip?: string
    userAgent?: string
  }
}

export type StandfirstResult =
  | { ok: true; status: 'pending_confirmation' | 'subscribed' | 'recorded' | 'ignored' }
  | { ok: false; reason: 'not_configured' | 'rejected' | 'unavailable' }

export function standfirstConfigured(): boolean {
  return Boolean(process.env.STANDFIRST_API_URL && process.env.STANDFIRST_API_KEY)
}

export async function upsertContact(contact: StandfirstContact): Promise<StandfirstResult> {
  if (!standfirstConfigured()) {
    console.error('[standfirst] STANDFIRST_API_URL or STANDFIRST_API_KEY is not set')
    return { ok: false, reason: 'not_configured' }
  }

  const url = `${process.env.STANDFIRST_API_URL!.replace(/\/$/, '')}/v1/contacts`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.STANDFIRST_API_KEY}`,
      },
      body: JSON.stringify(contact),
      cache: 'no-store',
      signal: AbortSignal.timeout(STANDFIRST_TIMEOUT_MS),
    })
    const data = (await res.json().catch(() => ({}))) as {
      status?: Extract<StandfirstResult, { ok: true }>['status']
      error?: string
      message?: string
    }
    if (res.ok && data.status) return { ok: true, status: data.status }

    // `message` names a form or a field, never the address.
    console.error('[standfirst] contact refused:', res.status, data.error, data.message)
    return { ok: false, reason: res.status >= 500 ? 'unavailable' : 'rejected' }
  } catch (error) {
    console.error('[standfirst] request failed:', error instanceof Error ? error.name : 'unknown')
    return { ok: false, reason: 'unavailable' }
  }
}
