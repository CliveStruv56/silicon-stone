/**
 * A Lemon Squeezy checkout URL counts as "configured" only when it's set and is
 * not the placeholder. Drives whether a product buy button is live or falls back
 * to the contact CTA. Previously duplicated across product pages.
 */
export function isConfiguredCheckout(url?: string): boolean {
  return Boolean(url && !url.includes('example.com'))
}
