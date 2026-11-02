import { describe, expect, it } from 'vitest'
import { ENQUIRY_TAG, PUBLIC_TAGS, resolveSignup, toolSourceTag } from './standfirst-signups'
import { BUYER_TAGS } from './lemonsqueezy-variants'

describe('resolveSignup', () => {
  it('defaults to the briefing list', () => {
    expect(resolveSignup({})).toEqual({ formSlug: 'briefing', tags: ['list-briefing'] })
  })

  it('subscribes to the newsletter list when asked', () => {
    expect(resolveSignup({ signup: 'newsletter', tags: ['source-home'] })).toEqual({
      formSlug: 'newsletter',
      tags: ['list-newsletter', 'source-home'],
    })
  })

  it('puts no list tag on an early-access request or a guide request', () => {
    expect(resolveSignup({ signup: 'early-access', tags: ['interest-waymarkpath'] })).toEqual({
      formSlug: 'early-access',
      tags: ['interest-waymarkpath'],
    })
    expect(resolveSignup({ signup: 'us-executive-guide' }).tags).toEqual([])
  })

  it('falls back to the briefing for an unknown or inherited kind', () => {
    expect(resolveSignup({ signup: 'nope' }).formSlug).toBe('briefing')
    expect(resolveSignup({ signup: 'constructor' }).formSlug).toBe('briefing')
  })

  it('refuses buyer, enquiry and list tags from the public route', () => {
    const tags = [...BUYER_TAGS, ENQUIRY_TAG, 'list-newsletter', 'Tool_Lead']
    expect(resolveSignup({ tags }).tags).toEqual(['list-briefing'])
  })

  it('dedupes and caps requested tags', () => {
    const tags = [...PUBLIC_TAGS, 'source-home']
    expect(resolveSignup({ signup: 'early-access', tags }).tags).toHaveLength(4)
    expect(resolveSignup({ tags: ['source-home', 'source-home'] }).tags).toEqual(['list-briefing', 'source-home'])
  })
})

describe('the public allow-list', () => {
  it('holds only source and interest tags', () => {
    for (const tag of PUBLIC_TAGS) expect(tag).toMatch(/^(source|interest)-/)
    expect(PUBLIC_TAGS).not.toContain(ENQUIRY_TAG)
  })

  it('covers every tool that captures an address', () => {
    for (const tool of ['compliance-checker', 'supply-chain-mapper', 'scenario-modeler', 'policy-stress-test']) {
      expect(PUBLIC_TAGS).toContain(toolSourceTag(tool))
    }
  })
})
