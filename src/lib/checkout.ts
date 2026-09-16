import { PRE_LAUNCH } from './flags'

/**
 * Lemon Squeezy checkout links, one per sellable SKU. NEXT_PUBLIC_ so server
 * and client render the same button; each must be referenced literally here
 * for Next to inline it into the client bundle. A missing or placeholder value
 * means "not on sale yet" and the page falls back to its early-access capture.
 */
export const CHECKOUT_URLS = {
  toolkitStandard: process.env.NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_STANDARD_URL,
  toolkitProfessional: process.env.NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_PROFESSIONAL_URL,
  sectorReportManufacturing: process.env.NEXT_PUBLIC_LEMONSQUEEZY_SECTOR_REPORT_MANUFACTURING_URL,
  advisoryBriefing: process.env.NEXT_PUBLIC_LEMONSQUEEZY_ADVISORY_BRIEFING_URL,
} as const

/** The one sector report with a checkout. A second report gets its own entry. */
export const MANUFACTURING_REPORT_SLUG = 'ai-and-european-manufacturing'

/**
 * A Lemon Squeezy checkout URL counts as "configured" only when it's set and is
 * not the placeholder. Drives whether a product buy button is live or falls back
 * to the contact CTA. Previously duplicated across product pages.
 */
export function isConfiguredCheckout(url?: string): boolean {
  return Boolean(url && !url.includes('example.com'))
}

/**
 * The URL a Buy button may open, or null when the button must not exist.
 * Two gates, both deliberate: the site-wide PRE_LAUNCH flag (no checkout is
 * invoked anywhere while it is on) and the placeholder check above. Every
 * purchase surface goes through this so the two conditions cannot drift apart
 * page by page.
 */
export function liveCheckoutUrl(url: string | undefined, preLaunch: boolean = PRE_LAUNCH): string | null {
  return !preLaunch && isConfiguredCheckout(url) ? (url as string) : null
}

/** Checkout for a sector report by slug; null for any report not yet on sale. */
export function sectorReportCheckoutUrl(slug: string, preLaunch: boolean = PRE_LAUNCH): string | null {
  if (slug !== MANUFACTURING_REPORT_SLUG) return null
  return liveCheckoutUrl(CHECKOUT_URLS.sectorReportManufacturing, preLaunch)
}
