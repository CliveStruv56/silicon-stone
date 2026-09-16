import { describe, expect, it } from 'vitest'
import {
  isConfiguredCheckout,
  liveCheckoutUrl,
  MANUFACTURING_REPORT_SLUG,
  sectorReportCheckoutUrl,
} from './checkout'

const URL = 'https://siliconandstone.lemonsqueezy.com/buy/abc'

describe('isConfiguredCheckout', () => {
  it('rejects empty and placeholder values', () => {
    expect(isConfiguredCheckout(undefined)).toBe(false)
    expect(isConfiguredCheckout('')).toBe(false)
    expect(isConfiguredCheckout('https://example.com/buy')).toBe(false)
  })
  it('accepts a real store link', () => {
    expect(isConfiguredCheckout(URL)).toBe(true)
  })
})

describe('liveCheckoutUrl', () => {
  it('never opens a checkout while PRE_LAUNCH is on, however good the URL', () => {
    expect(liveCheckoutUrl(URL, true)).toBeNull()
  })
  it('never opens a placeholder, even after launch', () => {
    expect(liveCheckoutUrl('https://example.com/buy', false)).toBeNull()
    expect(liveCheckoutUrl(undefined, false)).toBeNull()
  })
  it('opens a real link once both gates clear', () => {
    expect(liveCheckoutUrl(URL, false)).toBe(URL)
  })
  it('defaults to the site flag, which is on unless the env says otherwise', () => {
    // NEXT_PUBLIC_PRE_LAUNCH is unset under test, so the default gate is closed.
    expect(liveCheckoutUrl(URL)).toBeNull()
  })
})

describe('sectorReportCheckoutUrl', () => {
  it('only the manufacturing report has a checkout', () => {
    expect(MANUFACTURING_REPORT_SLUG).toBe('ai-and-european-manufacturing')
    expect(sectorReportCheckoutUrl('ai-in-financial-services', false)).toBeNull()
  })
  it('the manufacturing report follows the same two gates', () => {
    // Env unset under test: even with the flag off there is no URL to open.
    expect(sectorReportCheckoutUrl(MANUFACTURING_REPORT_SLUG, false)).toBeNull()
    expect(sectorReportCheckoutUrl(MANUFACTURING_REPORT_SLUG, true)).toBeNull()
  })
})
