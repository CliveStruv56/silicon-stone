import { describe, expect, it } from 'vitest'

import {
  TRACKING_QUERY_PARAMS,
  normalizeCanonicalUrl,
  normalizeExternalId,
  normalizeTags,
  normalizeText,
  normalizeTitle,
} from './normalize'

describe('normalizeCanonicalUrl', () => {
  it('lower-cases the scheme and host but not the path', () => {
    expect(normalizeCanonicalUrl('HTTPS://Example.COM/Path/To/Doc')).toBe(
      'https://example.com/Path/To/Doc',
    )
  })

  it('drops the fragment', () => {
    // A fragment addresses a position in a document, not a document.
    expect(normalizeCanonicalUrl('https://example.com/a#section-3')).toBe(
      'https://example.com/a',
    )
    expect(normalizeCanonicalUrl('https://example.com/a#')).toBe('https://example.com/a')
  })

  it('drops the default port and keeps a non-default one', () => {
    expect(normalizeCanonicalUrl('https://example.com:443/a')).toBe('https://example.com/a')
    expect(normalizeCanonicalUrl('http://example.com:80/a')).toBe('http://example.com/a')
    expect(normalizeCanonicalUrl('https://example.com:8443/a')).toBe(
      'https://example.com:8443/a',
    )
  })

  it('drops every tracking parameter it names, and the utm_ family', () => {
    for (const param of TRACKING_QUERY_PARAMS) {
      expect(normalizeCanonicalUrl(`https://example.com/a?${param}=x`)).toBe(
        'https://example.com/a',
      )
    }
    expect(
      normalizeCanonicalUrl('https://example.com/a?utm_source=x&utm_campaign=y&UTM_Medium=z'),
    ).toBe('https://example.com/a')
  })

  it('keeps every parameter it was not told to drop', () => {
    expect(normalizeCanonicalUrl('https://example.com/a?id=7&utm_source=x')).toBe(
      'https://example.com/a?id=7',
    )
    // Including empty ones: ?print= may mean something to the server.
    expect(normalizeCanonicalUrl('https://example.com/a?print=')).toBe(
      'https://example.com/a?print=',
    )
  })

  it('sorts the surviving query so order stops being a difference', () => {
    expect(normalizeCanonicalUrl('https://example.com/a?b=2&a=1')).toBe(
      normalizeCanonicalUrl('https://example.com/a?a=1&b=2'),
    )
  })

  it('does not collapse materially different URLs', () => {
    const distinct = [
      'https://example.com/a',
      'https://example.com/A',
      'https://example.com/a/',
      'https://www.example.com/a',
      'http://example.com/a',
      'https://example.com/a?id=7',
      'https://example.com/a?id=8',
      'https://sub.example.com/a',
    ]
    const normalised = distinct.map((url) => normalizeCanonicalUrl(url))
    // Path case, trailing slash, www, scheme, host and real query parameters
    // are all left alone, because any of them can address a different document.
    expect(new Set(normalised).size).toBe(distinct.length)
  })

  it('refuses anything that is not http or https', () => {
    for (const url of [
      'mailto:someone@example.com',
      'javascript:alert(1)',
      'data:text/plain,hello',
      'file:///etc/passwd',
      'ftp://example.com/a',
    ]) {
      expect(normalizeCanonicalUrl(url)).toBeNull()
    }
  })

  it('refuses empty and malformed input', () => {
    for (const value of ['', '   ', 'not a url', '://', 'https://', null, undefined, 42, {}]) {
      expect(normalizeCanonicalUrl(value)).toBeNull()
    }
  })

  it('is idempotent', () => {
    const once = normalizeCanonicalUrl('HTTPS://Example.com:443/a?b=2&utm_source=x#frag')
    expect(once).toBe('https://example.com/a?b=2')
    expect(normalizeCanonicalUrl(once)).toBe(once)
  })

  it('trims surrounding whitespace and a trailing host dot', () => {
    expect(normalizeCanonicalUrl('  https://example.com./a  ')).toBe('https://example.com/a')
  })
})

describe('normalizeText', () => {
  it('unifies line endings', () => {
    expect(normalizeText('a\r\nb\rc')).toBe('a\nb\nc')
  })

  it('normalises Unicode so the same word hashes alike', () => {
    const composed = 'café'
    const decomposed = 'café'
    expect(composed).not.toBe(decomposed)
    expect(normalizeText(composed)).toBe(normalizeText(decomposed))
  })

  it('folds non-breaking and fixed-width spaces to an ordinary space', () => {
    expect(normalizeText('a b c　d')).toBe('a b c d')
  })

  it('drops zero-width characters and a BOM', () => {
    expect(normalizeText('﻿a​b‍c')).toBe('abc')
  })

  it('collapses horizontal runs but keeps paragraphs', () => {
    expect(normalizeText('a   \t b\n\nc')).toBe('a b\n\nc')
    expect(normalizeText('a\n\n\n\n\nb')).toBe('a\n\nb')
  })

  it('strips trailing whitespace per line and around the whole text', () => {
    expect(normalizeText('  a   \n  b  \n  ')).toBe('a\n b')
  })

  it('returns an empty string for empty and non-string input', () => {
    for (const value of ['', '   \n\n  ', null, undefined, 42, {}, []]) {
      expect(normalizeText(value)).toBe('')
    }
  })

  it('is idempotent', () => {
    const once = normalizeText(' a  b\r\n\n\n c ')
    expect(normalizeText(once)).toBe(once)
  })
})

describe('normalizeTitle', () => {
  it('collapses to one line and keeps case', () => {
    expect(normalizeTitle('  The  EU\nAI Act  ')).toBe('The EU AI Act')
  })

  it('is empty for non-strings', () => {
    expect(normalizeTitle(undefined)).toBe('')
    expect(normalizeTitle(7)).toBe('')
  })
})

describe('normalizeExternalId', () => {
  it('trims and does nothing else', () => {
    // Case and punctuation belong to the issuing system. Folding them would
    // merge two of its records into one of ours.
    expect(normalizeExternalId('  Conv-AbC_123  ')).toBe('Conv-AbC_123')
    expect(normalizeExternalId('AbC')).not.toBe(normalizeExternalId('abc'))
  })

  it('is empty for non-strings', () => {
    expect(normalizeExternalId(null)).toBe('')
  })
})

describe('normalizeTags', () => {
  it('trims, lower-cases and de-duplicates while keeping order', () => {
    expect(normalizeTags([' AI Act ', 'ai act', 'GDPR', '', null, 7])).toEqual([
      'ai act',
      'gdpr',
    ])
  })

  it('is empty for non-arrays', () => {
    expect(normalizeTags('gdpr')).toEqual([])
  })
})
