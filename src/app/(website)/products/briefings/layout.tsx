import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Sector Intelligence Briefings | Silicon and Stone',
  description:
    'Subscription sector intelligence: forensic analysis of AI regulation, semiconductors, and digital sovereignty for industry leaders.',
  alternates: { canonical: '/products/briefings' },
}

export default function ProductsBriefingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
