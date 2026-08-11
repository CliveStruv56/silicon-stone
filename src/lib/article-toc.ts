import { slugify } from '@/lib/utils'

/**
 * Table of contents for article bodies (long-read orientation).
 *
 * The ids are resolved here, server-side, and *stamped onto the blocks* rather
 * than recomputed in the renderer. That is deliberate: duplicate headings
 * ("Background" twice) need a suffix to stay unique, and a suffix depends on
 * knowing the whole document. A renderer seeing one block at a time cannot know
 * it is the second "Background", so any recompute-locally scheme silently emits
 * two identical ids and every link to the second one lands on the first.
 *
 * `h1` is included as a top-level entry because body markdown starting with
 * `# Heading` is rendered as an <h2> (see PortableTextComponents) so the page
 * keeps exactly one <h1>. Collecting only `h2` would miss those entirely.
 */

export type TocEntry = {
  id: string
  text: string
  /** 2 = top level (h1 and h2 blocks), 3 = nested (h3 blocks). */
  level: 2 | 3
}

type Block = {
  _type?: string
  _key?: string
  style?: string
  children?: Array<{ text?: string }>
  /** Stamped by buildToc; read by the heading renderers. */
  tocId?: string
}

const LEVELS: Record<string, 2 | 3> = { h1: 2, h2: 2, h3: 3 }

/** Below this, a contents list is furniture rather than help. */
export const MIN_TOC_ENTRIES = 3

function blockText(block: Block): string {
  return (block.children || [])
    .map((child) => child.text || '')
    .join('')
    .trim()
}

/**
 * Returns the contents entries plus a copy of the body with `tocId` stamped on
 * each heading block. Non-heading blocks are passed through by reference — only
 * headings are cloned, so this stays cheap on long bodies.
 */
export function buildToc(body: unknown): { entries: TocEntry[]; body: Block[] } {
  if (!Array.isArray(body)) return { entries: [], body: [] }

  const entries: TocEntry[] = []
  const used = new Map<string, number>()

  const stamped = (body as Block[]).map((block) => {
    const level = block?.style ? LEVELS[block.style] : undefined
    if (!level) return block

    const text = blockText(block)
    // A heading with no text (an image-only or empty block) is not a landmark.
    if (!text) return block

    const base = slugify(text)
    const seen = used.get(base) ?? 0
    used.set(base, seen + 1)
    // First occurrence keeps the clean slug so existing shared links stay valid;
    // later duplicates take a suffix.
    const id = seen === 0 ? base : `${base}-${seen + 1}`

    entries.push({ id, text, level })
    return { ...block, tocId: id }
  })

  return { entries, body: stamped }
}
