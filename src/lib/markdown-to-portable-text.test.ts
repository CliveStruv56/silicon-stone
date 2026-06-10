import { describe, expect, it } from 'vitest'
import { markdownToPortableText } from './markdown-to-portable-text'

type Block = {
  _type: string
  style?: string
  listItem?: string
  markDefs?: Array<{ _type: string; _key: string; href?: string }>
  children?: Array<{ _type: string; text: string; marks: string[] }>
}

function blocks(markdown: string): Block[] {
  return markdownToPortableText(markdown) as Block[]
}

describe('markdownToPortableText — block structure', () => {
  it('parses headings at each level', () => {
    const result = blocks('# One\n## Two\n### Three')
    expect(result.map((block) => block.style)).toEqual(['h1', 'h2', 'h3'])
  })

  it('joins consecutive lines into one paragraph and splits on blank lines', () => {
    const result = blocks('line one\nline two\n\nsecond para')
    expect(result).toHaveLength(2)
    expect(result[0].children?.[0].text).toBe('line one line two')
    expect(result[1].children?.[0].text).toBe('second para')
  })

  it('accumulates multi-line blockquotes into a single blockquote block', () => {
    const result = blocks('> quoted line one\n> quoted line two\n\nafter')
    expect(result).toHaveLength(2)
    expect(result[0].style).toBe('blockquote')
    expect(result[0].children?.[0].text).toBe('quoted line one quoted line two')
  })

  it('parses bullet and numbered list items', () => {
    const result = blocks('- alpha\n* beta\n1. gamma')
    expect(result.map((block) => block.listItem)).toEqual(['bullet', 'bullet', 'number'])
  })

  it('drops horizontal rules', () => {
    const result = blocks('before\n\n---\n\nafter')
    expect(result).toHaveLength(2)
  })
})

describe('markdownToPortableText — inline marks', () => {
  it('parses bold, italic, and inline code spans', () => {
    const [block] = blocks('plain **bold** and *italic* and `code` end')
    const byText = Object.fromEntries(
      (block.children ?? []).map((child) => [child.text, child.marks])
    )
    expect(byText['bold']).toEqual(['strong'])
    expect(byText['italic']).toEqual(['em'])
    expect(byText['code']).toEqual(['code'])
  })

  it('parses safe links into markDefs-referenced spans', () => {
    const [block] = blocks('see [the source](https://example.com/report) here')
    expect(block.markDefs).toHaveLength(1)
    const def = block.markDefs![0]
    expect(def.href).toBe('https://example.com/report')
    const linkSpan = block.children?.find((child) => child.text === 'the source')
    expect(linkSpan?.marks).toEqual([def._key])
  })

  it('renders unsafe link schemes as plain text with no markDef', () => {
    const [block] = blocks('click [here](javascript:alert(1)) now')
    expect(block.markDefs).toHaveLength(0)
    const span = block.children?.find((child) => child.text === 'here')
    expect(span?.marks).toEqual([])
  })

  it('does not confuse bold with single-star italic', () => {
    const [block] = blocks('**only bold**')
    expect(block.children?.[0].marks).toEqual(['strong'])
    expect(block.children?.[0].text).toBe('only bold')
  })
})
