import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  buildEvidenceChunkId,
  buildEvidenceChunkRecords,
  chunkEvidenceText,
  EVIDENCE_CHUNK_MAX_CHARACTERS,
} from '../src/lib/evidence'

assert.equal(buildEvidenceChunkId('source-1', 0), 'source-1:chunk:0')
assert.equal(buildEvidenceChunkId('source-1', 12), 'source-1:chunk:12')
assert.throws(() => buildEvidenceChunkId('', 0), /sourceId is required/)
assert.throws(() => buildEvidenceChunkId('source-1', -1), /non-negative integer/)

const paragraphs = [
  'First paragraph with source-backed evidence.',
  'Second paragraph with more source-backed evidence.',
  'Third paragraph with additional evidence.',
].join('\n\n')

const chunks = chunkEvidenceText(paragraphs, 80)
assert.deepEqual(chunks, [
  'First paragraph with source-backed evidence.',
  'Second paragraph with more source-backed evidence.',
  'Third paragraph with additional evidence.',
])
assert.equal(chunks.every((chunk) => chunk.length <= 80), true)

const splitLongChunk = chunkEvidenceText('word '.repeat(30).trim(), 40)
assert.equal(splitLongChunk.every((chunk) => chunk.length <= 40), true)
assert.throws(() => chunkEvidenceText('text', 0), /must be positive/)

const records = buildEvidenceChunkRecords({
  sourceId: 'public-report-2026',
  recordType: 'knowledge_source',
  manifestId: 'public-report-2026',
  title: 'Public report',
  text: paragraphs,
  brandTags: ['silicon-and-stone', 'shared'],
  url: 'https://example.com/report',
  contentHash: `sha256:${'b'.repeat(64)}`,
})

assert.equal(records[0].id, 'public-report-2026:chunk:0')
assert.equal(records[0].metadata.sourceId, 'public-report-2026')
assert.equal(records[0].metadata.recordType, 'knowledge_source')
assert.equal(records[0].metadata.manifestId, 'public-report-2026')
assert.deepEqual(records[0].metadata.brandTags, ['silicon-and-stone', 'shared'])
assert.equal(records[0].metadata.locator, 'chunk:0')
assert.equal(records[0].metadata.url, 'https://example.com/report')
assert.equal(records[0].metadata.contentHash, `sha256:${'b'.repeat(64)}`)
assert.equal(records[0].metadata.text.length <= EVIDENCE_CHUNK_MAX_CHARACTERS, true)

const evidenceIndex = fs.readFileSync('src/lib/evidence-index.ts', 'utf8')
assert.match(
  evidenceIndex,
  /deleteMany\(\{\s*filter: \{ sourceId: \{ \$eq: source\.sourceId \} \},\s*\}\)/,
  'evidence replacement must delete existing source chunks by sourceId before upsert',
)
assert.match(evidenceIndex, /error\.name === 'PineconeNotFoundError'/)
assert.ok(
  evidenceIndex.indexOf('deleteMany') < evidenceIndex.indexOf('index.upsert'),
  'evidence deletion must occur before evidence upsert',
)
assert.match(evidenceIndex, /EVIDENCE_EMBEDDING_BATCH_SIZE/)
assert.match(evidenceIndex, /EVIDENCE_SOURCE_MAX_CHUNKS/)
assert.match(evidenceIndex, /embedInBatches/)
assert.match(
  evidenceIndex,
  /EVIDENCE_UPSERT_BATCH_SIZE/,
  'upserts must be batched — 500 chunks in one request exceeds Pinecone 2MB limit',
)
assert.equal(
  /Promise\.all\(\s*records\.map/.test(evidenceIndex),
  false,
  'evidence replacement must not fan out every embedding call at once',
)

const pineconeSource = fs.readFileSync('src/lib/pinecone.ts', 'utf8')
assert.match(pineconeSource, /PINECONE_EVIDENCE_INDEX_NAME/)

const vectorizeRoute = fs.readFileSync('src/app/api/vectorize/route.ts', 'utf8')
assert.equal(vectorizeRoute.includes('getEvidencePineconeIndex'), false)
assert.equal(vectorizeRoute.includes('replaceEvidenceSource'), false)
assert.match(vectorizeRoute, /relatedArticles/)

const semanticSearchRoute = fs.readFileSync('src/app/api/search/semantic/route.ts', 'utf8')
assert.equal(semanticSearchRoute.includes('searchEvidence'), false)
assert.match(semanticSearchRoute, /searchSimilar/)

const relatedArticlesComponent = fs.readFileSync('src/components/article/RelatedArticles.tsx', 'utf8')
assert.equal(relatedArticlesComponent.includes('generateEmbedding'), false)
assert.equal(relatedArticlesComponent.includes('searchSimilar'), false)

const evidenceSearchRoute = fs.readFileSync('src/app/api/knowledge/evidence/route.ts', 'utf8')
assert.match(evidenceSearchRoute, /await requireAdmin\(\)/)
assert.match(evidenceSearchRoute, /searchEvidence\(vector, 8, filter\)/)
// $in, not $eq — brandTags is a string[]; an equality filter could never match
// a multi-tag source, which is the bug this assertion previously pinned in place.
assert.match(evidenceSearchRoute, /brandTags: \{ \$in: \[brand\] \}/)

const knowledgePage = fs.readFileSync('src/app/(admin)/knowledge/page.tsx', 'utf8')
assert.match(knowledgePage, /Deep Evidence Search/)
assert.match(knowledgePage, /\/api\/knowledge\/evidence/)

const rebuildScript = fs.readFileSync('scripts/rebuild-evidence-index.ts', 'utf8')
assert.match(rebuildScript, /status == "processed"/)
assert.match(rebuildScript, /published_article/)
assert.match(rebuildScript, /--dry-run/)

console.log('Evidence index checks passed')
