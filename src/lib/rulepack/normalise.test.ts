import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { NORMALISATION_VERSION, normaliseLegalText } from './normalise'
// The build-time mirror. Plain .mjs because rulepack-check.mjs runs before any
// TypeScript is compiled and cannot import from src/.
import {
  normalise as buildNormalise,
  NORMALISATION_VERSION as BUILD_VERSION,
} from '../../../scripts/rulepack-normalise.mjs'

/**
 * The two implementations of the legal-text normaliser must agree.
 *
 * They are duplicated by necessity: the build gate runs in `prebuild`, before
 * TypeScript exists, and the runtime verifier lives in src/. Nothing but this
 * test holds them together. If they drift, the build gate and the citation
 * verifier compute different hashes for the same text — so a citation verifies
 * at build time and fails at runtime, or the reverse, and the symptom appears
 * nowhere near the cause. See docs/editorial-assurance-findings.md §10.
 */

const script = (input: string): string => buildNormalise(input) as string

/** One case per fold the normaliser performs, plus the traps around them. */
const CASES: Array<[string, string]> = [
  ['no-break space', 'Article 6(3)'],
  ['narrow no-break space', 'Article 6'],
  ['thin space', 'Article 6'],
  ['zero-width space', 'Arti​cle 6'],
  ['byte order mark', '﻿Article 6'],
  ['soft hyphen', 'obli­gation'],
  ['non-breaking hyphen', 'high‑risk'],
  ['left single quote', '‘provider’'],
  ['single low-9 quote', '‚provider‛'],
  ['prime', "person′s"],
  ['left double quote', '“provider”'],
  ['double low-9 quote', '„provider‟'],
  ['double prime', 'six″'],
  ['en dash', '2026–2027'],
  ['em dash', 'the provider — not the deployer'],
  ['ellipsis', 'shall ensure… that'],
  ['newline run', 'the provider\n\n   shall ensure'],
  ['tabs', 'the\tprovider\tshall'],
  ['leading and trailing space', '   Article 6   '],
  ['empty', ''],
  ['whitespace only', '   \n\t  '],
  ['already clean', 'The provider shall ensure that the system is robust.'],
  ['combining accents (NFC)', 'exposé'],
  ['everything at once', '﻿“Arti​cle 6” — obli­gation…\n\n  ends'],
]

describe('the two normalisers agree', () => {
  it.each(CASES)('%s', (_label, input) => {
    expect(script(input)).toBe(normaliseLegalText(input))
  })

  it('declares the same version', () => {
    // The manifest records this string; if the two disagree, the record is a
    // lie about which normalisation the stored hashes mean.
    expect(BUILD_VERSION).toBe(NORMALISATION_VERSION)
  })
})

describe('the two normalisers agree on the live corpus', () => {
  // Synthetic cases only prove the folds we thought to write down. The corpus
  // is the text the hashes are actually computed over.
  const root = path.join(process.cwd(), 'rulepack', 'versions')
  const versions = fs.existsSync(root)
    ? fs.readdirSync(root).filter((name) => !name.startsWith('.'))
    : []

  const files: Array<[string, string]> = []
  for (const version of versions) {
    const dir = path.join(root, version, 'corpus')
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir).filter((n) => n.endsWith('.txt'))) {
      files.push([`${version}/${file}`, path.join(dir, file)])
    }
  }

  it('has corpus files to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s', (_label, filePath) => {
    const text = fs.readFileSync(filePath, 'utf8')
    expect(script(text)).toBe(normaliseLegalText(text))
  })
})

describe('the manifest records the normalisation it was hashed under', () => {
  const root = path.join(process.cwd(), 'rulepack', 'versions')
  const versions = fs.existsSync(root)
    ? fs.readdirSync(root).filter((name) => !name.startsWith('.'))
    : []

  it.each(versions)('%s', (version) => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, version, 'manifest.json'), 'utf8'),
    ) as { normalisation?: string }
    expect(manifest.normalisation).toBe(NORMALISATION_VERSION)
  })
})
