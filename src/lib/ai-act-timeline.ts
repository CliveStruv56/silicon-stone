import {
  RULE_PACK,
  type PackPenaltyTier,
  type PackTimelineEntry,
  type RulePack,
} from './rulepack'

/**
 * AI Act application dates and penalty ceilings, read from the pinned rule pack
 * (see src/lib/rulepack). Every figure here is a legal claim traceable to the
 * consolidated text at CELEX 02024R1689-20260727, and each carries the
 * provision it comes from in `basis` so a reader can check it rather than
 * trust it.
 *
 * Correcting a date is a data edit in rulepack/versions/<version>/, never an
 * edit here — that is the whole point of the pack.
 */

export type TimelineEntry = PackTimelineEntry
export type PenaltyTier = PackPenaltyTier

export const OMNIBUS_CITATION =
  'Regulation (EU) 2026/1744 (Digital Omnibus on AI), OJ 24 July 2026, in force 27 July 2026'

/** Pure accessors, so tests can feed a different pack and prove the data drives the output. */
export function timelineFrom(pack: RulePack): TimelineEntry[] {
  return pack.timeline
}

export function penaltiesFrom(pack: RulePack): PenaltyTier[] {
  return pack.penalties
}

export const AI_ACT_TIMELINE: TimelineEntry[] = timelineFrom(RULE_PACK)
export const PENALTY_TIERS: PenaltyTier[] = penaltiesFrom(RULE_PACK)

/** Stamped on generated artefacts alongside the rule-pack version. */
export const LEGAL_CORPUS_CUT_OFF = RULE_PACK.manifest.corpusCutOff
