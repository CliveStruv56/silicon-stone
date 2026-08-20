import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

/**
 * The markdown sync paths must produce DRAFTS, never published articles.
 *
 * In Sanity the document id IS the publish state: `drafts.x` is the unpublished
 * draft of `x`, and every other id is live. Both sync paths got this wrong, in
 * ways that looked deliberate:
 *
 *   - the admin Sync button built `` `draft.${fileSlug}` `` — SINGULAR, which
 *     Sanity treats as an ordinary id, so every sync published to the live site;
 *   - the CLI script called `client.create()` with no id (published), set
 *     `publishedAt` itself, and `.set()`-patched whatever document shared the
 *     slug — so a re-run could overwrite a published article's body.
 *
 * Either would publish an article carrying an unresolved [AUTHOR: …]
 * placeholder, which is the one thing the publish preflight exists to stop —
 * and neither goes near Studio, where that check runs.
 *
 * These are source assertions rather than behavioural tests because the failure
 * is a one-character id prefix and an argument to a network call; there is no
 * seam to exercise without writing to the real dataset. They are deliberately
 * literal: if the code is restructured, this test should fail and be rewritten,
 * not deleted.
 */

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '../..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

/**
 * Strip comments and type declarations before asserting on "what the code
 * does". Without this the assertions match their own rationale comments and the
 * `publishedAt` field on the SanityArticle interface — a test that fails on
 * prose is a test that gets weakened until it passes.
 */
function codeOnly(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^interface [\s\S]*?^\}$/gm, '')
}

describe('the admin Sync button', () => {
  const actions = read('src/app/(admin)/content/actions.ts')

  it('writes to a drafts. id', () => {
    expect(actions).toContain('const sanityId = `drafts.${fileSlug}`')
  })

  it('never uses the singular draft. prefix as a document id', () => {
    // `draft.` reads as "this is a draft" and means the exact opposite.
    expect(actions).not.toMatch(/=\s*`draft\.\$\{/)
  })
})

describe('scripts/sync-content.ts', () => {
  const raw = read('scripts/sync-content.ts')
  const script = codeOnly(raw)

  it('never calls client.create(), which publishes', () => {
    // create() with no _id lets Sanity assign a published id.
    expect(script).not.toMatch(/client\.create\s*\(/)
  })

  it('never patches a document it merely found by slug', () => {
    expect(script).not.toMatch(/client\.patch\([^)]*existing\._id/)
  })

  it('does not set publishedAt', () => {
    // Publishing is a human act in Studio; the date belongs to it.
    expect(script).not.toMatch(/^\s*publishedAt:/m)
  })

  it('writes only to a drafts. id', () => {
    expect(script).toMatch(/drafts\.\$\{/)
    const writes = [...script.matchAll(/createOrReplace\(/g)]
    expect(writes.length).toBeGreaterThan(0)
    // The only id the writer is given comes from resolveDraftTarget.
    expect(script).toContain('_id: target.draftId')
  })

  it('reads with the raw perspective, or it cannot see drafts at all', () => {
    // On apiVersion >= 2026-01-13 the default perspective hides drafts.*, so a
    // lookup without this silently reports "no existing draft" every time and
    // the sync would keep clobbering its own work.
    expect(script).toMatch(/perspective: 'raw'/)
  })
})
