import type { Metadata } from 'next'

const description =
  'Before you commit to AI governance software, know what you actually need it to do. A framework-neutral, vendor-agnostic decision document for the board: multi-framework analysis, a 40-page report, a board-ready presentation and an implementation roadmap.'

export const metadata: Metadata = {
  title: 'Strategic Assessment — A Board-Ready AI Governance Decision | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/strategic-assessment' },
  openGraph: { title: 'Strategic Assessment', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Strategic Assessment', description },
}

export default function StrategicAssessmentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
