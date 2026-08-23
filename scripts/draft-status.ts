/**
 * What is blocking each unpublished draft.
 *
 *   npm run articles:draft-status
 *
 * Read-only. It runs `preflightArticle()` — the *same* function the Studio
 * publish dialog and `/api/on-publish` run — over every draft, so what it
 * reports and what the dialog will say cannot drift. That is the whole reason
 * it reuses the function rather than re-deriving the rules: a second opinion
 * about whether a draft is finished is how this repo has produced most of its
 * defects.
 *
 * It answers a question the Studio cannot: the dialog tells you about the one
 * draft you have open, and there is no view anywhere that says *"of the drafts
 * waiting, which are finished, which need a human, and which need a fact-check
 * run."* Opening ten documents one at a time to find out is the manual step this
 * removes.
 *
 * It publishes nothing and changes nothing. Publishing stays a human act in
 * Studio, where the guard and the date stamp live.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

import { createClient } from '@sanity/client'
import { preflightArticle, hasBlocker, type PreflightDocument } from '../src/lib/publish-preflight'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_READ_TOKEN

if (!projectId || !token) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_READ_TOKEN in .env.local')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  useCdn: false,
  // Drafts are invisible under the default perspective on this apiVersion, and
  // the script would cheerfully report "no drafts" rather than failing.
  perspective: 'raw',
})

type Draft = PreflightDocument & {
  _id: string
  /** Narrowed locally: PreflightDocument keeps citations opaque, and this only
   * needs to count them. */
  citations?: unknown[]
  title?: string
  slug?: string
  hasImage?: boolean
  categoryCount?: number
  /** The body as plain text; counted rather than stored as a number so the
   * query stays a projection and the rule lives here. */
  words?: string
  _createdAt?: string
}

/**
 * The words a reader will actually read.
 *
 * A raw count over the body is wrong in a way that matters, and it misled this
 * check on its first run: `[AUTHOR: …]` markers are *instructions to the
 * author*, often a full sentence each, and they are removed before anything is
 * published. Counting them reported a Pulse at 423 words when the prose was
 * 296 — the difference between "three times over budget" and "on budget".
 *
 * The newsletter furniture (`Subject Line:`, `Preview Text:`) is stripped at
 * write time by `stripAuthoringPreamble`, so it should never be here; it is
 * excluded anyway for the drafts written before that landed, and because a
 * count that disagrees with the page a reader sees is not worth printing.
 */
function wordCount(draft: Draft): number {
  if (!draft.words) return 0
  const readable = draft.words
    .replace(/\[AUTHOR:[^\]]*\]?/g, ' ')
    .split('\n')
    .filter((line) => !/^\s*(subject line|preview text|last reviewed)\s*:/i.test(line))
    .join('\n')
  return readable.trim().split(/\s+/).filter(Boolean).length
}

/**
 * What each format is supposed to run to, so drift is visible rather than
 * discovered two months later.
 *
 * Only the tier is on the document — Pulse and Signal are both stored as
 * `contentType: 'signal'` — so this keys on `intelligenceTier`, which is what
 * the reader's badge says. A piece badged Pulse is a 30-second scan whichever
 * generator made it, so the budget applies either way.
 *
 * The numbers are the prompts' own, and `npm run test:manual` holds those to the
 * operator manual. A Pulse drafted at 429 words against a then-100–140 budget is
 * what put this here (2026-08-23); the budget moved to 250–300 the same day.
 */
const TIER_WORD_CEILING: Record<string, number> = {
  pulse: 300,
}

/** Conditions Studio itself enforces, which the preflight deliberately does not.
 * A draft can be preflight-clean and still have an inert Publish button. */
function studioBlockers(draft: Draft): string[] {
  const missing: string[] = []
  if (!draft.title?.trim()) missing.push('title')
  if (!draft.slug) missing.push('slug')
  if (!draft.categoryCount) missing.push('at least one category')
  return missing
}

async function main(): Promise<void> {
  const drafts = await client.fetch<Draft[]>(
    `*[_type == "article" && _id in path("drafts.**")]{
       _id, title, contentType, intelligenceTier, excerpt, stoneTruth,
       actionableInsights, body, citations, quotationAudit, factCheck,
       "slug": slug.current,
       "hasImage": defined(mainImage),
       "categoryCount": count(categories),
       "words": pt::text(body),
       _createdAt
     } | order(_createdAt asc)`,
  )

  console.log(`\nDraft status — ${dataset}   (read-only)\n`)

  let ready = 0
  for (const draft of drafts) {
    const issues = preflightArticle(draft)
    const inert = studioBlockers(draft)
    const state = inert.length
      ? 'CANNOT PUBLISH'
      : hasBlocker(issues)
        ? 'BLOCKED'
        : issues.length
          ? 'WARNINGS'
          : 'READY'
    if (state === 'READY') ready += 1

    console.log(`${state.padEnd(15)} ${(draft.title ?? draft._id).slice(0, 62)}`)
    console.log(
      `                ${draft._createdAt?.slice(0, 10) ?? '?'} · ` +
        `${draft.contentType ?? 'no format'} · ${draft.intelligenceTier ?? 'no tier'} · ` +
        `${draft.citations?.length ?? 0} source(s) · image ${draft.hasImage ? 'yes' : 'no'} · ` +
        `${wordCount(draft)} words`,
    )
    const ceiling = draft.intelligenceTier ? TIER_WORD_CEILING[draft.intelligenceTier] : undefined
    if (ceiling && wordCount(draft) > ceiling) {
      console.log(
        `                [length] ${wordCount(draft)} words, badged ${draft.intelligenceTier} — the budget is ${ceiling}`,
      )
    }
    if (inert.length) {
      console.log(`                [STUDIO] Publish is disabled until it has: ${inert.join(', ')}`)
    }
    for (const issue of issues) {
      console.log(`                [${issue.severity === 'blocker' ? 'MUST FIX' : 'check'}] ${issue.title}`)
      // The detail on a blocker is the actionable half — for a placeholder it
      // is the exact text a human still owes a fact, which is the difference
      // between "four drafts are blocked" and a list you can work through.
      if (issue.severity === 'blocker') {
        for (const line of issue.detail.split('\n')) {
          if (line.trim()) console.log(`                         ${line.trim()}`)
        }
      }
    }
    console.log()
  }

  console.log(`   ${drafts.length} draft(s) · ${ready} with nothing outstanding\n`)
}

main().catch((error) => {
  console.error('\nDraft status failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
