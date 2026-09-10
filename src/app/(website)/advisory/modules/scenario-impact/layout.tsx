import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { MODULES } from '@/lib/offering'

const description =
  'Geopolitical scenarios built for your business, with revenue and margin at risk quantified by business unit as stated ranges, cascades mapped, early-warning indicators owned, and a board brief per scenario. A standalone specialist advisory project, available after a free scoping conversation.'

export const metadata: Metadata = {
  title: 'Scenario Impact Analysis — Value at Stake by Business Unit | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/modules/scenario-impact' },
  openGraph: { title: 'Scenario Impact Analysis', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Scenario Impact Analysis', description },
}

/**
 * Metadata and structured data sit in the layout, as they do for the four
 * engagement pages. The module is looked up by id rather than retyped, so the
 * breadcrumb cannot call it something `/pricing` and `/advisory` do not.
 */
const offering = MODULES.find((m) => m.id === 'scenario-impact')!

export default function ScenarioImpactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        data={buildEngagementBreadcrumbSchema({ name: offering.name, path: offering.href })}
      />
      {children}
    </>
  )
}
