import { describe, expect, it } from 'vitest'
import { needsPublishedAt, publishedAtPatch } from './published-at'

const NOW = new Date('2026-08-22T20:00:00.000Z')

describe('publishedAtPatch', () => {
  it('stamps an article that has never carried a date', () => {
    // The whole defect: ten of sixteen published articles looked exactly like
    // this, and nothing in the publish path filled it in.
    expect(publishedAtPatch({}, NOW)).toEqual({ publishedAt: '2026-08-22T20:00:00.000Z' })
  })

  it('never overwrites an existing date', () => {
    // Re-publishing is not re-publication. Every edit re-fires the publish
    // webhook, so an overwriting rule would walk the date forward on every save
    // and change a `datePublished` search engines have already seen.
    expect(publishedAtPatch({ publishedAt: '2026-01-21T09:00:00.000Z' }, NOW)).toBeNull()
  })

  it('treats null and an empty string as absent', () => {
    // Studio writes undefined for an emptied datetime, but a hand-edited
    // document or an API write can leave '' behind. Present-but-meaningless
    // must not satisfy a check whose job is that the field means something.
    expect(publishedAtPatch({ publishedAt: null }, NOW)).not.toBeNull()
    expect(publishedAtPatch({ publishedAt: '' }, NOW)).not.toBeNull()
    expect(publishedAtPatch({ publishedAt: '   ' }, NOW)).not.toBeNull()
  })

  it('is a pure function of the document and the clock', () => {
    const doc = {}
    const a = publishedAtPatch(doc, new Date('2026-01-01T00:00:00.000Z'))
    const b = publishedAtPatch(doc, new Date('2026-01-01T00:00:00.000Z'))
    expect(a).toEqual(b)
    expect(doc).toEqual({})
  })
})

describe('needsPublishedAt', () => {
  it('answers the same question as the patch', () => {
    expect(needsPublishedAt({})).toBe(true)
    expect(needsPublishedAt({ publishedAt: '' })).toBe(true)
    expect(needsPublishedAt({ publishedAt: '2026-01-21T09:00:00.000Z' })).toBe(false)
  })
})
