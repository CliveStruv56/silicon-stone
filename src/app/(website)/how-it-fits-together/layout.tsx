import type { Metadata } from 'next'

import { JsonLd } from '@/components/seo/JsonLd'
import { buildPageBreadcrumbSchema } from '@/lib/seo'
import { HOW_IT_FITS_TOGETHER_PATH } from '@/lib/offerings-map'

const title = 'How it fits together'
const description =
  'One map of everything Silicon & Stone offers: free analysis and tools, self-serve products, the Advisory Briefing, the specialist projects and engagements behind it, and the Drift Retainer they settle into.'

export const metadata: Metadata = {
  title: `${title} | Silicon and Stone`,
  description,
  alternates: { canonical: HOW_IT_FITS_TOGETHER_PATH },
  openGraph: { title, description, type: 'website', url: HOW_IT_FITS_TOGETHER_PATH },
  twitter: { card: 'summary_large_image', title, description },
}

/** Structured data beside the canonical, as the engagement layouts do. */
export default function HowItFitsTogetherLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd data={buildPageBreadcrumbSchema({ name: title, path: HOW_IT_FITS_TOGETHER_PATH })} />
      {children}
    </>
  )
}
