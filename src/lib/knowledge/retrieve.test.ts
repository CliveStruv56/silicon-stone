import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { configuredScoreFloor, KNOWLEDGE_SCORE_FLOOR_ENV } from './features'

/**
 * `retrieve.ts` imports `server-only` and cannot be imported here at all, so
 * the lane's properties are asserted at source level — the same split
 * `research-provenance.test.ts` uses. `configuredScoreFloor` lives in
 * `features.ts` beside the flags precisely because it is a second switch rather
 * than a setting, which also makes it directly testable.
 */

function read(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf-8')
}

/**
 * Source with comments removed.
 *
 * The lane's own docblock *cites* `PRIOR_COVERAGE_SCORE_FLOOR = 0.37` while
 * explaining why editorial memory has no equivalent, so a check that reads the
 * raw file fails on the explanation for the rule it is enforcing. Prose must
 * not be able to satisfy a guard, and it must not be able to break one either.
 */
function code(file: string): string {
  return read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const LANE = 'src/lib/knowledge/retrieve.ts'

describe('the floor must be measured, not defaulted', () => {
  it('is null when nobody has set one', () => {
    expect(configuredScoreFloor({})).toBeNull()
    expect(configuredScoreFloor({ [KNOWLEDGE_SCORE_FLOOR_ENV]: '' })).toBeNull()
    expect(configuredScoreFloor({ [KNOWLEDGE_SCORE_FLOOR_ENV]: '   ' })).toBeNull()
  })

  it('reads a real cosine floor', () => {
    expect(configuredScoreFloor({ [KNOWLEDGE_SCORE_FLOOR_ENV]: '0.42' })).toBe(0.42)
  })

  it('rejects a value outside (0, 1) rather than coercing it', () => {
    // A floor of 37 is a typo for 0.37. Treating it as "nothing ever matches"
    // would look exactly like an empty corpus, which is the one thing this lane
    // must not be confusable with.
    for (const raw of ['37', '0', '1', '-0.5', 'high', 'NaN']) {
      expect(configuredScoreFloor({ [KNOWLEDGE_SCORE_FLOOR_ENV]: raw }), raw).toBeNull()
    }
  })

  it('hard-codes no floor anywhere in the lane', () => {
    // Decision 5. PRIOR_COVERAGE_SCORE_FLOOR was measured over 15 articles;
    // editorial memory has two records and cannot reproduce that experiment, so
    // the number does not exist in code. A plausible constant here would
    // outlive everyone's memory of its being a guess.
    const assignments = code(LANE).match(/SCORE_FLOOR\s*=\s*0?\.\d+/g) ?? []
    expect(assignments, 'the lane must not define a default floor').toEqual([])
  })

  it('refuses to run on the flag alone', () => {
    // Turning KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED on is deliberately not enough.
    const source = read(LANE)
    expect(source).toContain("knowledgeFeatureEnabled('draftRetrieval')")
    expect(source).toContain('configuredScoreFloor()')
    const flagAt = source.indexOf("knowledgeFeatureEnabled('draftRetrieval')")
    const floorAt = source.indexOf('const floor = configuredScoreFloor()')
    const queryAt = source.indexOf('await generateEmbedding(')
    expect(flagAt).toBeGreaterThan(-1)
    expect(floorAt).toBeGreaterThan(flagAt)
    // Both gates precede any spend: an unconfigured lane must not embed.
    expect(queryAt).toBeGreaterThan(floorAt)
  })
})

describe('the lane reports rather than disappears', () => {
  it('distinguishes switched-off from found-nothing', () => {
    // A lane that never fires is otherwise indistinguishable from one that is
    // broken — the reasoning that put `notes` in draft-retrieval in the first
    // place, and why laneStatus exists.
    const source = read(LANE)
    for (const status of ["lane('skipped')", "lane('empty'", "lane('ok'"]) {
      expect(source, status).toContain(status)
    }
  })

  it('is wired into draft retrieval as a third independent lane', () => {
    const source = read('src/lib/draft-retrieval.ts')
    expect(source).toContain('retrieveEditorialMemory')
    // Promise.allSettled, so one lane failing cannot cost the others.
    expect(source).toMatch(/allSettled\(\[[\s\S]{0,300}retrieveEditorialMemory/)
    expect(source).toContain("inertLane('editorial_memory', 'failed')")
  })

  it('fences its block, because approval makes it trustworthy thinking, not instructions', () => {
    expect(read('src/lib/prompts.ts')).toContain('fenceUntrusted(editorialMemory)')
  })
})
