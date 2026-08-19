import manifest2026_08_10 from '../../../rulepack/versions/2026-08-10/manifest.json'
import sources2026_08_10 from '../../../rulepack/versions/2026-08-10/sources.json'
import timeline2026_08_10 from '../../../rulepack/versions/2026-08-10/timeline.json'
import penalties2026_08_10 from '../../../rulepack/versions/2026-08-10/penalties.json'
import rules2026_08_10 from '../../../rulepack/versions/2026-08-10/rules.json'
import manifest2026_08_18 from '../../../rulepack/versions/2026-08-18/manifest.json'
import sources2026_08_18 from '../../../rulepack/versions/2026-08-18/sources.json'
import timeline2026_08_18 from '../../../rulepack/versions/2026-08-18/timeline.json'
import penalties2026_08_18 from '../../../rulepack/versions/2026-08-18/penalties.json'
import rules2026_08_18 from '../../../rulepack/versions/2026-08-18/rules.json'
import manifest2026_08_19 from '../../../rulepack/versions/2026-08-19/manifest.json'
import sources2026_08_19 from '../../../rulepack/versions/2026-08-19/sources.json'
import timeline2026_08_19 from '../../../rulepack/versions/2026-08-19/timeline.json'
import penalties2026_08_19 from '../../../rulepack/versions/2026-08-19/penalties.json'
import rules2026_08_19 from '../../../rulepack/versions/2026-08-19/rules.json'
import manifest2026_08_19b from '../../../rulepack/versions/2026-08-19b/manifest.json'
import sources2026_08_19b from '../../../rulepack/versions/2026-08-19b/sources.json'
import timeline2026_08_19b from '../../../rulepack/versions/2026-08-19b/timeline.json'
import penalties2026_08_19b from '../../../rulepack/versions/2026-08-19b/penalties.json'
import rules2026_08_19b from '../../../rulepack/versions/2026-08-19b/rules.json'

/**
 * The versioned rule pack: the legal payload behind the AI Act triage engine,
 * held as data so a regulatory change is a data edit rather than a code change.
 *
 * What lives here: application dates, penalty ceilings, Article anchors, source
 * citations, and the verbatim corpus. What does NOT: the trigger predicates.
 * Encoding "fires when an Annex III domain is present and profiling is
 * performed" as JSON would need a condition language plus an interpreter —
 * untyped, untestable by the compiler, and deciding legal classifications. The
 * ten-week lag this pack exists to close is a lag in dates and wording, not in
 * logic shapes, so the predicates stay as TypeScript in ai-act-rules.ts.
 *
 * The corpus is deliberately absent from this module: it is ~70KB of statute
 * that only the server-side citation verifier needs, and bundling it would ship
 * the whole Regulation to every browser. See ./corpus.ts.
 */

export interface PackSource {
  label: string
  article: string
  publisher: string
  url: string
}

export interface PackTimelineEntry {
  date: string
  label: string
  detail: string
  status: 'in-force' | 'upcoming'
  /** The provision the date comes from, so a reader can check it. */
  basis: string
}

export interface PackPenaltyTier {
  infringement: string
  ceiling: string
  basis: string
}

export interface PackProhibitedPractice {
  point: string
  summary: string
  source: string
  appliesFrom: string
  futureDated?: boolean
}

export interface PackRuleAnchor {
  source: string
  /** Overrides the source's default article label where a rule is narrower. */
  article?: string
}

export interface PackManifest {
  version: string
  lastReviewed: string
  /** The date the consolidated text was current to. Stamped on generated output. */
  corpusCutOff: string
  normalisation: string
  provenance: {
    instrument: string
    celex: string
    url: string
    retrieved: string
    note: string
  }
  changelog: string
  /** Article number → sha256 of the normalised corpus file. */
  corpus: Record<string, string>
}

export interface RulePack {
  manifest: PackManifest
  sources: Record<string, PackSource>
  timeline: PackTimelineEntry[]
  penalties: PackPenaltyTier[]
  prohibitedPractices: PackProhibitedPractice[]
  ruleAnchors: Record<string, PackRuleAnchor>
}

/**
 * Every pack the build knows about. Adding a version means adding an import —
 * the JSON has to be bundled, because the engine runs in the browser. Choosing
 * between them does not: that is the env var below.
 */
