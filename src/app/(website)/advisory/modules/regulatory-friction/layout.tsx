import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { MODULES } from '@/lib/offering'

const description =
  'Where US and EU requirements pull against each other across your operations: every conflict friction-scored, priced and dated, with a priority matrix, a regulatory calendar built from pinned statute, and a transatlantic roadmap with owners. The follow-on module to the free Policy Stress-Test.'

export const metadata: Metadata = {
  title: 'Regulatory Friction Assessment — US and EU Gap Analysis | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/modules/regulatory-friction' },
  openGraph: { title: 'Regulatory Friction Assessment', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Regulatory Friction Assessment', description },
}

/**
 * Metadata and structured data sit in the layout, as they do for the four
 * engagement pages. The module is looked up by id rather than retyped, so the
 * breadcrumb cannot call it something `/pricing` and `/advisory` do not.
 */
const offering = MODULES.find((m) => m.id === 'regulatory-friction')!

export default function RegulatoryFrictionLayout({
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
