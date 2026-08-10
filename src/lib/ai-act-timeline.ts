/**
 * AI Act application dates and penalty ceilings, as amended by the Digital
 * Omnibus on AI — Regulation (EU) 2026/1744, OJ 24 July 2026, in force
 * 27 July 2026.
 *
 * Held as data rather than prose so the checker, the markdown export and (from
 * Stage 1) the versioned rule pack all read the same figures. Every entry here
 * is a legal claim: change one only against the consolidated text, and update
 * RULE_VERSION in ai-act-rules.ts when you do.
 *
 * Verified 10 August 2026 against EUR-Lex consolidated text
 * CELEX 02024R1689-20260727.
 */

export const OMNIBUS_CITATION =
  'Regulation (EU) 2026/1744 (Digital Omnibus on AI), OJ 24 July 2026, in force 27 July 2026'

export interface TimelineEntry {
  date: string
  label: string
  detail: string
  status: 'in-force' | 'upcoming'
}

export const AI_ACT_TIMELINE: TimelineEntry[] = [
  {
    date: '2 February 2025',
    label: 'Prohibited practices and AI literacy',
    detail: 'The eight original Article 5(1) prohibitions, and the Article 4 AI literacy duty.',
    status: 'in-force',
  },
  {
    date: '2 August 2025',
    label: 'GPAI obligations and governance',
    detail: 'General-purpose AI model duties and the governance architecture.',
    status: 'in-force',
  },
  {
    date: '2 August 2026',
    label: 'Article 50 transparency, GPAI enforcement, and penalties',
    detail: 'These are in force now. The Omnibus did not move them.',
    status: 'in-force',
  },
  {
    date: '2 December 2026',
    label: 'New prohibitions, and machine-readable marking',
    detail:
      'Article 5(1)(ba) and (bb) — non-consensual intimate imagery and CSAM generation — begin to apply. Article 50(2) machine-readable marking reaches the end of its transition for systems placed on the market before 2 August 2026.',
    status: 'upcoming',
  },
  {
    date: '2 August 2027',
    label: 'National regulatory sandboxes operational',
    detail: 'Article 57(1). Extended by the Omnibus from the original 2 August 2026.',
    status: 'upcoming',
  },
  {
    date: '2 December 2027',
    label: 'Standalone high-risk systems',
    detail: `Annex III obligations under Article 6(2), deferred by ${OMNIBUS_CITATION}.`,
    status: 'upcoming',
  },
  {
    date: '2 August 2028',
    label: 'Embedded product-safety high-risk systems',
    detail: `Annex I obligations under Article 6(1), deferred by ${OMNIBUS_CITATION}.`,
    status: 'upcoming',
  },
  {
    date: '2 August 2030',
    label: 'Legacy high-risk systems used by public authorities',
    detail: 'Systems already placed on the market before the high-risk dates, intended for use by public authorities.',
    status: 'upcoming',
  },
]

export interface PenaltyTier {
  infringement: string
  ceiling: string
  basis: string
}

/**
 * Ceilings are "whichever is HIGHER" of the fixed amount and the percentage of
 * total worldwide annual turnover — except for SMEs and SMCs, which take the
 * lower. There is no 1.5% band anywhere in the Regulation.
 */
export const PENALTY_TIERS: PenaltyTier[] = [
  {
    infringement: 'Article 5 prohibited practices',
    ceiling: '€35M or 7% of total worldwide annual turnover, whichever is higher',
    basis: 'Article 99(3)',
  },
  {
    infringement: 'Operator and notified-body duties other than Article 5 — including Article 50 transparency',
    ceiling: '€15M or 3%, whichever is higher',
    basis: 'Article 99(4), point (g) covers Article 50',
  },
  {
    infringement: 'Supplying incorrect, incomplete, or misleading information to notified bodies or competent authorities',
    ceiling: '€7.5M or 1%, whichever is higher',
    basis: 'Article 99(5)',
  },
  {
    infringement: 'General-purpose AI model providers',
    ceiling: '€15M or 3%, whichever is higher',
    basis: 'Article 101(1)',
  },
  {
    infringement: 'SMEs, including start-ups',
    ceiling: 'the lower of the percentage or the fixed amount, across paragraphs 3, 4 and 5',
    basis: 'Article 99(6)',
  },
  {
    infringement: 'Small mid-cap enterprises (SMCs)',
    ceiling: 'the lower of the two, for paragraphs 4 and 5 only — not Article 5 fines',
    basis: 'Article 99(6a)',
  },
]
