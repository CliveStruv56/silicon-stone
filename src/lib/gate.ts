/**
 * Shared types + resolution for the end-of-article Gate (P3-1/P3-3).
 *
 * The gate is a conversion surface appended below the article body — it never
 * blocks free reading. One of three modes renders from Sanity metadata:
 *  - email    → newsletter capture
 *  - commerce → product upsell (opens Lemon Squeezy checkout when configured)
 *  - lead     → book-a-call
 * Plus `auto` (commerce if a product maps to the article's topics, else email)
 * and `none`.
 */

export type GateMode = 'auto' | 'email' | 'commerce' | 'lead' | 'none'

export interface GateProduct {
  name: string
  slug: string
  kind?: string | null
  priceLabel?: string | null
  blurb?: string | null
  productPath: string
  checkoutUrl?: string | null
  deliveryModel?: 'download' | 'unlock' | null
  badge?: string | null
  isDefault?: boolean | null
  /** Category slugs this product is relevant to (for topic matching). */
  topics?: string[] | null
}

export interface GateConfig {
  mode?: GateMode | null
  product?: GateProduct | null
  href?: string | null
  headline?: string | null
  body?: string | null
  ctaLabel?: string | null
}

/** The concrete mode + copy the client Gate component renders. */
export type ResolvedGate =
  | { mode: 'none' }
  | {
      mode: 'email'
      headline: string
      body: string
      ctaLabel: string
    }
  | {
      mode: 'commerce'
      headline: string
      body: string
      ctaLabel: string
      product: GateProduct
    }
  | {
      mode: 'lead'
      headline: string
      body: string
      ctaLabel: string
      href: string
    }

const DEFAULT_LEAD_HREF = '/advisory#contact'

/**
 * Pick the topic-relevant product to upsell against an article. Precedence:
 *  1. explicit product on the gate,
 *  2. first product whose topics intersect the article's categories,
 *  3. nothing.
 * The `isDefault` fallback is deliberately NOT applied here — it is used only
 * for an explicit `commerce` gate (see `resolveGate`), so `auto` articles with
 * no topic match fall back to the newsletter rather than a blanket upsell.
 */
export function resolveUpsellProduct(
  explicit: GateProduct | null | undefined,
  articleCategorySlugs: string[],
  products: GateProduct[],
): GateProduct | null {
  if (explicit) return explicit

  const wanted = new Set(articleCategorySlugs)
  return (
    products.find((p) => (p.topics || []).some((slug) => wanted.has(slug))) || null
  )
}

/** The product flagged as the site-wide default upsell, if any. */
export function findDefaultProduct(products: GateProduct[]): GateProduct | null {
  return products.find((p) => p.isDefault) || null
}

/**
 * Turn the Sanity gate config + resolved product into the exact mode + copy to
 * render. `emailFallback` supplies the persona-aware newsletter copy so an
 * `auto`/`email` gate reuses the same headline/subheadline as the standing CTA.
 *
 * `defaultProduct` backs an explicit `commerce` gate whose article has no topic
 * match; `auto` never uses it (falls back to the newsletter instead).
 */
export function resolveGate(params: {
  gate: GateConfig | null | undefined
  upsellProduct: GateProduct | null
  defaultProduct?: GateProduct | null
  emailFallback: { headline: string; body: string }
}): ResolvedGate {
  const { gate, upsellProduct, defaultProduct, emailFallback } = params
  const mode: GateMode = gate?.mode || 'auto'

  if (mode === 'none') return { mode: 'none' }

  const emailGate = (): ResolvedGate => ({
    mode: 'email',
    headline: gate?.headline || emailFallback.headline,
    body: gate?.body || emailFallback.body,
    ctaLabel: gate?.ctaLabel || 'Subscribe',
  })

  const commerceGate = (product: GateProduct): ResolvedGate => ({
    mode: 'commerce',
    headline: gate?.headline || `Go deeper: ${product.name}`,
    body:
      gate?.body ||
      product.blurb ||
      'A practical companion to what you just read — built for the same decisions.',
    ctaLabel:
      gate?.ctaLabel ||
      (product.priceLabel ? `Get it — ${product.priceLabel}` : 'View product'),
    product,
  })

  const leadGate = (): ResolvedGate => ({
    mode: 'lead',
    headline: gate?.headline || 'Need this applied to your own exposure?',
    body:
      gate?.body ||
      'Advisory work turns the analysis into a plan for your organisation — assessment, board briefing, and a phased action set.',
    ctaLabel: gate?.ctaLabel || 'Book a call',
    href: gate?.href || DEFAULT_LEAD_HREF,
  })

  if (mode === 'lead') return leadGate()
  if (mode === 'email') return emailGate()
  if (mode === 'commerce') {
    // Explicit commerce: prefer topic/explicit match, fall back to the default
    // product, and only drop to the newsletter if no product exists at all.
    const product = upsellProduct || defaultProduct
    return product ? commerceGate(product) : emailGate()
  }

  // auto: commerce only when a product maps to the topic, else the newsletter.
  return upsellProduct ? commerceGate(upsellProduct) : emailGate()
}
