import type { Metadata } from 'next'

const description =
  'What the EU AI Act now actually requires of you after the Digital Omnibus — in plain English, priced fixed. A fixed-scope briefing for US and UK companies selling into Europe: what applies now, what moved, and the decisions to take this quarter.'

export const metadata: Metadata = {
  title: 'The Post-Omnibus Briefing — EU AI Act for US & UK Companies | Silicon and Stone',
  description,
  alternates: { canonical: '/eu-exposure' },
  openGraph: { title: 'The Post-Omnibus Briefing — EU AI Act for US & UK Companies', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'The Post-Omnibus Briefing — EU AI Act for US & UK Companies', description },
}

export default function EuExposureLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
