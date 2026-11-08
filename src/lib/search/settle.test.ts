import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SETTLE_MS, createSettledReporter } from './settle'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('createSettledReporter', () => {
  it('reports only the query the reader stopped on, not the prefixes typed on the way', () => {
    const report = vi.fn()
    const r = createSettledReporter(report)
    // What the 300ms debounce renders while someone types with short pauses.
    for (const q of ['qz', 'qzxv', 'qzxv flur', 'qzxv flurbian']) {
      r.update(q)
      vi.advanceTimersByTime(800)
    }
    expect(report).not.toHaveBeenCalled()
    vi.advanceTimersByTime(SETTLE_MS)
    expect(report.mock.calls).toEqual([['qzxv flurbian']])
  })

  it('does not report a query left before it settled', () => {
    const report = vi.fn()
    const r = createSettledReporter(report)
    r.update('qzxv')
    vi.advanceTimersByTime(SETTLE_MS - 1)
    r.update(null) // the next query found something
    vi.advanceTimersByTime(SETTLE_MS * 2)
    expect(report).not.toHaveBeenCalled()
  })

  it('reports each settled query once per session', () => {
    const report = vi.fn()
    const r = createSettledReporter(report)
    r.update('qzxv')
    vi.advanceTimersByTime(SETTLE_MS)
    r.update('qzxv')
    vi.advanceTimersByTime(SETTLE_MS)
    expect(report).toHaveBeenCalledTimes(1)
  })

  it('stops when cancelled (the reader left the page)', () => {
    const report = vi.fn()
    const r = createSettledReporter(report)
    r.update('qzxv')
    r.cancel()
    vi.advanceTimersByTime(SETTLE_MS * 2)
    expect(report).not.toHaveBeenCalled()
  })
})
