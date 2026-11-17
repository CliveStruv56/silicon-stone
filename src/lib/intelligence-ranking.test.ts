import { describe, expect, it } from 'vitest'
import {
  adjustedImpactScore,
  monthsBefore,
  rankIntelligence,
  type RankableArticle,
} from './intelligence-ranking'

const NOW = new Date('2026-11-17T12:00:00.000Z')
// Two calendar months before NOW.
const CUTOFF = '2026-09-17T12:00:00.000Z'

function article(
  id: string,
  impactScore: number | undefined,
  publishedAt: string | undefined,
): RankableArticle {
  return { _id: id, impactScore, publishedAt }
}

describe('monthsBefore', () => {
  it('goes back whole calendar months', () => {
    expect(monthsBefore(NOW, 2).toISOString()).toBe(CUTOFF)
  })

  it('clamps to the end of a shorter month instead of overflowing', () => {
    expect(monthsBefore(new Date('2026-03-31T00:00:00Z'), 1).toISOString()).toBe(
      '2026-02-28T00:00:00.000Z',
    )
    expect(monthsBefore(new Date('2026-04-30T09:00:00Z'), 2).toISOString()).toBe(
      '2026-02-28T09:00:00.000Z',
    )
  })

  it('crosses a year boundary', () => {
    expect(monthsBefore(new Date('2026-01-15T00:00:00Z'), 2).toISOString()).toBe(
      '2025-11-15T00:00:00.000Z',
    )
  })
})

describe('adjustedImpactScore: the two-month boundary', () => {
  it('keeps the score just under two months old', () => {
    expect(adjustedImpactScore(article('a', 8, '2026-09-17T12:00:01.000Z'), NOW)).toBe(8)
  })

  it('keeps the score at exactly two months old (not more than)', () => {
    expect(adjustedImpactScore(article('a', 8, CUTOFF), NOW)).toBe(8)
  })

  it('takes 3 points off just over two months old', () => {
    expect(adjustedImpactScore(article('a', 8, '2026-09-17T11:59:59.000Z'), NOW)).toBe(5)
  })

  it('does not clamp at the bottom of the 1-10 scale', () => {
    expect(adjustedImpactScore(article('a', 2, '2026-01-01T00:00:00Z'), NOW)).toBe(-1)
  })

  it('treats a missing score as 5, as the feed query always did', () => {
    expect(adjustedImpactScore(article('a', undefined, '2026-11-01T00:00:00Z'), NOW)).toBe(5)
    expect(adjustedImpactScore(article('a', undefined, '2026-01-01T00:00:00Z'), NOW)).toBe(2)
  })

  it('applies no deduction when the date is missing or unreadable', () => {
    expect(adjustedImpactScore(article('a', 8, undefined), NOW)).toBe(8)
    expect(adjustedImpactScore(article('a', 8, 'not a date'), NOW)).toBe(8)
  })
})

