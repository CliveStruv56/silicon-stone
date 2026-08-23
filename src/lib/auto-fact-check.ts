import type { DraftFormat } from './prompts'

/**
 * Which generated formats get a fact-check started for them automatically.
 *
 * Signal and Deep Dive, because three facts compound on them: they carry the
 * highest claim density; the Deep Dive is the only format the voice pass audits
 * rather than rewrites, so it already receives the least automatic scrutiny;
 * and until now the check ran only when an author remembered to press the
 * button. The format with the most claims had the least protection.
 *
 * Pulse, Guide and YouTube Script are excluded deliberately. A Pulse is 250–300
 * words built on one verified shift; a Guide explains a tool. Checking them
 * would spend Exa and model budget on pieces whose claim count barely reaches
 * the extraction floor, and a report that is nearly always empty is one nobody
 * reads.
 *
 * Type-only import, so this module is safe in a client component — the format
 * union is erased at build and nothing from prompts.ts reaches the browser.
 */
export const AUTO_FACT_CHECK_FORMATS: ReadonlySet<DraftFormat> = new Set<DraftFormat>([
  'signal',
  'deep_dive',
])

export function shouldAutoFactCheck(format: string): boolean {
  return AUTO_FACT_CHECK_FORMATS.has(format as DraftFormat)
}
