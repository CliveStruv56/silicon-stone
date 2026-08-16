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
  body?: unknown
  excerpt?: string
  stoneTruth?: string
  actionableInsights?: unknown
  citations?: unknown
  factCheck?: { status?: string; overallVerdict?: string }
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
  const verdict = doc.factCheck?.overallVerdict

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
  } else if (verdict === 'major-issues') {
    issues.push({
      id: 'fact-check-major-issues',
      severity: 'warning',
      title: 'The fact-check found major issues',
      detail:
        'At least one claim was contradicted by the evidence. Open the Fact Check ' +
        'panel, apply the suggested revisions, and re-run before publishing.',
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
        'primary sources wherever a claim rests on one.',
    })
  }

  return issues
}

export function hasBlocker(issues: PreflightIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'blocker')
}
