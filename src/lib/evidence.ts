export const EVIDENCE_CHUNK_MAX_CHARACTERS = 6000

export type EvidenceRecordType = 'knowledge_source' | 'published_article'

export type EvidenceSource = {
  sourceId: string
  recordType: EvidenceRecordType
  manifestId?: string
  title: string
  text: string
  brandTags: string[]
  url?: string
  contentHash: string
}

export type EvidenceChunkMetadata = {
  sourceId: string
  recordType: EvidenceRecordType
  manifestId: string
  title: string
  brandTags: string
  locator: string
  url: string
  text: string
  contentHash: string
}

function normalizeWhitespace(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

function splitLongSegment(segment: string, maxCharacters: number) {
  const chunks: string[] = []
  let remaining = segment.trim()

  while (remaining.length > maxCharacters) {
    const candidate = remaining.slice(0, maxCharacters + 1)
    const splitAt = Math.max(
      candidate.lastIndexOf('. '),
      candidate.lastIndexOf(' '),
    )
    const boundary = splitAt > Math.floor(maxCharacters * 0.6)
      ? splitAt + 1
      : maxCharacters

    chunks.push(remaining.slice(0, boundary).trim())
    remaining = remaining.slice(boundary).trim()
  }

  if (remaining) chunks.push(remaining)
  return chunks
}

export function chunkEvidenceText(
  text: string,
  maxCharacters = EVIDENCE_CHUNK_MAX_CHARACTERS,
) {
  if (maxCharacters < 1) throw new Error('Evidence chunk maxCharacters must be positive.')

  const segments = normalizeWhitespace(text)
    .split(/\n{2,}/)
    .flatMap((segment) => splitLongSegment(segment, maxCharacters))
    .filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const segment of segments) {
    const candidate = current ? `${current}\n\n${segment}` : segment
    if (candidate.length <= maxCharacters) {
      current = candidate
      continue
    }

    if (current) chunks.push(current)
    current = segment
  }

  if (current) chunks.push(current)
  return chunks
}

export function buildEvidenceChunkId(sourceId: string, chunkIndex: number) {
  if (!sourceId.trim()) throw new Error('Evidence sourceId is required.')
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
    throw new Error('Evidence chunkIndex must be a non-negative integer.')
  }
  return `${sourceId}:chunk:${chunkIndex}`
}

export function buildEvidenceChunkRecords(source: EvidenceSource) {
  if (!source.sourceId.trim()) throw new Error('Evidence sourceId is required.')
  if (!source.title.trim()) throw new Error('Evidence title is required.')
  if (!source.contentHash.trim()) throw new Error('Evidence contentHash is required.')

  return chunkEvidenceText(source.text).map((text, chunkIndex) => ({
    id: buildEvidenceChunkId(source.sourceId, chunkIndex),
    metadata: {
      sourceId: source.sourceId,
      recordType: source.recordType,
      manifestId: source.manifestId ?? '',
      title: source.title,
      brandTags: source.brandTags.join(','),
      locator: `chunk:${chunkIndex}`,
      url: source.url ?? '',
      text,
      contentHash: source.contentHash,
    } satisfies EvidenceChunkMetadata,
  }))
}
