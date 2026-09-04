import type { Metadata } from 'next'

const description =
  'One focused hour on your tool results and one specific question, with a written follow-up — and credited in full toward your first month on a Drift Retainer if you proceed within 30 days. The low-commitment way to test the water.'

export const metadata: Metadata = {
  title: 'The Advisory Briefing — One Hour, One Question | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/advisory-briefing' },
  openGraph: { title: 'The Advisory Briefing', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'The Advisory Briefing', description },
}

export default function AdvisoryBriefingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
