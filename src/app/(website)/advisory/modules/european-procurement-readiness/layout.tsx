import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { offeringById } from '@/lib/offering'

const offering = offeringById('european-procurement-readiness')
const description = 'Prepare for a European buyer’s procurement review with an evidence matrix, gap register and prioritised response plan. A standalone advisory project, scoped after a free conversation.'

export const metadata: Metadata = {
  title: `${offering.name} | Silicon and Stone`,
  description,
  alternates: { canonical: offering.href },
  openGraph: { title: offering.name, description, type: 'website' },
  twitter: { card: 'summary_large_image', title: offering.name, description },
}

export default function ProcurementReadinessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><JsonLd data={buildEngagementBreadcrumbSchema({ name: offering.name, path: offering.href })} />{children}</>
}
