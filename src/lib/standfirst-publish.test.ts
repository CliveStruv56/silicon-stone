import { describe, expect, it } from 'vitest'
import { isFreshPublication } from './standfirst-publish'

const NOW = new Date('2026-11-02T12:00:00Z')

describe('isFreshPublication', () => {
  it('forwards a recent publication and one that has only just been stamped', () => {
    expect(isFreshPublication('2026-11-01T12:00:00Z', NOW)).toBe(true)
    expect(isFreshPublication(null, NOW)).toBe(true)
    expect(isFreshPublication(undefined, NOW)).toBe(true)
  })

  it('does not forward an edit to an old article', () => {
    expect(isFreshPublication('2026-10-01T12:00:00Z', NOW)).toBe(false)
  })

  it('does not forward an unreadable date', () => {
    expect(isFreshPublication('soon', NOW)).toBe(false)
  })
})
