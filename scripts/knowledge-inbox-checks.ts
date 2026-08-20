import assert from 'node:assert/strict'
import fs from 'node:fs'
import { KNOWLEDGE_SOURCE_TYPES, assertValidSourceId } from '../src/lib/knowledge-inbox'
import {
  KNOWLEDGE_FEATURE_ENV_VARS,
} from '../src/lib/knowledge/features'
import { KNOWLEDGE_SOURCE_KINDS } from '../src/lib/knowledge/types'

assert.doesNotThrow(() => assertValidSourceId('valid-kebab-case-id'))
assert.throws(() => assertValidSourceId('../escape'), /Invalid sourceId/)
assert.throws(() => assertValidSourceId('Not-Kebab-Case'), /Invalid sourceId/)
const schemaIndex = fs.readFileSync('src/sanity/schemaTypes/index.ts', 'utf8')
assert.match(schemaIndex, /knowledgeSource/)
assert.match(schemaIndex, /knowledgeCandidate/)

const articleSchema = fs.readFileSync('src/sanity/schemaTypes/article.ts', 'utf8')
// This assertion used to forbid BOTH types. `knowledgeSource` is now permitted
// and expected: the canonical foundation wave gives an article optional
// internal lineage — a research run, knowledge items, canonical sources, prior
// coverage — because an article that cannot say what it was written from is
// the gap the whole knowledge system exists to close.
//
// What the original assertion was actually protecting still holds, and is
// asserted below instead: the article schema does not touch the legacy
// candidate type or the retired local-vault filing vocabulary, and none of the
// new lineage is public.
assert.equal(articleSchema.includes('knowledgeCandidate'), false)
assert.equal(articleSchema.includes('manifest'), false)
assert.match(articleSchema, /name: 'provenance', title: 'Provenance \(internal\)'/)
for (const field of [
  'researchRun',
  'knowledgeItems',
  'knowledgeSources',
  'priorCoverage',
  'citationSnapshots',
  'generationSnapshot',
]) {
  assert.match(
    articleSchema,
    new RegExp(`name: '${field}'`),
    `article schema is missing the ${field} lineage field`,
  )
}

// The lineage is internal. Every public article query lists its fields
// explicitly, so a new document field cannot leak by accident — but only for
// as long as that stays true, which is what this asserts.
const queries = fs.readFileSync('src/sanity/lib/queries.ts', 'utf8')
for (const field of [
  'researchRun',
  'knowledgeItems',
  'knowledgeSources',
  'priorCoverage',
  'citationSnapshots',
  'generationSnapshot',
]) {
  assert.equal(
    queries.includes(field),
    false,
    `public queries must not project the internal ${field} field`,
  )
}

// The three canonical types are registered, and the legacy candidate type is
// still reachable rather than quietly dropped.
for (const type of ['knowledgeItem', 'knowledgeTopic', 'researchRun']) {
  assert.match(schemaIndex, new RegExp(type), `${type} is not registered`)
}
const structure = fs.readFileSync('src/sanity/structure.ts', 'utf8')
for (const type of ['knowledgeItem', 'knowledgeTopic', 'researchRun', 'knowledgeCandidate']) {
  assert.match(structure, new RegExp(type), `${type} is not reachable in the Studio structure`)
}
// A source written before this wave has no reviewStatus, only the legacy
// status. Every Studio list has to ask both questions or the inbox looks empty.
assert.match(structure, /!defined\(reviewStatus\) && status == "pending"/)
assert.match(structure, /!defined\(reviewStatus\) && status == "processed"/)

// The legacy source-type list must stay a subset of the canonical kinds, so the
// two cannot drift into disagreeing about what a source can be.
for (const type of KNOWLEDGE_SOURCE_TYPES) {
  assert.ok(
    (KNOWLEDGE_SOURCE_KINDS as readonly string[]).includes(type),
    `legacy source type ${type} is not in KNOWLEDGE_SOURCE_KINDS`,
  )
}

// The knowledge feature controls gate server writes, indexing and retrieval.
// A NEXT_PUBLIC_ name would be inlined into the browser bundle.
for (const name of Object.values(KNOWLEDGE_FEATURE_ENV_VARS)) {
  assert.equal(
    name.startsWith('NEXT_PUBLIC_'),
    false,
    `${name} must not be a NEXT_PUBLIC_ variable`,
  )
}

// The local-vault handoff (scripts/pull-knowledge-source.ts + its manifest
// builders) was removed in Aug 2026 when the Obsidian vault was retired. Assert
// it stays gone, so the dead workflow is not quietly reintroduced.
assert.equal(fs.existsSync('scripts/pull-knowledge-source.ts'), false)
const knowledgeInbox = fs.readFileSync('src/lib/knowledge-inbox.ts', 'utf8')
assert.equal(knowledgeInbox.includes('Manifest'), false)

