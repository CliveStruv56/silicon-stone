import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'AI Act Compliance Checker | Silicon and Stone',
  description:
    'Triage your EU AI Act obligations: assess risk tier, GPAI duties, and the transparency rules in force since August 2026.',
  alternates: { canonical: '/tools/compliance-checker' },
}

export default function ComplianceCheckerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
