import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Intelligence Briefings | Silicon and Stone',
  description:
    'Tiered intelligence — Pulse, Briefing, and Audit — on AI regulation, semiconductor supply chains, and digital sovereignty for European decision-makers.',
  alternates: { canonical: '/briefings' },
}

export default function BriefingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
