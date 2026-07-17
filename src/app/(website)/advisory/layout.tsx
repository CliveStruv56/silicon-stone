import type { Metadata } from 'next'

const description =
  'The Drift Retainer: a standing, independent read on how the technopolitical drift affects your supply chains, procurement, and people — so AI activity becomes decisions the board can act on. Independent AI and technopolitical advisory from thirty years inside the industry.'

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
