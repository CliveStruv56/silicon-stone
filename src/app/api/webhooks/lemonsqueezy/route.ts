import { NextRequest, NextResponse } from 'next/server'
import {
  verifyWebhookSignature,
  webhookConfigured,
  claimWebhookDelivery,
  releaseWebhookDelivery,
  deliveryKey,
} from '@/lib/lemonsqueezy'

// Node runtime (HMAC via node:crypto) and never cached — this is a signed,
// side-effecting endpoint.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 100_000

/**
 * Lemon Squeezy webhook endpoint (P3-0). Verifies the signature, drops
 * duplicate retries, and dispatches by event name. Fulfilment (Model-A
 * download delivery, Model-B licence issue) lands in P3-4/P3-5 once the store
 * exists — for now each event is validated and logged so a test order in the
 * LS dashboard confirms the pipe end-to-end.
 *
 * Configure in LS: Settings → Webhooks → URL
 *   https://siliconandstone.com/api/webhooks/lemonsqueezy
 * with events order_created, subscription_created, subscription_updated,
 * subscription_cancelled, license_key_created, and the signing secret set as
 * LEMONSQUEEZY_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  if (!webhookConfigured()) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set; rejecting webhook')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const rawBody = await request.text()
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const signature = request.headers.get('x-signature')
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: { meta?: { event_name?: string }; data?: unknown }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = payload.meta?.event_name || request.headers.get('x-event-name') || 'unknown'

  // Idempotency: identical LS retries hash to the same key and are dropped.
  const key = deliveryKey(rawBody)
  const firstDelivery = await claimWebhookDelivery(key)
  if (!firstDelivery) {
    console.info(`[ls-webhook] duplicate delivery for ${eventName} — skipping`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (eventName) {
      case 'order_created':
        // TODO(P3-4): Model-A fulfilment — email/download link for the variant.
        // TODO(P3-5): if the variant issues licence keys, no action here (see
        // license_key_created); otherwise deliver the artefact.
        console.info('[ls-webhook] order_created')
        break
      case 'license_key_created':
        // TODO(P3-5): record the issued key so the post-checkout redirect can
        // auto-activate the on-site unlock.
        console.info('[ls-webhook] license_key_created')
        break
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_cancelled':
      case 'subscription_resumed':
      case 'subscription_expired':
        // TODO(P3-4): reflect subscription state for any recurring tier.
        console.info(`[ls-webhook] ${eventName}`)
        break
      default:
        console.info(`[ls-webhook] unhandled event ${eventName}`)
    }
  } catch (error) {
    // Release the claim so LS's retry re-processes rather than being masked as
    // a duplicate, then 500 to trigger that retry.
    await releaseWebhookDelivery(key)
    console.error(`[ls-webhook] handler error for ${eventName}:`, error)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
