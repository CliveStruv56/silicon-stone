import assert from 'node:assert/strict'
import fs from 'node:fs'
import { assertValidSourceId } from '../src/lib/knowledge-inbox'

assert.doesNotThrow(() => assertValidSourceId('valid-kebab-case-id'))
assert.throws(() => assertValidSourceId('../escape'), /Invalid sourceId/)
assert.throws(() => assertValidSourceId('Not-Kebab-Case'), /Invalid sourceId/)
const schemaIndex = fs.readFileSync('src/sanity/schemaTypes/index.ts', 'utf8')
assert.match(schemaIndex, /knowledgeSource/)
assert.match(schemaIndex, /knowledgeCandidate/)

const articleSchema = fs.readFileSync('src/sanity/schemaTypes/article.ts', 'utf8')
assert.equal(articleSchema.includes('knowledgeSource'), false)
assert.equal(articleSchema.includes('knowledgeCandidate'), false)

// The local-vault handoff (scripts/pull-knowledge-source.ts + its manifest
// builders) was removed in Aug 2026 when the Obsidian vault was retired. Assert
// it stays gone, so the dead workflow is not quietly reintroduced.
assert.equal(fs.existsSync('scripts/pull-knowledge-source.ts'), false)
const knowledgeInbox = fs.readFileSync('src/lib/knowledge-inbox.ts', 'utf8')
assert.equal(knowledgeInbox.includes('Manifest'), false)

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
