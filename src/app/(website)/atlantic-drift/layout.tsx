import type { Metadata } from 'next'

const title = 'The US Executive’s Guide to European Digital Sovereignty'
const description =
  'A free, neutral-interpreter guide for US executives: what Europe’s AI Act and sovereignty rules genuinely require, what is noise, and what is still moving — with a short self-check on your real exposure.'

export const metadata: Metadata = {
  title: `${title} | Silicon and Stone`,
  description,
  alternates: { canonical: '/atlantic-drift' },
  openGraph: {
    title,
    description,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function AtlanticDriftLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
