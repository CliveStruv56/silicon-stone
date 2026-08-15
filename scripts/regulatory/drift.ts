/**
 * Ask EUR-Lex whether the law has moved underneath the corpus.
 *
 *   npm run reg:drift
 *   npm run reg:drift -- --corpus gdpr
 *
 * THE POINT, because the obvious design does not work. Every `sourceUrl` here is
 * pinned to one consolidation (CELEX 02016R0679-20160504). When the EU amends
 * that instrument, the pinned URL keeps returning the OLD text forever, hashing
 * identically. A content-diff watcher would therefore report "no drift"
 * indefinitely while the law changed. The check that matters is not "did my text
 * change" but "does a newer consolidation exist than the one I pinned".
 *
 * Two checks per instrument:
 *
 *   1. VERSION DISCOVERY (the real one). Read the base act's EUR-Lex page and
 *      collect every consolidated CELEX it links. Newer than `consolidatedAs`
 *      means the corpus is stale. None at all is correct and expected for an
 *      instrument that has never been amended (the Chips Act, the Data Act) —
 *      but if one later appears for those, that IS the amendment.
 *   2. TAMPER CHECK (secondary). Re-extract the pinned URL and compare the
 *      normalised hash to the manifest. This should ALWAYS match; a mismatch
 *      means the extractor or the pinned text changed, not that the law did.
 *
 * Exits non-zero on anything but "current", so a scheduler can act on it.
 * Deliberately NOT run in prebuild: it needs the network, and a EUR-Lex blip
 * must not be able to fail a deploy. The fail-closed guard is `reviewBy` in
 * reg:check; this exists to make that review a two-minute job.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import {
  listCorpusIds,
  readInstrumentMeta,
  readManifest,
  hashSource,
} from '../../src/lib/regulatory/meta'
import { normaliseLegalText } from '../../src/lib/rulepack/normalise'
import { extract } from './extract'
import type { InstrumentMeta } from '../../src/lib/regulatory/types'

/**
 * Consolidated CELEX ids look like 02016R0679-20160504; originals like
 * 32023R1781. Built per instrument rather than as one loose pattern: these
 * pages cite other acts, often with their own consolidations, and a generic
 * match would report a newer consolidation of a DIFFERENT regulation as drift
 * in this one. The act id has to be pinned to the instrument being checked.
 */
function consolidationPattern(baseId: string): RegExp {
  return new RegExp(`0${baseId.slice(1)}-(\\d{8})`, 'g')
}

/**
 * The base act id for a corpus, whichever form its CELEX takes. A consolidated
 * id (0YYYYRNNNN-DATE) and an original id (3YYYYRNNNN) describe the same act;
 * the base page is where EUR-Lex lists the consolidations.
 */
function baseCelex(celex: string): string {
  const consolidated = /^0(\d{4}[RL]\d{4})-\d{8}$/.exec(celex)
  return consolidated ? `3${consolidated[1]}` : celex
}

function isoFromCelexDate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

async function getText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'user-agent': 'silicon-and-stone-regulatory-corpus/1.0' },
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`)
  return response.text()
}

interface Finding {
  corpusId: string
  status: 'current' | 'newer' | 'changed' | 'error'
  detail: string
}

async function checkInstrument(meta: InstrumentMeta, recordedHash: string): Promise<Finding> {
  const base = baseCelex(meta.celex)

  // 1. Version discovery.
  const basePage = await getText(
    `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${base}`,
  )
  const dates = [...basePage.matchAll(consolidationPattern(base))]
    .map((match) => isoFromCelexDate(match[1]))
    .filter((date, index, all) => all.indexOf(date) === index)
    .sort()

  const latest = dates[dates.length - 1]
  if (latest && latest > meta.consolidatedAs) {
    return {
      corpusId: meta.corpusId,
      status: 'newer',
      detail:
        `EUR-Lex now offers a consolidation of ${latest}; the corpus pins ` +
        `${meta.consolidatedAs}. Re-fetch: npm run reg:fetch -- --corpus ${meta.corpusId} ` +
        `(update meta.json first — celex, version, consolidatedAs, sourceUrl, citationUrl, ` +
        `and rename the version directory).`,
    }
  }

  // 2. Tamper check against the pinned text.
  const extracted = extract(await getText(meta.sourceUrl))
  const liveHash = hashSource(normaliseLegalText(extracted.text))

  if (liveHash !== recordedHash) {
    return {
      corpusId: meta.corpusId,
      status: 'changed',
      detail:
        `the PINNED text at ${meta.celex} no longer hashes to the manifest value. ` +
        `This is not an amendment — a pinned consolidation does not change. Suspect the ` +
        `extractor, or an upstream correction. Run npm run reg:fetch -- --corpus ` +
        `${meta.corpusId} and read the diff before doing anything else.`,
    }
  }

  const coverage = dates.length === 0 ? 'no consolidation exists (original act)' : `latest ${latest}`
  return {
    corpusId: meta.corpusId,
    status: 'current',
    detail: `${coverage}, pinned ${meta.consolidatedAs}, text unchanged`,
  }
}

async function main(): Promise<void> {
  const only = process.argv.includes('--corpus')
    ? process.argv[process.argv.indexOf('--corpus') + 1]
    : undefined

  const manifest = readManifest()
  const corpusIds = only ? [only] : listCorpusIds()
  const findings: Finding[] = []

  for (const corpusId of corpusIds) {
    const meta = readInstrumentMeta(corpusId)
    const recorded = manifest.instruments[corpusId]
    if (!recorded) {
      findings.push({ corpusId, status: 'error', detail: 'absent from manifest.json — run reg:hash' })
      continue
    }
    try {
      findings.push(await checkInstrument(meta, recorded.sha256))
    } catch (error) {
      findings.push({
        corpusId,
        status: 'error',
        detail: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const label = { current: 'ok     ', newer: 'STALE  ', changed: 'CHANGED', error: 'ERROR  ' }
  for (const finding of findings) {
    console.log(`${label[finding.status]} ${finding.corpusId.padEnd(24)} ${finding.detail}`)
  }

  const stale = findings.filter((f) => f.status !== 'current')
  if (stale.length === 0) {
    console.log('\nAll instruments current against EUR-Lex.')
    return
  }

  console.log('')
  // The AI Act is not like the others: reg:check asserts its consolidation date
  // equals the rule pack's corpusCutOff, so moving it means bumping the pack
  // version and re-verifying every citation pinned against the old text. Say so
  // rather than implying all six are equal work.
  if (stale.some((f) => f.corpusId === 'eu-ai-act' && f.status === 'newer')) {
    console.log(
      'NOTE: the AI Act is coupled to the Compliance Checker rule pack. A new ' +
        'consolidation is not a re-fetch — rulepack/versions/<v>/manifest.json ' +
        'corpusCutOff must move with it, and every pinned citation must be ' +
        're-verified against the new text or reg:check will fail the build.',
    )
    console.log('')
  }
  console.log(`${stale.length} instrument(s) need attention.`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
