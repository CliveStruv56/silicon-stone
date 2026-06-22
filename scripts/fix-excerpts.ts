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
  if (sep > s.length * 0.5) s = s.slice(0, sep).trim()
  s = s.replace(/[\s,;:–—-]+$/, '').trim()
  return s ? `${s}.` : ''
}

const DRY_RUN = process.argv.includes('--dry-run')

async function run() {
  const articles = await client.fetch<Array<{ _id: string; slug: string; excerpt?: string }>>(
    `*[_type == "article" && !(_id in path("drafts.**")) && defined(excerpt)]{_id, "slug": slug.current, excerpt}`
  )

  let changed = 0
  for (const article of articles) {
    const fixed = completeSentence(article.excerpt)
    if (!fixed || fixed === article.excerpt) continue
    changed += 1
    console.log(`\n${article.slug}`)
    console.log(`  before: ${article.excerpt}`)
    console.log(`  after:  ${fixed}`)
    if (!DRY_RUN) {
      await client.patch(article._id).set({ excerpt: fixed }).commit({ visibility: 'sync' })
    }
  }

  console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}${changed} excerpt(s) ${DRY_RUN ? 'would be' : ''} updated.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
