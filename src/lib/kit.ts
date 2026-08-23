import 'server-only'

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
 * Tags the public /api/subscribe route may apply, mapped to their Kit tag-ID
 * env vars. Legacy PascalCase tags predate the one-list/tag architecture and
 * are kept for existing callers.
 */
export const SUBSCRIBE_TAG_IDS: Record<string, string | undefined> = {
  // Legacy
  Tool_Lead: process.env.CONVERTKIT_TOOL_LEAD_TAG_ID,
  WaymarkPath_Early_Access: process.env.CONVERTKIT_WAYMARKPATH_TAG_ID,
  // Early access + product tier requested (pre-launch capture)
  'early-access': process.env.CONVERTKIT_EARLY_ACCESS_TAG_ID,
  'tier-checklist': process.env.CONVERTKIT_TIER_CHECKLIST_TAG_ID,
  'tier-toolkit-standard': process.env.CONVERTKIT_TIER_TOOLKIT_STANDARD_TAG_ID,
  'tier-toolkit-professional': process.env.CONVERTKIT_TIER_TOOLKIT_PROFESSIONAL_TAG_ID,
  'tier-sector-reports': process.env.CONVERTKIT_TIER_SECTOR_REPORTS_TAG_ID,
  // Source segments (landing pages)
  'atlantic-drift': process.env.CONVERTKIT_ATLANTIC_DRIFT_TAG_ID,
  'eu-exposure': process.env.CONVERTKIT_EU_EXPOSURE_TAG_ID,
  // Tool results subscribe blocks
  'tool-compliance-checker': process.env.CONVERTKIT_TOOL_COMPLIANCE_CHECKER_TAG_ID,
  'tool-supply-chain-mapper': process.env.CONVERTKIT_TOOL_SUPPLY_CHAIN_MAPPER_TAG_ID,
  'tool-scenario-modeler': process.env.CONVERTKIT_TOOL_SCENARIO_MODELER_TAG_ID,
  'tool-policy-stress-test': process.env.CONVERTKIT_TOOL_POLICY_STRESS_TEST_TAG_ID,
}

/** Buyer tags applied by the Lemon Squeezy order_created webhook only. */
export const BUYER_TAG_IDS: Record<string, string | undefined> = {
  'buyer-checklist': process.env.CONVERTKIT_BUYER_CHECKLIST_TAG_ID,
  'buyer-toolkit-standard': process.env.CONVERTKIT_BUYER_TOOLKIT_STANDARD_TAG_ID,
  'buyer-toolkit-pro': process.env.CONVERTKIT_BUYER_TOOLKIT_PRO_TAG_ID,
}

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
