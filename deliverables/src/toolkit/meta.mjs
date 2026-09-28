/**
 * Edition metadata shared by every file in the toolkit bundle, so the handbook,
 * workbook and templates cannot disagree about which edition they belong to.
 *
 * `REGULATORY_REVIEWED` is the date the legal content was last checked against
 * primary sources. It is NOT refreshed by a packaging change — move it only
 * when the references, classifications and deadlines have actually been
 * re-verified (docs/ai-act-compliance-toolkit.md).
 */
export const TOOLKIT_EDITION = 'Edition 1'
export const REGULATORY_REVIEWED = '26 June 2026'
export const PUBLISHER = 'Silicon and Stone'
export const DISCLAIMER =
  'An operational aid for internal governance and evidence gathering, not legal advice. Use qualified legal counsel for decisions requiring legal advice.'
