import 'server-only'

import { LEMONSQUEEZY_TIMEOUT_MS } from './timeouts'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { getRedis } from '@/lib/redis'

/**
 * Lemon Squeezy webhook + Licence API helpers (P3-0). LS is the Merchant of
 * Record — it handles VAT, receipts and wallet payments — so our side only
 * needs to (a) verify signed webhooks, (b) process them idempotently, and
 * (later, P3-4/P3-5) fulfil orders and validate licence keys. The API key and
 * signing secret are server-side secrets, never exposed to the client.
 */

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || ''
const API_KEY = process.env.LEMONSQUEEZY_API_KEY || ''
const LS_API = 'https://api.lemonsqueezy.com/v1'

export function webhookConfigured(): boolean {
  return Boolean(WEBHOOK_SECRET)
}

export function apiConfigured(): boolean {
  return Boolean(API_KEY)
}

/**
 * Verify the `X-Signature` header against the raw request body using the
 * webhook signing secret (HMAC-SHA256, hex). Constant-time comparison.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(rawBody, 'utf8').digest('hex')
  const a = Buffer.from(expected, 'hex')
  let b: Buffer
  try {
    b = Buffer.from(signature, 'hex')
  } catch {
    return false
  }
  if (a.length !== b.length || a.length === 0) return false
  return timingSafeEqual(a, b)
}

export interface LemonWebhookEvent {
  eventName: string
  /** Stable de-dupe key: the exact bytes LS signed, hashed. Retries repeat it. */
  data: unknown
  meta: {
    event_name?: string
    custom_data?: Record<string, unknown>
  }
}

/**
 * Mark a webhook delivery as processed, returning true only the first time.
 * Keyed on a hash of the raw body so LS retries of an identical payload are
 * dropped. Falls back to "always process" (returns true) when Upstash is not
 * configured, so a missing store never silently swallows events — at worst a
 * retry is handled twice, which downstream fulfilment must itself tolerate.
 */
export async function claimWebhookDelivery(dedupeKey: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true
  // NX = set only if absent; EX = 7-day retention (LS retries within ~3 days).
  const result = await redis.set(`ls:webhook:${dedupeKey}`, '1', {
    nx: true,
    ex: 7 * 24 * 60 * 60,
  })
  return result === 'OK'
}

/**
 * Release a claimed delivery so a failed handler can be retried by LS. Call
 * this when processing throws after the claim succeeded, so the dedupe key does
 * not permanently mask an event that was never actually handled.
 */
export async function releaseWebhookDelivery(dedupeKey: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(`ls:webhook:${dedupeKey}`)
  } catch {
    // Best-effort; the 7-day TTL eventually clears it regardless.
  }
}

/** SHA-256 of the raw body, hex — the idempotency key for a delivery. */
export function deliveryKey(rawBody: string): string {
  return createHmac('sha256', 'ls-delivery').update(rawBody, 'utf8').digest('hex')
}

// ── Licence API (P3-5, Model B on-site unlock) ──────────────────────────────
// Wired now so the entitlement route can re-validate per request once the store
// exists. Bearer credential: mitigate sharing with LS activation caps.

export interface LicenseValidation {
  valid: boolean
  status?: string
  activationLimit?: number
  activationUsage?: number
  productId?: number
  variantId?: number
  error?: string
}

async function licenseCall(
  path: '/licenses/validate' | '/licenses/activate',
  body: Record<string, string>,
): Promise<LicenseValidation> {
  try {
    const res = await fetch(`${LS_API}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
      cache: 'no-store',
      signal: AbortSignal.timeout(LEMONSQUEEZY_TIMEOUT_MS),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    const meta = (json.license_key as Record<string, unknown>) || {}
    const instance = json.meta as Record<string, unknown> | undefined
    return {
      valid: Boolean(json.valid),
      status: typeof meta.status === 'string' ? meta.status : undefined,
      activationLimit: typeof meta.activation_limit === 'number' ? meta.activation_limit : undefined,
      activationUsage: typeof meta.activation_usage === 'number' ? meta.activation_usage : undefined,
      productId: typeof instance?.product_id === 'number' ? instance.product_id : undefined,
      variantId: typeof instance?.variant_id === 'number' ? instance.variant_id : undefined,
      error: typeof json.error === 'string' ? json.error : undefined,
    }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Licence API error' }
  }
}

/** Validate a licence key (optionally scoped to an activation instance). */
export function validateLicense(licenseKey: string, instanceId?: string): Promise<LicenseValidation> {
  return licenseCall('/licenses/validate', {
    license_key: licenseKey,
    ...(instanceId ? { instance_id: instanceId } : {}),
  })
}

/** Activate a licence key on this device (consumes one activation). */
export function activateLicense(licenseKey: string, instanceName: string): Promise<LicenseValidation> {
  return licenseCall('/licenses/activate', {
    license_key: licenseKey,
    instance_name: instanceName,
  })
}
