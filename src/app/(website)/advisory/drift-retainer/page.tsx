import { coverageFor } from '@/lib/advisory/coverage'
import { DriftRetainerEngagement } from './DriftRetainerEngagement'

/** Server half: reads the articles placed under this engagement in Studio. */
export default async function DriftRetainerPage() {
  const coverage = await coverageFor('drift-retainer', {
    label: 'All Atlantic Drift coverage',
    href: '/analysis/category/atlantic-drift',
  })
  return <DriftRetainerEngagement coverage={coverage} />
}
