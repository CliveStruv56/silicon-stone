import { AMOUNTS, gbp, offeringById } from './offering'
import { CHECKOUT_URLS, liveCheckoutUrl, MANUFACTURING_REPORT_SLUG, sectorReportCheckoutUrl } from './checkout'

/**
 * Shared types + resolution for the end-of-article Gate (P3-1/P3-3).
 *
 * The gate is a conversion surface appended below the article body — it never
 * blocks free reading. One of three modes renders from Sanity metadata:
 *  - email    → newsletter capture
 *  - commerce → product upsell (opens Lemon Squeezy checkout when configured)
 *  - lead     → book-a-call
 * Plus `auto` (commerce if a product maps to the article's topics, else the
 * article's category default, else email) and `none`.
 */

export type GateMode = 'auto' | 'email' | 'commerce' | 'lead' | 'none'

/**
 * What a category says an `auto` article should close on when no product maps
 * to it (`category.defaultGateMode`). Deliberately excludes `commerce`: with no
 * product match, a commerce gate could only fall back to the `isDefault`
 * product, and `resolveUpsellProduct` refuses that blanket upsell on purpose.
 */
export type CategoryGateFallback = 'email' | 'lead' | 'none'

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

/** Resolve retained CMS references to the consolidated offer before rendering. */
export function currentGateProduct(product: GateProduct): GateProduct {
  if (product.slug === 'sector-reports' || product.productPath.startsWith('/products/sector-reports')) {
    return {
      ...product,
      priceLabel: `${gbp(AMOUNTS.sectorReport)} · 12 months of monthly updates`,
      // The generic Sector Reports product backs one report today. Its checkout
      // opens only once both launch gates clear; until then the gate links to
      // the preview. Never reuse a stale CMS checkout URL here.
      checkoutUrl: sectorReportCheckoutUrl(MANUFACTURING_REPORT_SLUG),
      badge: sectorReportCheckoutUrl(MANUFACTURING_REPORT_SLUG) ? 'Available now' : 'Preview available',
      blurb: 'Explore the report contents and opening Executive Summary. One payment covers one named reader, with monthly PDF updates for 12 months and optional renewal.',
    }
  }
  if (!['ai-audit-checklist', 'ai-act-toolkit'].includes(product.slug) &&
      !['/products/ai-audit-checklist', '/products/ai-act-toolkit'].includes(product.productPath)) return product
  const toolkit = offeringById('ai-act-toolkit')
  return {
    ...product,
    name: toolkit.name,
    slug: toolkit.id,
    productPath: toolkit.href,
    priceLabel: `From ${gbp(AMOUNTS.toolkitStandard)}`,
    blurb: toolkit.summary,
    badge: 'Complete toolkit',
    deliveryModel: 'download',
    // Do not reuse a retired SKU's checkout URL from Sanity.
    checkoutUrl: liveCheckoutUrl(CHECKOUT_URLS.toolkitStandard),
  }
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
  if (explicit) return currentGateProduct(explicit)

  const wanted = new Set(articleCategorySlugs)
  return (
    products.map(currentGateProduct).find((p) => (p.topics || []).some((slug) => wanted.has(slug))) || null
  )
}

/** The product flagged as the site-wide default upsell, if any. */
export function findDefaultProduct(products: GateProduct[]): GateProduct | null {
  return products.map(currentGateProduct).find((p) => p.isDefault) || null
}

/**
 * The gate an article's categories ask for when `auto` finds no product.
 *
 * Resolution is "first category that states a preference", in the order the
 * editor arranged them on the article — so the primary category wins and
 * re-ordering in Studio is the control. Categories that leave the field unset
 * are skipped rather than treated as a vote for the newsletter, which lets a
 * single opinionated category carry an article tagged with several vague ones.
 */
export function resolveCategoryGateFallback(
  categories: Array<{ defaultGateMode?: string | null } | null | undefined> | null | undefined,
): CategoryGateFallback | null {
  for (const category of categories || []) {
    const mode = category?.defaultGateMode
    if (mode === 'email' || mode === 'lead' || mode === 'none') return mode
  }
  return null
}

/**
 * Turn the Sanity gate config + resolved product into the exact mode + copy to
 * render. `emailFallback` supplies the persona-aware newsletter copy so an
 * `auto`/`email` gate reuses the same headline/subheadline as the standing CTA.
 *
 * `defaultProduct` backs an explicit `commerce` gate whose article has no topic
 * match; `auto` never uses it (falls back to the category default instead).
 *
 * `categoryFallback` is `category.defaultGateMode` resolved across the
 * article's categories. It only ever replaces `auto`'s newsletter fallback —
 * an explicit gate on the article and a real product match both outrank it.
 */
export function resolveGate(params: {
  gate: GateConfig | null | undefined
  upsellProduct: GateProduct | null
  defaultProduct?: GateProduct | null
  categoryFallback?: CategoryGateFallback | null
  emailFallback: { headline: string; body: string }
}): ResolvedGate {
  const { gate, upsellProduct, defaultProduct, categoryFallback, emailFallback } = params
  const retiredGate = gate?.product?.slug === 'ai-audit-checklist' ||
    gate?.product?.productPath === '/products/ai-audit-checklist'
  const mode: GateMode = gate?.mode || 'auto'

  if (mode === 'none') return { mode: 'none' }

  const emailGate = (): ResolvedGate => ({
    mode: 'email',
    headline: gate?.headline || emailFallback.headline,
    body: gate?.body || emailFallback.body,
    ctaLabel: gate?.ctaLabel || 'Subscribe',
  })

  const commerceGate = (candidate: GateProduct): ResolvedGate => {
    const product = currentGateProduct(candidate)
    const isReport = product.productPath.startsWith('/products/sector-reports')
    // Only commerce copy belongs to the retired offer. Preserve separately
    // authored newsletter/lead copy when an editor changes the gate mode.
    const copy = retiredGate || isReport ? null : gate
    return {
      mode: 'commerce',
      headline: copy?.headline || `Go deeper: ${product.name}`,
      body: copy?.body || product.blurb ||
        'A practical companion to what you just read — built for the same decisions.',
      ctaLabel: copy?.ctaLabel ||
        (isReport
          ? product.checkoutUrl ? `Buy the report — ${gbp(AMOUNTS.sectorReport)}` : 'View contents and preview'
          : product.priceLabel ? `Get it — ${product.priceLabel}` : 'View product'),
      product,
    }
  }

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

  // auto: commerce when a product maps to the topic. Otherwise the article's
  // categories decide (`category.defaultGateMode`) — an advisory-shaped topic
  // can ask for the book-a-call gate rather than a second email ask — and the
  // newsletter remains the fallback when no category states a preference.
  if (upsellProduct) return commerceGate(upsellProduct)
  if (categoryFallback === 'none') return { mode: 'none' }
  if (categoryFallback === 'lead') return leadGate()
  return emailGate()
}
