import type { DocumentBadgeComponent } from 'sanity'
import { liveVerdict, type VerdictClaim } from '@/lib/fact-check-verdict'

type FactCheckState = {
  status?: string
  overallVerdict?: string
  claims?: VerdictClaim[] | null
}

/**
 * Document badge surfacing the fact-check state on article documents.
 * Returns null (no badge) for articles that have never been checked.
 *
 * The verdict is recomputed from the claims still outstanding rather than read
 * from `overallVerdict`, which is frozen at the end of the run. Applying every
 * suggested revision used to leave the badge reading "major issues" with no way
 * to clear it short of paying for another run. See src/lib/fact-check-verdict.ts.
 */
export const factCheckBadge: DocumentBadgeComponent = (props) => {
  const doc = (props.draft ?? props.published) as { factCheck?: FactCheckState } | null
  const factCheck = doc?.factCheck
  if (!factCheck?.status) return null

  if (factCheck.status === 'running') {
    return { label: 'Fact-check running', color: 'primary' }
  }
  if (factCheck.status === 'failed') {
    return { label: 'Fact-check failed', color: 'danger' }
  }

  const live = liveVerdict(factCheck)

  // Every flagged claim has been dealt with, but the report predates the edits.
  // Deliberately not "clean": an inserted revision has not been re-verified
  // against evidence, and only a fresh run may say it has.
  if (live.addressed) {
    return {
      label: `Fact-check: ${live.applied} revision${live.applied === 1 ? '' : 's'} applied`,
      title: 'Every flagged claim has been addressed. Re-run the fact-check to confirm the new wording.',
      color: 'primary',
    }
  }

  const remaining = live.outstanding > 0 ? ` (${live.outstanding} to address)` : ''

  switch (live.verdict) {
    case 'clean':
      return { label: 'Fact-check: clean', color: 'success' }
    case 'minor-issues':
      return { label: `Fact-check: minor issues${remaining}`, color: 'warning' }
    case 'major-issues':
      return { label: `Fact-check: major issues${remaining}`, color: 'danger' }
    case 'unverifiable':
      return { label: 'Fact-check: unverifiable', color: 'warning' }
    default:
      return { label: 'Fact-checked', color: 'success' }
  }
}
