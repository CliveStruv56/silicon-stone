import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { AMOUNTS, DERIVED, ENGAGEMENTS, LADDER, MODULES, PRODUCTS, gbp, priceOf } from './offering'

/**
 * The catalogue is the single source of truth for every price the site shows.
 * Two things are asserted here.
 *
 * First, the arithmetic. Figures like "£83 for both rather than £103" are sums
 * of two other prices, and were hand-typed on the product pages until
 * 2026-08-15. If someone changes the Toolkit price, these have to move with it
 * — that is the whole reason `DERIVED` exists.
 *
 * Second, and more importantly, that nobody quietly reintroduces a literal. A
 * 2026-08-15 audit found the same figures restated across nine surfaces and
 * drifted apart on six of them; the fix only holds if the next hard-coded "£79"
 * fails a test rather than sitting unnoticed until a customer reads it.
 */

describe('derived figures', () => {
  it('discounts the toolkit by the credit the checklist ships', () => {
    expect(DERIVED.toolkitAfterDiscount).toBe(59)
    expect(DERIVED.toolkitAfterDiscount).toBe(
      AMOUNTS.toolkitStandard - AMOUNTS.toolkitDiscount,
    )
  })

  it('prices the ladder below the two bought cold', () => {
    expect(DERIVED.bundleTotal).toBe(83)
    expect(DERIVED.bundleSeparately).toBe(103)
    expect(DERIVED.bundleSeparately - DERIVED.bundleTotal).toBe(AMOUNTS.toolkitDiscount)
  })

  it('credits the evidence pack in full against the toolkit', () => {
    expect(DERIVED.toolkitAfterEvidencePack).toBe(40)
    expect(DERIVED.toolkitAfterEvidencePack).toBe(
      AMOUNTS.toolkitStandard - AMOUNTS.evidencePack,
    )
  })
})

describe('gbp', () => {
  it('formats sterling with thousands separators', () => {
    expect(gbp(24)).toBe('£24')
    expect(gbp(2000)).toBe('£2,000')
    expect(gbp(25000)).toBe('£25,000')
  })
})

describe('catalogue shape', () => {
  it('gives every offering a unique id', () => {
    const ids = [...PRODUCTS, ...ENGAGEMENTS, ...MODULES].map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves the ids the header nav looks up', () => {
    // These are the exact keys src/components/layout/Header.tsx passes to
    // priceOf(). A rename in the catalogue silently blanks a nav price note,
    // so the coupling is asserted rather than trusted.
    for (const id of [
      'ai-audit-checklist',
      'ai-act-toolkit',
      'advisory-briefing',
      'exposure-diagnostic',
      'drift-retainer',
      'strategic-assessment',
      'post-omnibus-briefing',
    ]) {
      expect(priceOf(id), `priceOf('${id}')`).toMatch(/£/)
    }
  })

  it('emphasises only the ladder rungs that move money', () => {
    // Rungs 2 and 4 are scope progressions. Bolding them would read as a
    // discount that does not exist.
    expect(LADDER.filter((rung) => rung.emphasis)).toHaveLength(3)
  })
})

/**
 * Every file that may legitimately contain a "£" character, and why.
 * Everything else must interpolate `gbp(AMOUNTS.x)`.
 */
const ALLOWED = new Set([
  // The catalogue itself, and its own test.
  'src/lib/offering.ts',
  'src/lib/offering.test.ts',
  // Sanity's `priceLabel` is authored in Studio, so its field description
  // carries an example string. Not a price the site renders.
  'src/sanity/schemaTypes/product.ts',
  // Gate fixtures deliberately pin their own labels: a test that imported the
  // values it checks would pass whatever they became.
  'src/lib/gate.test.ts',
])

/** Strip comments — a comment explaining a price is not a rendered price. */
const stripComments = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

describe('no hard-coded prices outside the catalogue', () => {
  it('finds no £ literal in any component or page', () => {
    const offenders = walk('src')
      .filter((file) => !ALLOWED.has(file.split(path.sep).join('/')))
      .flatMap((file) => {
        const lines = stripComments(fs.readFileSync(file, 'utf8')).split('\n')
        return lines
          .map((line, i) => ({ file, line: i + 1, text: line.trim() }))
          .filter(({ text }) => text.includes('£'))
      })

    expect(
      offenders,
      offenders.length
        ? `Hard-coded price(s). Import { AMOUNTS, gbp } from '@/lib/offering' and interpolate instead:\n` +
            offenders.map((o) => `  ${o.file}:${o.line}  ${o.text}`).join('\n')
        : '',
    ).toEqual([])
  })
})
