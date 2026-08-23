/**
 * The fact-check's document-level verdict, and how applying a revision changes
 * it.
 *
 * `factCheck.overallVerdict` is written once, when the run completes, and
 * nothing has updated it since. Applying a suggested revision from the Fact
 * Check panel sets `claims[…].applied` and patches the body — it does not
 * recompute the verdict. So an editor who worked through every flagged claim
 * still saw the badge reading "Fact-check: major issues", with no way to clear
 * it short of paying for another run. Reported from real use, 21 August 2026.
 *
 * The fix is to derive the verdict at read time from the claims that are still
 * outstanding, rather than trusting a value frozen at the end of the run.
 *
 * **An applied revision is not a re-verified claim.** The revision is the
 * model's suggestion, inserted by a human; nothing has checked the new sentence
 * against evidence. So a document whose claims have all been addressed reports
 * `addressed`, never `clean` — the distinction is the whole honesty of the
 * badge, and only a fresh run may return `clean`.
 *
 * No `server-only` import: the badge and the publish dialog are browser
 * bundles, and this is the module that stops them drifting from the pipeline
 * that writes the field.
 */

export type FactCheckVerdict = 'clean' | 'minor-issues' | 'major-issues' | 'unverifiable'

export type VerdictClaim = { verdict?: string; applied?: boolean }

/** Verdicts that represent something for the editor to act on. */
const ISSUE_VERDICTS = new Set(['inaccurate', 'outdated', 'needs-context'])

/** Precedence, in one place: the pipeline and the badge must agree. */
export function verdictFor(claims: VerdictClaim[]): FactCheckVerdict {
  if (claims.some((c) => c.verdict === 'inaccurate')) return 'major-issues'
  if (claims.some((c) => c.verdict === 'outdated' || c.verdict === 'needs-context')) {
    return 'minor-issues'
  }
  const unverifiable = claims.filter((c) => c.verdict === 'unverifiable').length
  if (claims.length > 0 && unverifiable > claims.length / 2) return 'unverifiable'
  return 'clean'
}

export type LiveVerdict = {
  /** Recomputed over the claims the editor has not yet addressed. */
  verdict: FactCheckVerdict
  /** Claims whose revision has been inserted into the body. */
  applied: number
  /** Flagged claims still to act on. */
  outstanding: number
  /**
   * True when every flagged claim has been addressed but the run predates those
   * edits — the report no longer describes the article in front of you.
   */
  addressed: boolean
  /**
   * Claims the evidence **contradicted** whose suggested revision has been
   * inserted and which nothing has re-checked.
   *
   * Separate from `applied` because it is a different kind of fact. Applying a
   * revision to a `needs-context` claim adds a qualifier; applying one to an
   * `inaccurate` claim replaces a sentence the evidence said was wrong with a
   * sentence a model proposed, and no search has been run against the new
   * wording.
   *
   * It exists because that case could otherwise vanish from view entirely. The
   * recomputed verdict drops from `major-issues` to whatever the remaining
   * claims imply, and `addressed` is false while any other claim is still
   * outstanding — so an article whose one contradicted claim was patched, with
   * three `needs-context` claims left alone, matched no branch of the publish
   * guard and published in silence. Found on a real draft, 2026-08-23.
   */
  correctedInaccurate: number
  /**
   * True when the verdict was computed from claims, false when it is the stored
   * value because there were none to read.
   *
   * Callers must fail closed on `false`: an adverse stored verdict with no
   * claims to explain it still means the article was flagged, and treating
   * "nothing outstanding" as "nothing wrong" would drop the warning entirely.
   */
  derived: boolean
}

/**
 * The verdict as it stands now, given what the editor has applied.
 *
 * Falls back to the stored verdict when there are no claims to reason about —
 * an older document, or a report that recorded a verdict and nothing else.
 */
export function liveVerdict(factCheck: {
  overallVerdict?: string
  claims?: VerdictClaim[] | null
}): LiveVerdict {
  const claims = Array.isArray(factCheck.claims) ? factCheck.claims : []

  if (claims.length === 0) {
    return {
      verdict: (factCheck.overallVerdict as FactCheckVerdict) ?? 'clean',
      applied: 0,
      outstanding: 0,
      addressed: false,
      correctedInaccurate: 0,
      derived: false,
    }
  }

  const flagged = claims.filter((c) => ISSUE_VERDICTS.has(c.verdict ?? ''))
  const applied = flagged.filter((c) => c.applied === true).length
  const outstanding = flagged.length - applied

  // An applied claim is resolved and leaves the set; an accurate one never had
  // a revision to apply and stays, so it still counts toward "mostly
  // unverifiable".
  const verdict = verdictFor(claims.filter((c) => c.applied !== true))

  return {
    verdict,
    applied,
    outstanding,
    addressed: applied > 0 && outstanding === 0,
    correctedInaccurate: claims.filter((c) => c.verdict === 'inaccurate' && c.applied === true)
      .length,
    derived: true,
  }
}
