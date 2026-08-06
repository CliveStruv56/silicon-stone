/**
 * Canonical site origin — the single source of truth for absolute URLs in
 * metadata, canonicals, Open Graph, JSON-LD, the sitemap and robots.
 *
 * Production redirects send www → apex (308), so the canonical host is the bare
 * apex. Every discovery surface must agree on it, or canonicals, OG URLs and
 * schema @ids drift apart. This must stay in step with the Vercel project's
 * domain redirect — if that flips, change it here in the same breath, or every
 * canonical will point at a host that redirects.
 *
 * Override per-environment with NEXT_PUBLIC_SITE_URL (e.g. a preview deploy).
 */
const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://siliconandstone.com'

/** Canonical origin, no trailing slash (e.g. "https://siliconandstone.com"). */
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, '')

/** Brand name used across metadata and schema. */
export const SITE_NAME = 'Silicon and Stone'

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}
