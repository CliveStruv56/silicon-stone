import { describe, it, expect } from 'vitest'
import { blockTextOf, findPassageBlock, passagePattern } from './claim-passage'

/**
 * All fixtures below are the real values from a Signal generated 21 August
 * 2026, where "Insert into article" greyed out on a paragraph that plainly
 * contained the passage. The paragraph carried an inline link, so the
 * space-joined view the fact-check reads gained a space the body does not have.
 */
const STORED_WITH_PHANTOM_SPACE =
  'Those obligations — conformity assessments, technical documentation, human oversight requirements — do not apply at scale until December 2027 and August 2028, as covered in our earlier analysis at /analysis/eu-ai-act-compliance-chasm-august-2026 .'

/** The same paragraph as Portable Text: prose, a linked span, then a full stop. */
const LINKED_BLOCK = {
  _type: 'block',
  _key: 'linked',
  children: [
    {
      text: 'Article 50 is structurally different from the high-risk obligations that dominate most compliance roadmaps. Those obligations — conformity assessments, technical documentation, human oversight requirements — do not apply at scale until December 2027 and August 2028, as covered in our earlier analysis at ',
    },
    { text: '/analysis/eu-ai-act-compliance-chasm-august-2026', marks: ['link1'] },
    { text: '. Article 50 carries no such runway.' },
  ],
}

const PLAIN_BLOCK = {
  _type: 'block',
  _key: 'plain',
  children: [{ text: 'The AI Office operates under Commission supervision and oversees general-purpose AI.' }],
}

describe('blockTextOf', () => {
  it('joins spans with nothing, as the body stores them', () => {
    expect(blockTextOf(LINKED_BLOCK)).toContain('august-2026. Article 50 carries')
    expect(blockTextOf(LINKED_BLOCK)).not.toContain('august-2026 .')
  })

  it('is empty for a block with no children', () => {
    expect(blockTextOf({ _type: 'block' })).toBe('')
  })
})

describe('passagePattern', () => {
  it('matches across a span boundary where the stored text has a phantom space', () => {
    const pattern = passagePattern(STORED_WITH_PHANTOM_SPACE)!
    expect(pattern.test(blockTextOf(LINKED_BLOCK))).toBe(true)
  })

  it('still matches when the whitespace is genuinely there', () => {
    const pattern = passagePattern('do not apply at scale')!
    expect(pattern.test('…obligations do not apply at scale until December…')).toBe(true)
  })

  it('tolerates a different whitespace run — newline for space', () => {
    const pattern = passagePattern('human oversight requirements')!
    expect(pattern.test('human\noversight   requirements')).toBe(true)
  })

  it('does not match a passage that genuinely is not there', () => {
    const pattern = passagePattern('a sentence this article never contained')!
    expect(pattern.test(blockTextOf(LINKED_BLOCK))).toBe(false)
  })

  it('escapes regex metacharacters in the passage', () => {
    const pattern = passagePattern('Article 50(2) applies (in part).')!
    expect(pattern.test('Note: Article 50(2) applies (in part).')).toBe(true)
    expect(pattern.test('Article 502 applies in part.')).toBe(false)
  })

  it('is null for an empty passage', () => {
    expect(passagePattern('')).toBeNull()
    expect(passagePattern('   ')).toBeNull()
  })
})

describe('findPassageBlock', () => {
  const body = [PLAIN_BLOCK, LINKED_BLOCK]

  it('locates the linked paragraph the button used to grey out on', () => {
    expect(findPassageBlock(body, STORED_WITH_PHANTOM_SPACE)?._key).toBe('linked')
  })

  it('locates an ordinary paragraph', () => {
    expect(
      findPassageBlock(body, 'The AI Office operates under Commission supervision and oversees general-purpose AI.')?._key,
    ).toBe('plain')
  })

  it('returns null when the passage really has been edited away', () => {
    expect(findPassageBlock(body, 'A passage that was rewritten by the author.')).toBeNull()
  })

  it('ignores non-block content and bad input', () => {
    expect(findPassageBlock([{ _type: 'image', _key: 'img' }], 'anything')).toBeNull()
    expect(findPassageBlock(undefined, 'anything')).toBeNull()
    expect(findPassageBlock(body, undefined)).toBeNull()
  })

  it('a passage spanning two paragraphs is not findable, and says so by returning null', () => {
    // Correct behaviour, not a bug: the replacement is per block, so a passage
    // crossing a boundary has no single block to rewrite. The UI falls back to
    // "Copy revision" rather than half-applying it.
    const across = 'oversees general-purpose AI. Article 50 is structurally different'
    expect(findPassageBlock(body, across)).toBeNull()
  })
})
