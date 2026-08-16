/**
 * Invariant tests for the regulatory retrieval lane.
 *
 *   npm run test:regulatory-index
 *
 * The load-bearing group is SEPARATION. This lane exists to give the drafting
 * model statutory text to quote; it is chunked, unverified and editorial. The
 * Compliance Checker's legal authority is the pinned rule pack, and its promise
 * is that no generated legal quotation reaches a screen unverified. Wiring the
 * two together would silently void that promise, so it is asserted here rather
 * than left to a comment.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { parseStatute } from '../src/lib/regulatory/parse'
import {
  buildRegulatoryChunkRecords,
  REGULATORY_CHUNK_MAX_CHARACTERS,
  PINECONE_METADATA_LIMIT_BYTES,
} from '../src/lib/regulatory/chunk'
import { readInstrumentMeta, readSourceText, readManifest, listCorpusIds } from '../src/lib/regulatory/meta'
import { looksRegulatory, routableCorpusIds } from '../src/lib/regulatory/gate'

const read = (file: string): string => fs.readFileSync(file, 'utf8')

/**
 * Strip comments so a "must never call X" assertion is not tripped by the
 * comment explaining why X must never be called. `://` is preserved so URLs
 * survive. Good enough for presence checks; not a parser.
 */
const code = (file: string): string =>
  read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')

