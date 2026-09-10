import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'AI Act Compliance Checker | Silicon and Stone',
  description:
    'Classify an AI system under the EU AI Act: a rule-based risk tier, the obligations that follow, the vendor evidence to ask for, and the transparency rules in force since August 2026.',
  alternates: { canonical: '/tools/compliance-checker' },
}

export default function ComplianceCheckerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
