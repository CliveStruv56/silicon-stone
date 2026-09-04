import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { ENGAGEMENTS } from '@/lib/offering'

const description =
  'One focused hour on your tool results and one specific question, with a written follow-up — and credited in full toward your first month on a Drift Retainer if you proceed within 30 days. The low-commitment way to test the water.'

export const metadata: Metadata = {
  title: 'The Advisory Briefing — One Hour, One Question | Silicon and Stone',
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
        data={buildEngagementBreadcrumbSchema({
          name: engagement.name,
          path: engagement.href,
        })}
      />
      {children}
    </>
  )
}
