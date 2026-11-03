import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { COURSE_CODE } from '@/lib/learn/model'
import { coursePath } from '@/lib/learn/types'
import { sanityFetch } from '@/sanity/lib/live'
import { COURSE_BY_CODE_QUERY } from '@/sanity/lib/queries'

/**
 * `/learn/code/4-3` → the course page for 4.3, wherever its slug now points.
 *
 * The tool pages are Client Components and cannot ask Sanity for a slug, and a
 * slug is a Studio edit away from changing. A course code is stable — it is the
 * course's identity in the catalogue — so links from code that cannot fetch go
 * through here. A temporary redirect, because the slug it resolves to may move.
 * Not indexed and not in the sitemap: it is a pointer, not a page.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } }

type Props = { params: Promise<{ code: string }> }

export default async function CourseByCodePage({ params }: Props) {
  const { code: raw } = await params
  const code = raw.replace('-', '.')
  if (!COURSE_CODE.test(code)) notFound()
  const { data } = await sanityFetch({ query: COURSE_BY_CODE_QUERY, params: { code }, stega: false })
  const slug = (data as { slug?: string } | null)?.slug
  if (!slug) notFound()
  redirect(coursePath(slug))
}
