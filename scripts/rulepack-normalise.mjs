/**
 * The build-time mirror of `normaliseLegalText` in src/lib/rulepack/normalise.ts.
 *
 * WHY A SECOND COPY EXISTS. rulepack-check.mjs runs in `prebuild`, before any
 * TypeScript is compiled, so it cannot import from src/. The duplication is
 * therefore forced rather than careless — but it was previously unguarded: if
 * the two implementations drifted, the build gate and the runtime verifier
 * would compute different hashes for the same text, and the symptom (a citation
 * that verifies at build time and fails at runtime, or the reverse) appears
 * nowhere near the cause.
 *
 * `src/lib/rulepack/normalise.test.ts` now imports BOTH and asserts they agree
 * character for character, across a battery of typographic cases and every file
 * in the live corpus. See docs/editorial-assurance-findings.md §10.
 *
 * Extracted from rulepack-check.mjs into its own side-effect-free module so a
 * test can import it: the check script does its work at import time and would
 * otherwise call process.exit() inside the test run.
 *
 * The character classes hold literal glyphs, matching the TypeScript. Several
 * of them — soft hyphen, zero-width space, the BOM — are invisible in a diff,
 * so each class carries its code points in the comment beside it. Do not trust
 * the comment either: the equality test is what actually holds the two
 * implementations together.
 */

export const NORMALISATION_VERSION = 'v1'

export function normalise(input) {
  return (
    input
      .normalize('NFC')
      // Whitespace variants: no-break (00A0), narrow no-break (202F), thin
      // (2009), zero-width space (200B), zero-width no-break / BOM (FEFF).
      .replace(/[   ​﻿]/g, ' ')
      // Soft hyphen (00AD) carries no meaning; non-breaking hyphen (2011) is a
      // plain hyphen.
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
  )
}
