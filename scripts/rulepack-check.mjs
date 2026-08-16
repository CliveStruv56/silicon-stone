#!/usr/bin/env node
/**
 * Validate a rule pack against the hashes in its manifest, and regenerate them
 * with --write.
 *
 * Runs in `prebuild`. The failure it exists to catch is silent drift: someone
 * edits a pack file — fixing a typo, pasting a newer paragraph, correcting a
 * penalty ceiling — without bumping the pack version, and every claim
 * previously verified against it is quietly invalidated. Pack content and pack
 * version move together, or the build stops.
 *
 * TWO HASH SETS, because the two kinds of drift are different failures:
 *
 *   `corpus` — the verbatim Article text under corpus/*.txt. A change here
 *     invalidates every citation the verifier has ever matched against it.
 *   `files`  — rules.json, penalties.json, timeline.json, sources.json. These
 *     were unhashed until 2026-08-16, so a penalty ceiling, an implementation
 *     date or an Article anchor could be edited with no build failure and no
 *     version bump. CLAUDE.md calls every figure in the pack a legal claim;
 *     this makes the check match the claim. See
 *     docs/editorial-assurance-findings.md §9.
 *
 * Plain .mjs with no imports from src/ so it runs before any TypeScript build.
 * The normalisation therefore lives in a sibling .mjs mirroring
 * src/lib/rulepack/normalise.ts, and a test asserts the two agree.
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

import { normalise } from './rulepack-normalise.mjs'

const ROOT = path.join(process.cwd(), 'rulepack', 'versions')
const WRITE = process.argv.includes('--write')

/** The manifest cannot carry its own hash. */
const UNHASHED = new Set(['manifest.json'])

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex')

/**
 * Hash a JSON pack file by its CONTENT, not its bytes: parse, sort object keys
 * recursively, re-stringify. Array order is preserved, because here it carries
 * meaning — the penalty tiers are ordered.
 *
 * Formatting is therefore not a change. That is the right line to draw: a
 * prettier run must not fail the build, while an edited figure must. The legal
 * claim is the value, never the whitespace around it.
 */
function canonicalJson(text) {
  return JSON.stringify(sortKeys(JSON.parse(text)))
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    )
  }
  return value
}

if (!existsSync(ROOT)) {
  console.error('rulepack: no rulepack/versions directory found')
  process.exit(1)
}

let failed = false

for (const version of readdirSync(ROOT).filter((name) => !name.startsWith('.'))) {
  const versionDir = path.join(ROOT, version)
  const manifestPath = path.join(versionDir, 'manifest.json')
  const corpusDir = path.join(versionDir, 'corpus')

  if (!existsSync(manifestPath)) {
    console.error(`rulepack ${version}: manifest.json is missing`)
    failed = true
    continue
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  // Corpus: verbatim statute, folded through the legal-text normaliser.
  const corpusFiles = existsSync(corpusDir)
    ? readdirSync(corpusDir).filter((name) => name.endsWith('.txt'))
    : []

  const actualCorpus = {}
  for (const file of corpusFiles) {
    const article = file.replace(/^article-|\.txt$/g, '')
    actualCorpus[article] = sha256(normalise(readFileSync(path.join(corpusDir, file), 'utf8')))
  }

  // Pack data: every JSON file beside the manifest, discovered rather than
  // listed, so a new pack file is covered the day it appears instead of the day
  // someone remembers to add it here.
  const dataFiles = readdirSync(versionDir)
    .filter((name) => name.endsWith('.json') && !UNHASHED.has(name))
    .sort()

  const actualFiles = {}
  const unparseable = []
  for (const file of dataFiles) {
    try {
      actualFiles[file] = sha256(canonicalJson(readFileSync(path.join(versionDir, file), 'utf8')))
    } catch (error) {
      unparseable.push(`${file}: not valid JSON (${error.message})`)
    }
  }

  if (WRITE) {
    if (unparseable.length > 0) {
      console.error(`rulepack ${version}: refusing to write hashes for unreadable files`)
      for (const problem of unparseable) console.error(`  - ${problem}`)
      failed = true
      continue
    }
    const orderedCorpus = Object.fromEntries(
      Object.keys(actualCorpus)
        .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
        .map((article) => [article, actualCorpus[article]]),
    )
    writeFileSync(
      manifestPath,
      `${JSON.stringify({ ...manifest, corpus: orderedCorpus, files: actualFiles }, null, 2)}\n`,
    )
    console.log(
      `rulepack ${version}: wrote ${Object.keys(orderedCorpus).length} corpus hashes and ` +
        `${Object.keys(actualFiles).length} file hashes`,
    )
    continue
  }

  const expectedCorpus = manifest.corpus || {}
  const expectedFiles = manifest.files || {}
  const problems = [...unparseable]

  for (const [article, hash] of Object.entries(expectedCorpus)) {
    if (!(article in actualCorpus)) problems.push(`Article ${article}: file missing`)
    else if (actualCorpus[article] !== hash) problems.push(`Article ${article}: content changed`)
  }
  for (const article of Object.keys(actualCorpus)) {
    if (!(article in expectedCorpus)) problems.push(`Article ${article}: file present but unhashed`)
  }

  // An absent `files` map is itself a failure, not a pack that opts out: it
  // means the pack predates this check and its figures are unverified.
  if (Object.keys(expectedFiles).length === 0 && dataFiles.length > 0) {
    problems.push(
      `no "files" hashes in the manifest, but ${dataFiles.length} pack file(s) are present ` +
        `(${dataFiles.join(', ')}) — run: npm run rulepack:hash`,
    )
  } else {
    for (const [file, hash] of Object.entries(expectedFiles)) {
      if (!(file in actualFiles)) problems.push(`${file}: missing`)
      else if (actualFiles[file] !== hash) problems.push(`${file}: content changed`)
    }
    for (const file of Object.keys(actualFiles)) {
      if (!(file in expectedFiles)) problems.push(`${file}: present but unhashed`)
    }
  }

  if (problems.length > 0) {
    console.error(`rulepack ${version}: pack does not match the manifest`)
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('  Pack content and pack version must move together.')
    console.error('  Intentional change? Bump the version, then: npm run rulepack:hash')
    failed = true
  } else {
    console.log(
      `rulepack ${version}: ${Object.keys(expectedCorpus).length} corpus files and ` +
        `${Object.keys(expectedFiles).length} pack files verified`,
    )
  }
}

process.exit(failed ? 1 : 0)
