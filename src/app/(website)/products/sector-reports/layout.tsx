import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sector Reports | Silicon and Stone',
  description:
    'Preview AI and European Manufacturing: full contents and an Executive Summary excerpt. Sector reports include monthly updates for 12 months with one payment.',
  alternates: { canonical: '/products/sector-reports' },
}

export default function ProductsSectorReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
