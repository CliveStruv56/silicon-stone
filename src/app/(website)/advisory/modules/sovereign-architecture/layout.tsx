import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { offeringById } from '@/lib/offering'

const offering = offeringById('sovereign-architecture-review')
const description = 'Review hosting, access, key custody, portability and exit constraints for your technology stack. A standalone advisory project with practical options and a staged decision roadmap.'

export const metadata: Metadata = {
  title: `${offering.name} | Silicon and Stone`,
  description,
  alternates: { canonical: offering.href },
  openGraph: { title: offering.name, description, type: 'website' },
  twitter: { card: 'summary_large_image', title: offering.name, description },
}

export default function SovereignArchitectureLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><JsonLd data={buildEngagementBreadcrumbSchema({ name: offering.name, path: offering.href })} />{children}</>
}
