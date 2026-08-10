import crypto from 'crypto'

function key() {
  return crypto.randomUUID().slice(0, 8)
}

function span(text: string, marks: string[] = []) {
  return { _type: 'span', _key: key(), text, marks }
}

// House style requires the authored markdown *file* to open with
// `# Title` → `**Subject Line:**` → `**Preview Text:**` → `## Article`
// (.agent/rules/style/house-style.md). That furniture addresses the newsletter,
// not the reader: the article page renders the title itself and has no use for
// the subject/preview lines, so it must never reach the Sanity body. The legacy
// file-sync path stripped it (scripts/sync-content.ts); this is the same job for
// the generator path.
//
// Only the run at the head of the document is considered — a paragraph further
// down that happens to open "Preview text:" is left alone.
const PREAMBLE_META = /^\s*(?:\*\*)?\s*(?:subject line|preview text)\s*(?:\*\*)?\s*:/i
const PREAMBLE_ARTICLE_HEADING = /^\s*#{2,3}\s*article\s*$/i

function normaliseHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[*_`]/g, '')
    .replace(/[:\s]+$/, '')
}

/**
 * Drop authoring/newsletter furniture from the head of an article's markdown.
 * The leading `# Heading` is removed only when it duplicates `title`, so a body
 * that legitimately opens on a different h1 is preserved.
 */
export function stripAuthoringPreamble(markdown: string, title?: string): string {
  if (!markdown) return markdown

  const lines = markdown.split('\n')
  const wantedTitle = title ? normaliseHeading(title) : ''
  let cut = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trim() === '') {
      cut = i + 1
      continue
    }
    if (PREAMBLE_META.test(line) || PREAMBLE_ARTICLE_HEADING.test(line)) {
      cut = i + 1
      continue
    }

    const heading = line.match(/^\s*#\s+(.*)$/)
    if (heading && wantedTitle && normaliseHeading(heading[1]) === wantedTitle) {
      cut = i + 1
      continue
    }

    break
  }

  return cut > 0 ? lines.slice(cut).join('\n') : markdown
}

export function markdownToPortableText(markdown: string): unknown[] {
  const blocks: unknown[] = []
  const lines = markdown.split('\n')
  let currentParagraph: string[] = []
  let currentQuote: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length === 0) return
    const text = currentParagraph.join(' ').trim()
    if (text) {
      const { children, markDefs } = parseInlineMarkdown(text)
      blocks.push({ _type: 'block', _key: key(), style: 'normal', markDefs, children })
    }
    currentParagraph = []
  }

  const flushQuote = () => {
    if (currentQuote.length === 0) return
    const text = currentQuote.join(' ').trim()
    if (text) {
      const { children, markDefs } = parseInlineMarkdown(text)
      blocks.push({ _type: 'block', _key: key(), style: 'blockquote', markDefs, children })
    }
    currentQuote = []
  }

  const flushAll = () => {
    flushParagraph()
    flushQuote()
  }

  const pushBlock = (style: string, text: string, extra: Record<string, unknown> = {}) => {
    flushAll()
    const { children, markDefs } = parseInlineMarkdown(text)
    blocks.push({ _type: 'block', _key: key(), style, markDefs, children, ...extra })
  }

  for (const line of lines) {
    // Accumulate consecutive blockquote lines into a single blockquote block so
    // multi-line quotes aren't folded into the following paragraph.
    if (line.startsWith('> ') || line.trimEnd() === '>') {
      flushParagraph()
      currentQuote.push(line.replace(/^>\s?/, ''))
      continue
    }
    // A non-quote line ends any open quote.
    flushQuote()

    if (line.trim() === '---') {
      flushParagraph()
      continue
    }

    if (line.startsWith('### ')) {
      pushBlock('h3', line.replace(/^###\s*/, ''))
      continue
    }

    if (line.startsWith('## ')) {
      pushBlock('h2', line.replace(/^##\s*/, ''))
      continue
    }

    if (line.startsWith('# ')) {
      pushBlock('h1', line.replace(/^#\s*/, ''))
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      pushBlock('normal', line.replace(/^[-*]\s*/, ''), { listItem: 'bullet', level: 1 })
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      pushBlock('normal', line.replace(/^\d+\.\s*/, ''), { listItem: 'number', level: 1 })
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      continue
    }

    currentParagraph.push(line)
  }

  flushAll()
  return blocks
}

const SAFE_LINK = /^(https?:\/\/|mailto:)/i

/**
 * Parse inline markdown into Portable Text spans + the markDefs they reference.
 * Supports links ([text](url)), bold (**), inline code (`code`) and italics (*).
 * Links with unsafe/relative hrefs are rendered as plain text (the schema only
 * permits http/https/mailto).
 */
function parseInlineMarkdown(text: string): { children: unknown[]; markDefs: unknown[] } {
  const children: unknown[] = []
  const markDefs: unknown[] = []

  // Order matters: links first, then bold before single-star italic.
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|`([^`]+)`|\*(?!\*)([^*]+?)\*(?!\*)/g

  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      children.push(span(text.slice(last, match.index)))
    }

    if (match[1] !== undefined) {
      // Link: [label](href)
      const label = match[1]
      const href = match[2]
      if (SAFE_LINK.test(href)) {
        const linkKey = key()
        markDefs.push({ _type: 'link', _key: linkKey, href })
        children.push(span(label, [linkKey]))
      } else {
        children.push(span(label))
      }
    } else if (match[3] !== undefined) {
      children.push(span(match[3], ['strong']))
    } else if (match[4] !== undefined) {
      children.push(span(match[4], ['code']))
    } else if (match[5] !== undefined) {
      children.push(span(match[5], ['em']))
    }

    last = match.index + match[0].length
  }

  if (last < text.length) {
    children.push(span(text.slice(last)))
  }

  if (children.length === 0) {
    children.push(span(text))
  }

  return { children, markDefs }
}
