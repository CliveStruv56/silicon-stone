import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

dotenv.config({ path: '.env.local' })

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) throw new Error('SANITY_API_WRITE_TOKEN is required to fix excerpts')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  token,
  useCdn: false,
  perspective: 'raw',
})

// Mirror of completeSentence() in src/lib/seo.ts — inlined to keep this script
// free of the app's "@/..." path aliases. Keep the two in sync.
function completeSentence(input?: string | null): string {
  if (!input) return ''
  let s = input.replace(/\r/g, '').replace(/[*_`#>]/g, '').trim()
  const nl = s.indexOf('\n')
  if (nl >= 0) s = s.slice(0, nl).trim()
  s = s.replace(/^[-•*]\s+/, '').trim()
  s = s.replace(/\s*(?:…|\.{2,})\s*$/, '').trim()
  if (!s) return ''
  if (/[.!?]["')\]]?$/.test(s)) return s
  const lastTerminator = Math.max(s.lastIndexOf('.'), s.lastIndexOf('!'), s.lastIndexOf('?'))
  if (lastTerminator >= 0) return s.slice(0, lastTerminator + 1).trim()
  const sep = Math.max(s.lastIndexOf(' - '), s.lastIndexOf(' – '), s.lastIndexOf(' — '))
  if (sep >= 40) s = s.slice(0, sep).trim()
  s = s.replace(/[\s,;:–—-]+$/, '').trim()
  return s ? `${s}.` : ''
}

const DRY_RUN = process.argv.includes('--dry-run')

async function run() {
  const articles = await client.fetch<
    Array<{ _id: string; slug: string; excerpt?: string; metaDescription?: string; stoneTruth?: string }>
  >(
    `*[_type == "article" && !(_id in path("drafts.**")) && (defined(excerpt) || defined(seo.metaDescription) || defined(stoneTruth))]{
      _id, "slug": slug.current, excerpt, "metaDescription": seo.metaDescription, stoneTruth
    }`
  )

  let changed = 0
  for (const article of articles) {
    const patch: Record<string, string> = {}

    const fixedExcerpt = completeSentence(article.excerpt)
    if (fixedExcerpt && fixedExcerpt !== article.excerpt) patch.excerpt = fixedExcerpt

    const fixedMeta = completeSentence(article.metaDescription)
    if (fixedMeta && fixedMeta !== article.metaDescription) patch['seo.metaDescription'] = fixedMeta

    const fixedStone = completeSentence(article.stoneTruth)
    if (fixedStone && fixedStone !== article.stoneTruth) patch.stoneTruth = fixedStone

    if (!Object.keys(patch).length) continue
    changed += 1
    console.log(`\n${article.slug}`)
    for (const [field, value] of Object.entries(patch)) console.log(`  ${field} → ${value}`)
    if (!DRY_RUN) {
      await client.patch(article._id).set(patch).commit({ visibility: 'sync' })
    }
  }

  console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}${changed} article(s) ${DRY_RUN ? 'would be' : ''} updated.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
