import { sanityFetch } from '@/sanity/lib/live'
import { RSS_ARTICLES_QUERY } from '@/sanity/lib/queries'
import { SITE_URL, SITE_NAME, absoluteUrl } from '@/lib/site'
import { cleanDescription } from '@/lib/seo'

/**
 * RSS 2.0 feed of the latest analysis — for Inoreader, aggregators and
 * syndication tooling. Revalidated hourly.
 */
export const dynamic = 'force-static'
export const revalidate = 3600

type RssArticle = {
  title: string
  slug: string
  excerpt?: string | null
  stoneTruth?: string | null
  publishedAt?: string | null
  author?: string | null
  categories?: string[] | null
}

function escapeXml(value: string): string {
  return value.replace(
    /[<>&'"]/g,
    (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[
        c
      ] as string
  )
}

export async function GET() {
  const { data } = await sanityFetch({
    query: RSS_ARTICLES_QUERY,
    perspective: 'published',
    stega: false,
  })
  const articles = (data ?? []) as RssArticle[]

  const items = articles
    .map((a) => {
      const url = absoluteUrl(`/analysis/${a.slug}`)
      const description = cleanDescription(a.excerpt || a.stoneTruth, 300)
      const pubDate = a.publishedAt
        ? new Date(a.publishedAt).toUTCString()
        : ''
      const categories = (a.categories ?? [])
        .map((c) => `<category>${escapeXml(c)}</category>`)
        .join('')
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>${pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ''}${a.author ? `\n      <dc:creator>${escapeXml(a.author)}</dc:creator>` : ''}
      ${categories}
      <description>${escapeXml(description)}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} — Forensic Technopolitics</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Independent, decision-grade intelligence for UK and European leaders managing AI governance, technology dependency, and operational resilience.</description>
    <language>en-gb</language>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
