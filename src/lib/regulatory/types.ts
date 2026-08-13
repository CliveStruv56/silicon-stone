/**
 * Types for the regulatory retrieval corpus.
 *
 * EDITORIAL LANE ONLY. This corpus gives the drafting model at /create primary
 * statutory text to quote and cite. It is NEVER an authority for anything the
 * Compliance Checker renders on screen — that remains the pinned rule pack under
 * rulepack/versions/. See CLAUDE.md and scripts/regulatory-index-checks.ts, which
 * fails the build if the two lanes are ever wired together.
 */

/** What a chunk claims about itself. Deliberately self-describing at record level. */
export type RegulatoryAuthority = 'editorial-only'

export type ProvisionUnit = 'article' | 'annex'

/** How much of the instrument the corpus actually holds. */
export type CorpusCoverage = 'full' | 'partial'

/** Per-instrument provenance, committed alongside the text it describes. */
export interface InstrumentMeta {
  corpusId: string
  /** Short label used in citations, e.g. "EU AI Act". */
  shortName: string
  /** Full formal title including amending acts. */
  instrument: string
  jurisdiction: string
  /** CELEX id for EU instruments; "" for US law. */
  celex: string
  /** ELI permalink for EU instruments; "" otherwise. */
  eli: string
  /** Corpus directory name — the consolidation date for EU instruments. */
  version: string
  /** ISO date the consolidated text is current as at. */
  consolidatedAs: string
  /** Machine-readable URL the fetcher pulls. */
  sourceUrl: string
  /** Human-facing URL printed in citations. */
  citationUrl: string
  retrieved: string
  /** Selects the extractor/parser family. */
  parser: 'eurlex' | 'uslm'
  expectedArticles: number
  coverage: CorpusCoverage
  /** Required when coverage is 'partial' — what was left out and why. */
  excluded?: string
  /** Links to the paraphrased record in src/lib/policy-data.ts, if any. */
  relatedPolicyId?: string
  note?: string
}

/** One structural unit as parsed out of the source text, before chunking. */
export interface ParsedProvision {
  unit: ProvisionUnit
  /** "6", "4a", "III" (annexes use roman numerals). */
  number: string
  /** Article rubric / annex title. May be "". */
  heading: string
  /** Paragraph number ("1", "2", "3a") or null for an article chapeau. */
  paragraph: string | null
  /** Body text, structure preserved (newline-separated blocks). */
  text: string
}

/**
 * Declared as a `type` alias, not an `interface`, deliberately: only type
 * aliases get TypeScript's implicit index signature, which is what makes this
 * assignable to Pinecone's `RecordMetadata`. The evidence lane does the same.
 * Every field is therefore a scalar — no arrays, no nested objects.
 */
export type RegulatoryChunkMetadata = {
  corpusId: string
  instrument: string
  shortName: string
  jurisdiction: string
  celex: string
  eli: string
  unit: ProvisionUnit
  /** Article or annex number this chunk belongs to. */
  articleNumber: string
  /** Paragraph number, or "" for a chapeau / merged block. */
  paragraph: string
  heading: string
  /** The exact string the model is told to print, e.g. "EU AI Act, Article 6(3)". */
  citation: string
  /** Stable structural path, e.g. "art:6:para:3" or "art:5:para:1:part:2". */
  locator: string
  /** Groups chunks of the same article at render time. */
  parentId: string
  url: string
  consolidatedAs: string
  corpusVersion: string
  coverage: CorpusCoverage
  contentHash: string
  /** Citation header + body — EXACTLY what was embedded. */
  text: string
  chars: number
  authority: RegulatoryAuthority
}

export interface RegulatoryChunkRecord {
  id: string
  metadata: RegulatoryChunkMetadata
}

export interface RegulatoryHit {
  id: string
  score: number
  metadata: RegulatoryChunkMetadata
}
