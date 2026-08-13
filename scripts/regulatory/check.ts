/**
 * Corpus integrity gate for the regulatory retrieval lane.
 *
 *   npm run reg:check     verify (runs in prebuild — a failure blocks the build)
 *   npm run reg:hash      re-stamp the manifest after a deliberate change
 *
 * Three gates, all build-blocking. None of them is a log line, because a warning
 * in a build log is a warning nobody reads.
 *
 *   1. HASH      the committed text still matches its recorded sha256.
 *   2. FRESHNESS today is not past the instrument's reviewBy date.
 *   3. VINTAGE   for the AI Act, the corpus consolidation matches the rule pack's
 *                corpusCutOff — so the editorial lane and the Compliance Checker
 *                can never quote two different vintages of the same Article.
 *
 * Gate 3 asserts CONSISTENCY between the lanes; it deliberately does not share
 * storage with them. Sharing the corpus would couple the editorial lane to the
 * legal authority and defeat the separation the checker depends on.
 */

import { normaliseLegalText, NORMALISATION_VERSION } from '../../src/lib/rulepack/normalise'
import {
  listCorpusIds,
  readInstrumentMeta,
  readSourceText,
  readManifest,
  writeManifest,
  hashSource,
  type ManifestInstrument,
} from '../../src/lib/regulatory/meta'
import * as fs from 'node:fs'
import * as path from 'node:path'

const WRITE = process.argv.includes('--write')

/** Default review cadence when stamping a new instrument. */
const REVIEW_INTERVAL_DAYS = 90

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * The rule pack's pinned consolidation date, read from its manifest on disk.
 * Reading the MANIFEST is not reading the corpus — no legal text crosses here.
 */
function rulePackCorpusCutOff(): { version: string; corpusCutOff: string } | null {
  const versionsDir = path.join(process.cwd(), 'rulepack', 'versions')
  if (!fs.existsSync(versionsDir)) return null
  const versions = fs
    .readdirSync(versionsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
  const pinned = process.env.NEXT_PUBLIC_RULEPACK_VERSION || versions[versions.length - 1]
  const manifestPath = path.join(versionsDir, pinned, 'manifest.json')
  if (!fs.existsSync(manifestPath)) return null
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { corpusCutOff?: string }
  return manifest.corpusCutOff ? { version: pinned, corpusCutOff: manifest.corpusCutOff } : null
}

function main(): void {
  const corpusIds = listCorpusIds()
  if (corpusIds.length === 0) {
    console.log('regulatory corpus: no instruments yet — nothing to check.')
    return
  }

  const manifest = readManifest()
  manifest.normalisation = NORMALISATION_VERSION

  const problems: string[] = []
  const now = today()
  const rulePack = rulePackCorpusCutOff()

  for (const corpusId of corpusIds) {
    const meta = readInstrumentMeta(corpusId)
    const actual = hashSource(normaliseLegalText(readSourceText(meta)))
    const recorded: ManifestInstrument | undefined = manifest.instruments[corpusId]

    if (WRITE) {
      manifest.instruments[corpusId] = {
        version: meta.version,
        consolidatedAs: meta.consolidatedAs,
        sha256: actual,
        reviewBy: recorded?.reviewBy ?? addDays(now, REVIEW_INTERVAL_DAYS),
        changelog:
          recorded?.changelog ??
          `Initial ingest of ${meta.instrument}, consolidated as at ${meta.consolidatedAs}, retrieved ${meta.retrieved}.`,
      }
      console.log(`stamped ${corpusId} @ ${meta.version} → ${actual.slice(0, 12)}…`)
      continue
    }

    // 1. HASH
    if (!recorded) {
      problems.push(`${corpusId}: present on disk but absent from manifest.json (unhashed).`)
      continue
    }
    if (recorded.sha256 !== actual) {
      problems.push(
        `${corpusId}: content changed. Recorded ${recorded.sha256.slice(0, 12)}…, ` +
          `found ${actual.slice(0, 12)}…`,
      )
    }
    if (recorded.version !== meta.version) {
      problems.push(
        `${corpusId}: manifest records version ${recorded.version} but meta.json says ${meta.version}.`,
      )
    }

    // 2. FRESHNESS
    if (!recorded.reviewBy) {
      problems.push(`${corpusId}: manifest entry has no reviewBy date.`)
    } else if (now > recorded.reviewBy) {
      problems.push(
        `${corpusId}: review lapsed on ${recorded.reviewBy} (today ${now}). ` +
          `Re-check the instrument upstream, then bump reviewBy AND write what you ` +
          `checked into its changelog.`,
      )
    }
    if (!recorded.changelog?.trim()) {
      problems.push(`${corpusId}: manifest entry has no changelog — a review must be a written act.`)
    }

    // 3. VINTAGE
    if (corpusId === 'eu-ai-act' && rulePack) {
      if (meta.consolidatedAs !== rulePack.corpusCutOff) {
        problems.push(
          `${corpusId}: corpus is consolidated as at ${meta.consolidatedAs} but rule pack ` +
            `${rulePack.version} pins corpusCutOff ${rulePack.corpusCutOff}. The editorial lane ` +
            `and the Compliance Checker must not quote two vintages of the same Article.`,
        )
      }
    }
  }

  if (WRITE) {
    writeManifest(manifest)
    console.log('\nWrote corpus/regulatory/manifest.json')
    return
  }

  if (problems.length > 0) {
    console.error('\nRegulatory corpus check FAILED:\n')
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('\nIntentional change? Update the text, then: npm run reg:hash\n')
    process.exit(1)
  }

  const summary = corpusIds
    .map((id) => `${id}@${manifest.instruments[id].version} (review by ${manifest.instruments[id].reviewBy})`)
    .join(', ')
  console.log(`regulatory corpus OK: ${summary}`)
  if (rulePack) {
    console.log(`  vintage matches rule pack ${rulePack.version} (corpusCutOff ${rulePack.corpusCutOff})`)
  }
}

main()
