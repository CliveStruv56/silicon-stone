import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildLearnBreadcrumbSchema } from '@/lib/seo'

const name = 'Free orientation'
const path = '/learn/start'
const description =
  ' AI in 30 minutes:Course 0.1, free: trace what happens between typing a prompt and getting an answer, and where the model, the data and the hardware sit.'

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
