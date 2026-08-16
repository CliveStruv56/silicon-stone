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

/**
 * Terms that identify WHICH instrument a topic is about, keyed by corpus id.
 *
 * Why this exists: statutory prose is highly self-similar. "The provider shall
 * ensure that..." reads almost identically in the AI Act, the Cyber Resilience
 * Act and the Data Act, so cosine similarity alone is a poor instrument
 * discriminator — an AI Act query can surface CRA passages at a comparable
 * score, and the model then quotes the wrong instrument with a citation that
 * looks verified. Selection fixes what diversification cannot.
 *
 * Biased toward recall on purpose. Routing narrows a search; matching too many
 * instruments merely returns today's behaviour, whereas missing the right one
 * hides the very text the draft needed. Zero matches means "search everything",
 * never "search nothing".
 *
 * Keys MUST be corpus directory names under corpus/regulatory/ —
 * scripts/regulatory-index-checks.ts asserts that against listCorpusIds().
 */
export const INSTRUMENT_TERMS: Record<string, string[]> = {
  'eu-ai-act': [
    'ai act', 'artificial intelligence act', 'high-risk ai', 'ai office',
    'gpai', 'general-purpose ai', 'general purpose ai', 'ai system',
    'conformity assessment', 'digital omnibus',
  ],
  gdpr: [
    'gdpr', 'general data protection', 'data protection', 'personal data',
    'data subject', 'lawful basis', 'supervisory authority', 'data controller',
    'data processor', 'dpia', 'privacy notice', 'international transfer',
  ],
  'eu-chips-act': [
    'chips act', 'semiconductor', 'foundry', 'wafer', 'fabrication plant',
    'chip shortage', 'lithography', 'design capacit', 'first-of-a-kind facilit',
  ],
  'eu-data-act': [
    'data act', 'cloud switching', 'switching between data processing',
    'connected product', 'data holder', 'data sharing obligation',
    'business-to-government data', 'interoperability of data spaces',
  ],
  nis2: [
    'nis2', 'nis 2', 'network and information systems', 'essential entit',
    'important entit', 'incident reporting', 'cybersecurity risk management',
  ],
  'eu-cyber-resilience-act': [
    'cyber resilience', 'products with digital elements', 'vulnerability disclosure',
    'security update', 'ce marking', 'software bill of materials', 'sbom',
  ],
}

export interface GateResult {
  hit: boolean
  matched: string[]
  /**
   * Corpus ids the topic names or implies. Empty means "no instrument
   * identified" — callers should search every instrument, not none.
   */
  corpusIds: string[]
}

export function looksRegulatory(...fields: Array<string | undefined | null>): GateResult {
  const haystack = fields.filter(Boolean).join(' \n ').toLowerCase()
  if (!haystack.trim()) return { hit: false, matched: [], corpusIds: [] }

  const matched = REGULATORY_TERMS.filter((term) => haystack.includes(term))
  const corpusIds = Object.entries(INSTRUMENT_TERMS)
    .filter(([, terms]) => terms.some((term) => haystack.includes(term)))
    .map(([corpusId]) => corpusId)

  // Naming an instrument's subject matter is itself evidence the topic is
  // regulation-adjacent, even when no general legal word appears. "Cloud
  // switching charges and interoperability for data processing services" is
  // squarely Data Act Chapter VI, yet contains not one word from
  // REGULATORY_TERMS, and gated out entirely before this.
  //
  // Safe to be permissive here because the gate is not the last defence: the
  // 0.30 score floor in retrieve.ts drops everything when the corpus has
  // nothing relevant, so a false positive costs one embedding call rather than
  // an irrelevant statutory paragraph in the draft.
  return { hit: matched.length > 0 || corpusIds.length > 0, matched, corpusIds }
}

/** Exposed so a guard test can assert every routing key is a real corpus. */
export function routableCorpusIds(): string[] {
  return Object.keys(INSTRUMENT_TERMS)
}
