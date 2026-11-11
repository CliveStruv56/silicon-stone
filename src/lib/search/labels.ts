/**
 * Labels shown beside search results. Plain data with no imports, so the
 * client-side result lists can use it without bundling the page registry.
 */
export const RESULT_LABELS = {
  tool: 'Tool',
  product: 'Product',
  advisory: 'Advisory',
  guide: 'Guide',
  page: 'Page',
  author: 'Author',
  article: 'Analysis',
  glossary: 'Glossary',
} as const

export type ResultLabelKind = keyof typeof RESULT_LABELS

/**
 * Article formats as readers see them. Sanity stores lower-case keys
 * ("signal", "deepdive"); a key with no entry here renders no badge rather
 * than the raw value.
 */
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  signal: 'Signal',
  deepdive: 'Deep Dive',
  guide: 'Guide',
}

export function contentTypeLabel(contentType: string | null | undefined): string | null {
  return (contentType && CONTENT_TYPE_LABELS[contentType]) || null
}
