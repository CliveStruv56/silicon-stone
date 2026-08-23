/**
 * Pre-publish checks for an article, run by the Studio publish action.
 *
 * Two editorial obligations were documentation-only until now: resolve every
 * `[AUTHOR: …]` placeholder before publishing (docs/authoring-guide.md §4), and
 * read the fact-check before shipping. Both were stated in prose that the
 * publish button did not enforce, so the only thing standing between a
 * half-finished draft and the live site was the editor remembering. See
 * docs/editorial-assurance-findings.md §2 and §3.
 *
 * The split between blocker and warning is deliberate. A placeholder in the
 * body is never correct — it is the system's own marker for "a human still owes
 * this sentence a fact", and publishing one tells every reader the piece was
 * machine-drafted and not finished. Everything else is a judgement call an
 * editor is entitled to make (an opinion-led Pulse legitimately has no external
 * claims), so those confirm rather than block. A control the author routinely
 * has to fight is a control they learn to route around.
 *
 * No `server-only` import: this runs inside the Studio, which is a browser
 * bundle.
 */

import { liveVerdict, type VerdictClaim } from './fact-check-verdict'

export type PreflightSeverity = 'blocker' | 'warning'

export type PreflightIssue = {
  /** Stable key, for React lists and tests. */
  id: string
  severity: PreflightSeverity
  title: string
  detail: string
}

export type PreflightSpan = { text?: string }

export type PreflightBlock = {
  _type?: string
  _key?: string
  children?: PreflightSpan[]
}

export type PreflightDocument = {
  contentType?: string
  intelligenceTier?: string
  body?: unknown
  excerpt?: string
  stoneTruth?: string
  actionableInsights?: unknown
  citations?: unknown
  factCheck?: { status?: string; overallVerdict?: string; claims?: VerdictClaim[] | null }
  /** Rendered report from the quotation audit; see src/lib/quotation-audit.ts. */
  quotationAudit?: string
}

/**
 * Detection is on the OPENING token, not a balanced `[AUTHOR: … ]` pair.
 * An unclosed placeholder is still an unresolved one, and matching the pair
 * would let the worst-formed case through. This also matches the instruction
 * the authoring guide gives a human: "search the body for `[AUTHOR:`".
 */
const PLACEHOLDER_OPENING = /\[AUTHOR:/i

/** Captures enough of the placeholder to be recognisable in a dialog. */
const PLACEHOLDER_SNIPPET = /\[AUTHOR:[^\]]{0,160}\]?/gi

/** Formats whose claims are external and therefore ought to cite something. */
export const CITATION_EXPECTED_TYPES = new Set(['signal', 'deepdive', 'guide'])

/** Beyond this the dialog summarises rather than lists. */
export const MAX_LISTED_PLACEHOLDERS = 8

function blockText(block: PreflightBlock): string {
  if (!Array.isArray(block.children)) return ''
  // Joined per block before matching: a placeholder that picks up a mark part
  // way through ("[AUTHOR: confirm the **2027** figure]") is stored as three
  // sibling spans, and matching span by span would miss it.
  return block.children.map((child) => child?.text ?? '').join('')
}

export type PlaceholderHit = { field: string; snippet: string }

/**
 * Every field whose text reaches a reader. `voiceEditNotes` is deliberately
 * excluded: it is the editorial record that *lists* the outstanding
 * placeholders, so scanning it would block every article that has ever been
 * through the voice pass. `sourceMaterial` is excluded for the same reason —
 * it holds the unedited import, which is never published.
 */
export function findPlaceholders(doc: PreflightDocument): PlaceholderHit[] {
  const hits: PlaceholderHit[] = []

  const scan = (field: string, text: unknown) => {
    if (typeof text !== 'string' || !PLACEHOLDER_OPENING.test(text)) return
    for (const match of text.match(PLACEHOLDER_SNIPPET) ?? [text.trim()]) {
      hits.push({ field, snippet: match.trim() })
    }
  }

  if (Array.isArray(doc.body)) {
    for (const raw of doc.body as PreflightBlock[]) {
      if (!raw || raw._type !== 'block') continue
      scan('Body', blockText(raw))
    }
  }

  scan('Excerpt', doc.excerpt)
  scan('Stone Truth', doc.stoneTruth)

  if (Array.isArray(doc.actionableInsights)) {
    for (const insight of doc.actionableInsights) scan('Actionable insight', insight)
  }

  return hits
}

function citationCount(doc: PreflightDocument): number {
  return Array.isArray(doc.citations) ? doc.citations.length : 0
}

/**
 * Everything wrong with this draft, blockers first. An empty array means the
 * publish proceeds untouched — the guard must be invisible on a finished piece.
 */
