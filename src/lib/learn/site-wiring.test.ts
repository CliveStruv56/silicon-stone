import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { TOOL_COURSE } from './model'

/**
 * Where Learn is woven into the rest of the site (docs/learn/lbuild.md,
 * Phase 3). Each of these is a placement a later edit could quietly drop with
 * every page still rendering, so each is asserted from source, in the style of
 * `offerings-map.test.ts` and `engagement-pages.test.ts`.
 */
const APP = 'src/app/(website)'
const read = (file: string) => {
  expect(fs.existsSync(file), `${file} not found — this check has gone blind`).toBe(true)
  return fs.readFileSync(file, 'utf8')
}
/** Index of `needle` in `source`, failing loudly if it is missing. */
const at = (source: string, needle: string, file: string) => {
  const index = source.indexOf(needle)
  expect(index, `${needle} not found in ${file}`).toBeGreaterThanOrEqual(0)
  return index
}

describe('Learn in the navigation', () => {
  it('sits between Tools and Products in the header', () => {
    const file = 'src/components/layout/Header.tsx'
    const header = read(file)
    const tools = at(header, "name: 'Tools'", file)
    const learn = at(header, "name: 'Learn'", file)
    const products = at(header, "name: 'Products'", file)
    expect(tools < learn && learn < products).toBe(true)
  })

  it('has a footer column', () => {
    const footer = read('src/components/layout/Footer.tsx')
    expect(footer).toContain('footerNavigation.learn.map')
    expect(footer).toContain("href: '/learn'")
  })
})

describe('Learn on the homepage', () => {
  it('is a rung on the start-here spine', () => {
    expect(read('src/components/home/StartHereSpine.tsx')).toContain("title: 'Learn'")
  })

  it('has its band directly after the decision tools, and the hero is untouched', () => {
    const file = path.join(APP, 'page.tsx')
    const home = read(file)
    const tools = at(home, '<ToolsGallery />', file)
    const band = at(home, '<LearnBand', file)
    const products = at(home, '<ProductsBand', file)
    expect(tools < band && band < products).toBe(true)
    expect(home.indexOf('<LearnBand')).toBeGreaterThan(home.indexOf('<HeroSection'))
  })
})

describe('Learn after a tool result', () => {
  it.each(Object.keys(TOOL_COURSE))('the %s page links to its course', (tool) => {
    const source = read(path.join(APP, 'tools', tool, 'page.tsx'))
    expect(source).toContain(`<ToolCourseLink tool="${tool}" />`)
  })
})

describe('Learn in the article footer', () => {
  it('shows the related course after the series and before the gate', () => {
    const file = path.join(APP, 'analysis/[slug]/page.tsx')
    const article = read(file)
    const series = at(article, '<SeriesNav', file)
    const course = at(article, '<RelatedCourseCard', file)
    const gate = at(article, '<Gate ', file)
    expect(series < course && course < gate).toBe(true)
  })

  it('projects related courses in the article query', () => {
    expect(read('src/sanity/lib/queries.ts')).toMatch(/"relatedCourses": relatedCourses\[\]->/)
  })
})

describe('Learn on the offerings map', () => {
  it('is a stage between Use and Discuss', () => {
    const file = 'src/components/offerings/OfferingsMap.tsx'
    const map = read(file)
    const use = at(map, 'title="Use"', file)
    const learn = at(map, 'title="Learn"', file)
    const discuss = at(map, 'title="Discuss"', file)
    expect(use < learn && learn < discuss).toBe(true)
  })
})
