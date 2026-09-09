import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { MODULES } from '@/lib/offering'

const description =
  'Where inference, weights and keys sit, who can reach them, and whether you could satisfy a buyer’s sovereignty demand without re-architecting — with a roadmap that keeps your options open.'

export const metadata: Metadata = {
  title: 'Sovereign Architecture Review — Keys, Access and Portability | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/modules/sovereign-architecture-review' },
  openGraph: { title: 'Sovereign Architecture Review', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Sovereign Architecture Review', description },
}

/**
 * Metadata and structured data sit in the layout, as they do for the four
 * engagement pages. The module is looked up by id rather than retyped, so the
 * breadcrumb cannot call it something `/pricing` and `/advisory` do not.
 */
const offering = MODULES.find((m) => m.id === 'sovereign-architecture-review')!

export default function SovereignArchitectureReviewLayout({
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
