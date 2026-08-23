/**
 * Give every article that needs a cover image two "what to depict" prompts.
 *
 *   npm run articles:image-prompts              report what is missing
 *   npm run articles:image-prompts -- --write   generate and store them
 *
 * **Dry run by default**, as every write script in this repo is.
 *
 * Why it exists: `/create` has generated image prompts as pass 4 of 4 since the
 * feature landed (`src/lib/draft-pipeline.ts`), but the back catalogue predates
 * it. Measured 2026-08-23: of the eight published articles with no `mainImage`,
 * **all eight** carried zero prompts, as did six of the nine image-less drafts.
 * Only five articles in the whole dataset had any. So the operator's loop for a
 * back-catalogue article did not start at "copy the prompt" — it started at
 * "read the article and invent one", which is the expensive part.
 *
 * It targets articles that need an image and have no prompts. An article that
 * already has a cover does not need a prompt, and one that already has prompts
 * has what it needs; both are skipped. Re-running after a write is a verified
 * no-op.
 *
 * **The prompts describe subject only, never style.** That is the whole design
 * of `src/lib/image-prompts.ts` — the house illustration style belongs to the
 * external image agent the operator runs next. This script reuses
 * `resolveImagePromptTarget` and `generateImagePrompts` unchanged rather than
 * restating any of it: the system prompt in that module is the only written
 * record of the house image style anywhere in the repo, and a second copy is
 * how it starts to drift.
 *
 * **The draft is preferred over the published document**, via the resolver the
 * Studio route already uses. Where only a published document exists it is
 * patched directly — the exception to this repo's draft-only rule, and a
 * deliberate one: `imagePrompts` is internal metadata, projected by no public
 * query and rendered on no page, so writing it to a published article cannot
 * change anything a reader sees.
 *
 * Model calls are sequential, not batched. Fourteen articles is a small job and
 * a serial loop keeps one failure from taking the rest of the run with it.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

// Static imports are hoisted above dotenv.config(), so anything that reads an
// environment variable at module load must be imported inside main(). Same trap
// and same workaround as scripts/knowledge-sync.ts.
import { createClient } from '@sanity/client'

const write = process.argv.includes('--write')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !token) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env.local')
  process.exit(1)
}

const sanity = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  useCdn: false,
  perspective: 'raw',
})

interface Row {
  _id: string
  title?: string
  hasImage: boolean
  promptCount: number
}

interface Candidate {
  baseId: string
  title: string
}

/**
 * Collapse the draft and published variants of one article into a single row,
 * preferring the draft — which is what `resolveImagePromptTarget` will pick, so
 * the report and the write must agree about which document they are describing.
 */
function chooseTargets(rows: Row[]): Map<string, { row: Row; isDraft: boolean }> {
  const byBase = new Map<string, { row: Row; isDraft: boolean }>()
  for (const row of rows) {
    const isDraft = row._id.startsWith('drafts.')
    const baseId = row._id.replace(/^drafts\./, '')
    const existing = byBase.get(baseId)
    if (!existing || (isDraft && !existing.isDraft)) {
      byBase.set(baseId, { row, isDraft })
    }
  }
  return byBase
}

async function main(): Promise<void> {
  console.log(
    `\nImage prompts — ${dataset}${write ? '' : '   (DRY RUN — pass --write to change anything)'}\n`,
  )

  const rows = await sanity.fetch<Row[]>(
    `*[_type == "article"]{
       _id,
       title,
       "hasImage": defined(mainImage.asset),
       "promptCount": count(coalesce(imagePrompts.prompts, []))
     } | order(_createdAt asc)`,
  )

  const targets = chooseTargets(rows)

  const candidates: Candidate[] = []
  for (const [baseId, { row }] of targets) {
    if (row.hasImage || row.promptCount > 0) continue
    candidates.push({ baseId, title: row.title ?? baseId })
  }

  for (const [, { row, isDraft }] of targets) {
    const needs = !row.hasImage && row.promptCount === 0
    const state = row.hasImage
      ? 'has a cover'
      : row.promptCount > 0
        ? `${row.promptCount} prompt(s) already`
        : 'needs prompts'
    console.log(
      `   ${needs ? '+' : ' '} ${(row.title ?? row._id).slice(0, 52).padEnd(54)}` +
        `${(isDraft ? 'draft' : 'published').padEnd(10)}${state}`,
    )
  }

  console.log(`\n   ${targets.size} article(s) · ${candidates.length} needing prompts\n`)

  if (candidates.length === 0) {
    console.log('   Nothing to do.\n')
    return
  }
  if (!write) {
    console.log('   Nothing changed. Re-run with --write to generate them.\n')
    return
  }

  // Deferred until we know there is work: importing this pulls in the Anthropic
  // and Sanity clients, which read env at module load.
  const { resolveImagePromptTarget, generateImagePrompts } = await import('../src/lib/image-prompts')

  let done = 0
  const failures: { title: string; reason: string }[] = []

  for (const candidate of candidates) {
    process.stdout.write(`   ${candidate.title.slice(0, 52).padEnd(54)}`)
    try {
      const target = await resolveImagePromptTarget(candidate.baseId)
      if (!target) {
        failures.push({ title: candidate.title, reason: 'document disappeared between read and write' })
        console.log('not found')
        continue
      }
      const prompts = await generateImagePrompts(target.targetId, target.article)
      done += 1
      console.log(`${prompts.length} prompt(s)`)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      failures.push({ title: candidate.title, reason })
      console.log('FAILED')
    }
  }

  console.log(`\n   Generated prompts for ${done} of ${candidates.length} article(s).`)

  if (failures.length > 0) {
    console.log(`\n   ${failures.length} failed:`)
    for (const failure of failures) {
      console.log(`     ${failure.title.slice(0, 52).padEnd(54)}${failure.reason}`)
    }
    console.log('\n   Re-run to retry only these — the ones that succeeded are now skipped.')
  }

  console.log('   Confirm with a re-run: it should report 0 needing prompts.\n')
}

main().catch((error) => {
  console.error('\nImage-prompt backfill failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