const sourceRoute = fs.readFileSync('src/app/api/knowledge/sources/route.ts', 'utf8')
assert.match(sourceRoute, /await requireAdmin\(\)/)
assert.match(sourceRoute, /status: 'pending'/)
// The legacy status is still written AND the canonical review status is
// written beside it, so records captured from here forward need less backfill.
assert.match(sourceRoute, /reviewStatus: 'inbox'/)
// Hashing moved into the knowledge domain rather than being re-implemented per
// route. The assertion follows it: the route must use the shared helper, and
// the shared helper must still be SHA-256.
assert.match(sourceRoute, /from '@\/lib\/knowledge\/hash'/)
assert.equal(sourceRoute.includes("createHash('sha256')"), false)
const knowledgeHash = fs.readFileSync('src/lib/knowledge/hash.ts', 'utf8')
assert.match(knowledgeHash, /createHash\('sha256'\)/)
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
// Still the legacy type, deliberately: the cutover onto knowledgeItem is the
// migration wave's job, and switching the writer before the migration exists
// would split the records across two types with nothing reconciling them.
assert.match(candidateRoute, /_type: 'knowledgeCandidate'/)
assert.match(candidateRoute, /status: 'pending'/)
assert.equal(candidateRoute.includes('git commit'), false)
assert.equal(candidateRoute.includes('git push'), false)

// ---- External capture and the MCP server (wave 4a) ----

// The new machine endpoints must stay OUT of both middleware lists. The reason
// is concrete rather than theoretical: middleware REDIRECTS to /login rather
// than answering 401, so a machine client that matched would receive a 307 to
// an HTML page and report a confusing parse failure instead of an auth error.
for (const machinePath of [
  '/api/knowledge/capture',
  '/api/knowledge/inbox',
  '/api/knowledge/record',
  '/api/mcp',
]) {
  assert.equal(
    middleware.includes(machinePath),
    false,
    `${machinePath} must not be behind the admin cookie middleware`,
  )
}

// zod is a transport requirement of the MCP SDK, which needs a Standard Schema
// to publish each tool's inputSchema. It is confined to src/lib/mcp/ so that
// "the knowledge domain has no validation library" stays literally true — the
// domain's own parsers in schema.ts remain the only thing that decides.
for (const file of fs.readdirSync('src/lib/knowledge')) {
  if (!file.endsWith('.ts')) continue
  const source = fs.readFileSync(`src/lib/knowledge/${file}`, 'utf8')
  assert.equal(
    /from 'zod'/.test(source),
    false,
    `src/lib/knowledge/${file} must not import zod — validation lives in schema.ts`,
  )
}

const toolsSource = fs.readFileSync('src/lib/mcp/knowledge-tools.ts', 'utf8')

// destructiveHint defaults to TRUE whenever readOnlyHint is false, so leaving
// it implicit would put a destructive-action confirmation in front of the one
// action performed constantly. Capture never overwrites: a duplicate returns
// the record that already existed.
assert.equal(
  (toolsSource.match(/destructiveHint: false/g) ?? []).length,
  3,
  'every write tool must declare destructiveHint: false explicitly',
)
// ChatGPT treats a MISSING readOnlyHint as a write and gates it behind a
// confirmation, so the read tools must say so.
assert.equal(
  (toolsSource.match(/readOnlyHint: true/g) ?? []).length,
  3,
  'all three read tools must declare readOnlyHint: true',
)

// Neither field may be offered to a model. `sourceSystem` is half of the
// external-reference duplicate probe, so a model that can set it can split or
// merge deduplication buckets; `extractionExpected` describes a capability that
// does not exist, and a field in a schema is an invitation.
// Matched as an object key (`field: z...`), which is how a zod schema field is
// written — the module's own comments explain at length why these two are
// absent, and prose must not trip the check.
const schemaRegion = toolsSource.slice(0, toolsSource.indexOf('export interface ToolResult'))
assert.equal(
  /extractionExpected\s*:/.test(schemaRegion),
  false,
  'no tool schema may offer extractionExpected',
)
assert.equal(
  /sourceSystem\s*:/.test(schemaRegion),
  false,
  'no tool schema may offer sourceSystem — the server sets it',
)

// link_sources_to_item is the ONLY tool that may modify an existing record, and
// it may only add source references to something still awaiting review. If it
// ever reaches for a review transition, the invariant is gone.
assert.match(toolsSource, /linkSourcesToItem/)

// No tool may move a record out of the inbox. That invariant is what the whole
// domain layer exists to hold, and a tool is the easiest way to lose it.
for (const forbidden of ['applyReviewTransition', 'reviewTransitions', 'promote_to_article']) {
  assert.equal(
    toolsSource.includes(forbidden),
    false,
    `the MCP tools must not expose ${forbidden}`,
  )
}

console.log('Knowledge inbox checks passed')
