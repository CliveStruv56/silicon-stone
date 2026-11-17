import { describe, expect, it } from 'vitest'
import {
  formatTermsDate,
  isTermsRegisterProvider,
  TERMS_REGISTER_DISCLAIMER,
  TERMS_REGISTER_PROVIDERS,
  termsChangePath,
} from './terms-register'
import { PUBLIC_TAGS } from './standfirst-signups'

describe('terms register', () => {
  it('routes on the same provider ids the tracker writes', () => {
    // Must match PROVIDERS in terms-tracker/src/register.ts.
    expect(TERMS_REGISTER_PROVIDERS.map((p) => p.id)).toEqual(['anthropic', 'openai', 'google', 'microsoft', 'spacexsi', 'mistral'])
    expect(isTermsRegisterProvider('openai')).toBe(true)
    expect(isTermsRegisterProvider('xai')).toBe(false)
    expect(isTermsRegisterProvider('constructor')).toBe(false)
  })

  it('builds item paths under the provider', () => {
    expect(termsChangePath('mistral', 'training-on-by-default-42')).toBe('/terms-register/mistral/training-on-by-default-42')
  })

  it('formats a date-only value without slipping a day', () => {
    expect(formatTermsDate('2026-11-03')).toBe('3 November 2026')
    expect(formatTermsDate('2026-11-03T23:30:00Z')).toBe('3 November 2026')
    expect(formatTermsDate(null)).toBe('')
    expect(formatTermsDate('not a date')).toBe('')
  })

  it('states that it is not legal advice', () => {
    expect(TERMS_REGISTER_DISCLAIMER).toContain('not legal advice')
  })

  it('lets the Terms Register signup carry its source tag, and nothing that subscribes to a list', () => {
    expect(PUBLIC_TAGS).toContain('source-terms-register')
    expect(PUBLIC_TAGS.some((tag) => tag.startsWith('list-'))).toBe(false)
  })
})
