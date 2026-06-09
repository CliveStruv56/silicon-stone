import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Strategic Advisory | Silicon and Stone',
  description:
    'Focused diagnostic support for organisations managing AI governance, vendor evidence, technology dependency, and operational resilience.',
  alternates: { canonical: '/advisory' },
}

export default function AdvisoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
