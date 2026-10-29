/**
 * Shared shapes for the reader-facing AI Act explainers: the FAQ at
 * /tools/compliance-checker/faq and the ISO/IEC 42001 crosswalk at
 * /tools/compliance-checker/iso-42001.
 *
 * Both are authored explanation — the same class of content as a finding's
 * `practicalMeaning` — and both quote statute. The rule they share is the
 * Compliance Checker's: no legal quotation reaches a screen unverified. A
 * `StatuteCitation` is therefore only ever a contiguous, verbatim run of the
 * pinned rule pack's corpus; `explainers.test.ts` string-matches every one, and
 * the pages check again at render and show a note in place of any quote that
 * fails.
 */

export interface StatuteCitation {
  /**
   * A key of `RULE_PACK.manifest.corpus` — the bare number ('2', '25') or an
   * annex key ('annex-iii'). The test asserts it exists, so the provision link
   * beside the quote can never 404.
   */
  corpusArticle: string
  /** How the citation reads on screen: "Article 2(1)(c)". */
  locator: string
  /**
   * A contiguous, verbatim run of the consolidated text. No ellipses, no
   * joining of non-adjacent sentences, no tidied punctuation. If a passage
   * needs cutting to be quotable, quote the shorter part.
   */
  quote: string
}

/**
 * A dated fact that comes from outside the pinned pack — an Official Journal
 * publication, for instance — and so cannot be corpus-verified.
 *
 * It carries its own source and the date somebody last checked it, and it is
 * rendered with both, so a reader can tell a claim the pack guarantees from one
 * this project looked up. A fact like this goes stale silently; `checkedAt` is
 * what makes that visible.
 */
export interface SourcedFact {
  /** The fact as one plain-text sentence. */
  statement: string
  /** Display date of the event the fact reports, e.g. "14 October 2026". */
  date: string
  sourceLabel: string
  sourceUrl: string
  /** ISO date this project last confirmed the fact against the source. */
  checkedAt: string
}
