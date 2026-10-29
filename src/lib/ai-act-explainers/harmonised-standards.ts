import type { SourcedFact } from './types'

/**
 * The harmonised standards whose references have been published in the
 * Official Journal under Article 40 of the AI Act.
 *
 * This is the one place the explainers name a standard as giving a presumption
 * of conformity. It is outside the rule pack on purpose: the pack holds the
 * Regulation, and an implementing decision is a different instrument. It is a
 * list rather than a sentence because more will follow — the standardisation
 * request (Implementing Decision C(2025) 3871) asks for several — and each one
 * changes what the ISO/IEC 42001 crosswalk can truthfully say.
 *
 * Confirmed 2026-10-29 against the Official Journal text of Commission
 * Implementing Decision (EU) 2026/2274 (CELEX 32026D2274): its Annex lists
 * exactly one standard, EN 18286:2026, and recital 3 describes it as the
 * standard on quality management systems for providers of AI systems,
 * including post-market monitoring processes. ISO/IEC 42001 is not cited.
 *
 * When a new decision is published, add it here, re-read the crosswalk rows it
 * touches, and move `checkedAt`. Do not move `checkedAt` without re-reading.
 */
export const HARMONISED_STANDARDS: ReadonlyArray<SourcedFact & { reference: string; covers: string }> = [
  {
    reference: 'EN 18286:2026',
    covers: 'quality management systems for providers of high-risk AI systems, including post-market monitoring processes',
    statement:
      'The reference of EN 18286:2026, Artificial intelligence – Quality management system for EU AI Act regulatory purposes, was published in the Official Journal as the first harmonised standard for high-risk AI systems.',
    date: '14 October 2026',
    sourceLabel: 'Commission Implementing Decision (EU) 2026/2274',
    sourceUrl: 'https://eur-lex.europa.eu/eli/dec_impl/2026/2274/oj',
    checkedAt: '2026-10-29',
  },
]
