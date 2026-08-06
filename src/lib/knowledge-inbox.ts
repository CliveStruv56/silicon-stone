export const KNOWLEDGE_SOURCE_TYPES = [
  'url',
  'pdf',
  'image',
  'note',
  'published_article',
] as const

export const KNOWLEDGE_BRAND_TAGS = [
  'silicon-and-stone',
  'waymark-path',
  'shared',
] as const

export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number]
export type KnowledgeBrandTag = (typeof KNOWLEDGE_BRAND_TAGS)[number]

export function assertValidSourceId(sourceId: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceId)) {
    throw new Error(`Invalid sourceId: ${sourceId}. Expected lower-case kebab-case.`)
  }
}
