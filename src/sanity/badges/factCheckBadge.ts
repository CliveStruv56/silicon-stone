import type { DocumentBadgeComponent } from 'sanity'

type FactCheckState = { status?: string; overallVerdict?: string }

/**
 * Document badge surfacing the fact-check state on article documents.
 * Returns null (no badge) for articles that have never been checked.
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

  switch (factCheck.overallVerdict) {
    case 'clean':
      return { label: 'Fact-check: clean', color: 'success' }
    case 'minor-issues':
      return { label: 'Fact-check: minor issues', color: 'warning' }
    case 'major-issues':
      return { label: 'Fact-check: major issues', color: 'danger' }
    case 'unverifiable':
      return { label: 'Fact-check: unverifiable', color: 'warning' }
    default:
      return { label: 'Fact-checked', color: 'success' }
  }
}
