import { coverageFor } from '@/lib/advisory/coverage'
import { AdvisoryBriefingEngagement } from './AdvisoryBriefingEngagement'

/** Server half: reads the articles placed under this engagement in Studio. */
export default async function AdvisoryBriefingPage() {
  const coverage = await coverageFor('advisory-briefing', {
    label: 'All intelligence',
    href: '/intelligence',
  })
  return <AdvisoryBriefingEngagement coverage={coverage} />
}
