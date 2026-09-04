import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getSeriesProgress,
  neighboursFor,
  partHref,
  partNumberFor,
  partsLabel,
  publishedParts,
  recordSeriesProgress,
  resolveSeriesContext,
  resumeTarget,
  totalParts,
  type SeriesPart,
  type SeriesRef,
} from './series'

function slot(id: string | null, key = id ?? 'gap'): SeriesPart {
  return {
    _key: key,
    ref: id ?? 'unresolved-ref',
    article: id ? { _id: id, title: `Part ${id}`, slug: `part-${id}` } : null,
  }
}

// A six-slot series where slot 4 points at an article that is still a draft.
// This is the shape the whole module exists to get right.
const WITH_GAP: SeriesPart[] = [slot('a'), slot('b'), slot('c'), slot(null), slot('e'), slot('f')]

describe('partNumberFor', () => {
  it('numbers by position, so a gap does not shift the parts after it', () => {
    expect(partNumberFor(WITH_GAP, 'a')).toBe(1)
    expect(partNumberFor(WITH_GAP, 'c')).toBe(3)
    // The point of the whole design: 'e' is Part 5, not Part 4, even though
    // only four parts are readable.
    expect(partNumberFor(WITH_GAP, 'e')).toBe(5)
    expect(partNumberFor(WITH_GAP, 'f')).toBe(6)
  })

  it('does not renumber when the gap is later filled', () => {
    const filled = [...WITH_GAP]
    filled[3] = slot('d')
    expect(partNumberFor(filled, 'e')).toBe(5)
    expect(partNumberFor(filled, 'f')).toBe(6)
    expect(partNumberFor(filled, 'd')).toBe(4)
  })

  it('returns null for an article that is not in the series', () => {
    expect(partNumberFor(WITH_GAP, 'zzz')).toBeNull()
    expect(partNumberFor(null, 'a')).toBeNull()
    expect(partNumberFor(WITH_GAP, '')).toBeNull()
  })
})

describe('partsLabel', () => {
  /**
   * One editorial rule, three call sites — the series index, and the promo band
   * on `/intelligence` and the homepage. It was written twice within a day and
   * the two copies had already drifted in wording ("5 published" against
   * "5 published so far") before either shipped, which is why it is a shared
   * function with a test rather than a comment asking people to keep them in
   * step.
   */
  it('counts every slot, including parts still in draft', () => {
    expect(partsLabel(6, 5)).toBe('6 parts · 5 published')
  })

  it('says "N published" only when it differs from the total', () => {
    // The whole point: on a finished series the same number twice reads as a
    // bug rather than as information.
    expect(partsLabel(6, 6)).toBe('6 parts')
    expect(partsLabel(6, 6, 'in-progress')).toBe('6 parts')
  })

  it('marks a complete series complete', () => {
    expect(partsLabel(6, 6, 'complete')).toBe('6 parts · complete')
  })

  it('never says "complete" while parts are unpublished', () => {
    // A series can be flagged complete in Studio while a part is still a draft.
    // Claiming completeness over a gap is the worse of the two errors.
    expect(partsLabel(6, 5, 'complete')).toBe('6 parts · 5 published')
  })

  it('singularises a one-part series', () => {
    expect(partsLabel(1, 1)).toBe('1 part')
  })

  it('survives an empty series without saying "0 parts · 0 published"', () => {
    expect(partsLabel(0, 0)).toBe('0 parts')
  })
})

describe('totalParts / publishedParts', () => {
  it('counts every slot, and separately the readable ones', () => {
    expect(totalParts(WITH_GAP)).toBe(6)
    expect(publishedParts(WITH_GAP)).toBe(5)
    expect(totalParts(null)).toBe(0)
    expect(publishedParts(undefined)).toBe(0)
  })
})

