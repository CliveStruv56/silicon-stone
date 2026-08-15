/**
 * Sanity ↔ code price agreement check.
 *
 *   npm run test:sanity-prices
 *
 * Every price the site renders comes from `src/lib/offering.ts` — except one.
 * The three Sanity `product` documents carry their own `priceLabel`, authored
 * in Studio, and it is that string the end-of-article upsell gate puts on
 * screen ("Go deeper: AI Act Compliance Toolkit / Get it — From £79"). Code
 * cannot import it, so nothing stops the two drifting apart: change a price in
 * the catalogue and the whole site updates except the surface a reader meets at
 * the end of an article, which is the one place they are already persuaded.
 *
 * `SANITY_PRODUCTS` in the catalogue declares what those documents must say,
 * derived from `AMOUNTS`. This script fetches them and fails when they don't.
 *
 * Two deliberate asymmetries:
 *
 *  - **Published mismatches fail; draft mismatches warn.** The site serves
 *    published documents, and a draft is by definition unfinished. Failing CI
 *    because someone has a half-edited document open in Studio would train
 *    everyone to ignore this check.
 *  - **An unreachable Sanity fails.** A check that silently passes when it
 *    could not run is worse than no check, so the exit code is the same as a
 *    mismatch — but the message says plainly which of the two happened, so
 *    nobody wastes time hunting a price that was never wrong.
 *
 * Drafts are only inspected when `SANITY_API_READ_TOKEN` is set; without one
 * the API returns published documents only, and the script says so rather than
 * implying it checked.
 */

import { createClient } from '@sanity/client'

import { SANITY_PRODUCTS } from '../src/lib/offering'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13'
const token = process.env.SANITY_API_READ_TOKEN

type ProductDoc = {
  _id: string
  name?: string
  priceLabel?: string
  productPath?: string
}

/** A field that disagrees between Sanity and the code catalogue. */
type Mismatch = { documentId: string; field: string; expected: string; actual: string }

function compare(expected: (typeof SANITY_PRODUCTS)[number], doc: ProductDoc): Mismatch[] {
  const fields: Array<[string, string, string | undefined]> = [
    ['priceLabel', expected.priceLabel, doc.priceLabel],
    ['name', expected.name, doc.name],
    ['productPath', expected.productPath, doc.productPath],
  ]

  return fields
    .filter(([, want, got]) => got !== want)
    .map(([field, want, got]) => ({
      documentId: doc._id,
      field,
      expected: want,
      actual: got === undefined ? '(unset)' : got,
    }))
}

function report(mismatches: Mismatch[]): string {
  return mismatches
    .map(
      (m) =>
        `  ${m.documentId} · ${m.field}\n` +
        `      code says:   ${m.expected}\n` +
        `      Sanity says: ${m.actual}`,
    )
    .join('\n')
}

async function main() {
  if (!projectId || !dataset) {
    console.error(
      'Cannot check: NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must both be set.',
    )
    process.exit(1)
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    // Never the CDN: a cached response could pass this check minutes after the
    // document that would fail it was published.
    useCdn: false,
    ...(token ? { token } : {}),
  })

  let docs: ProductDoc[]
  try {
    docs = await client.fetch<ProductDoc[]>(
      `*[_type == "product"]{_id, name, priceLabel, productPath}`,
      {},
      // 'raw' so drafts come back alongside published documents when a token is
      // present; on this apiVersion the client would otherwise default to
      // 'published' and quietly hide them.
      { perspective: 'raw', signal: AbortSignal.timeout(15_000) },
    )
  } catch (error) {
    console.error(
      'Cannot check: Sanity was unreachable, so nothing was verified.\n' +
        `  ${error instanceof Error ? error.message : String(error)}\n` +
        'This is NOT a price mismatch. Re-run when the API is reachable.',
    )
    process.exit(1)
  }

  const published = docs.filter((doc) => !doc._id.startsWith('drafts.'))
  const drafts = docs.filter((doc) => doc._id.startsWith('drafts.'))

  const failures: Mismatch[] = []
  const missing: string[] = []

  for (const expected of SANITY_PRODUCTS) {
    const doc = published.find((d) => d._id === expected.documentId)
    if (!doc) {
      missing.push(expected.documentId)
      continue
    }
    failures.push(...compare(expected, doc))
  }

  // A SKU created in Studio that the site's own catalogue has never heard of
  // can still be selected by the article gate, and would be sold at a price no
  // page shows.
  const known = new Set(SANITY_PRODUCTS.map((p) => p.documentId))
  const unknown = published.filter((doc) => !known.has(doc._id)).map((doc) => doc._id)

  // Drafts are advisory: they are not what the site serves, but a drifted one
  // becomes a live mismatch the moment somebody hits Publish.
  const draftWarnings: Mismatch[] = []
  for (const expected of SANITY_PRODUCTS) {
    const doc = drafts.find((d) => d._id === `drafts.${expected.documentId}`)
    if (doc) draftWarnings.push(...compare(expected, doc))
  }

  if (draftWarnings.length) {
    console.warn(
      `Warning: ${draftWarnings.length} unpublished draft change(s) disagree with the code catalogue.\n` +
        'These do not fail the build — the site serves published documents — but publishing them would.\n' +
        report(draftWarnings) +
        '\n',
    )
  }

  if (missing.length) {
    console.error(
      `Missing product document(s) in Sanity: ${missing.join(', ')}\n` +
        'The article upsell gate cannot sell a product whose document does not exist.\n',
    )
  }

  if (unknown.length) {
    console.error(
      `Product document(s) in Sanity that the code catalogue does not know about: ${unknown.join(', ')}\n` +
        'The article gate can select these, but no page on the site prices them.\n' +
        'Add them to SANITY_PRODUCTS in src/lib/offering.ts, or delete them.\n',
    )
  }

  if (failures.length) {
    console.error(
      `${failures.length} product field(s) disagree with the code catalogue:\n` +
        report(failures) +
        '\n\nThe end-of-article gate renders the Sanity value, so a reader sees the\n' +
        'right-hand column above. Fix it in Studio (Products → the document), or, if\n' +
        'the price genuinely changed, change AMOUNTS in src/lib/offering.ts first and\n' +
        'let every other surface follow.\n',
    )
  }

  if (failures.length || missing.length || unknown.length) {
    process.exit(1)
  }

  const draftNote = token
    ? `${drafts.length} draft(s) inspected`
    : 'drafts not inspected (no SANITY_API_READ_TOKEN)'
  console.log(
    `Sanity prices agree with the code catalogue — ` +
      `${published.length} published product(s) checked, ${draftNote}.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
