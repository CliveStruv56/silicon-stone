/**
 * Which Vendor Assessment Questionnaire questions inform each dependency
 * dimension, read from the template itself.
 *
 * The workbook's Scoring key lists these question numbers. Typed a second time
 * they would drift the first time a question was added or renumbered, so they
 * are parsed from the table rows of the template (`| n | question | dims | |`).
 * Every dimension must be informed by at least one question, and every
 * dimension name must be one the workbook scores — a misspelt annotation would
 * otherwise drop out of the key without a word.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'vendor-assessment-questionnaire.md')

export const DIMENSIONS = ['Data Sovereignty', 'Contractual Lock-In', 'Regulatory Risk', 'Concentration Risk', 'Alternative Availability']

export function questionsByDimension(file = FILE) {
  const map = Object.fromEntries(DIMENSIONS.map((d) => [d, []]))
  let rows = 0
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*(\d+)\s*\|[^|]+\|([^|]*)\|/)
    if (!m) continue
    rows++
    const n = Number(m[1])
    for (const dim of m[2].split(',').map((d) => d.trim()).filter(Boolean)) {
      if (!map[dim]) throw new Error(`vendor-assessment-questionnaire.md: question ${n} names unknown dimension "${dim}"`)
      map[dim].push(n)
    }
  }
  if (rows === 0) throw new Error('vendor-assessment-questionnaire.md: no question rows found')
  for (const d of DIMENSIONS) if (map[d].length === 0) throw new Error(`vendor-assessment-questionnaire.md: no question informs ${d}`)
  return map
}
