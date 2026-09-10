import { coverageFor } from '@/lib/advisory/coverage'
import { ProcurementReadinessProject } from './ProcurementReadinessProject'

export default async function ProcurementReadinessPage() {
  const coverage = await coverageFor('european-procurement-readiness', {
    label: 'Browse the intelligence archive', href: '/intelligence',
  })
  return <ProcurementReadinessProject coverage={coverage} />
}
