import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { AMOUNTS, ENGAGEMENTS, MODULES, SCOPED_FEE } from './offering'
import { buildProvisionSchema, buildServiceSchema, buildToolSchema } from './seo'

/**
 * Structured data is the one copy of a price no reader ever sees, which makes
 * it the copy most likely to go on quoting a figure the site has withdrawn.
 *
 * Owner's rule, 21 September 2026: advisory is priced after a discussion, and
 * only the Advisory Briefing publishes a figure. Product markup is held back
 * entirely until the Lemon Squeezy store is live — an `Offer` for something
 * nobody can yet buy is a false statement made to a machine.
 */

const APP_DIR = 'src/app/(website)'

function layoutsUnder(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return layoutsUnder(full)
    return entry.name === 'layout.tsx' ? [full] : []
  })
}

describe('advisory Service markup', () => {
  const scoped = [...ENGAGEMENTS, ...MODULES].filter((o) => o.price === SCOPED_FEE)

  it('finds the scoped-fee offerings it is meant to protect', () => {
    expect(scoped.length).toBeGreaterThanOrEqual(7)
  })

  it('carries no offer for an engagement priced after scoping', () => {
    for (const offering of scoped) {
      expect(buildServiceSchema(offering), offering.id).not.toHaveProperty('offers')
    }
  })

  it('refuses a figure that is not the price the page displays', () => {
    for (const offering of scoped) {
      expect(() => buildServiceSchema(offering, 2500), offering.id).toThrow()
    }
    const briefing = ENGAGEMENTS.find((e) => e.id === 'advisory-briefing')!
    expect(() => buildServiceSchema(briefing, AMOUNTS.advisoryBriefing + 1)).toThrow()
  })

  it('prices the Advisory Briefing from AMOUNTS, in sterling', () => {
    const briefing = ENGAGEMENTS.find((e) => e.id === 'advisory-briefing')!
    expect(buildServiceSchema(briefing, AMOUNTS.advisoryBriefing).offers).toEqual({
      '@type': 'Offer',
      price: AMOUNTS.advisoryBriefing,
      priceCurrency: 'GBP',
      url: expect.stringContaining('/advisory/advisory-briefing'),
    })
  })

  it('passes an amount from exactly one layout', () => {
    // Read from source: the builder cannot know which layouts call it.
    const layouts = layoutsUnder(path.join(APP_DIR, 'advisory'))
    const calling = layouts.filter((f) => fs.readFileSync(f, 'utf8').includes('buildServiceSchema('))
    expect(calling.length, 'advisory layouts emitting Service markup').toBe(8)
    const priced = calling.filter((f) => /buildServiceSchema\([^)]*,/.test(fs.readFileSync(f, 'utf8')))
    expect(priced).toEqual([path.join(APP_DIR, 'advisory/advisory-briefing/layout.tsx')])
  })
})

describe('product markup', () => {
  it('is not emitted before the store is live', () => {
    const offenders = layoutsUnder(path.join(APP_DIR, 'products'))
      .concat(path.join(APP_DIR, 'pricing/page.tsx'))
      .filter((f) => fs.existsSync(f) && /'@type':\s*'Product'|buildProductSchema/.test(fs.readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})

describe('tool and provision markup', () => {
  it('marks a tool free without inventing a price', () => {
    const schema = buildToolSchema({ name: 'T', description: 'D', path: '/tools/t' })
    expect(schema.isAccessibleForFree).toBe(true)
    expect(schema.offers.price).toBe(0)
  })

  it('carries the identifier and consolidation date it was given, unchanged', () => {
    const schema = buildProvisionSchema({
      label: 'AI Act Article 50',
      title: 'Transparency obligations',
      path: '/tools/compliance-checker/provisions/50',
      instrument: 'Regulation (EU) 2024/1689',
      celex: '02024R1689-20260727',
      sourceUrl: 'https://example.test/celex',
      consolidatedAs: '2026-07-27',
    })
    expect(schema.legislationIdentifier).toBe('02024R1689-20260727')
    expect(schema.legislationDateVersion).toBe('2026-07-27')
    expect(schema.isPartOf.legislationIdentifier).toBe('02024R1689-20260727')
  })
})
