import type { Metadata } from 'next'

// Metadata lives in a server layout because the page itself is a Client Component.
export const metadata: Metadata = {
  title: 'Policy Stress-Test | Silicon and Stone',
  description:
    'Stress-test how EU technology policy and the AI Act affect your organisation across regulatory scenarios.',
  alternates: { canonical: '/tools/policy-stress-test' },
}

export default function PolicyStressTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
