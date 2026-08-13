/**
 * Decide whether a draft is regulation-adjacent at all.
 *
 * Deterministic on purpose. A model call here would add 5-15s and a new failure
 * mode for close to nothing, and the cost of being wrong is asymmetric: a false
 * negative just returns today's behaviour, while a false positive drops a
 * statutory paragraph into a piece that is not about regulation — which is not
 * neutral, because the drafting model will find a way to use whatever it is
 * handed. The list is therefore biased toward recall but still requires the
 * topic to actually mention law.
 */

/** Lowercased substrings. Stems ('obligat', 'penalt') catch inflections. */
const REGULATORY_TERMS = [
  // Named instruments
  'ai act', 'gdpr', 'chips act', 'data act', 'digital services act',
  'digital markets act', 'dsa', 'dma', 'nis2', 'cyber resilience',
  'digital omnibus', 'general data protection',
  // Legal-instrument vocabulary
  'regulation', 'directive', 'legisl', 'statut', 'article ', 'annex ',
  'recital', 'clause', 'provision',
  // Compliance vocabulary
  'complian', 'conformity', 'notified body', 'obligat', 'requirement',
  'high-risk', 'prohibited', 'enforcement', 'penalt', 'fine', 'sanction',
  'liabilit', 'audit', 'certif', 'accredit',
  // Data protection
  'data protection', 'lawful basis', 'supervisory authority', 'privacy',
  'personal data', 'data subject',
  // Trade and industrial policy
  'export control', 'entity list', 'subsid', 'state aid', 'tariff',
  'sanctions regime', 'guardrail',
  // Regulators
  'regulator', 'commission', 'ec ruling', 'bis ', 'ai office',
]

export interface GateResult {
  hit: boolean
  matched: string[]
}

export function looksRegulatory(...fields: Array<string | undefined | null>): GateResult {
  const haystack = fields.filter(Boolean).join(' \n ').toLowerCase()
  if (!haystack.trim()) return { hit: false, matched: [] }

  const matched = REGULATORY_TERMS.filter((term) => haystack.includes(term))
  return { hit: matched.length > 0, matched }
}
