/**
 * State-transition guards for the knowledge lane.
 *
 * Pure and unwired on purpose. Nothing in this file reads a request, a client
 * or an environment variable; a route or migration decides *that* a transition
 * should happen, and asks here whether it *may*.
 *
 * Two rules shape every table below.
 *
 *  - **A terminal state does not drift back into an active one.** `rejected`,
 *    `superseded` and `completed` are verdicts. Where returning is legitimate
 *    it is one named transition with `repair: true`, not a general allowance —
 *    so "how does a rejected record come back?" has exactly one answer, and it
 *    is greppable.
 *  - **Staying put is not a transition.** `from === to` is refused rather than
 *    quietly allowed, because a no-op that reports success hides the caller's
 *    confusion about what state it was already in.
 */

import {
  KNOWLEDGE_EXTRACTION_STATUSES,
  KNOWLEDGE_INDEX_STATUSES,
  KNOWLEDGE_REVIEW_STATUSES,
  RESEARCH_RUN_STATUSES,
  type KnowledgeExtractionStatus,
  type KnowledgeIndexStatus,
  type KnowledgeReviewStatus,
  type ResearchRunStatus,
} from './types'

/** One permitted edge. `repair` marks a deliberate return from a terminal or
 * failed state — the exception the rule above allows, labelled as one. */
export interface TransitionRule<S extends string> {
  from: S
  to: S
  repair?: boolean
  /** Why this edge exists, shown in the refusal message for its neighbours. */
  note?: string
}

export interface TransitionResult<S extends string> {
  allowed: boolean
  /** True when the edge is a labelled repair/retry rather than normal progress. */
  repair: boolean
  reason?: string
  from: S
  to: S
}

export class KnowledgeTransitionError extends Error {
  readonly machine: string
  readonly from: string
  readonly to: string

  constructor(machine: string, from: string, to: string, reason: string) {
    super(`${machine}: ${reason}`)
    this.name = 'KnowledgeTransitionError'
    this.machine = machine
    this.from = from
    this.to = to
  }
}

/** A machine is a named state set plus the edges between its members. */
export interface TransitionMachine<S extends string> {
  name: string
  states: readonly S[]
  rules: readonly TransitionRule<S>[]
}

function evaluate<S extends string>(
  machine: TransitionMachine<S>,
  from: unknown,
  to: unknown,
): TransitionResult<S> {
  const states = machine.states as readonly string[]

  if (typeof from !== 'string' || !states.includes(from)) {
    return {
      allowed: false,
      repair: false,
      reason: `unknown source state: ${String(from)}`,
      from: from as S,
      to: to as S,
    }
  }
  if (typeof to !== 'string' || !states.includes(to)) {
    return {
      allowed: false,
      repair: false,
      reason: `unknown target state: ${String(to)}`,
      from: from as S,
      to: to as S,
    }
  }
  if (from === to) {
    return {
      allowed: false,
      repair: false,
      reason: `already in ${from}; a no-op is not a transition`,
      from: from as S,
      to: to as S,
    }
  }

  const rule = machine.rules.find((r) => r.from === from && r.to === to)
  if (!rule) {
    return {
      allowed: false,
      repair: false,
      reason: `${from} → ${to} is not an allowed transition`,
      from: from as S,
      to: to as S,
    }
  }

  return { allowed: true, repair: rule.repair === true, from: from as S, to: to as S }
}

function machineApi<S extends string>(machine: TransitionMachine<S>) {
  return {
    machine,
    check: (from: unknown, to: unknown): TransitionResult<S> =>
      evaluate(machine, from, to),
    can: (from: unknown, to: unknown): boolean => evaluate(machine, from, to).allowed,
    /** Throws `KnowledgeTransitionError` rather than returning false, for the
     * call sites where a refused transition is a bug and not a branch. */
    assert: (from: unknown, to: unknown): TransitionResult<S> => {
      const result = evaluate(machine, from, to)
      if (!result.allowed) {
        throw new KnowledgeTransitionError(
          machine.name,
          String(from),
          String(to),
          result.reason ?? 'transition refused',
        )
      }
      return result
    },
    /** Every state reachable from `from`, for building a UI's action list. */
    nextStates: (from: unknown): S[] =>
      machine.rules.filter((r) => r.from === from).map((r) => r.to),
  }
}

/* ------------------------------------------------------------------ *
 * Editorial review — knowledgeItem and knowledgeSource
 * ------------------------------------------------------------------ */

/**
 * `inbox` is the entry state and the only one capture may write.
 *
 * `ready → inbox` is ordinary, not a repair: pulling an approved record back
 * for another look is normal editorial work, and `ready` is not terminal.
 * `rejected → inbox` *is* a repair — it reverses a verdict, so it is labelled.
 * `superseded` has no way out at all: the record that replaced it is the live
 * one, and un-superseding would leave two records claiming the same ground.
 */
