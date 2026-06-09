import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Strategic Advisory | Silicon and Stone',
  description:
    'Focused diagnostic support for organisations managing AI governance, vendor evidence, technology dependency, and operational resilience.',
  alternates: { canonical: '/services' },
}

export default function ServicesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
