/**
 * Disk access for the regulatory corpus: instrument metadata, source text and
 * the hash manifest.
 *
 * Node-only. The Next app NEVER reads this — it queries Pinecone. Only the
 * scripts under scripts/regulatory/ touch the filesystem, which is why the
 * corpus does not need to survive Next's build tracing.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import type { InstrumentMeta } from './types'

export const CORPUS_ROOT = path.join(process.cwd(), 'corpus', 'regulatory')
export const MANIFEST_PATH = path.join(CORPUS_ROOT, 'manifest.json')

export interface ManifestInstrument {
  version: string
  consolidatedAs: string
  sha256: string
  /** ISO date after which reg:check FAILS until someone re-reviews the text. */
  reviewBy: string
  /** What was checked at the last review. Required — review must be a written act. */
  changelog: string
}

export interface CorpusManifest {
  /** Matches src/lib/rulepack/normalise.ts. Bump only alongside that. */
  normalisation: string
  instruments: Record<string, ManifestInstrument>
}

export function listCorpusIds(): string[] {
  if (!fs.existsSync(CORPUS_ROOT)) return []
  return fs
    .readdirSync(CORPUS_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
}

export function readManifest(): CorpusManifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { normalisation: 'v1', instruments: {} }
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as CorpusManifest
}

export function writeManifest(manifest: CorpusManifest): void {
  const ordered: CorpusManifest = {
    ...manifest,
    instruments: Object.fromEntries(
      Object.entries(manifest.instruments).sort(([a], [b]) => a.localeCompare(b)),
    ),
  }
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8')
}

function metaPathFor(corpusId: string): string {
  const dir = path.join(CORPUS_ROOT, corpusId)
  if (!fs.existsSync(dir)) {
    throw new Error(`Unknown corpus "${corpusId}". Known: ${listCorpusIds().join(', ') || '(none)'}`)
  }
  const versions = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
  if (versions.length === 0) throw new Error(`No version directory under ${dir}`)
  // Exactly one version is live at a time; a cutover replaces it rather than
  // accumulating, so retrieval can never mix two vintages of the same article.
  if (versions.length > 1) {
    throw new Error(
      `${corpusId} has ${versions.length} version directories (${versions.join(', ')}). ` +
        `Exactly one must be live — delete the superseded one so retrieval cannot mix vintages.`,
    )
  }
  return path.join(dir, versions[0], 'meta.json')
}

export function readInstrumentMeta(corpusId: string): InstrumentMeta {
  const file = metaPathFor(corpusId)
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  return JSON.parse(fs.readFileSync(file, 'utf8')) as InstrumentMeta
}

export function sourceTextPath(meta: InstrumentMeta): string {
  return path.join(CORPUS_ROOT, meta.corpusId, meta.version, 'source.txt')
}

export function readSourceText(meta: InstrumentMeta): string {
  const file = sourceTextPath(meta)
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file} — run: npm run reg:fetch -- --corpus ${meta.corpusId}`)
  }
  return fs.readFileSync(file, 'utf8')
}

/**
 * Hash the NORMALISED text, exactly as scripts/rulepack-check.mjs does, so that
 * whitespace-only reformatting is not reported as a legal change while any real
 * edit is.
 */
export function hashSource(normalised: string): string {
  return crypto.createHash('sha256').update(normalised, 'utf8').digest('hex')
}
