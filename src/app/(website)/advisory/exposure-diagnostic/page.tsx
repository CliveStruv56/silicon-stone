import { coverageFor } from '@/lib/advisory/coverage'
import { ExposureDiagnosticEngagement } from './ExposureDiagnosticEngagement'

/** Server half: reads the articles placed under this engagement in Studio. */
export default async function ExposureDiagnosticPage() {
  const coverage = await coverageFor('exposure-diagnostic', {
    label: 'All AI Act & Compliance coverage',
    href: '/analysis/category/ai-act',
  })
  return <ExposureDiagnosticEngagement coverage={coverage} />
}
