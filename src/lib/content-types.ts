/**
 * Article formats as readers (and editors) see them.
 *
 * Sanity stores a lower-case key on `article.contentType`. The stored value
 * `guide` is the Practical Move: the Friday "what to do about it" piece. The
 * value is deliberately NOT renamed, because every stored document, the
 * on-publish payload, the vector index and the admin tooling key off it. Only
 * the label changes, and it changes here, once.
 *
 * Plain data with no imports so the Studio, client components and server code
 * can all use it.
 */
export const PRACTICAL_MOVE_CONTENT_TYPE = 'guide'

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  signal: 'Signal',
  deepdive: 'Deep Dive',
  [PRACTICAL_MOVE_CONTENT_TYPE]: 'Practical Move',
  youtube: 'YouTube Script',
}

/** Reader-facing label, or null for an unknown or missing type. */
export function contentTypeLabel(contentType: string | null | undefined): string | null {
  return (contentType && CONTENT_TYPE_LABELS[contentType]) || null
}
