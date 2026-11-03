import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { LEARN_PRICE_KEYS } from '../offering'
import { PERSONA_ORDER } from '../personas'
import { SEED_COURSES, SEED_LEVELS, SEED_ROUTES, SEED_TRACKS } from './catalogue-seed'
import {
  COURSE_CODE,
  COURSE_STATUSES,
  EXERCISE_TOOLS,
  ROUTE_LABELS,
  ROUTE_SLUGS,
  TOOL_COURSE,
  TRACK_LABELS,
  TRACK_SLUGS,
  codeSlug,
  compareCodes,
  formatMonth,
  statusLabel,
} from './model'

const byCode = new Map(SEED_COURSES.map((c) => [c.code, c]))

describe('the catalogue seed', () => {
  it('holds all 31 courses, each code and slug once', () => {
    expect(SEED_COURSES).toHaveLength(31)
    expect(new Set(SEED_COURSES.map((c) => c.code)).size).toBe(31)
    expect(new Set(SEED_COURSES.map((c) => c.slug)).size).toBe(31)
  })

  it('gives every course a well-formed code on a level that exists', () => {
    const levels = new Set(SEED_LEVELS.map((l) => l.number))
    for (const course of SEED_COURSES) {
      expect(course.code, course.code).toMatch(COURSE_CODE)
      expect(levels.has(Number(course.code.split('.')[0])), course.code).toBe(true)
      expect(course.slug, course.code).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('puts every course in exactly one track, the one the course names', () => {
    const seen = new Map<string, string>()
    for (const track of SEED_TRACKS) {
      for (const code of track.courses) {
        expect(seen.has(code), `${code} is in ${seen.get(code)} and ${track.slug}`).toBe(false)
        seen.set(code, track.slug)
        expect(byCode.get(code)?.track, code).toBe(track.slug)
      }
    }
    expect([...seen.keys()].sort(compareCodes)).toEqual(SEED_COURSES.map((c) => c.code).sort(compareCodes))
  })

  it('uses exactly the code-owned track and route slugs, which the waitlist tags are built from', () => {
    expect(SEED_TRACKS.map((t) => t.slug).sort()).toEqual([...TRACK_SLUGS].sort())
    expect(SEED_ROUTES.map((r) => r.slug).sort()).toEqual([...ROUTE_SLUGS].sort())
    for (const track of SEED_TRACKS) expect(LEARN_PRICE_KEYS).toContain(track.priceKey)
  })

  it('labels the waitlist options exactly as the seeded documents are titled', () => {
    for (const t of SEED_TRACKS) expect(TRACK_LABELS[t.slug], t.slug).toBe(t.title)
    // The menu, the form and the hub list tracks in one order.
    expect([...SEED_TRACKS].sort((a, b) => a.order - b.order).map((t) => t.slug)).toEqual([...TRACK_SLUGS])
    for (const r of SEED_ROUTES) expect(ROUTE_LABELS[r.slug], r.slug).toBe(r.title)
  })

  it('routes only through courses that exist, each once', () => {
    for (const route of SEED_ROUTES) {
      expect(new Set(route.courses).size, route.slug).toBe(route.courses.length)
      for (const code of route.courses) expect(byCode.has(code), `${route.slug}: ${code}`).toBe(true)
      if (route.personaSlug) expect(PERSONA_ORDER).toContain(route.personaSlug)
    }
    // The catalogue's governance route spells out a range; the expansion must not drop one.
    expect(SEED_ROUTES.find((r) => r.slug === 'governance-and-compliance')?.courses).toHaveLength(16)
  })

  it('maps each persona to at most one route', () => {
    const personas = SEED_ROUTES.map((r) => r.personaSlug).filter(Boolean)
    expect(new Set(personas).size).toBe(personas.length)
  })

  it('never says a course is coming without saying when', () => {
    for (const course of SEED_COURSES) {
      expect(COURSE_STATUSES).toContain(course.status)
      if (course.status === 'coming') expect(formatMonth(course.statusMonth), course.code).not.toBeNull()
    }
  })

  it('opens no course before its track opens', () => {
    for (const track of SEED_TRACKS) {
      for (const code of track.courses) {
        const month = byCode.get(code)?.statusMonth
        if (month && track.opens && code !== '0.1') {
          expect(month >= track.opens, `${code} (${month}) before ${track.slug} (${track.opens})`).toBe(true)
        }
      }
    }
  })

  it('gives every course at least one outcome and one module, and never more than five outcomes', () => {
    for (const course of SEED_COURSES) {
      expect(course.outcomes.length, course.code).toBeGreaterThan(0)
      expect(course.outcomes.length, course.code).toBeLessThanOrEqual(5)
      expect(course.modules.length, course.code).toBeGreaterThan(0)
    }
  })

  it('does not describe Article 4 as the pre-Omnibus "sufficient level" duty', () => {
    // Regulation (EU) 2026/1744 rewrote Article 4 on 27 July 2026.
    const text = JSON.stringify(SEED_COURSES)
    expect(text).not.toMatch(/sufficient level/i)
  })
})

describe('exercise tools', () => {
  it('points every tool at a real page', () => {
    for (const [key, tool] of Object.entries(EXERCISE_TOOLS)) {
      const page = path.join(process.cwd(), 'src/app/(website)', tool.href, 'page.tsx')
      expect(fs.existsSync(page), `${key} → ${tool.href}`).toBe(true)
    }
  })

  it('links each free tool to a course that uses it', () => {
    for (const [tool, code] of Object.entries(TOOL_COURSE)) {
      expect(byCode.get(code)?.exerciseTools ?? [], `${tool} → ${code}`).toContain(tool)
    }
  })
})

describe('model helpers', () => {
  it('reads a status as the badge shows it', () => {
    expect(statusLabel('coming', '2027-01')).toBe('Coming January 2027')
    expect(statusLabel('coming', null)).toBe('Coming soon')
    expect(statusLabel('coming', '2027-13')).toBe('Coming soon')
    expect(statusLabel('founding-cohort')).toBe('Founding cohort')
    expect(statusLabel('open')).toBe('Open')
    expect(statusLabel('in-development')).toBe('In development')
  })

  it('turns a code into its tag and id form, and refuses anything else', () => {
    expect(codeSlug('2.2')).toBe('2-2')
    expect(codeSlug('4.10')).toBe('4-10')
    expect(() => codeSlug('2-2')).toThrow()
    expect(() => codeSlug('9.1')).toThrow()
  })

  it('sorts 4.2 before 4.10', () => {
    expect(['4.10', '4.2', '0.1'].sort(compareCodes)).toEqual(['0.1', '4.2', '4.10'])
  })
})
