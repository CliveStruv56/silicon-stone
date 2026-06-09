import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Scenario Modeler | Silicon and Stone',
  description:
    'Model geopolitical and supply-chain scenarios and stress-test their impact on European technology strategy.',
  alternates: { canonical: '/tools/scenario-modeler' },
}

export default function ScenarioModelerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
