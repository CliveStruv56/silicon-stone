import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'WaymarkPath — Career Navigation for the AI Shift | Silicon and Stone',
  description:
    'WaymarkPath helps technology professionals navigate career transitions as AI reshapes European tech, compliance, and defence-tech roles.',
  alternates: { canonical: '/waymarkpath' },
}

export default function WaymarkPathLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
