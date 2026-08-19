import { describe, expect, it } from 'vitest'

import {
  KNOWLEDGE_TRANSITION_MACHINES,
  KnowledgeTransitionError,
  extractionTransitions,
  indexTransitions,
  researchRunTransitions,
  reviewTransitions,
} from './transitions'
import {
  KNOWLEDGE_EXTRACTION_STATUSES,
  KNOWLEDGE_INDEX_STATUSES,
  KNOWLEDGE_REVIEW_STATUSES,
  RESEARCH_RUN_STATUSES,
} from './types'

/**
 * The point of these tests is not that the tables are transcribed correctly —
 * that would be a tautology. It is that the two rules the module claims hold
 * across every machine: a terminal state cannot drift back into an active one
 * except through an edge explicitly marked `repair`, and a no-op is refused.
 */

describe('review transitions', () => {
  it('lets an inbox record progress, be declined, or be replaced', () => {
    expect(reviewTransitions.can('inbox', 'ready')).toBe(true)
    expect(reviewTransitions.can('inbox', 'rejected')).toBe(true)
    expect(reviewTransitions.can('inbox', 'superseded')).toBe(true)
  })

  it('lets an approved record be pulled back without calling it a repair', () => {
    const result = reviewTransitions.check('ready', 'inbox')
    expect(result.allowed).toBe(true)
    expect(result.repair).toBe(false)
  })

  it('reverses a rejection only through a labelled repair edge', () => {
    const result = reviewTransitions.check('rejected', 'inbox')
    expect(result.allowed).toBe(true)
    expect(result.repair).toBe(true)
  })

  it('never lets a rejected record reach ready directly', () => {
    // The reopen path is rejected → inbox → ready. Skipping the inbox step
    // would put an unreviewed record into editorial memory.
    expect(reviewTransitions.can('rejected', 'ready')).toBe(false)
  })

  it('treats superseded as final', () => {
    for (const to of KNOWLEDGE_REVIEW_STATUSES) {
      expect(reviewTransitions.can('superseded', to)).toBe(false)
    }
    expect(reviewTransitions.nextStates('superseded')).toEqual([])
  })

  it('refuses a no-op and says why', () => {
    const result = reviewTransitions.check('ready', 'ready')
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/no-op/)
  })

  it('refuses states it does not know', () => {
    expect(reviewTransitions.check('inbox', 'approved').reason).toMatch(
      /unknown target state/,
    )
    expect(reviewTransitions.check(undefined, 'ready').reason).toMatch(
      /unknown source state/,
    )
    expect(reviewTransitions.check('inbox', '').allowed).toBe(false)
  })

  it('throws a typed error from assert', () => {
    expect(() => reviewTransitions.assert('superseded', 'ready')).toThrow(
      KnowledgeTransitionError,
    )
    try {
      reviewTransitions.assert('superseded', 'ready')
    } catch (error) {
      const typed = error as KnowledgeTransitionError
      expect(typed.machine).toBe('knowledge review')
      expect(typed.from).toBe('superseded')
      expect(typed.to).toBe('ready')
    }
    expect(reviewTransitions.assert('inbox', 'ready').allowed).toBe(true)
  })
})

describe('research run transitions', () => {
  it('runs a job forwards', () => {
    expect(researchRunTransitions.can('queued', 'running')).toBe(true)
    expect(researchRunTransitions.can('running', 'completed')).toBe(true)
  })

  it('retries from failed and cancelled, as labelled repairs', () => {
    expect(researchRunTransitions.check('failed', 'queued')).toMatchObject({
      allowed: true,
      repair: true,
    })
    expect(researchRunTransitions.check('cancelled', 'queued')).toMatchObject({
      allowed: true,
      repair: true,
    })
  })

  it('treats completed as final, so a rerun is a new run', () => {
    for (const to of RESEARCH_RUN_STATUSES) {
      expect(researchRunTransitions.can('completed', to)).toBe(false)
    }
  })

  it('never jumps a failed job straight back to running', () => {
    expect(researchRunTransitions.can('failed', 'running')).toBe(false)
    expect(researchRunTransitions.can('failed', 'completed')).toBe(false)
  })
})

