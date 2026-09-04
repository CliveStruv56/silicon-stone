import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { ENGAGEMENTS } from '@/lib/offering'

const description =
  'Before you commit to AI governance software, know what you actually need it to do. A framework-neutral, vendor-agnostic decision document for the board: multi-framework analysis, a 40-page report, a board-ready presentation and an implementation roadmap.'

export const metadata: Metadata = {
  title: 'Strategic Assessment — A Board-Ready AI Governance Decision | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/strategic-assessment' },
  openGraph: { title: 'Strategic Assessment', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Strategic Assessment', description },
}


/**
 * Structured data lives in the layout, not the page: two of the four engagement
 * pages are Client Components (framer-motion), and this is server-rendered
 * metadata that has no business in the client bundle. It also puts the
 * breadcrumb next to the canonical, which is the same concern.
 *
 * The engagement is looked up by id in `ENGAGEMENTS` rather than retyped, so the
 * breadcrumb cannot call it something the header, footer and /pricing do not.
 */
const engagement = ENGAGEMENTS.find((e) => e.id === 'strategic-assessment')!

export default function StrategicAssessmentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        data={buildEngagementBreadcrumbSchema({
          name: engagement.name,
          path: engagement.href,
        })}
      />
      {children}
    </>
  )
}
