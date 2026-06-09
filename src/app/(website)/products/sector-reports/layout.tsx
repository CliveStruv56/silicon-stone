import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Sector Reports | Silicon and Stone',
  description:
    'Subscription sector intelligence: forensic analysis of AI regulation, semiconductors, and digital sovereignty for industry leaders.',
  alternates: { canonical: '/products/sector-reports' },
}

export default function ProductsSectorReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
