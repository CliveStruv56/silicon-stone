import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Policy Stress-Test | Silicon and Stone',
  description:
    'Pair an EU policy with a US policy for your industry — AI Act, GDPR, Chips Acts, DMA, Data Act, export controls — and get the friction scored, the pressure point named, and a dated action plan.',
  alternates: { canonical: '/tools/policy-stress-test' },
}

export default function PolicyStressTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
