#!/usr/bin/env node
/**
 * Validate a rule pack's corpus against the hashes in its manifest, and
 * regenerate them with --write.
 *
 * Runs in `prebuild`. The failure it exists to catch is silent drift: someone
 * edits a corpus file — fixing a typo, pasting a newer paragraph — without
 * bumping the pack version, and every citation previously verified against that
 * text is quietly invalidated. Corpus text and pack version move together or
 * the build stops.
 *
 * Plain .mjs with no imports from src/ so it runs before any TypeScript build,
 * which means the normalisation below must mirror src/lib/rulepack/normalise.ts.
 * The manifest records `normalisation` so a divergence is at least visible.
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'rulepack', 'versions')
const WRITE = process.argv.includes('--write')

/** Mirror of normaliseLegalText in src/lib/rulepack/normalise.ts (v1). */
function normalise(input) {
  return input
    .normalize('NFC')
    .replace(/[   ​﻿]/g, ' ')
    .replace(/­/g, '')
    .replace(/‑/g, '-')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
}

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex')

if (!existsSync(ROOT)) {
  console.error('rulepack: no rulepack/versions directory found')
  process.exit(1)
}

let failed = false

for (const version of readdirSync(ROOT).filter((name) => !name.startsWith('.'))) {
  const manifestPath = path.join(ROOT, version, 'manifest.json')
  const corpusDir = path.join(ROOT, version, 'corpus')

  if (!existsSync(manifestPath)) {
    console.error(`rulepack ${version}: manifest.json is missing`)
    failed = true
    continue
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const files = existsSync(corpusDir)
    ? readdirSync(corpusDir).filter((name) => name.endsWith('.txt'))
    : []

  const actual = {}
  for (const file of files) {
    const article = file.replace(/^article-|\.txt$/g, '')
    actual[article] = sha256(normalise(readFileSync(path.join(corpusDir, file), 'utf8')))
  }

  if (WRITE) {
    const ordered = Object.fromEntries(
      Object.keys(actual)
        .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
        .map((article) => [article, actual[article]]),
    )
    writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, corpus: ordered }, null, 2)}\n`)
    console.log(`rulepack ${version}: wrote ${Object.keys(ordered).length} corpus hashes`)
    continue
  }

  const expected = manifest.corpus || {}
  const problems = []

  for (const [article, hash] of Object.entries(expected)) {
    if (!(article in actual)) problems.push(`Article ${article}: file missing`)
    else if (actual[article] !== hash) problems.push(`Article ${article}: content changed`)
  }
  for (const article of Object.keys(actual)) {
    if (!(article in expected)) problems.push(`Article ${article}: file present but unhashed`)
  }

  if (problems.length > 0) {
    console.error(`rulepack ${version}: corpus does not match the manifest`)
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('  Corpus text and pack version must move together.')
    console.error('  Intentional change? Bump the version, then: npm run rulepack:hash')
    failed = true
  } else {
    console.log(`rulepack ${version}: ${Object.keys(expected).length} corpus files verified`)
  }
}

process.exit(failed ? 1 : 0)
