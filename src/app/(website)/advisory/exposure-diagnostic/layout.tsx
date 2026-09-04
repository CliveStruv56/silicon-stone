import type { Metadata } from 'next'

const description =
  'A one-off engagement for the question documents cannot answer: where your dependency on specific vendors, models and jurisdictions becomes an operating constraint — and what to do about it this quarter. Written report, prioritised actions, 30-day follow-up.'

export const metadata: Metadata = {
  title: 'The Exposure Diagnostic — AI Dependency and Evidence Review | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/exposure-diagnostic' },
  openGraph: { title: 'The Exposure Diagnostic', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'The Exposure Diagnostic', description },
}

export default function ExposureDiagnosticLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
