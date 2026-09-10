import { coverageFor } from '@/lib/advisory/coverage'
import { RegulatoryFrictionModule } from './RegulatoryFrictionModule'

/** Server half: reads the articles placed under this module in Studio. */
export default async function RegulatoryFrictionPage() {
  const coverage = await coverageFor('regulatory-friction', {
    label: 'All Atlantic Drift coverage',
    href: '/analysis/category/atlantic-drift',
  })
  return <RegulatoryFrictionModule coverage={coverage} />
}
