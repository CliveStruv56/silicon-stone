'use client'

import { projectId } from '../env'

/**
 * Makes Studio's own buttons work without a second login.
 *
 * "Run fact-check" and "Suggest two prompts" live in Studio but call this
 * app's API, which authenticates on the /login admin cookie rather than on
 * Sanity. The two sessions expire independently, so an editor could be signed
 * into Studio and refused by the buttons, with no warning until they clicked.
 *
 * `fetchWithAdminSession` closes that gap: on a 401 it trades the Sanity token
 * Studio already holds for an ordinary admin session (see
 * /api/studio-session), then replays the request once. The editor sees a
 * slightly slower click and nothing else.
 *
 * The manual /login route still exists and still works. This removes the need
 * to use it from inside Studio; it does not replace it.
 */

/**
 * Where Sanity Studio keeps the signed-in user's token. Verified against a
 * running Studio for this project; it is also how the Puppeteer test path
 * authenticates.
 *
 * This is Studio's internal storage rather than a published API, so treat a
 * miss as normal: every caller falls back to the old "sign in at /login"
 * path rather than failing. If a Sanity upgrade moves it, the buttons degrade
 * to the previous behaviour instead of breaking.
 */
const TOKEN_STORAGE_KEY = `__studio_auth_token_${projectId}`

/** Result of an exchange attempt, for callers that want to explain a failure. */
export type SessionExchange =
  | { ok: true }
  | { ok: false; reason: 'no-token' | 'rejected' | 'forbidden' | 'error'; message?: string }

export function readStudioToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: unknown }
    return typeof parsed?.token === 'string' && parsed.token ? parsed.token : null
  } catch {
    // Storage disabled, or the shape changed. Not an error worth surfacing —
    // the caller falls back to /login.
    return null
  }
}

/**
 * Trades the Studio token for an admin session cookie. Safe to call when one
 * already exists; it simply refreshes it.
 */
export async function exchangeStudioSession(): Promise<SessionExchange> {
  const token = readStudioToken()
  if (!token) return { ok: false, reason: 'no-token' }

  try {
    const res = await fetch('/api/studio-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) return { ok: true }

    let message: string | undefined
    try {
      message = ((await res.json()) as { error?: string }).error
    } catch {
      /* non-JSON body; fall through to the generic reason */
    }
    if (res.status === 403) return { ok: false, reason: 'forbidden', message }
    if (res.status === 401) return { ok: false, reason: 'rejected', message }
    return { ok: false, reason: 'error', message }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/**
 * fetch(), but a 401 triggers one silent re-authentication and one replay.
 *
 * Returns the *final* response, plus the exchange outcome when one was
 * attempted — so a caller can distinguish "your Sanity account lacks the role"
 * (actionable, and not fixed by signing in again) from "the request failed".
 *
 * Only 401 is retried. A 403, 409 or 429 is a real answer and is passed
 * straight back; retrying those would hide the reason.
 */
export async function fetchWithAdminSession(
  input: string,
  init?: RequestInit,
): Promise<{ res: Response; exchange?: SessionExchange }> {
  const res = await fetch(input, init)
  if (res.status !== 401) return { res }

  const exchange = await exchangeStudioSession()
  if (!exchange.ok) return { res, exchange }

  const retried = await fetch(input, init)
  return { res: retried, exchange }
}

/**
 * Turns a failed exchange into what to tell the editor, in one place, so the
 * fact-check action and the image-prompt input cannot drift apart on it.
 *
 * `openLogin` is false for `forbidden` on purpose: that account *is* signed in
 * correctly, and sending it to /login would be a loop with no exit. Only a
 * missing or rejected Sanity session earns the old fallback.
 */
export function describeExchangeFailure(exchange: SessionExchange | undefined): {
  title: string
  description: string
  openLogin: boolean
} {
  if (exchange?.ok === false && exchange.reason === 'forbidden') {
    return {
      title: 'Your Sanity account cannot run this',
      description:
        exchange.message ??
        'This project’s site tools are limited to Sanity administrators.',
      openLogin: false,
    }
  }
  if (exchange?.ok === false && exchange.reason === 'no-token') {
    return {
      title: 'Not signed in to Sanity',
      description:
        'Reload Studio and sign in, or use the admin access code at /login.',
      openLogin: true,
    }
  }
  return {
    title: 'Admin session expired',
    description:
      'Could not renew it from your Sanity login. Opened /login in a new tab — sign in there, then try again.',
    openLogin: true,
  }
}
