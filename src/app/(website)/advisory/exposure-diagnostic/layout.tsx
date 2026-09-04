import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildEngagementBreadcrumbSchema } from '@/lib/seo'
import { ENGAGEMENTS } from '@/lib/offering'

const description =
  'A one-off engagement for the question documents cannot answer: where your dependency on specific vendors, models and jurisdictions becomes an operating constraint — and what to do about it this quarter. Written report, prioritised actions, 30-day follow-up.'

export const metadata: Metadata = {
  title: 'The Exposure Diagnostic — AI Dependency and Evidence Review | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/exposure-diagnostic' },
  openGraph: { title: 'The Exposure Diagnostic', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'The Exposure Diagnostic', description },
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
const engagement = ENGAGEMENTS.find((e) => e.id === 'exposure-diagnostic')!

export default function ExposureDiagnosticLayout({
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
