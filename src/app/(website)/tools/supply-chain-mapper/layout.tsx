import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Supply Chain Chokepoints | Silicon and Stone',
  description:
    'Map the semiconductor and critical-mineral chokepoints exposing European technology supply chains.',
  alternates: { canonical: '/tools/supply-chain-mapper' },
}

export default function SupplyChainMapperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
