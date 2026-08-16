import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * draft-retrieval.ts is `server-only`, so its behaviour cannot be imported
 * here. What matters and can be checked is that the floor exists, is applied
 * per result rather than to the top score alone, and is shared with the
 * reader-facing related-articles write-back — the two places where a weak
 * neighbour does harm.
 */
const retrieval = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/draft-retrieval.ts'),
  'utf8',
)
const vectorize = fs.readFileSync(
  path.join(process.cwd(), 'src/app/api/vectorize/route.ts'),
  'utf8',
)

describe('prior-coverage score floor', () => {
  it('is defined and exported', () => {
    expect(retrieval).toMatch(/export const PRIOR_COVERAGE_SCORE_FLOOR = 0\.37/)
  })

  it('sits inside the measured separating band', () => {
    const value = Number(
      /PRIOR_COVERAGE_SCORE_FLOOR = ([\d.]+)/.exec(retrieval)?.[1] ?? '0',
    )
    // Measured 2026-08-16 against the live index: off-topic queries topped out
    // at 0.318, on-topic queries bottomed at 0.421.
    expect(value).toBeGreaterThan(0.318)
    expect(value).toBeLessThan(0.421)
  })

  it('records how it was calibrated, not just what it is', () => {
    // The regulatory floors carry their measurements; a bare number invites
    // someone to "tune" it later with no idea what it was separating.
    expect(retrieval).toMatch(/Calibrated 2026-08-16/)
    expect(retrieval).toMatch(/0\.318/)
  })

  it('filters every result, not only the top one', () => {
    expect(retrieval).toMatch(/similar\.filter\(\(result\) => result\.score >= PRIOR_COVERAGE_SCORE_FLOOR\)/)
  })

  it('reports the no-block outcome instead of failing silently', () => {
    expect(retrieval).toMatch(/below floor/)
    expect(retrieval).toMatch(/no block injected/)
  })

  it('says how many survived the floor, not just how many were found', () => {
    expect(retrieval).toMatch(/above floor/)
  })
})

describe('the reader-facing related list shares the floor', () => {
  it('imports the same constant rather than repeating a number', () => {
    expect(vectorize).toMatch(/PRIOR_COVERAGE_SCORE_FLOOR/)
    expect(vectorize).toMatch(/from '@\/lib\/draft-retrieval'/)
  })

  it('filters the neighbours by score', () => {
    expect(vectorize).toMatch(/match\.score \?\? 0\) >= PRIOR_COVERAGE_SCORE_FLOOR/)
  })
})

describe('prior coverage embeds the topic alone, deliberately', () => {
  it('documents why it does not compose a query like the regulatory lane', () => {
    // Asymmetry with retrieve.ts is intentional and worth a comment, or someone
    // will "fix" it by adding the research keywords back in. Comment markers and
    // line wrapping are flattened first so the assertion survives reformatting.
    const prose = retrieval.replace(/\s*\/\/\s*/g, ' ').replace(/\s+/g, ' ')
    expect(prose).toMatch(/news vocabulary/)
  })
})