describe('rankIntelligence', () => {
  it('features the newest article even when its impact score is the lowest', () => {
    const { featured, panels } = rankIntelligence(
      [
        article('high-old', 10, '2026-11-01T00:00:00Z'),
        article('newest-low', 1, '2026-11-16T00:00:00Z'),
        article('mid', 6, '2026-11-10T00:00:00Z'),
      ],
      NOW,
    )
    expect(featured?._id).toBe('newest-low')
    expect(panels.map((a) => a._id)).toEqual(['high-old', 'mid'])
  })

  it('does not repeat the featured article in the panels', () => {
    const input = [
      article('a', 5, '2026-11-16T00:00:00Z'),
      article('b', 5, '2026-11-15T00:00:00Z'),
    ]
    const { featured, panels } = rankIntelligence(input, NOW)
    expect(panels).not.toContain(featured)
    expect(panels).toHaveLength(1)
  })

  it('orders panels by adjusted score, highest first', () => {
    const { panels } = rankIntelligence(
      [
        article('latest', 5, '2026-11-17T00:00:00Z'),
        article('seven', 7, '2026-11-01T00:00:00Z'),
        article('nine', 9, '2026-10-01T00:00:00Z'),
        article('eight', 8, '2026-11-05T00:00:00Z'),
      ],
      NOW,
    )
    expect(panels.map((a) => a._id)).toEqual(['nine', 'eight', 'seven'])
  })

  it('lets the age deduction reorder panels', () => {
    const { panels } = rankIntelligence(
      [
        article('latest', 5, '2026-11-17T00:00:00Z'),
        // 10 but old: adjusted 7, so it falls below the fresh 8.
        article('old-ten', 10, '2026-05-18T00:00:00Z'),
        article('fresh-eight', 8, '2026-11-01T00:00:00Z'),
      ],
      NOW,
    )
    expect(panels.map((a) => a._id)).toEqual(['fresh-eight', 'old-ten'])
  })

  it('breaks equal adjusted scores by date, newest first', () => {
    const { panels } = rankIntelligence(
      [
        article('latest', 1, '2026-11-17T00:00:00Z'),
        article('older', 7, '2026-11-01T00:00:00Z'),
        article('newer', 7, '2026-11-10T00:00:00Z'),
        // 10 minus 3 = 7: ties with the two above, and is the oldest.
        article('aged-ten', 10, '2026-06-01T00:00:00Z'),
      ],
      NOW,
    )
    expect(panels.map((a) => a._id)).toEqual(['newer', 'older', 'aged-ten'])
  })

  it('does not depend on the order the articles arrive in', () => {
    const input = [
      article('a', 7, '2026-11-01T00:00:00Z'),
      article('b', 7, '2026-11-01T00:00:00Z'),
      article('c', 9, '2026-10-20T00:00:00Z'),
      article('latest', 2, '2026-11-17T00:00:00Z'),
    ]
    const forward = rankIntelligence(input, NOW)
    const backward = rankIntelligence([...input].reverse(), NOW)
    expect(backward.featured?._id).toBe(forward.featured?._id)
    expect(backward.panels.map((x) => x._id)).toEqual(forward.panels.map((x) => x._id))
  })

  it('does not change the articles or the input array', () => {
    const input = [article('a', 5, '2026-11-01T00:00:00Z'), article('b', 9, '2026-11-02T00:00:00Z')]
    const copy = JSON.parse(JSON.stringify(input))
    rankIntelligence(input, NOW)
    expect(input).toEqual(copy)
  })

  it('treats a missing score as 5 when ranking panels', () => {
    const { panels } = rankIntelligence(
      [
        article('latest', 1, '2026-11-17T00:00:00Z'),
        article('four', 4, '2026-11-10T00:00:00Z'),
        article('none', undefined, '2026-11-09T00:00:00Z'),
        article('six', 6, '2026-11-08T00:00:00Z'),
      ],
      NOW,
    )
    expect(panels.map((a) => a._id)).toEqual(['six', 'none', 'four'])
  })

  it('never features a dateless article while a dated one exists, and sorts it last on ties', () => {
    const { featured, panels } = rankIntelligence(
      [
        article('dateless', 9, undefined),
        article('dated', 1, '2026-01-01T00:00:00Z'),
        article('dated-nine', 9, '2026-11-01T00:00:00Z'),
      ],
      NOW,
    )
    expect(featured?._id).toBe('dated-nine')
    // dateless keeps 9; dated (Jan) is 1-3 = -2.
    expect(panels.map((a) => a._id)).toEqual(['dateless', 'dated'])
  })

  it('handles an empty list and a single article', () => {
    expect(rankIntelligence([], NOW)).toEqual({ featured: undefined, panels: [] })
    const only = article('only', 5, '2026-11-01T00:00:00Z')
    expect(rankIntelligence([only], NOW)).toEqual({ featured: only, panels: [] })
  })
})
