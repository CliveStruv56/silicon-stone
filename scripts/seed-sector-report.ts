/** Seed public metadata only. Idempotent; never overwrite an edited report/edition. */
import { createClient } from '@sanity/client'
import { loadEnvConfig } from '@next/env'
import manufacturing from '../src/content/sector-reports/ai-and-european-manufacturing.json'
import { AMOUNTS, gbp } from '../src/lib/offering'

loadEnvConfig(process.cwd())
const write = process.argv.includes('--write')
const reportId = 'sector-report-ai-and-european-manufacturing'
const editionId = `${reportId}-2026-10`
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

async function main() {
  const articles = await client.fetch<Array<{ _id: string }>>(
    '*[_type == "article" && !(_id in path("drafts.**")) && slug.current in $slugs]{_id}',
    { slugs: manufacturing.relatedArticleSlugs },
  )
  const edition = {
    _id: editionId, _type: 'sectorReportEdition', ...manufacturing.edition,
    contents: manufacturing.edition.contents.map((group, i) => ({
      ...group, _key: `group-${i}`,
      entries: group.entries.map((entry, j) => ({ ...entry, _key: `entry-${j}` })),
    })),
  }
  const report = {
    _id: reportId, _type: 'sectorReport', title: manufacturing.title,
    slug: { _type: 'slug', current: manufacturing.slug }, previewPublished: true,
    description: manufacturing.description, highlights: manufacturing.highlights,
    audiences: manufacturing.audiences.map((audience, i) => ({ ...audience, _key: `audience-${i}` })),
    relatedArticles: articles.map((article, i) => ({ _type: 'reference', _ref: article._id, _key: `article-${i}` })),
    currentEdition: { _type: 'reference', _ref: editionId },
  }
  const productUpdate = {
    priceLabel: `From ${gbp(AMOUNTS.sectorReport)}`,
    blurb: 'Sector reference guides with the current PDF and monthly updates for 12 months. One named reader; optional renewal. Preview the first report before purchase.',
    badge: 'Preview available',
  }
  if (!write) {
    console.log(JSON.stringify({ report, edition, productUpdate }, null, 2))
    return
  }
  if (!process.env.SANITY_API_WRITE_TOKEN) throw new Error('SANITY_API_WRITE_TOKEN is required')
  await client.transaction()
    .createIfNotExists(edition)
    .createIfNotExists(report)
    .patch('product-sector-reports', patch => patch.set(productUpdate).unset(['checkoutUrl']))
    .commit()
  console.log(`Public preview records prepared: ${reportId}, ${editionId}. Price label synchronised. No paid file uploaded and no email sent.`)
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Seed failed'); process.exitCode = 1 })
