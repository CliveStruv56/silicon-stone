import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildToolSchema } from '@/lib/seo'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Supply Chain Mapper | Silicon and Stone',
  description:
    'Map the semiconductor and critical-mineral chokepoints exposing European technology supply chains.',
  alternates: { canonical: '/tools/supply-chain-mapper' },
}

export default function SupplyChainMapperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildToolSchema({
          name: 'Supply Chain Mapper',
          description: String(metadata.description),
          path: '/tools/supply-chain-mapper',
        })}
      />
      {children}
    </>
  )
}
