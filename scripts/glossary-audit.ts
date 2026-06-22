import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { createClient } from '@sanity/client'
import { GLOSSARY_SEED_TERMS } from '../src/lib/glossary-seed'
import { normaliseGlossaryText } from '../src/lib/glossary'

dotenv.config({ path: '.env.local' })

const ALLOWLIST = new Set(['AI', 'EU', 'UK', 'US', 'URL', 'PDF', 'SEO', 'CTA', 'API', 'VAT', 'Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2'])
const known = new Set<string>()

for (const term of GLOSSARY_SEED_TERMS) {
  for (const value of [term.acronym, term.name, term.fullName, ...(term.aliases ?? [])]) {
    if (value) known.add(normaliseGlossaryText(value))
  }
}

function collectCandidates(text: string, source: string, result: Map<string, Set<string>>) {
  for (const match of text.matchAll(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*\b/g)) {
    const value = match[0]
    if (value.length < 2 || ALLOWLIST.has(value) || known.has(normaliseGlossaryText(value))) continue
    const sources = result.get(value) ?? new Set<string>()
    sources.add(source)
    result.set(value, sources)
  }
}

async function audit() {
  const result = new Map<string, Set<string>>()
  const files = execFileSync('git', ['ls-files', 'src/app/(website)', 'src/components', 'src/lib/*.ts'], { encoding: 'utf8' })
    .split('\n')
    .filter((file) => /\.(tsx?|md)$/.test(file))

  for (const file of files) collectCandidates(readFileSync(file, 'utf8'), file, result)

  if (
    process.argv.includes('--published') &&
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
    process.env.NEXT_PUBLIC_SANITY_DATASET
  ) {
    try {
      const client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
        useCdn: true,
      })
      const articles = await client.fetch<Array<{ slug: string; text: string }>>(
        `*[_type == "article" && !(_id in path("drafts.**"))]{"slug": slug.current, "text": pt::text(body)}`,
        {},
        { signal: AbortSignal.timeout(10_000) }
      )
      for (const article of articles) collectCandidates(article.text ?? '', `article:${article.slug}`, result)
    } catch (error) {
      console.warn(`Published-article scan skipped: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (!result.size) {
    console.log('No unrecognised acronym candidates found.')
    return
  }

  console.log('Unrecognised acronym candidates (editorial review only):')
  for (const [term, sources] of [...result].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`${term}\t${[...sources].slice(0, 4).join(', ')}`)
  }
}

audit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
