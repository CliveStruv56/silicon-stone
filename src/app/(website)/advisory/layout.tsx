import type { Metadata } from 'next'

// Leads with the Advisory Briefing because the hub's hero does: a searcher
// promised one product must not land on a page whose callout names another.
const description =
  'The Advisory Briefing: one AI system, one principal question, an hour with an independent adviser and a written follow-up — the first step toward a standing read on how the technopolitical drift affects your supply chains, procurement, and people. Independent AI and technopolitical advisory from thirty years inside the industry.'

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