export function preflightArticle(doc: PreflightDocument): PreflightIssue[] {
  const issues: PreflightIssue[] = []

  const placeholders = findPlaceholders(doc)
  if (placeholders.length > 0) {
    const listed = placeholders.slice(0, MAX_LISTED_PLACEHOLDERS)
    const remainder = placeholders.length - listed.length
    issues.push({
      id: 'author-placeholders',
      severity: 'blocker',
      title:
        placeholders.length === 1
          ? '1 unresolved [AUTHOR: …] placeholder'
          : `${placeholders.length} unresolved [AUTHOR: …] placeholders`,
      detail:
        listed.map((hit) => `${hit.field}: ${hit.snippet}`).join('\n') +
        (remainder > 0 ? `\n…and ${remainder} more.` : '') +
        '\n\nEach marks a specific only you can supply. Replace it with the real ' +
        'figure, name, date or observation — the Voice Edit Notes panel lists what ' +
        'each one needs.',
    })
  }

  const status = doc.factCheck?.status
  // Derived, not read: overallVerdict is frozen at the end of the run and does
  // not move when the editor applies a revision. See fact-check-verdict.ts.
  const live = liveVerdict(doc.factCheck ?? {})
  const verdict = live.verdict

  if (status !== 'completed') {
    issues.push({
      id: 'fact-check-missing',
      severity: 'warning',
      title:
        status === 'running'
          ? 'A fact-check is still running'
          : status === 'failed'
            ? 'The last fact-check failed'
            : 'No fact-check has been run',
      detail:
        'The "Run fact-check" action verifies each checkable claim against fresh ' +
        'searches of primary sources. It is advisory, and there are pieces that do ' +
        'not need it — but this one has not been checked.',
    })
  } else if (verdict === 'major-issues' && (!live.derived || live.outstanding > 0)) {
    issues.push({
      id: 'fact-check-major-issues',
      severity: 'warning',
      title: !live.derived
        ? 'The fact-check found major issues'
        : live.outstanding === 1
          ? 'The fact-check found major issues — 1 claim still to address'
          : `The fact-check found major issues — ${live.outstanding} claims still to address`,
      detail:
        'At least one claim was contradicted by the evidence. Open the Fact Check ' +
        'panel, apply the suggested revisions, and re-run before publishing.',
    })
  } else if (live.correctedInaccurate > 0) {
    // The case that used to fall between every branch. The verdict is no longer
    // major because the contradicted claim was applied, and `addressed` is false
    // because other claims are still outstanding — so nothing was said at all
    // about an article carrying an unverified correction to a factual error.
    // Deliberately louder than the stale-report warning and checked ahead of it:
    // this one implies staleness and adds why it matters.
    issues.push({
      id: 'fact-check-corrected-not-rechecked',
      severity: 'warning',
      title:
        live.correctedInaccurate === 1
          ? 'A contradicted claim was revised but not re-checked'
          : `${live.correctedInaccurate} contradicted claims were revised but not re-checked`,
      detail:
        'The evidence contradicted this claim, and the suggested revision has been ' +
        'inserted — but nothing has verified the new wording. An applied revision ' +
        'is a model’s proposal placed by hand, not a re-verified fact. Re-run the ' +
        'fact-check before publishing, or satisfy yourself the new sentence is right.',
    })
  } else if (live.addressed) {
    // Not adverse any more, but not confirmed either: the revisions were
    // inserted by hand and nothing has checked the new wording against
    // evidence. Saying nothing here would let a stale clean-looking report
    // stand in for one.
    issues.push({
      id: 'fact-check-stale',
      severity: 'warning',
      title: 'The fact-check predates your revisions',
      detail:
        `All ${live.applied} flagged claim${live.applied === 1 ? '' : 's'} have been addressed, ` +
        'but the report describes the article as it was before those edits. Nothing ' +
        'has verified the new wording. Re-run the fact-check to confirm it.',
    })
  }

  // A quotation the model could not have copied is the one error the drafting
  // prompt calls a retraction rather than a correction, so it is surfaced at
  // the moment of publication rather than left in a panel. Still a warning:
  // exact matching cannot always tell an elided quotation from an invented one.
  const unmatchedQuotations = (doc.quotationAudit?.match(/\[UNMATCHED\]/g) ?? []).length
  if (unmatchedQuotations > 0) {
    issues.push({
      id: 'unmatched-quotations',
      severity: 'warning',
      title:
        unmatchedQuotations === 1
          ? '1 statutory quotation is not in the source text'
          : `${unmatchedQuotations} statutory quotations are not in the source text`,
      detail:
        'These were string-matched against the verbatim legal text the drafting ' +
        'model was given, and were not found in it. Open the Quotation Audit ' +
        'panel and check each against the primary source. An invented Article ' +
        'number is a correction; an invented quotation is a retraction.',
    })
  }

  // Only the generated paths set a tier; nothing on the hand-made Studio path
  // does. /intelligence no longer hides an untiered article (it did until
  // 2026-08-21, which published one straight into invisibility), but the piece
  // still carries no tier badge and cannot be reached by the tier filter. That
  // is an editorial choice an author is entitled to make on a one-off, so this
  // confirms rather than blocks — the schema keeps the field optional.
  if (!doc.intelligenceTier) {
    issues.push({
      id: 'no-intelligence-tier',
      severity: 'warning',
      title: 'No intelligence tier set',
      detail:
        'The article will be listed on /intelligence, but with no PULSE / BRIEFING / ' +
        'AUDIT badge, and the tier filter will not find it. Only Audit tier triggers ' +
        'a push notification on publish. Set the tier under Content unless you mean ' +
        'this piece to sit outside the tiers.',
    })
  }

  if (
    doc.contentType &&
    CITATION_EXPECTED_TYPES.has(doc.contentType) &&
    citationCount(doc) === 0
  ) {
    issues.push({
      id: 'no-citations',
      severity: 'warning',
      title: 'No sources listed',
      detail:
        'This piece has an empty Sources list, so the published article cites ' +
        'nothing and its structured data carries no citation. House style asks for ' +
        'primary sources wherever a claim rests on one.\n\n' +
        'If it came from /create, the research sources are already on the document: ' +
        'open the Sources field and press "Add from research", then delete the ones ' +
        'the piece does not actually rest on. The gathering is automatic; which ' +
        'sources a reader sees is not.',
    })
  }

  return issues
}

export function hasBlocker(issues: PreflightIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'blocker')
}
