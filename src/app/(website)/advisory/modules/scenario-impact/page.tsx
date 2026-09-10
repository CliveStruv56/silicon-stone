import { coverageFor } from '@/lib/advisory/coverage'
import { ScenarioImpactModule } from './ScenarioImpactModule'

/** Server half: reads the articles placed under this module in Studio. */
export default async function ScenarioImpactPage() {
  const coverage = await coverageFor('scenario-impact', {
    label: 'All Atlantic Drift coverage',
    href: '/analysis/category/atlantic-drift',
  })
  return <ScenarioImpactModule coverage={coverage} />
}
