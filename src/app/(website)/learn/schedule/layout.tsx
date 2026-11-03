import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildLearnBreadcrumbSchema } from '@/lib/seo'

const name = 'Release schedule'
const path = '/learn/schedule'
const description =
  'What opens when in Silicon to Sovereignty: one track roughly every six to eight weeks from January 2027, finishing with the sovereignty capstone in November 2027.'

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
