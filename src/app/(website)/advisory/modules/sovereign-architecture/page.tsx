import { coverageFor } from '@/lib/advisory/coverage'
import { SovereignArchitectureProject } from './SovereignArchitectureProject'

export default async function SovereignArchitecturePage() {
  const coverage = await coverageFor('sovereign-architecture-review', {
    label: 'Browse the intelligence archive', href: '/intelligence',
  })
  return <SovereignArchitectureProject coverage={coverage} />
}
