import 'server-only'

import { BUYER_TAGS, SUBSCRIBE_TAGS, tagIdsFrom } from './kit-tags'
import { KIT_TIMEOUT_MS } from './timeouts'

/**
 * Kit (ConvertKit) API v4 helpers. One Kit list/form site-wide; every audience
 * distinction is a tag, never a separate subscription. Tag IDs live in env
 * (CONVERTKIT_*_TAG_ID) — a missing ID means that tag is skipped gracefully,
 * the subscribe itself still succeeds.
 */

const KIT_API = 'https://api.kit.com/v4'
const KIT_API_KEY = process.env.CONVERTKIT_API_KEY || ''

/**
 * Tags the public /api/subscribe route may apply, name → Kit tag ID. The
 * registry (`kit-tags.ts`) is the single list of names and env vars; this is
 * it read against the environment once at module load.
 */
export const SUBSCRIBE_TAG_IDS: Record<string, string | undefined> = tagIdsFrom(SUBSCRIBE_TAGS, process.env)

/** Buyer tags applied by the Lemon Squeezy order_created webhook only. */
export const BUYER_TAG_IDS: Record<string, string | undefined> = tagIdsFrom(BUYER_TAGS, process.env)

export function kitConfigured(): boolean {
  return Boolean(KIT_API_KEY)
}

function kitHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Kit-Api-Key': KIT_API_KEY,
  }
}

/**
 * Create (or fetch, if they already exist) a subscriber outside any form —
 * used for buyers, who did not opt into the newsletter form. Returns the
 * subscriber ID, or null on failure.
 */
export async function ensureSubscriber(email: string): Promise<number | null> {
  const res = await fetch(`${KIT_API}/subscribers`, {
    method: 'POST',
    headers: kitHeaders(),
    body: JSON.stringify({ email_address: email }),
    cache: 'no-store',
    signal: AbortSignal.timeout(KIT_TIMEOUT_MS),
  })
  if (!res.ok) {
    console.error('Kit ensureSubscriber failed:', res.status)
    return null
  }
  const data = (await res.json().catch(() => ({}))) as {
    subscriber?: { id?: number }
  }
  return data.subscriber?.id ?? null
}

/** Apply a tag (by Kit tag ID) to a subscriber ID. Returns success. */
export async function tagSubscriber(tagId: string, subscriberId: number): Promise<boolean> {
  const res = await fetch(`${KIT_API}/tags/${tagId}/subscribers/${subscriberId}`, {
    method: 'POST',
    headers: kitHeaders(),
    body: JSON.stringify({}),
    cache: 'no-store',
    signal: AbortSignal.timeout(KIT_TIMEOUT_MS),
  })
  if (!res.ok) {
    console.error('Kit tagSubscriber failed:', res.status, 'tag', tagId)
  }
  return res.ok
}
