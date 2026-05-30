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

export type PendingKnowledgeSource = {
  _id: string
  sourceId: string
  title: string
  sourceType: KnowledgeSourceType
  brandTags: KnowledgeBrandTag[]
  topicTags: string[]
  originalUrl?: string
  assetRef?: string
  assetUrl?: string
  extractedText: string
  contentHash: string
  capturedAt: string
  status: 'pending' | 'processed' | 'error'
  manifestId?: string
}

function yamlString(value: string) {
  return JSON.stringify(value)
}

function yamlArray(values: string[]) {
  return values.length === 0
    ? ' []'
    : `\n${values.map((value) => `  - ${yamlString(value)}`).join('\n')}`
}

export function assertValidSourceId(sourceId: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceId)) {
    throw new Error(`Invalid sourceId: ${sourceId}. Expected lower-case kebab-case.`)
  }
}

export function validatePendingKnowledgeSource(
  source: PendingKnowledgeSource,
) {
  assertValidSourceId(source.sourceId)

  if (!source.title.trim()) throw new Error('Knowledge source title is required.')
  if (!KNOWLEDGE_SOURCE_TYPES.includes(source.sourceType)) {
    throw new Error(`Unsupported knowledge source type: ${source.sourceType}`)
  }
  if (source.brandTags.length === 0) {
    throw new Error('At least one knowledge source brand tag is required.')
  }
  for (const tag of source.brandTags) {
    if (!KNOWLEDGE_BRAND_TAGS.includes(tag)) {
      throw new Error(`Unsupported knowledge source brand tag: ${tag}`)
    }
  }
  if (!source.originalUrl && !source.assetRef) {
    throw new Error('Knowledge source requires originalUrl or assetRef.')
  }
  if (!source.extractedText.trim()) {
    throw new Error('Knowledge source extractedText is required.')
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(source.contentHash)) {
    throw new Error('Knowledge source contentHash must be sha256:<64 lower-case hex characters>.')
  }
  if (!source.capturedAt || Number.isNaN(Date.parse(source.capturedAt))) {
    throw new Error('Knowledge source capturedAt must be a valid date.')
  }
  if (source.status !== 'pending') {
    throw new Error(`Expected pending knowledge source, received: ${source.status}`)
  }
}

export function getKnowledgeSourceManifestFilename(sourceId: string) {
  assertValidSourceId(sourceId)
  return `${sourceId}.md`
}

export function buildPendingKnowledgeSourceManifest(
  source: PendingKnowledgeSource,
) {
  validatePendingKnowledgeSource(source)

  const originalLocation = source.originalUrl
    ? `canonical_url: ${yamlString(source.originalUrl)}`
    : `sanity_asset_ref: ${yamlString(source.assetRef ?? '')}`

  const durableAsset = source.assetRef
    ? `\nsanity_asset_ref: ${yamlString(source.assetRef)}`
    : ''

  return `---
type: source-manifest
source_id: ${yamlString(source.sourceId)}
title: ${yamlString(source.title)}
source_type: ${yamlString(source.sourceType)}
brand_tags:${yamlArray(source.brandTags)}
topic_tags:${yamlArray(source.topicTags)}
${originalLocation}${durableAsset}
captured_at: ${yamlString(source.capturedAt.slice(0, 10))}
content_hash: ${yamlString(source.contentHash)}
status: pending
---

# Source: ${source.title}

## Summary

Pending local-agent processing.

## Useful Locators

- Pending local-agent processing.

## Wiki Pages Updated

- None yet.

## Processing Notes

- Prepared from Sanity knowledge inbox document \`${source._id}\`.
- Extracted source text remains in Sanity and is intentionally not duplicated in the vault.
- Review the source, update the wiki with claim-level citations, then set this manifest to \`status: processed\`.
`
}

export function isReviewedManifest(content: string) {
  return /^status: processed$/m.test(content)
}
