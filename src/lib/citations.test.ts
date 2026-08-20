import { describe, expect, it } from 'vitest'
import { buildCitationMembers, normalizeUrl, publisherFromUrl } from './citations'

/**
 * This module exists so three writers agree on when two URLs are the same
 * source. If they disagree, the reader sees the same page listed twice under
 * different tracking parameters — which is the failure mode these tests hold.
 */

let n = 0
const key = () => `k${n++}`

describe('normalizeUrl', () => {
  it('treats tracking variants of one page as the same source', () => {
    const plain = normalizeUrl('https://example.com/a')
    expect(normalizeUrl('https://example.com/a?utm_source=x')).toBe(plain)
    expect(normalizeUrl('https://example.com/a#section')).toBe(plain)
    expect(normalizeUrl('https://EXAMPLE.com/a')).toBe(plain)
    expect(normalizeUrl('https://example.com/a/')).toBe(plain)
  })

  it('keeps meaningful query parameters', () => {
    // Only utm_* is noise. ?id=2 is a different page.
    expect(normalizeUrl('https://example.com/a?id=2')).not.toBe(normalizeUrl('https://example.com/a'))
  })

  it('rejects anything that is not http(s)', () => {
    for (const bad of ['', 'not a url', 'javascript:alert(1)', 'ftp://example.com', 'mailto:a@b.c']) {
      expect(normalizeUrl(bad)).toBeNull()
    }
  })
})

describe('publisherFromUrl', () => {
  it('drops www', () => {
    expect(publisherFromUrl('https://www.ft.com/x')).toBe('ft.com')
    expect(publisherFromUrl('https://eur-lex.europa.eu/x')).toBe('eur-lex.europa.eu')
  })

  it('returns undefined rather than guessing', () => {
    expect(publisherFromUrl('not a url')).toBeUndefined()
  })
})

describe('buildCitationMembers', () => {

  it('shapes a candidate as the schema expects', () => {
    const [c] = buildCitationMembers(
      [{ title: 'A report', url: 'https://example.com/a', publisher: 'Example' }],
      [],
      key,
    )
    expect(c).toMatchObject({
      _type: 'citation',
      title: 'A report',
      url: 'https://example.com/a',
      publisher: 'Example',
    })
    expect(c._key).toBeTruthy()
  })

  it('skips what the document already lists, whatever the tracking params', () => {
    const out = buildCitationMembers(
      [{ title: 'A', url: 'https://example.com/a?utm_campaign=x' }],
      [{ url: 'https://example.com/a' }],
      key,
    )
    expect(out).toEqual([])
  })

  it('dedupes within a single batch', () => {
    const out = buildCitationMembers(
      [
        { title: 'A', url: 'https://example.com/a' },
        { title: 'A again', url: 'https://example.com/a/' },
      ],
      [],
      key,
    )
    expect(out).toHaveLength(1)
  })

  it('drops candidates with no usable URL — url is required by the schema', () => {
    const out = buildCitationMembers(
      [{ title: 'No link' }, { title: 'Bad', url: 'not a url' }, { url: 'javascript:x' }],
      [],
      key,
    )
    expect(out).toEqual([])
  })

  it('never emits an empty title, which would fail validation on publish', () => {
    const [c] = buildCitationMembers([{ url: 'https://www.ft.com/x' }], [], key)
    expect(c.title).toBe('ft.com')
    const [d] = buildCitationMembers([{ title: '   ', url: 'https://example.com/z' }], [], key)
    expect(d.title).toBeTruthy()
  })

  it('omits publisher rather than writing an empty string', () => {
    const [c] = buildCitationMembers(
      [{ title: 'A', url: 'https://example.com/a', publisher: '  ' }],
      [],
      key,
    )
    expect('publisher' in c).toBe(false)
  })

  it('ignores existing entries with no URL instead of throwing', () => {
    const out = buildCitationMembers([{ title: 'A', url: 'https://example.com/a' }], [{}], key)
    expect(out).toHaveLength(1)
  })
})
