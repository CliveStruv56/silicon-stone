import type { Metadata } from 'next'

const title = 'Silicon & Stone Learning: Silicon to Sovereignty'
const description =
  'Courses for the leaders who have to approve, buy and answer for AI: how it works, what it runs on, what the rules now require, and who controls your stack. First courses open January 2027.'

/**
 * The hub's metadata. Every child page sets its OWN canonical: Next overwrites
 * metadata field by field from the nearest ancestor that sets it, so a child
 * that inherited this one would be canonicalised onto /learn and deindexed.
 */
export const metadata: Metadata = {
  title: `${title} | Silicon and Stone`,
  description,
  alternates: { canonical: '/learn' },
  openGraph: { title, description, type: 'website', url: '/learn' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function LearnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Structured data lives in each page, not here: anything rendered by this
  // layout would repeat on every page beneath /learn.
  return children
}
