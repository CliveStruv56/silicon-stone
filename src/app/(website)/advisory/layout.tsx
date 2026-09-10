import type { Metadata } from 'next'

// Leads with the Advisory Briefing because the hub's hero does: a searcher
// promised one product must not land on a page whose callout names another.
const description =
  'Independent AI and technopolitical advisory: an Advisory Briefing, broader assessments, an ongoing retainer and five standalone specialist projects. Agree the scope after a free conversation.'

export const metadata: Metadata = {
  title: 'Independent AI & Technopolitical Advisory | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory' },
  openGraph: { title: 'Independent AI & Technopolitical Advisory', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Independent AI & Technopolitical Advisory', description },
}

export default function AdvisoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
