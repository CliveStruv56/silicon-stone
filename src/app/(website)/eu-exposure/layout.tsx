import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EU Exposure Briefing for US Companies | Silicon and Stone',
  description:
    'Independent interpretation of the EU AI Act, the sovereignty package, and the wider technopolitical drift for US companies operating in or entering Europe. A fixed-scope diagnostic from the Atlantic edge.',
  alternates: { canonical: '/eu-exposure' },
}

export default function EuExposureLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
