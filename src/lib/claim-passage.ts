/**
 * Locating a fact-check claim's original passage inside the article body.
 *
 * Extracted from ClaimCheckInput so it can be tested: the "Insert into article"
 * button's enabled state and its replacement both depend on this matching, and
 * a silent mismatch disables the control with a message that blames the editor.
 *
 * THE PHANTOM SPACE. Two functions read the same paragraph and disagree:
 *
 *   extractArticleText (embeddings.ts)  children.map(c => c.text).join(' ')
 *   this module, and the body itself    children.map(c => c.text).join('')
 *
 * Portable Text spans are contiguous — a paragraph carrying an inline link is
 * stored as three spans, and the rendered text has no space at the joins. The
 * fact-check reads the space-joined view, so the `originalText` it stores gains
 * a space at every span boundary that the body does not have:
 *
 *   stored:  "…eu-ai-act-compliance-chasm-august-2026 ."
 *   body:    "…eu-ai-act-compliance-chasm-august-2026. Article 50 carries…"
 *
 * Observed 21 August 2026 on a Signal whose paragraph linked to a prior piece.
 * A pattern requiring whitespace could never match, so the button greyed out on
 * exactly the formatted paragraphs the component has special handling for —
 * and the UI said "it may have been edited" when nothing had been.
 *
 * Whitespace is therefore OPTIONAL, not required. Fixing `join(' ')` instead
 * would be more principled but changes the text that feeds the article
 * embeddings, and this is a display-time match, not a stored value.
 */

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export type PassageSpan = { text?: string }
export type PassageBlock = { _type?: string; _key?: string; children?: PassageSpan[] }

/**
 * The stored passage is whitespace-normalised (claim extraction reads a
 * squashed text view of the article) and may carry a phantom space at any span
 * boundary, so match any whitespace run flexibly — including none at all.
 */
export function passagePattern(text: string): RegExp | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  return new RegExp(escapeRegExp(trimmed).replace(/\s+/g, '\\s*'))
}

/** A block's text exactly as the body stores it — spans joined, not spaced. */
export function blockTextOf(block: PassageBlock): string {
  if (!Array.isArray(block.children)) return ''
  return block.children.map((c) => c?.text ?? '').join('')
}

/** The block containing `originalText`, or null when it is not findable. */
export function findPassageBlock(
  body: unknown,
  originalText: string | undefined,
): PassageBlock | null {
  if (!Array.isArray(body) || !originalText) return null
  const pattern = passagePattern(originalText)
  if (!pattern) return null

  return (
    (body as PassageBlock[]).find(
      (block) =>
        block?._type === 'block' &&
        Array.isArray(block.children) &&
        pattern.test(blockTextOf(block)),
    ) ?? null
  )
}
