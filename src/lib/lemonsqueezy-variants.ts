/**
 * Which Kit buyer tag an order earns, by Lemon Squeezy variant. Variant IDs
 * are numbers Lemon Squeezy assigns when the owner creates each variant, so
 * they live in env (LEMONSQUEEZY_VARIANT_ID_*), never in code. Pure so the
 * mapping is testable without the server-only webhook module around it.
 *
 * Buyer tags are applied ONLY by the signed order_created webhook: they are
 * kept out of the public /api/subscribe allow-list on purpose, so a tag is
 * evidence that Lemon Squeezy reported a paid order and nothing else can mint
 * one. The tag name is per product, so a second sector report gets its own
 * entry here and its own tag rather than sharing this one.
 */
export const VARIANT_ENV_BY_BUYER_TAG = {
  'buyer-toolkit-standard': 'LEMONSQUEEZY_VARIANT_ID_TOOLKIT_STANDARD',
  'buyer-toolkit-pro': 'LEMONSQUEEZY_VARIANT_ID_TOOLKIT_PRO',
  'buyer-sector-report-manufacturing': 'LEMONSQUEEZY_VARIANT_ID_SECTOR_REPORT_MANUFACTURING',
  'buyer-advisory-briefing': 'LEMONSQUEEZY_VARIANT_ID_ADVISORY_BRIEFING',
} as const

export type BuyerTag = keyof typeof VARIANT_ENV_BY_BUYER_TAG

export const BUYER_TAGS = Object.keys(VARIANT_ENV_BY_BUYER_TAG) as BuyerTag[]

export function buyerTagForVariant(
  variantId: number | string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): BuyerTag | null {
  const id = variantId === undefined || variantId === null ? '' : String(variantId).trim()
  if (!id) return null
  for (const tag of BUYER_TAGS) {
    const configured = (env[VARIANT_ENV_BY_BUYER_TAG[tag]] ?? '').trim()
    // An unset variant must never match anything: compare only configured values.
    if (configured && configured === id) return tag
  }
  return null
}
