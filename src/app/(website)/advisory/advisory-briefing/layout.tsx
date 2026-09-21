import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema, buildServiceSchema } from '@/lib/seo'
import { AMOUNTS, ENGAGEMENTS } from '@/lib/offering'

const description =
  'The output of a tool or product, or one of your AI systems. A one-hour discussion and a written follow-up with priorities, evidence gaps and next actions.'

export const metadata: Metadata = {
  title: 'Advisory Briefing — One Hour, One Written Follow-Up | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/advisory-briefing' },
  openGraph: { title: 'The Advisory Briefing', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'The Advisory Briefing', description },
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
const engagement = ENGAGEMENTS.find((e) => e.id === 'advisory-briefing')!

export default function AdvisoryBriefingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        data={[
          buildEngagementBreadcrumbSchema({ name: engagement.name, path: engagement.href }),
          buildServiceSchema(engagement, AMOUNTS.advisoryBriefing),
        ]}
      />
      {children}
    </>
  )
}
