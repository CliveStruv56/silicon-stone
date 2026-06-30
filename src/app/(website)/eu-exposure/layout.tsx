import type { Metadata } from 'next'

const description =
  'Independent interpretation of the EU AI Act, the sovereignty package, and the wider technopolitical drift for US companies operating in or entering Europe. A fixed-scope diagnostic from the Atlantic edge.'

export const metadata: Metadata = {
  title: 'EU Exposure Briefing for US Companies | Silicon and Stone',
  description,
  alternates: { canonical: '/eu-exposure' },
  openGraph: { title: 'EU Exposure Briefing for US Companies', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'EU Exposure Briefing for US Companies', description },
}

export default function EuExposureLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
