import type { Metadata } from 'next'
import { SCENARIOS } from '@/lib/scenario-data'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Scenario Modeler | Silicon and Stone',
  // Scenario names are read from the data so the description follows the model.
  description: `${SCENARIOS.length} geopolitical scenarios — ${SCENARIOS.map((s) => s.shortName).join(', ')} — priced sector by sector and re-read through your own exposure lens, with a board brief for each.`,
  alternates: { canonical: '/tools/scenario-modeler' },
}

export default function ScenarioModelerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
