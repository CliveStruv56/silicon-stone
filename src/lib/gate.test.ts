import { describe, expect, it } from 'vitest'
import {
  resolveCategoryGateFallback,
  resolveGate,
  resolveUpsellProduct,
  type GateProduct,
} from './gate'

const TOOLKIT: GateProduct = {
  name: 'AI Act Compliance Toolkit',
  slug: 'ai-act-toolkit',
  priceLabel: 'From £79',
  productPath: '/products/ai-act-toolkit',
  isDefault: true,
  topics: ['ai-act', 'digital-sovereignty', 'european-sovereignty'],
}

const CHECKLIST: GateProduct = {
  name: 'AI Audit Checklist Pack',
  slug: 'ai-audit-checklist',
  priceLabel: '£24',
  productPath: '/products/ai-audit-checklist',
  topics: ['ai-act'],
}

const EMAIL_FALLBACK = { headline: 'Subscribe', body: 'The newsletter.' }

const resolve = (
  overrides: Partial<Parameters<typeof resolveGate>[0]> = {},
) =>
  resolveGate({
    gate: null,
    upsellProduct: null,
    emailFallback: EMAIL_FALLBACK,
    ...overrides,
  })

describe('resolveCategoryGateFallback', () => {
  it('takes the first category that states a preference', () => {
    expect(
      resolveCategoryGateFallback([
        { defaultGateMode: 'lead' },
        { defaultGateMode: 'email' },
      ]),
    ).toBe('lead')
  })

  it('skips categories that leave the field unset rather than counting them as a vote', () => {
    expect(
      resolveCategoryGateFallback([
        { defaultGateMode: null },
        {},
        { defaultGateMode: 'lead' },
      ]),
    ).toBe('lead')
  })

  it('ignores values outside the allowed set', () => {
    // `commerce` is deliberately not offered — with no product match it could
    // only fall back to the blanket isDefault upsell.
    expect(resolveCategoryGateFallback([{ defaultGateMode: 'commerce' }])).toBeNull()
    expect(resolveCategoryGateFallback([{ defaultGateMode: 'auto' }])).toBeNull()
  })

  it.each([[null], [undefined], [[]]])('returns null for %s', (input) => {
    expect(resolveCategoryGateFallback(input as never)).toBeNull()
  })
})

describe('resolveGate — auto with a category fallback', () => {
  it('uses the category fallback when no product maps to the article', () => {
    expect(resolve({ categoryFallback: 'lead' })).toMatchObject({
      mode: 'lead',
      href: '/advisory#contact',
    })
  })

  it('renders no gate at all when the category asks for none', () => {
    expect(resolve({ categoryFallback: 'none' })).toEqual({ mode: 'none' })
  })

  it('still falls back to the newsletter when no category states a preference', () => {
    expect(resolve({ categoryFallback: null })).toMatchObject({ mode: 'email' })
  })

  it('lets a real product match outrank the category fallback', () => {
    // The category asking for `lead` must not cost a sale on an article that
    // has something to sell.
    expect(resolve({ upsellProduct: TOOLKIT, categoryFallback: 'lead' })).toMatchObject({
      mode: 'commerce',
      ctaLabel: 'Get it — From £79',
    })
  })

  it('lets an explicit gate on the article outrank the category fallback', () => {
    expect(
      resolve({ gate: { mode: 'email' }, categoryFallback: 'lead' }),
    ).toMatchObject({ mode: 'email' })
  })

  it('does not let the category fallback resurrect the blanket default upsell', () => {
    // `auto` + no match must never reach defaultProduct, category default or not.
    expect(
      resolve({ defaultProduct: TOOLKIT, categoryFallback: 'lead' }),
    ).toMatchObject({ mode: 'lead' })
  })
})

describe('resolveUpsellProduct', () => {
  it('takes the first product whose topics intersect the article categories', () => {
    expect(
      resolveUpsellProduct(null, ['ai-act'], [TOOLKIT, CHECKLIST])?.slug,
    ).toBe('ai-act-toolkit')
  })

  it('honours the query ordering rather than the article category order', () => {
    // UPSELL_PRODUCTS_QUERY orders isDefault desc, name asc precisely so this
    // is deterministic; the article's own category order must not flip it.
    expect(
      resolveUpsellProduct(null, ['ai-act'], [CHECKLIST, TOOLKIT])?.slug,
    ).toBe('ai-audit-checklist')
  })

  it('returns null when nothing matches, so auto can fall through', () => {
    expect(resolveUpsellProduct(null, ['semiconductors'], [TOOLKIT, CHECKLIST])).toBeNull()
  })

  it('prefers an explicit product over any topic match', () => {
    expect(
      resolveUpsellProduct(CHECKLIST, ['ai-act'], [TOOLKIT])?.slug,
    ).toBe('ai-audit-checklist')
  })
})
