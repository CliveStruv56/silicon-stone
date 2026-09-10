import { coverageFor } from '@/lib/advisory/coverage'
import { StrategicAssessmentEngagement } from './StrategicAssessmentEngagement'

/** Server half: reads the articles placed under this engagement in Studio. */
export default async function StrategicAssessmentPage() {
  const coverage = await coverageFor('strategic-assessment', {
    label: 'All European Sovereignty coverage',
    href: '/analysis/category/european-sovereignty',
  })
  return <StrategicAssessmentEngagement coverage={coverage} />
}