describe('extraction transitions', () => {
  it('queues, processes and succeeds', () => {
    expect(extractionTransitions.can('queued', 'processing')).toBe(true)
    expect(extractionTransitions.can('processing', 'succeeded')).toBe(true)
  })

  it('retries a failure', () => {
    expect(extractionTransitions.check('failed', 'queued').repair).toBe(true)
    expect(extractionTransitions.can('failed', 'processing')).toBe(false)
    expect(extractionTransitions.can('failed', 'succeeded')).toBe(false)
  })

  it('re-extracts a success only through the repair edge', () => {
    expect(extractionTransitions.check('succeeded', 'queued').repair).toBe(true)
    expect(extractionTransitions.can('succeeded', 'processing')).toBe(false)
  })

  it('lets a source that turns out to need extraction leave not_required', () => {
    expect(extractionTransitions.can('not_required', 'queued')).toBe(true)
    expect(extractionTransitions.can('not_required', 'succeeded')).toBe(false)
  })
})

describe('index transitions', () => {
  it('indexes an eligible record', () => {
    expect(indexTransitions.can('not_eligible', 'pending')).toBe(true)
    expect(indexTransitions.can('pending', 'indexed')).toBe(true)
  })

  it('lets every state fall back to not_eligible', () => {
    for (const from of KNOWLEDGE_INDEX_STATUSES) {
      if (from === 'not_eligible') continue
      expect(indexTransitions.can(from, 'not_eligible')).toBe(true)
    }
  })

  it('re-queues an indexed record when its content drifts', () => {
    const result = indexTransitions.check('indexed', 'pending')
    expect(result.allowed).toBe(true)
    // Drift is a normal fact of life, not a repair.
    expect(result.repair).toBe(false)
  })

  it('retries an error only into pending', () => {
    expect(indexTransitions.check('error', 'pending').repair).toBe(true)
    expect(indexTransitions.can('error', 'indexed')).toBe(false)
  })

  it('never lets a not_eligible record appear indexed without being queued', () => {
    expect(indexTransitions.can('not_eligible', 'indexed')).toBe(false)
    expect(indexTransitions.can('not_eligible', 'error')).toBe(false)
  })
})

describe('every machine', () => {
  const stateSets: Record<string, readonly string[]> = {
    review: KNOWLEDGE_REVIEW_STATUSES,
    researchRun: RESEARCH_RUN_STATUSES,
    extraction: KNOWLEDGE_EXTRACTION_STATUSES,
    index: KNOWLEDGE_INDEX_STATUSES,
  }

  it('only names states from its own declared set', () => {
    for (const [name, api] of Object.entries(KNOWLEDGE_TRANSITION_MACHINES)) {
      const states = stateSets[name]
      expect(states).toBeDefined()
      for (const rule of api.machine.rules) {
        expect(states).toContain(rule.from)
        expect(states).toContain(rule.to)
      }
    }
  })

  it('declares no self-edges', () => {
    for (const api of Object.values(KNOWLEDGE_TRANSITION_MACHINES)) {
      for (const rule of api.machine.rules) {
        expect(rule.from).not.toBe(rule.to)
      }
    }
  })

  it('declares no duplicate edges', () => {
    for (const api of Object.values(KNOWLEDGE_TRANSITION_MACHINES)) {
      const seen = api.machine.rules.map((r) => `${r.from}->${r.to}`)
      expect(new Set(seen).size).toBe(seen.length)
    }
  })

  it('refuses every state pair it has not declared', () => {
    for (const [name, api] of Object.entries(KNOWLEDGE_TRANSITION_MACHINES)) {
      const declared = new Set(api.machine.rules.map((r) => `${r.from}->${r.to}`))
      for (const from of stateSets[name]) {
        for (const to of stateSets[name]) {
          const expected = declared.has(`${from}->${to}`)
          expect(api.can(from, to)).toBe(expected)
        }
      }
    }
  })
})
