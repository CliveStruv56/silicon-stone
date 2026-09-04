import type { Metadata } from 'next'

const description =
  'A standing, independent read on how the technopolitical drift affects your supply chains, procurement and people — a board-forwardable monthly briefing, a working session on one live decision, direct access between sessions, and a quarterly written exposure review.'

export const metadata: Metadata = {
  title: 'The Drift Retainer — A Standing Read on the Drift | Silicon and Stone',
  description,
  alternates: { canonical: '/advisory/drift-retainer' },
  openGraph: { title: 'The Drift Retainer', description, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'The Drift Retainer', description },
}

export default function DriftRetainerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
