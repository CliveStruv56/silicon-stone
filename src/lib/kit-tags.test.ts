import { describe, expect, it } from 'vitest'
import { ALL_TAGS, BUYER_TAGS, CONTACT_CUSTOM_FIELDS, CONTACT_TAG, SUBSCRIBE_TAGS, tagIdsFrom } from './kit-tags'
import { BUYER_TAGS as WEBHOOK_BUYER_TAGS } from './lemonsqueezy-variants'

describe('Kit tag registry', () => {
  it('holds seventeen tags, each with a distinct name and a distinct env var', () => {
    expect(ALL_TAGS).toHaveLength(17)
    expect(new Set(ALL_TAGS.map(t => t.tag)).size).toBe(17)
    expect(new Set(ALL_TAGS.map(t => t.env)).size).toBe(17)
  })

  it('every env var follows the CONVERTKIT_*_TAG_ID convention', () => {
    for (const { env } of ALL_TAGS) expect(env).toMatch(/^CONVERTKIT_[A-Z_]+_TAG_ID$/)
  })

  it('buyer tags never appear in the public subscribe list', () => {
    const publicNames = new Set(SUBSCRIBE_TAGS.map(t => t.tag))
    for (const { tag } of BUYER_TAGS) expect(publicNames.has(tag)).toBe(false)
    expect(publicNames.has(CONTACT_TAG.tag)).toBe(false)
  })

  it('the webhook and the registry agree on the buyer tag names', () => {
    expect([...BUYER_TAGS.map(t => t.tag)].sort()).toEqual([...WEBHOOK_BUYER_TAGS].sort())
  })

  it('the contact form writes exactly the four fields Kit must already have', () => {
    expect([...CONTACT_CUSTOM_FIELDS]).toEqual(['company', 'interest', 'message', 'source'])
  })

  it('tagIdsFrom maps names to IDs and leaves unset ones undefined', () => {
    const ids = tagIdsFrom(BUYER_TAGS, { CONVERTKIT_BUYER_TOOLKIT_PRO_TAG_ID: '123', CONVERTKIT_BUYER_TOOLKIT_STANDARD_TAG_ID: '' })
    expect(ids['buyer-toolkit-pro']).toBe('123')
    expect(ids['buyer-toolkit-standard']).toBeUndefined()
    expect(ids['buyer-advisory-briefing']).toBeUndefined()
  })
})
