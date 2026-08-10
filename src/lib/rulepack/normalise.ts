/**
 * Text normalisation for the legal corpus.
 *
 * EUR-Lex text is full of typography that defeats naive string matching:
 * non-breaking spaces inside "Article 6", curly apostrophes in "person’s",
 * soft hyphens, non-breaking hyphens, and runs of whitespace introduced by the
 * HTML-to-text conversion. A citation verifier that compares a model's quote
 * against the corpus without folding these will fail on essentially every
 * quote, and a 100% failure rate reads as a model problem rather than a
 * character-encoding one.
 *
 * Both sides of every comparison go through `normaliseLegalText`. The
 * `NORMALISATION_VERSION` is recorded in each rule pack's manifest, so a change
 * to this function is a change to what the stored hashes mean.
 */

export const NORMALISATION_VERSION = 'v1'

/**
 * Fold the typography that varies between a quoted passage and the corpus,
 * without altering wording. Case is preserved — legal text is quoted as
 * written, and lower-casing would hide a real mismatch.
 */
export function normaliseLegalText(input: string): string {
  return input
    .normalize('NFC')
    // Whitespace variants: non-breaking, narrow no-break, thin, zero-width.
    .replace(/[   ​﻿]/g, ' ')
    // Soft hyphen carries no meaning; non-breaking hyphen is a plain hyphen.
    .replace(/­/g, '')
    .replace(/‑/g, '-')
    // Quotes and dashes: fold the typographic forms onto their ASCII bases.
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    // Collapse all whitespace runs, including newlines, to single spaces so a
    // quote spanning a line break still matches.
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Whether `quote` appears verbatim in `corpus` once both are normalised.
 * Deliberately exact-substring: a fuzzy match would let a paraphrase through,
 * which is the failure this whole mechanism exists to prevent.
 */
export function corpusContainsQuote(corpus: string, quote: string): boolean {
  const needle = normaliseLegalText(quote)
  if (needle.length === 0) return false
  return normaliseLegalText(corpus).includes(needle)
}
