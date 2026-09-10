import { coverageFor } from '@/lib/advisory/coverage'
import { ManufacturingExposureModule } from './ManufacturingExposureModule'

/**
 * Server half of the module page: it exists to read the articles an editor has
 * placed under this module (`article.appearsUnder`) and hand them to the
 * Client Component that owns the content. The category link is the one thing
 * still typed here — it is a place to send the reader, not an article
 * placement.
 */
export default async function ManufacturingExposurePage() {
  const coverage = await coverageFor('manufacturing-exposure', {
    label: 'All semiconductor supply chain coverage',
    href: '/analysis/category/semiconductors',
  })
  return <ManufacturingExposureModule coverage={coverage} />
}
