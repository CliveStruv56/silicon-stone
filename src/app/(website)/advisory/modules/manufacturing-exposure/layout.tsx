import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { MODULES } from '@/lib/offering'

const description =
  'Semiconductor, cloud, supplier and operational dependencies mapped against your own organisation, with chokepoints named and the procurement questions to put to exposed suppliers. A standalone specialist advisory project, available after a free scoping conversation.'

export const metadata: Metadata = {
  title: 'Manufacturing Exposure Module — Supplier and Chokepoint Mapping | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/modules/manufacturing-exposure' },
  openGraph: { title: 'Manufacturing Exposure Module', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Manufacturing Exposure Module', description },
}

/**
 * Metadata and structured data sit in the layout, as they do for the four
 * engagement pages. The module is looked up by id rather than retyped, so the
 * breadcrumb cannot call it something `/pricing` and `/advisory` do not.
 */
const offering = MODULES.find((m) => m.id === 'manufacturing-exposure')!

export default function ManufacturingExposureLayout({
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
