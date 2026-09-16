import { describe, expect, it } from 'vitest'
import { BUYER_TAGS, buyerTagForVariant, VARIANT_ENV_BY_BUYER_TAG } from './lemonsqueezy-variants'

const env = {
  LEMONSQUEEZY_VARIANT_ID_TOOLKIT_STANDARD: '100001',
  LEMONSQUEEZY_VARIANT_ID_TOOLKIT_PRO: '100002',
  LEMONSQUEEZY_VARIANT_ID_SECTOR_REPORT_MANUFACTURING: '100003',
  LEMONSQUEEZY_VARIANT_ID_ADVISORY_BRIEFING: '100004',
}

describe('buyerTagForVariant', () => {
  it('maps every sellable variant to its own buyer tag', () => {
    expect(buyerTagForVariant(100001, env)).toBe('buyer-toolkit-standard')
    expect(buyerTagForVariant('100002', env)).toBe('buyer-toolkit-pro')
    expect(buyerTagForVariant(100003, env)).toBe('buyer-sector-report-manufacturing')
    expect(buyerTagForVariant(100004, env)).toBe('buyer-advisory-briefing')
  })

  it('covers four SKUs, each with a distinct env var', () => {
    expect(BUYER_TAGS).toHaveLength(4)
    expect(new Set(Object.values(VARIANT_ENV_BY_BUYER_TAG)).size).toBe(4)
  })

  it('returns null for an unknown, missing or blank variant', () => {
    expect(buyerTagForVariant(999999, env)).toBeNull()
    expect(buyerTagForVariant(undefined, env)).toBeNull()
    expect(buyerTagForVariant('', env)).toBeNull()
  })

  it('an unset env var never matches, even against an empty id', () => {
    expect(buyerTagForVariant('', {})).toBeNull()
    expect(buyerTagForVariant('   ', { LEMONSQUEEZY_VARIANT_ID_TOOLKIT_PRO: '' })).toBeNull()
  })

  it('compares as strings, so a numeric webhook id matches a pasted string', () => {
    expect(buyerTagForVariant(100001, { LEMONSQUEEZY_VARIANT_ID_TOOLKIT_STANDARD: ' 100001 ' })).toBe('buyer-toolkit-standard')
  })
})
