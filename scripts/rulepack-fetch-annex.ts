/**
 * Fetch one Annex of the AI Act from the pinned CELEX and write it into a rule
 * pack's corpus directory.
 *
 * WHY A SCRIPT AND NOT A PASTE. Every figure in the pack is a legal claim
 * traceable to the EUR-Lex consolidated text, and the fastest way to introduce
 * an untraceable one is to copy statute out of a browser. This reads the same
 * CELEX the manifest names, through the same Cellar endpoint the regulatory
 * lane uses — `eur-lex.europa.eu` answers automated clients with a bot
 * challenge, and `source-fetch.ts` exists because two fetch paths once read
 * that challenge as an empty instrument.
 *
 * WHY IT IS NOT A BLURRING OF THE TWO LANES. `scripts/regulatory/source-fetch.ts`
 * and `extract.ts` are a fetcher and an XHTML parser, not an authority: nothing
 * they hold decides what the Compliance Checker shows. The output of this script
 * is a file a person reads, commits, and hashes into a **new pack version** —
 * which is the point at which it becomes authority, and that step is deliberate
 * and human. The separation the guard enforces is that `src/lib/rulepack/` never
 * *references* the retrieval lane at runtime, and it still does not.
 *
 * Usage:
 *   npm run rulepack:fetch-annex -- --version 2026-08-18 --annex III
 *
 * Then read the diff, then `npm run rulepack:hash`. Never the other way round.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fetchFromCellar, XHTML_ACCEPT } from './regulatory/source-fetch'
import { extract } from './regulatory/extract'

const args = process.argv.slice(2)
const flag = (name: string): string | undefined => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : undefined
}

const version = flag('version')
const annex = flag('annex')

function required(name: string, value: string | undefined): string {
  if (!value) {
    console.error('Usage: rulepack:fetch-annex -- --version <pack-version> --annex <III>')
    console.error(`Missing --${name}`)
    process.exit(1)
  }
  return value
}

const packVersion = required('version', version)
const annexNumber = required('annex', annex)

const versionDir = path.join(process.cwd(), 'rulepack', 'versions', packVersion)
if (!existsSync(path.join(versionDir, 'manifest.json'))) {
  console.error(
    `rulepack ${packVersion}: no manifest.json. Create the version directory first — ` +
      `pack content and pack version move together.`,
  )
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(path.join(versionDir, 'manifest.json'), 'utf8'))
const celex: string = manifest.provenance?.celex
if (!celex) {
  console.error(`rulepack ${packVersion}: manifest has no provenance.celex to fetch against`)
  process.exit(1)
}

async function main() {
console.log(`Fetching CELEX ${celex} from the Publications Office…`)
const html = await fetchFromCellar(celex, XHTML_ACCEPT)
console.log(`  ${html.length.toLocaleString()} bytes`)

/**
 * The consolidation date is asserted, not assumed. A newer consolidation served
 * under the same identifier would be a different instrument wearing the pinned
 * one's name, and the manifest's `corpusCutOff` is what every citation is
 * verified against.
 */
const [, servedDate] = /<title>[^<]*—\s*EN\s*—\s*([\d.]+)\s*<\/title>/.exec(html) ?? []
const expected = manifest.corpusCutOff.split('-').reverse().join('.')
if (servedDate !== expected) {
  console.error(
    `Refusing to write: the document says it is current to ${servedDate ?? 'an unknown date'}, ` +
      `but the manifest pins ${manifest.corpusCutOff} (${expected}).`,
  )
  process.exit(1)
}
console.log(`  consolidation date ${servedDate} matches the manifest`)

const { text, annexes } = extract(html)
if (!annexes.includes(annexNumber)) {
  console.error(`Annex ${annexNumber} not found. The document carries: ${annexes.join(', ')}`)
  process.exit(1)
}

const section = text.split('\n\n\n').find((block) => block.startsWith(`ANNEX ${annexNumber}\n`))
if (!section) {
  console.error(`Annex ${annexNumber} is listed but its section could not be isolated.`)
  process.exit(1)
}

const corpusDir = path.join(versionDir, 'corpus')
mkdirSync(corpusDir, { recursive: true })
const target = path.join(corpusDir, `annex-${annexNumber.toLowerCase()}.txt`)
writeFileSync(target, `${section.trimEnd()}\n`, 'utf8')

console.log(`Wrote ${path.relative(process.cwd(), target)} — ${section.length.toLocaleString()} bytes`)
console.log('Read the file, then run: npm run rulepack:hash')
}

main()
