import { describe, expect, it } from 'vitest'
import { isDigitalOmnibusRelated } from './digital-omnibus-related'
import { ENGAGEMENTS, MODULES } from './offering'

describe('selective Digital Omnibus discovery', () => {
  it.each([
    { title: 'What the Digital Omnibus changes' },
    { slug: 'post-omnibus-ai-act-timetable' },
    { excerpt: 'A board decision about Article 50 transparency.' },
    { title: 'GDPR and the use of training data' },
    { title: 'Cloud switching under the Data Act' },
    { title: 'Reporting under NIS2' },
    { title: 'GPAI Enforcement Activates 2 August' },
    { title: 'General-purpose AI obligations' },
  ])('recognises a specific regulatory story: %j', article => {
    expect(isDigitalOmnibusRelated(article)).toBe(true)
  })

  it.each([null, undefined, {}, { title: 'The chip supply chain' }, { title: 'AI agents and digital sovereignty' }, { title: 'A new data activation tool' }])('avoids unrelated or missing content: %j', article => {
    expect(isDigitalOmnibusRelated(article)).toBe(false)
  })
})

it('keeps the retired Omnibus briefing separate from the standalone procurement project', () => {
  const ids = [...ENGAGEMENTS, ...MODULES].map(offer => offer.id)
  expect(ids).not.toContain('post-omnibus-briefing')
  expect(ids).toContain('european-procurement-readiness')
  expect(ids).toContain('exposure-diagnostic')
  expect(ids).toContain('strategic-assessment')
})