const PACKS: Record<string, RulePack> = {
  '2026-08-10': {
    manifest: manifest2026_08_10 as PackManifest,
    sources: sources2026_08_10 as Record<string, PackSource>,
    timeline: timeline2026_08_10 as PackTimelineEntry[],
    penalties: penalties2026_08_10 as PackPenaltyTier[],
    prohibitedPractices: rules2026_08_10.prohibitedPractices as PackProhibitedPractice[],
    ruleAnchors: rules2026_08_10.ruleAnchors as Record<string, PackRuleAnchor>,
  },
  /**
   * Adds Annex III to the corpus and changes nothing else — the four data files
   * and the nineteen Article texts are byte-identical to 2026-08-10, which their
   * hashes in both manifests show rather than assert. The version moved because
   * the pack changed; that is the rule, and it holds even when the change is
   * additive.
   */
  '2026-08-18': {
    manifest: manifest2026_08_18 as PackManifest,
    sources: sources2026_08_18 as Record<string, PackSource>,
    timeline: timeline2026_08_18 as PackTimelineEntry[],
    penalties: penalties2026_08_18 as PackPenaltyTier[],
    prohibitedPractices: rules2026_08_18.prohibitedPractices as PackProhibitedPractice[],
    ruleAnchors: rules2026_08_18.ruleAnchors as Record<string, PackRuleAnchor>,
  },
  /**
   * Adds Articles 10, 14, 15, 16 and 43 to the corpus — the rest of the
   * high-risk provider's Chapter III Section 2 duties, plus the conformity
   * assessment that decides which procedure they are assessed under. The four
   * data files and the twenty carried-over corpus files are byte-identical to
   * 2026-08-18; the same CELEX consolidation, just more of it read out of it,
   * which is why `corpusCutOff` does not move.
   */
  '2026-08-19': {
    manifest: manifest2026_08_19 as PackManifest,
    sources: sources2026_08_19 as Record<string, PackSource>,
    timeline: timeline2026_08_19 as PackTimelineEntry[],
    penalties: penalties2026_08_19 as PackPenaltyTier[],
    prohibitedPractices: rules2026_08_19.prohibitedPractices as PackProhibitedPractice[],
    ruleAnchors: rules2026_08_19.ruleAnchors as Record<string, PackRuleAnchor>,
  },
  /**
   * Adds Articles 4, 27 and 86 to the corpus, closing the last gap the deployer
   * path admitted to in prose. The three are unlike the 2026-08-19 batch in one
   * way worth knowing: they are not all deferred. Article 4 sits in Chapter I
   * and has applied since 2 February 2025; Article 86 sits in Chapter IX, which
   * Article 113 does not carve out, so it has applied since 2 August 2026. Only
   * Article 27 waits with the rest of Chapter III Section 3.
   *
   * The version is suffixed rather than dated forward because both packs were
   * cut on 2026-08-19 and a version string that claimed 2026-08-20 would be a
   * false date on a legal artefact. Keys sort lexicographically, so "b" orders
   * after its parent.
   *
   * The four data files and the twenty-five carried-over corpus files are
   * byte-identical to 2026-08-19; same CELEX consolidation, so `corpusCutOff`
   * does not move and the regulatory lane needs no re-verification.
   */
  '2026-08-19b': {
    manifest: manifest2026_08_19b as PackManifest,
    sources: sources2026_08_19b as Record<string, PackSource>,
    timeline: timeline2026_08_19b as PackTimelineEntry[],
    penalties: penalties2026_08_19b as PackPenaltyTier[],
    prohibitedPractices: rules2026_08_19b.prohibitedPractices as PackProhibitedPractice[],
    ruleAnchors: rules2026_08_19b.ruleAnchors as Record<string, PackRuleAnchor>,
  },
}

export const AVAILABLE_RULE_PACK_VERSIONS = Object.keys(PACKS).sort()

/** The version served when nothing is pinned. Never "latest" — see below. */
const DEFAULT_RULE_PACK_VERSION = '2026-08-19b'

/**
 * The pinned version. Deliberately an explicit version string, never a
 * "latest" pointer: a rule pack decides what the law is said to be, and that
 * must change when someone decides it changes, not when a file lands.
 */
export const PINNED_RULE_PACK_VERSION =
  process.env.NEXT_PUBLIC_RULEPACK_VERSION || DEFAULT_RULE_PACK_VERSION

/**
 * Resolve a pack by version. Throws on an unknown version rather than falling
 * back — silently serving a different vintage of the law than the one pinned is
 * the worst available outcome, and a build-time failure is cheap by comparison.
 */
export function getRulePack(version: string = PINNED_RULE_PACK_VERSION): RulePack {
  const pack = PACKS[version]
  if (!pack) {
    throw new Error(
      `Unknown rule pack version "${version}". Available: ${AVAILABLE_RULE_PACK_VERSIONS.join(', ')}`,
    )
  }
  return pack
}

/** The pinned pack, resolved once. */
export const RULE_PACK = getRulePack()
