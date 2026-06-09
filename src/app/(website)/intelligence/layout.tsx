import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Intelligence | Silicon and Stone',
  description:
    'One intelligence hub — filter by topic, tier (Pulse, Briefing, Audit) and role. AI regulation, semiconductor supply chains, and digital sovereignty for European decision-makers.',
  alternates: { canonical: '/intelligence' },
}

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
