import { describe, expect, it } from 'vitest'

import {
  compositeHash,
  contentHash,
  isContentHash,
  normalizedContentHash,
  sha256Hex,
} from './hash'

describe('contentHash', () => {
  it('produces the stored sha256:<hex> shape the schema validates', () => {
    const hash = contentHash('hello')
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(isContentHash(hash)).toBe(true)
    // The known digest of "hello" — this is what pins the algorithm.
    expect(hash).toBe(
      'sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    )
  })

  it('is deterministic and distinguishes different input', () => {
    expect(contentHash('a')).toBe(contentHash('a'))
    expect(contentHash('a')).not.toBe(contentHash('b'))
  })

  it('hashes bytes and the equivalent string alike', () => {
    expect(contentHash(new TextEncoder().encode('hello'))).toBe(contentHash('hello'))
  })

  it('rejects a malformed hash', () => {
    for (const value of ['sha256:xyz', 'sha1:' + 'a'.repeat(40), sha256Hex('a'), '', null]) {
      expect(isContentHash(value)).toBe(false)
    }
    // Upper-case hex is not the stored form.
    expect(isContentHash(`sha256:${'A'.repeat(64)}`)).toBe(false)
  })
})

describe('normalizedContentHash', () => {
  it('ignores differences normalisation is meant to ignore', () => {
    expect(normalizedContentHash('a  b\r\n')).toBe(normalizedContentHash('a b\n'))
    expect(normalizedContentHash('café')).toBe(normalizedContentHash('café'))
  })

  it('still distinguishes content that genuinely differs', () => {
    expect(normalizedContentHash('a b')).not.toBe(normalizedContentHash('a c'))
    // Paragraph structure is meaning and survives normalisation.
    expect(normalizedContentHash('a\nb')).not.toBe(normalizedContentHash('a\n\nb'))
  })

  it('hashes empty input rather than refusing to', () => {
    // Returning "no hash" would make every empty record a duplicate of every
    // other one.
    const empty = normalizedContentHash('')
    expect(isContentHash(empty)).toBe(true)
    expect(normalizedContentHash('   \n  ')).toBe(empty)
    expect(normalizedContentHash(undefined)).toBe(empty)
  })
})

describe('compositeHash', () => {
  it('cannot be fooled by moving a boundary between parts', () => {
    expect(compositeHash(['ab', 'c'])).not.toBe(compositeHash(['a', 'bc']))
  })

  it('treats null and undefined as an empty part rather than skipping it', () => {
    expect(compositeHash(['a', null, 'b'])).toBe(compositeHash(['a', '', 'b']))
    expect(compositeHash(['a', null, 'b'])).not.toBe(compositeHash(['a', 'b']))
  })

  it('is deterministic and order-sensitive', () => {
    expect(compositeHash(['a', 'b'])).toBe(compositeHash(['a', 'b']))
    expect(compositeHash(['a', 'b'])).not.toBe(compositeHash(['b', 'a']))
  })
})
