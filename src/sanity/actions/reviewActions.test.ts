import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { reviewTransitions } from '@/lib/knowledge/transitions'

/**
 * The Studio actions offer a verdict only when the state machine would accept
 * it. These tests pin the menu the operator actually sees, because the failure
 * mode is silent in both directions: offering an illegal edge produces a 409
 * they cannot act on, and hiding a legal one makes a record unreviewable.
 *
 * The component itself is not rendered here — it needs the Studio runtime. What
 * is testable, and what matters, is the rule it asks.
 */

type Status = 'inbox' | 'ready' | 'rejected' | 'superseded'

/** Mirrors the component: which of the three buttons appear from a given state. */
function offered(from: Status): string[] {
  return (['ready', 'inbox', 'rejected'] as Status[]).filter(
    (to) => reviewTransitions.check(from, to).allowed,
  )
}

describe('which verdicts the actions offer', () => {
  it('an inbox record can be accepted or rejected, but not returned to where it is', () => {
    expect(offered('inbox').sort()).toEqual(['ready', 'rejected'])
  })

  it('a ready record can be sent back or rejected', () => {
    expect(offered('ready').sort()).toEqual(['inbox', 'rejected'])
  })

  it('a rejected record can only return to the inbox — the repair edge', () => {
    expect(offered('rejected')).toEqual(['inbox'])
    expect(reviewTransitions.check('rejected', 'inbox').repair).toBe(true)
  })

  it('a superseded record offers nothing — it is terminal', () => {
    expect(offered('superseded')).toEqual([])
  })

  it('never offers a move to the state the record is already in', () => {
    for (const s of ['inbox', 'ready', 'rejected', 'superseded'] as Status[]) {
      expect(offered(s)).not.toContain(s)
    }
  })

  it('does not offer superseded from anywhere', () => {
    // It needs the replacement named, which is a dialog rather than a button.
    // The service refuses a supersede with no supersededById, so a one-click
    // version would only ever produce an error.
    for (const s of ['inbox', 'ready', 'rejected'] as Status[]) {
      expect(offered(s)).not.toContain('superseded')
    }
  })
})

describe('what the reviewer is told about editorial memory', () => {
  // `/api/knowledge/review` returns `indexing` specifically "so a reviewer can
  // see what happened without going to look", and the action threw it away: a
  // failed embedding arrived as an unqualified green "Marked ready", with the
  // reason only in a server log. Found by pressing the button, not by a test.
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/sanity/actions/reviewActions.tsx'),
    'utf-8',
  )

  it('reads the indexing outcome out of the response', () => {
    expect(source).toContain('body.indexing')
  })

  it('says something different when the index was not updated', () => {
    expect(source).toMatch(/body\.indexing === 'failed' \? 'warning' : 'success'/)
  })

  it('has a phrase for every outcome the indexer can return', () => {
    // The indexer's four actions. A missing key renders no description at all,
    // which is the silence this test exists to stop.
    for (const action of ['indexed', 'removed', 'unchanged', 'failed']) {
      expect(source).toMatch(new RegExp(`^\\s*${action}: '`, 'm'))
    }
  })
})

describe('the legacy status mapping the actions rely on', () => {
  // Pre-foundation records carry `status`, not `reviewStatus`. Without this the
  // actions would render nothing on exactly the records most in need of review.
  const effective = (doc: { reviewStatus?: string; status?: string }): Status | null => {
    const c = doc.reviewStatus
    if (c === 'inbox' || c === 'ready' || c === 'rejected' || c === 'superseded') return c
    if (doc.status === 'pending') return 'inbox'
    if (doc.status === 'processed') return 'ready'
    return null
  }

  it('maps the legacy values', () => {
    expect(effective({ status: 'pending' })).toBe('inbox')
    expect(effective({ status: 'processed' })).toBe('ready')
  })

  it('refuses to read a capture failure as a verdict', () => {
    // `error` meant extraction broke, never that a human judged it. Mapping it
    // to `rejected` would discard records nobody has looked at.
    expect(effective({ status: 'error' })).toBeNull()
  })

  it('prefers the new field when both are present', () => {
    expect(effective({ reviewStatus: 'ready', status: 'pending' })).toBe('ready')
  })
})
