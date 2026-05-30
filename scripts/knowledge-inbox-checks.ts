import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  assertValidSourceId,
  buildPendingKnowledgeSourceManifest,
  getKnowledgeSourceManifestFilename,
  isReviewedManifest,
  type PendingKnowledgeSource,
} from '../src/lib/knowledge-inbox'

const source: PendingKnowledgeSource = {
  _id: 'knowledge-source-test',
  sourceId: 'example-2026-05-30-agentic-ai',
  title: 'Example agentic AI source',
  sourceType: 'url',
  brandTags: ['silicon-and-stone', 'shared'],
  topicTags: ['agentic-ai', 'operating-models'],
  originalUrl: 'https://example.com/agentic-ai',
  extractedText: 'Source-backed text for local processing.',
  contentHash: `sha256:${'a'.repeat(64)}`,
  capturedAt: '2026-05-30T12:00:00.000Z',
  status: 'pending',
}

const manifest = buildPendingKnowledgeSourceManifest(source)

assert.equal(
  getKnowledgeSourceManifestFilename(source.sourceId),
  'example-2026-05-30-agentic-ai.md',
)
assert.match(manifest, /^type: source-manifest$/m)
assert.match(manifest, /^source_id: "example-2026-05-30-agentic-ai"$/m)
assert.match(manifest, /^canonical_url: "https:\/\/example.com\/agentic-ai"$/m)
assert.match(manifest, /^content_hash: "sha256:a{64}"$/m)
assert.match(manifest, /^status: pending$/m)
assert.equal(manifest.includes(source.extractedText), false)
assert.equal(isReviewedManifest(manifest), false)
assert.equal(isReviewedManifest(manifest.replace('status: pending', 'status: processed')), true)

assert.doesNotThrow(() => assertValidSourceId('valid-kebab-case-id'))
assert.throws(() => assertValidSourceId('../escape'), /Invalid sourceId/)
assert.throws(() => assertValidSourceId('Not-Kebab-Case'), /Invalid sourceId/)
assert.throws(
  () =>
    buildPendingKnowledgeSourceManifest({
      ...source,
      contentHash: 'md5:not-allowed',
    }),
  /contentHash must be sha256/,
)
assert.throws(
  () =>
    buildPendingKnowledgeSourceManifest({
      ...source,
      originalUrl: undefined,
    }),
  /requires originalUrl or assetRef/,
)

const schemaIndex = fs.readFileSync('src/sanity/schemaTypes/index.ts', 'utf8')
assert.match(schemaIndex, /knowledgeSource/)
assert.match(schemaIndex, /knowledgeCandidate/)

const articleSchema = fs.readFileSync('src/sanity/schemaTypes/article.ts', 'utf8')
assert.equal(articleSchema.includes('knowledgeSource'), false)
assert.equal(articleSchema.includes('knowledgeCandidate'), false)

const pullScript = fs.readFileSync('scripts/pull-knowledge-source.ts', 'utf8')
assert.match(pullScript, /--confirm-reviewed/)
assert.match(pullScript, /isReviewedManifest\(manifest\)/)
assert.match(pullScript, /status: 'processed', manifestId: sourceId/)
assert.equal(pullScript.includes('git commit'), false)
assert.equal(pullScript.includes('git push'), false)

const sourceRoute = fs.readFileSync('src/app/api/knowledge/sources/route.ts', 'utf8')
assert.match(sourceRoute, /await requireAdmin\(\)/)
assert.match(sourceRoute, /status: 'pending'/)
assert.match(sourceRoute, /createHash\('sha256'\)/)
assert.match(sourceRoute, /assets\.upload\('file'/)
assert.equal(sourceRoute.includes('git commit'), false)
assert.equal(sourceRoute.includes('git push'), false)

const knowledgePage = fs.readFileSync('src/app/(admin)/knowledge/page.tsx', 'utf8')
assert.match(knowledgePage, /Capture Source/)
assert.match(knowledgePage, /Source Inbox/)
assert.match(knowledgePage, /Published Article Search/)
assert.match(knowledgePage, /\/api\/search\/semantic/)
assert.match(knowledgePage, /\/api\/knowledge\/sources/)
assert.match(knowledgePage, /Save Knowledge Candidate/)
assert.match(knowledgePage, /\/api\/knowledge\/candidates/)

const middleware = fs.readFileSync('src/middleware.ts', 'utf8')
assert.match(middleware, /'\/api\/knowledge\/sources'/)
assert.match(middleware, /'\/api\/knowledge\/sources\/:path\*'/)
assert.match(middleware, /'\/api\/knowledge\/evidence'/)
assert.match(middleware, /'\/api\/knowledge\/evidence\/:path\*'/)
assert.match(middleware, /'\/api\/knowledge\/candidates'/)
assert.match(middleware, /'\/api\/knowledge\/candidates\/:path\*'/)

const candidateRoute = fs.readFileSync('src/app/api/knowledge/candidates/route.ts', 'utf8')
assert.match(candidateRoute, /await requireAdmin\(\)/)
assert.match(candidateRoute, /_type: 'knowledgeCandidate'/)
assert.match(candidateRoute, /status: 'pending'/)
assert.equal(candidateRoute.includes('git commit'), false)
assert.equal(candidateRoute.includes('git push'), false)

console.log('Knowledge inbox checks passed')
