#!/usr/bin/env node
/**
 * Assembles the flagship "AI Act Compliance Toolkit" manual from its section
 * sources into a single frontmatter-led markdown file ready for render-briefing.
 *
 *   node deliverables/src/assemble-toolkit.mjs
 *
 * Section 1, 6 and 7 live together in _sections-1-6-7.md (authored in reading
 * order 1 → 6 → 7); sections 2–5 are individual files. We splice them into the
 * correct 1..7 order with a hard page break between each.
 */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = __dirname
const OUT = path.resolve(__dirname, '..', 'dist', 'AI Act Compliance Toolkit.md')
const PB = '\n\n<div class="pagebreak"></div>\n\n'

const FRONTMATTER = `---
title: "The AI Act Compliance Toolkit"
subtitle: "A practical operating manual for the EU AI Act, reconciled to the 2026 Digital Omnibus staged timeline — risk classification, obligations by category, a working checklist, ready-to-adapt templates, and a 90-day action plan."
author: "Silicon and Stone"
date: "2026-06-26"
version: "v1 · reconciled to the post-Omnibus staged timeline"
---
`

async function read(f) {
  return (await fs.readFile(path.join(SRC, f), 'utf8')).trim()
}

function slice(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker)
  if (start === -1) throw new Error(`marker not found: ${startMarker}`)
  const end = endMarker ? text.indexOf(endMarker, start) : text.length
  return text.slice(start, end === -1 ? text.length : end).trim()
}

async function main() {
  const bundle = await read('_sections-1-6-7.md')
  const s1 = slice(bundle, '## Section 1', '## Section 6')
    // drop any trailing pagebreak div the bundle used between 1 and 6
    .replace(/<div class="pagebreak"><\/div>\s*$/, '').trim()
  const s6 = slice(bundle, '## Section 6', '## Appendix')
    .replace(/<div class="pagebreak"><\/div>\s*$/, '').trim()
  const s7 = slice(bundle, '## Appendix', null).trim()

  const s2 = await read('section-2.md')
  const s3 = await read('section-3.md')
  const s4 = await read('section-4.md')
  const s5 = await read('section-5.md')

  const body = [s1, s2, s3, s4, s5, s6, s7].join(PB)
  const doc = `${FRONTMATTER}\n${body}\n`
  await fs.writeFile(OUT, doc, 'utf8')

  const words = body.split(/\s+/).filter(Boolean).length
  console.log(`✓ Wrote ${path.relative(process.cwd(), OUT)}`)
  console.log(`  sections: 7 · ~${words.toLocaleString()} words`)
}

main().catch((e) => { console.error(e); process.exit(1) })