describe('neighboursFor', () => {
  it('skips an unresolved slot when linking but keeps its number', () => {
    const { prev, next } = neighboursFor(WITH_GAP, 'c')
    expect(prev?.article._id).toBe('b')
    expect(prev?.partNumber).toBe(2)
    // Slot 4 is a draft, so the next readable part is slot 5 — and it must be
    // labelled Part 5. Labelling it "Part 4" is the bug this asserts against.
    expect(next?.article._id).toBe('e')
    expect(next?.partNumber).toBe(5)
  })

  it('has no prev at the start and no next at the end', () => {
    expect(neighboursFor(WITH_GAP, 'a').prev).toBeNull()
    expect(neighboursFor(WITH_GAP, 'a').next?.partNumber).toBe(2)
    expect(neighboursFor(WITH_GAP, 'f').next).toBeNull()
    expect(neighboursFor(WITH_GAP, 'f').prev?.partNumber).toBe(5)
  })

  it('skips a run of consecutive gaps', () => {
    const parts = [slot('a'), slot(null, 'g1'), slot(null, 'g2'), slot('d')]
    const { next } = neighboursFor(parts, 'a')
    expect(next?.article._id).toBe('d')
    expect(next?.partNumber).toBe(4)
  })

  it('returns nothing for an article outside the series', () => {
    expect(neighboursFor(WITH_GAP, 'zzz')).toEqual({ prev: null, next: null })
  })
})

describe('resolveSeriesContext', () => {
  const sovereignty: SeriesRef = { title: 'Sovereignty', slug: 'sovereignty', parts: [] }
  const careers: SeriesRef = { title: 'Careers', slug: 'careers', parts: [] }

  it('takes the first, deterministically, when an article is in more than one', () => {
    expect(resolveSeriesContext([sovereignty, careers])?.slug).toBe('sovereignty')
  })

  it('returns null with no series', () => {
    expect(resolveSeriesContext([])).toBeNull()
    expect(resolveSeriesContext(null)).toBeNull()
    expect(resolveSeriesContext(undefined)).toBeNull()
  })
})

describe('partHref', () => {
  it('is one URL per article — no series param, so article pages stay static', () => {
    expect(partHref('some-article')).toBe('/analysis/some-article')
  })
})

describe('resumeTarget', () => {
  it('offers part 1 with no progress', () => {
    expect(resumeTarget(WITH_GAP, null)?.partNumber).toBe(1)
  })

  it('offers the next readable part after the furthest reached', () => {
    expect(resumeTarget(WITH_GAP, 2)?.partNumber).toBe(3)
    // Read to part 3; slot 4 is a draft, so resume at 5.
    expect(resumeTarget(WITH_GAP, 3)?.partNumber).toBe(5)
  })

  it('wraps to the first readable part once the series is finished', () => {
    expect(resumeTarget(WITH_GAP, 6)?.partNumber).toBe(1)
  })

  it('returns null when nothing in the series is readable', () => {
    expect(resumeTarget([slot(null, 'x'), slot(null, 'y')], null)).toBeNull()
    expect(resumeTarget([], null)).toBeNull()
  })
})

describe('reading progress', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    // jsdom is not configured for this suite (vitest runs in node), so stand up
    // the minimum surface the module actually touches.
    ;(globalThis as unknown as { window?: unknown }).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    }
  })

  it('records and reads back a part number', () => {
    recordSeriesProgress('sovereignty', 3)
    expect(getSeriesProgress('sovereignty')).toBe(3)
    expect(getSeriesProgress('careers')).toBeNull()
  })

  it('is monotonic — re-reading an earlier part does not rewind progress', () => {
    recordSeriesProgress('sovereignty', 5)
    recordSeriesProgress('sovereignty', 2)
    expect(getSeriesProgress('sovereignty')).toBe(5)
  })

  it('ignores nonsense rather than storing it', () => {
    recordSeriesProgress('sovereignty', 0)
    recordSeriesProgress('sovereignty', Number.NaN)
    recordSeriesProgress('', 3)
    expect(getSeriesProgress('sovereignty')).toBeNull()
  })

  afterEach(() => {
    // Vitest isolates files, but leaving a fake `window` on globalThis would
    // quietly change how anything later in THIS file behaves.
    delete (globalThis as unknown as { window?: unknown }).window
  })

  it('survives storage that throws', () => {
    ;(globalThis as unknown as { window?: unknown }).window = {
      localStorage: {
        getItem: () => {
          throw new Error('SecurityError')
        },
        setItem: () => {
          throw new Error('SecurityError')
        },
      },
    }
    expect(() => recordSeriesProgress('sovereignty', 2)).not.toThrow()
    expect(getSeriesProgress('sovereignty')).toBeNull()
  })
})
