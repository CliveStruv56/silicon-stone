import 'server-only'

import type { ComponentProps } from 'react'

import { RelatedCoverage } from '@/components/advisory/RelatedCoverage'
import { ARTICLES_FOR_OFFERING_QUERY } from '@/sanity/lib/queries'
import { sanityFetch } from '@/sanity/lib/live'
import { isCoveragePlacement } from './coverage-placement'

type CoverageProps = ComponentProps<typeof RelatedCoverage>

/**
 * The "Further reading on this topic" strip for one offering, read from the
 * articles an editor has placed under it in Studio.
 *
 * Goes through `sanityFetch` so the offering page re-renders when an article
 * is placed or unplaced, without a deploy — which is the whole point of the
 * field. The offering pages themselves are Client Components (they hand icons
 * to the enquiry form), so this runs in a thin server `page.tsx` that passes
 * the plain result down.
 *
 * An unknown offering id throws rather than returning an empty strip: a typo
 * would otherwise render nothing and look like "no articles placed yet".
 */
export async function coverageFor(
  offeringId: string,
  more?: CoverageProps['more'],
): Promise<CoverageProps> {
  if (!isCoveragePlacement(offeringId)) {
    throw new Error(`coverageFor: "${offeringId}" is not an offering articles can be placed under`)
  }

  const { data } = await sanityFetch({
    query: ARTICLES_FOR_OFFERING_QUERY,
    params: { offeringId },
    stega: false,
  })
  // No typegen in this repo, so the projection is restated here.
  const rows = (data ?? []) as Array<{ title?: string | null; slug?: string | null; excerpt?: string | null }>

  return {
    articles: rows
      .filter((article): article is { title: string; slug: string; excerpt?: string | null } =>
        Boolean(article.title && article.slug),
      )
      .map(article => ({
        title: article.title,
        href: `/analysis/${article.slug}`,
        note: article.excerpt ?? undefined,
      })),
    more,
  }
}
