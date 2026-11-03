import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildLearnBreadcrumbSchema } from '@/lib/seo'

const name = 'In-house training'
const path = '/learn/teams'
const description =
  'Silicon & Stone Learning for your board or your staff, delivered privately: from a 60-minute board briefing to a two-day workshop, with exercises on your own systems.'

export const metadata: Metadata = {
  title: `${name} | Silicon & Stone Learning`,
  description,
  alternates: { canonical: path },
  openGraph: { title: name, description, type: 'website', url: path },
}

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd data={buildLearnBreadcrumbSchema([{ name, path }])} />
      {children}
    </>
  )
}