const reviewMachine: TransitionMachine<KnowledgeReviewStatus> = {
  name: 'knowledge review',
  states: KNOWLEDGE_REVIEW_STATUSES,
  rules: [
    { from: 'inbox', to: 'ready', note: 'reviewed and approved' },
    { from: 'inbox', to: 'rejected', note: 'reviewed and declined' },
    { from: 'inbox', to: 'superseded', note: 'replaced before it was reviewed' },
    { from: 'ready', to: 'inbox', note: 'returned for another look' },
    { from: 'ready', to: 'rejected', note: 'approval withdrawn' },
    { from: 'ready', to: 'superseded', note: 'replaced by a newer record' },
    { from: 'rejected', to: 'inbox', repair: true, note: 'rejection reversed' },
  ],
}

export const reviewTransitions = machineApi(reviewMachine)

/* ------------------------------------------------------------------ *
 * Research runs
 * ------------------------------------------------------------------ */

/**
 * `completed` is terminal with no exceptions: a finished investigation is a
 * historical fact, and re-running it produces a *new* run carrying `retryOf`.
 *
 * `failed → queued` and `cancelled → queued` exist because an operator
 * restarting a job in place is the common case and forcing a new document for
 * it would scatter one investigation across several records. Both are labelled
 * repairs.
 */
const researchRunMachine: TransitionMachine<ResearchRunStatus> = {
  name: 'research run',
  states: RESEARCH_RUN_STATUSES,
  rules: [
    { from: 'queued', to: 'running' },
    { from: 'queued', to: 'failed' },
    { from: 'queued', to: 'cancelled' },
    { from: 'running', to: 'completed' },
    { from: 'running', to: 'failed' },
    { from: 'running', to: 'cancelled' },
    { from: 'failed', to: 'queued', repair: true, note: 'retried in place' },
    { from: 'cancelled', to: 'queued', repair: true, note: 'restarted in place' },
  ],
}

export const researchRunTransitions = machineApi(researchRunMachine)

/* ------------------------------------------------------------------ *
 * Extraction
 * ------------------------------------------------------------------ */

/**
 * `not_required → queued` is allowed because the judgement can turn out wrong:
 * a note captured as plain text may later gain a URL worth fetching.
 *
 * `succeeded → queued` is a repair, and the reason it exists is method
 * versioning — a better extractor is a legitimate cause to re-run one that
 * already worked. It does not fire on its own; something has to ask.
 */
const extractionMachine: TransitionMachine<KnowledgeExtractionStatus> = {
  name: 'extraction',
  states: KNOWLEDGE_EXTRACTION_STATUSES,
  rules: [
    { from: 'not_required', to: 'queued', note: 'extraction turned out to be needed' },
    { from: 'queued', to: 'processing' },
    { from: 'queued', to: 'failed' },
    { from: 'queued', to: 'not_required', note: 'no longer anything to extract' },
    { from: 'processing', to: 'succeeded' },
    { from: 'processing', to: 'failed' },
    { from: 'failed', to: 'queued', repair: true, note: 'retried' },
    { from: 'succeeded', to: 'queued', repair: true, note: 're-extracted, e.g. a newer method' },
  ],
}

export const extractionTransitions = machineApi(extractionMachine)

/* ------------------------------------------------------------------ *
 * Indexing
 * ------------------------------------------------------------------ */

/**
 * Every state can fall back to `not_eligible`, because eligibility is derived
 * from review status and a record can lose it — a `ready` source returned to
 * `inbox` must be able to leave the index. That is a withdrawal, not a repair.
 *
 * `indexed → pending` is how content drift is expressed: the canonical hash
 * moved, so what is in the index is stale.
 */
const indexMachine: TransitionMachine<KnowledgeIndexStatus> = {
  name: 'index',
  states: KNOWLEDGE_INDEX_STATUSES,
  rules: [
    { from: 'not_eligible', to: 'pending', note: 'became eligible' },
    { from: 'pending', to: 'indexed' },
    { from: 'pending', to: 'error' },
    { from: 'pending', to: 'not_eligible', note: 'eligibility withdrawn' },
    { from: 'indexed', to: 'pending', note: 'content changed; index is stale' },
    { from: 'indexed', to: 'error', note: 'reconciliation found a problem' },
    { from: 'indexed', to: 'not_eligible', note: 'eligibility withdrawn' },
    { from: 'error', to: 'pending', repair: true, note: 'retried' },
    { from: 'error', to: 'not_eligible', note: 'eligibility withdrawn' },
  ],
}

export const indexTransitions = machineApi(indexMachine)

/** Every machine, keyed by name, for tests and diagnostics. */
export const KNOWLEDGE_TRANSITION_MACHINES = {
  review: reviewTransitions,
  researchRun: researchRunTransitions,
  extraction: extractionTransitions,
  index: indexTransitions,
} as const
