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
}

/**
 * Label for search results: the three public types only, no badge (null)
 * for anything else. Exactly what search showed before the rename.
 */
export function contentTypeLabel(contentType: string | null | undefined): string | null {
  return (contentType && CONTENT_TYPE_LABELS[contentType]) || null
}

/**
 * Badge on the article page and grid cards. Any stored type other than signal
 * or deepdive has always shown "Guide" there (including youtube); only the
 * stored value `guide` changes name. Kept as it was on purpose.
 */
export function badgeLabel(contentType: string | null | undefined): string | null {
  if (!contentType) return null
  return CONTENT_TYPE_LABELS[contentType] ?? 'Guide'
}

/** Related-articles list and admin knowledge page: also names youtube, falls back to the raw value. */
export const LABELS_WITH_YOUTUBE: Record<string, string> = {
  ...CONTENT_TYPE_LABELS,
  youtube: 'YouTube Script',
}

