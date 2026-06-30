import type { Metadata } from 'next'

const description =
  'Focused diagnostic support for organisations managing AI governance, vendor evidence, technology dependency, and operational resilience.'

export const metadata: Metadata = {
  title: 'Strategic Advisory | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory' },
  openGraph: { title: 'Strategic Advisory', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Strategic Advisory', description },
}

export default function AdvisoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
