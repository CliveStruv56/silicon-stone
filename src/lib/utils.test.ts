import { describe, expect, it } from 'vitest'
import { redactForLog, safeInternalPath, slugify } from './utils'

describe('safeInternalPath', () => {
  it('accepts a normal rooted path', () => {
    expect(safeInternalPath('/analysis/some-article')).toBe('/analysis/some-article')
  })

  it.each([
    ['https://evil.com/x', 'absolute URL'],
    ['//evil.com', 'scheme-relative'],
    ['/\\evil.com', 'backslash trick'],
    ['relative/path', 'non-rooted path'],
    ['javascript:alert(1)', 'javascript scheme'],
    ['', 'empty string'],
  ])('rejects %s (%s) and returns the fallback', (input) => {
    expect(safeInternalPath(input)).toBe('/')
  })

  it('returns the supplied fallback for null/undefined', () => {
    expect(safeInternalPath(null, '/intelligence')).toBe('/intelligence')
    expect(safeInternalPath(undefined, '/intelligence')).toBe('/intelligence')
  })
})

describe('redactForLog', () => {
  it('masks email addresses in strings', () => {
    const result = redactForLog('email_address user@example.com already exists')
    expect(result).not.toContain('user@example.com')
    expect(result).toContain('***@redacted')
  })

  it('serialises and masks objects', () => {
    const result = redactForLog({ error: 'duplicate', email: 'a@b.co' })
    expect(result).not.toContain('a@b.co')
  })

  it('clamps output length', () => {
    expect(redactForLog('x'.repeat(1000)).length).toBeLessThanOrEqual(200)
  })
})

describe('slugify', () => {
  it('lowercases, hyphenates, and strips punctuation', () => {
    expect(slugify('The EU AI Act: What SMEs Need to Know!')).toBe(
      'the-eu-ai-act-what-smes-need-to-know'
    )
  })

  it('collapses repeated separators and trims edge hyphens', () => {
    expect(slugify('  --Hello   --  World--  ')).toBe('hello-world')
  })

  it('never returns an empty slug', () => {
    expect(slugify('✦✦✦')).toBe('untitled')
    expect(slugify('')).toBe('untitled')
  })

  it('truncates on a word boundary, never mid-word', () => {
    const title =
      'European regulators move to include the FDA equivalent frameworks in semiconductor oversight'
    const slug = slugify(title)
    expect(slug.length).toBeLessThanOrEqual(60)
    // The slug must end at a word boundary present in the full slug.
    expect(slugify(title, 1000).startsWith(slug + '-') || slugify(title, 1000) === slug).toBe(true)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('returns short slugs unchanged', () => {
    expect(slugify('Short Title')).toBe('short-title')
  })

  it('respects a custom maxLength', () => {
    const slug = slugify('one two three four five six seven', 12)
    expect(slug.length).toBeLessThanOrEqual(12)
    expect(slug).toBe('one-two')
  })
})
