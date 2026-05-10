import crypto from 'crypto'

function key() {
  return crypto.randomUUID().slice(0, 8)
}

function span(text: string, marks: string[] = []) {
  return { _type: 'span', _key: key(), text, marks }
}

export function markdownToPortableText(markdown: string): unknown[] {
  const blocks: unknown[] = []
  const lines = markdown.split('\n')
  let currentParagraph: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length === 0) return

    const text = currentParagraph.join(' ').trim()
    if (text) {
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'normal',
        markDefs: [],
        children: parseInlineMarkdown(text),
      })
    }
    currentParagraph = []
  }

  for (const line of lines) {
    if (line.trim() === '---') {
      flushParagraph()
      continue
    }

    if (line.startsWith('### ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'h3',
        markDefs: [],
        children: [span(line.replace(/^###\s*/, ''))],
      })
      continue
    }

    if (line.startsWith('## ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'h2',
        markDefs: [],
        children: [span(line.replace(/^##\s*/, ''))],
      })
      continue
    }

    if (line.startsWith('# ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'h1',
        markDefs: [],
        children: [span(line.replace(/^#\s*/, ''))],
      })
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        markDefs: [],
        children: parseInlineMarkdown(line.replace(/^[-*]\s*/, '')),
      })
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'normal',
        listItem: 'number',
        level: 1,
        markDefs: [],
        children: parseInlineMarkdown(line.replace(/^\d+\.\s*/, '')),
      })
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      continue
    }

    if (line.startsWith('> ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'blockquote',
        markDefs: [],
        children: parseInlineMarkdown(line.replace(/^>\s*/, '')),
      })
      continue
    }

    currentParagraph.push(line)
  }

  flushParagraph()
  return blocks
}

function parseInlineMarkdown(text: string): unknown[] {
  const parts: { text: string; bold: boolean }[] = []
  const boldRegex = /\*\*(.+?)\*\*/g
  let match
  let currentIndex = 0

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push({ text: text.slice(currentIndex, match.index), bold: false })
    }
    parts.push({ text: match[1], bold: true })
    currentIndex = match.index + match[0].length
  }

  if (currentIndex < text.length) {
    parts.push({ text: text.slice(currentIndex), bold: false })
  }

  if (parts.length === 0) {
    return [span(text)]
  }

  return parts.map(part => span(part.text, part.bold ? ['strong'] : []))
}