function walkTs(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkTs(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

// ── Chunker invariants ──────────────────────────────────────────────────────

// Every ingested instrument, not just the AI Act. These invariants are what
// make a quotation safe to publish, so a corpus added later must inherit them
// rather than rely on whoever added it having read this file.
const chunksByCorpus = listCorpusIds().map((corpusId) => {
  const instrumentMeta = readInstrumentMeta(corpusId)
  return {
    corpusId,
    records: buildRegulatoryChunkRecords(
      parseStatute(readSourceText(instrumentMeta), instrumentMeta),
      instrumentMeta,
    ),
  }
})

assert.ok(chunksByCorpus.length > 0, 'at least one corpus must be present')

for (const { corpusId, records } of chunksByCorpus) {
  assert.ok(records.length > 0, `${corpusId} must produce chunks`)
}

const chunks = chunksByCorpus.flatMap((entry) => entry.records)

for (const chunk of chunks) {
  const body = chunk.metadata.text.split('\n---\n').slice(1).join('\n---\n')
  assert.ok(
    body.length <= REGULATORY_CHUNK_MAX_CHARACTERS,
    `${chunk.id}: body ${body.length} exceeds ${REGULATORY_CHUNK_MAX_CHARACTERS}`,
  )
  assert.ok(
    chunk.metadata.text.startsWith(chunk.metadata.citation),
    `${chunk.id}: the citation header must be INSIDE the embedded text — a quotation must ` +
      `never be separable from its locator`,
  )
  assert.notEqual(chunk.metadata.consolidatedAs, '', `${chunk.id}: missing consolidation date`)
  assert.notEqual(chunk.metadata.url, '', `${chunk.id}: missing source URL`)
  assert.equal(chunk.metadata.authority, 'editorial-only', `${chunk.id}: wrong authority marker`)
  assert.ok(
    Buffer.byteLength(JSON.stringify(chunk.metadata), 'utf8') < PINECONE_METADATA_LIMIT_BYTES,
    `${chunk.id}: metadata exceeds Pinecone's 40KB ceiling`,
  )
  const articleLabels = chunk.metadata.text.match(/^Article \d+[a-z]?$/gm) ?? []
  assert.ok(articleLabels.length <= 1, `${chunk.id}: a chunk must never span two Articles`)
}

assert.equal(new Set(chunks.map((c) => c.id)).size, chunks.length, 'record ids must be unique')

// Unique ids are not enough — two records can carry identical TEXT under
// different locators. Chips Act Annex I produced sixteen byte-identical chunks
// because an oversize point was split together with its chapeau, so every part
// regenerated the same chapeau-only slice. Duplicates waste the per-article
// retrieval budget on text the model has already been shown.
for (const { corpusId, records } of chunksByCorpus) {
  const byHash = new Map<string, string[]>()
  for (const record of records) {
    const seen = byHash.get(record.metadata.contentHash) ?? []
    byHash.set(record.metadata.contentHash, [...seen, record.metadata.locator])
  }
  for (const [, locators] of byHash) {
    assert.equal(
      locators.length,
      1,
      `${corpusId}: identical text under ${locators.length} locators (${locators.slice(0, 4).join(', ')})`,
    )
  }
}

// Merged sibling blocks must not collapse onto the article chapeau's locator.
for (const chunk of chunks.filter((c) => c.metadata.paragraph.includes('-'))) {
  assert.match(chunk.metadata.locator, /:para:/, `${chunk.id}: merged block lost its paragraph range`)
}

// Recitals are not ingested: EUR-Lex consolidated texts omit the preamble, and
// non-binding interpretive material must not be quotable as obligation.
assert.equal(
  chunks.some((c) => c.metadata.text.includes('Whereas:')),
  false,
  'recitals must not be in the corpus',
)

// EUR-Lex editorial apparatus must never survive into a quotable passage. The
// consolidation markers (▼B, ▼M1) and corrigendum brackets (►C1 ... ◄) are
// EUR-Lex's own annotations, not legal text; GDPR Articles 43(1) and 65(1)
// carry them inline, mid-sentence.
for (const chunk of chunks) {
  assert.doesNotMatch(
    chunk.metadata.text,
    /[►◄▼]/,
    `${chunk.id}: a consolidation marker survived into quotable text`,
  )
}

// Every chunk must declare whether its instrument binds companies directly.
for (const chunk of chunks) {
  assert.ok(
    chunk.metadata.instrumentType === 'regulation' || chunk.metadata.instrumentType === 'directive',
    `${chunk.id}: instrumentType must be set — a Directive quoted as directly binding is wrong`,
  )
}

// ── Gate and routing ────────────────────────────────────────────────────────

assert.equal(looksRegulatory('EU AI Act high-risk obligations').hit, true)
assert.equal(looksRegulatory('TSMC Dresden fab workforce shortages').hit, false)

// An ingested corpus no query can route to is text nobody can reach.
const routable = new Set(routableCorpusIds())
for (const corpusId of listCorpusIds()) {
  assert.ok(
    routable.has(corpusId),
    `${corpusId} is ingested but has no routing terms in gate.ts — no query can select it`,
  )
}

// ── SEPARATION: the Compliance Checker must never reach this lane ────────────

const REGULATORY_REFERENCE =
  /@\/lib\/regulatory|lib\/regulatory|getRegulatoryPineconeIndex|searchRegulatory|PINECONE_REGULATORY_INDEX_NAME/

for (const dir of [
  'src/lib/report',
  'src/lib/rulepack',
  'src/app/api/tools/compliance-checker',
]) {
  for (const file of walkTs(dir)) {
    assert.equal(
      REGULATORY_REFERENCE.test(code(file)),
      false,
      `${file}: the Compliance Checker's legal authority is the pinned rule pack, never the ` +
        `regulatory retrieval corpus. No generated legal quotation reaches a screen unverified.`,
    )
  }
}

// Belt and braces on the three most load-bearing files by name. Matched on
// module/identifier references, NOT the bare word "regulatory" — that appears
// legitimately in English prose inside the report prompts.
for (const file of [
  'src/lib/report/generate.ts',
  'src/lib/report/verify.ts',
  'src/lib/rulepack/corpus.ts',
]) {
  assert.equal(
    REGULATORY_REFERENCE.test(code(file)),
    false,
    `${file} must not reference the regulatory retrieval lane`,
  )
}

// And the reverse: this lane claims no verification authority.
const retrieve = code('src/lib/regulatory/retrieve.ts')
for (const forbidden of ['rulepack/corpus', 'verifyCitation', 'verifyReport', 'readArticle']) {
  assert.equal(
    retrieve.includes(forbidden),
    false,
    `src/lib/regulatory/retrieve.ts must not use ${forbidden} — it is not a verifier`,
  )
}

// ── Index isolation ─────────────────────────────────────────────────────────

const pineconeSource = read('src/lib/pinecone.ts')
assert.match(pineconeSource, /PINECONE_REGULATORY_INDEX_NAME/)

const client = code('src/lib/regulatory/index-client.ts')
assert.match(client, /getRegulatoryPineconeIndex/)
assert.equal(client.includes('getPineconeIndex()'), false, 'must not touch the article index')
assert.equal(client.includes('getEvidencePineconeIndex'), false, 'must not touch the evidence index')
// The integrated-text query path would embed with llama and compare against our
// OpenAI vectors — confident nonsense. It must be unreachable from here.
assert.equal(client.includes('searchRecords'), false, 'must not use the integrated-text query path')
assert.equal(/inputs:\s*\{/.test(client), false, 'must not use the integrated-text query path')
assert.match(client, /REGULATORY_UPSERT_BATCH_SIZE/, 'upserts must be batched')

// ── The generator must actually consume it ──────────────────────────────────

const draftRetrieval = read('src/lib/draft-retrieval.ts')
assert.match(draftRetrieval, /retrieveRegulatoryContext/)
assert.match(draftRetrieval, /searchSimilar/)

const createActions = read('src/app/(admin)/create/actions.ts')
assert.match(createActions, /gatherDraftContext/)
assert.match(createActions, /regulatoryCorpus/)

const prompts = read('src/lib/prompts.ts')
assert.match(prompts, /regulatoryBlock/)
assert.ok(
  prompts.includes('${regulatoryBlock}'),
  'the regulatory block must be interpolated into the user prompt, not merely defined',
)
assert.match(prompts, /regulatory-text/, 'the SECURITY notice must name the new block')
assert.match(
  prompts,
  /ONLY around words you have copied character-for-character/,
  'the prompt must forbid quoting from memory',
)

// ── No silent failure anywhere in the retrieval path ────────────────────────

const EMPTY_CATCH = /catch\s*(\([^)]*\))?\s*\{\s*(\/\/[^\n]*\s*)*\}/

for (const file of [
  'src/app/(admin)/create/actions.ts',
  'src/lib/draft-retrieval.ts',
  'src/lib/regulatory/retrieve.ts',
  'src/lib/regulatory/index-client.ts',
]) {
  assert.equal(
    EMPTY_CATCH.test(code(file)),
    false,
    `${file}: a retrieval failure must be logged, never swallowed — an unqueried index is ` +
      `indistinguishable from a broken one`,
  )
}

// ── Upstream fetches must not treat a non-document as content ───────────────

// `if (!response.ok)` is TRUE for 202, and the bot challenge upstream now
// serves answers 202 with an empty body. Both fetch paths accepted it as
// content: reg:drift hashed the empty string and reported every instrument
// CHANGED, while version discovery found nothing on an empty page and so could
// never report `newer`. The status check has to be an equality on 200.
for (const file of ['scripts/regulatory/fetch.ts', 'scripts/regulatory/drift.ts']) {
  const source = code(file)
  assert.match(
    source,
    /from '\.\/source-fetch'/,
    `${file}: upstream reads must go through source-fetch.ts, which refuses a non-document`,
  )
  assert.doesNotMatch(
    source,
    /!\s*(r|res|response)\s*\.\s*ok\b/,
    `${file}: \`!response.ok\` accepts 202, which is how a bot challenge was read as an ` +
      `empty instrument — assert status === 200 in source-fetch.ts instead`,
  )
}

const sourceFetch = code('scripts/regulatory/source-fetch.ts')
assert.match(
  sourceFetch,
  /x-amzn-waf-action/,
  'source-fetch must detect the bot-challenge header explicitly — it is the one failure that looks like success',
)
assert.match(
  sourceFetch,
  /status\s*!==\s*200/,
  'source-fetch must accept only 200, not any 2xx',
)
assert.match(
  sourceFetch,
  /MIN_USABLE_BYTES/,
  'source-fetch must reject a 200 whose body is too small to be an instrument',
)

// The fetch URL is derived from the CELEX so the text and the identifier
// claimed for it cannot disagree.
assert.doesNotMatch(
  code('scripts/regulatory/fetch.ts'),
  /fetch\(\s*meta\.sourceUrl/,
  'fetch.ts must derive its URL from meta.celex, not read meta.sourceUrl',
)

// ── The local pipeline stays in sync by construction ────────────────────────

const localPipeline = code('scripts/local-draft/pipeline.ts')
assert.match(localPipeline, /gatherDraftContext/)
assert.match(localPipeline, /regulatoryCorpus/)
assert.equal(
  localPipeline.includes('searchSimilar('),
  false,
  'the local pipeline must not re-implement prior-coverage retrieval',
)
assert.equal(
  localPipeline.includes('searchRegulatory('),
  false,
  'the local pipeline must not re-implement regulatory retrieval',
)

// ── Scripts must not re-hardcode the embedding config ───────────────────────

for (const file of walkTs('scripts/regulatory')) {
  assert.equal(
    code(file).includes("'text-embedding-3-small'"),
    false,
    `${file}: import EMBEDDING_MODEL from src/lib/embeddings instead of hardcoding it`,
  )
}

// ── Manifest hygiene ────────────────────────────────────────────────────────

const manifest = readManifest()
for (const corpusId of listCorpusIds()) {
  const entry = manifest.instruments[corpusId]
  assert.ok(entry, `${corpusId}: missing from manifest.json`)
  assert.ok(entry.reviewBy, `${corpusId}: reviewBy is required`)
  assert.ok(entry.consolidatedAs, `${corpusId}: consolidatedAs is required`)
  assert.ok(entry.changelog?.trim(), `${corpusId}: changelog is required — review must be a written act`)
}

// The build must actually run the corpus gate.
const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }
assert.match(pkg.scripts.prebuild, /regulatory\/check\.ts/, 'reg:check must run in prebuild')

console.log(`Regulatory index checks passed (${chunks.length} chunks, ${listCorpusIds().length} instrument(s))`)
