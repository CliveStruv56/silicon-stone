/**
 * The detailed compliance checklist, read out of the handbook's own source.
 *
 * `section-4.md` is the single copy of the checklist. The workbook's
 * Requirements tab is generated from it rather than typed a second time — the
 * legacy Compliance Tracker carried 18 broad rows of its own while the handbook
 * listed 84 detailed ones, and the handbook's claim that "every row above maps
 * to a line in the Compliance Tracker" was false the day it was written.
 *
 * Every row carries a stable ID in its first cell (`| ☐ A-01 | …`). The parser
 * fails loudly on a table row without one, on a duplicate, on an unknown
 * checklist prefix and on a target date it does not recognise: a parser that
 * silently skipped a row would publish a workbook quietly missing a duty.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Checklist prefixes, in handbook order, with who each applies to. */
export const CHECKLISTS = {
  A: { name: 'A — Universal', appliesTo: 'Every organisation', tier: 'All tiers' },
  P: { name: 'A — Prohibited-practice screen (Art 5)', appliesTo: 'Every organisation', tier: 'All tiers' },
  B: { name: 'B — Transparency (Art 50)', appliesTo: 'Providers and deployers of systems that interact with people or generate content', tier: 'Limited risk' },
  C: { name: 'C — High-risk provider', appliesTo: 'Provider', tier: 'High-risk' },
  D: { name: 'D — High-risk deployer', appliesTo: 'Deployer', tier: 'High-risk' },
  E: { name: 'E — Importer / distributor', appliesTo: 'Importer or distributor', tier: 'High-risk' },
}

/**
 * Target dates the checklist may use. Each statutory date is traceable to the
 * pinned rule pack's `timeline.json`; a new one must be added here on purpose.
 */
export const KNOWN_TARGETS = new Set([
  'Standing',
  '2 Feb 2025',
  '2 Aug 2026',
  '2 Dec 2026',
  '2 Dec 2027',
  '2 Dec 2027 / 2 Aug 2028',
])

const ROW = /^\|\s*☐\s*([A-Z])-(\d{2})\s*\|(.*)\|\s*$/

export function readChecklist(file = path.join(SRC, 'section-4.md')) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const items = []
  const seen = new Set()

  for (const [i, line] of lines.entries()) {
    if (!line.startsWith('| ☐')) continue
    if (line.startsWith('| ☐ ID |')) continue // header row
    const m = line.match(ROW)
    if (!m) throw new Error(`section-4.md:${i + 1}: checklist row without a valid ID: ${line.slice(0, 80)}`)
    const [, prefix, num, rest] = m
    const id = `${prefix}-${num}`
    if (!CHECKLISTS[prefix]) throw new Error(`section-4.md:${i + 1}: unknown checklist prefix ${prefix}`)
    if (seen.has(id)) throw new Error(`section-4.md:${i + 1}: duplicate checklist ID ${id}`)
    seen.add(id)

    const cells = rest.split('|').map((c) => c.trim())
    // Task | Owner | Target date | Status | Evidence location
    if (cells.length !== 5) throw new Error(`section-4.md:${i + 1}: ${id} has ${cells.length} cells after the ID, expected 5`)
    const [task, , target] = cells
    if (!task) throw new Error(`section-4.md:${i + 1}: ${id} has no task text`)
    if (!KNOWN_TARGETS.has(target)) throw new Error(`section-4.md:${i + 1}: ${id} has unrecognised target date "${target}"`)

    items.push({ id, prefix, checklist: CHECKLISTS[prefix].name, ...CHECKLISTS[prefix], task, target })
  }

  // Anchors: the parse must have found every checklist, or the file moved
  // under us and the workbook would ship short.
  for (const prefix of Object.keys(CHECKLISTS)) {
    if (!items.some((it) => it.prefix === prefix)) throw new Error(`section-4.md: no rows found for checklist ${prefix}`)
  }
  // IDs are deliberately NOT required to be consecutive. Buyers receive updated
  // files for twelve months and their own workbooks reference these IDs, so a
  // withdrawn row retires its ID and a new row takes the next unused number.
  // Never renumber.
  return items
}
