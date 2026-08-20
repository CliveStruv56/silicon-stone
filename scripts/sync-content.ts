/**
 * Content Sync Script
 *
 * Syncs markdown articles from AI Writer System to Sanity CMS.
 *
 * It writes DRAFTS ONLY and never publishes. Review and publish in Studio,
 * where the publish preflight runs. See resolveDraftTarget() for why.
 *
 * Usage: npx tsx scripts/sync-content.ts
 *
 * Options:
 *   --dry-run    Preview what would be synced without making changes
 *   --force      Re-write the draft even when the source file is unchanged
 */

import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'
import { markdownToPortableText } from '../src/lib/markdown-to-portable-text'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Configuration
const AI_WRITER_CONTENT_PATH = process.env.AI_WRITER_CONTENT_PATH || path.join(process.cwd(), '../content/substack')
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '3q59mpd7'
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const SANITY_WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN

// Parse command line args
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const forceUpdate = args.includes('--force')

// Initialize Sanity client with write access
const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
})

// Types
interface ParsedArticle {
  title: string
  slug: string
  subjectLine: string
  previewText: string
  body: string
  filename: string
  hash: string
}

interface SanityArticle {
  _id: string
  _type: 'article'
  title: string
  slug: { _type: 'slug'; current: string }
  excerpt: string
  body: unknown[]
  publishedAt: string
  contentType: 'deepdive' | 'signal' | 'guide'
  sourceHash?: string
}

/**
 * Recursively get all markdown files from a directory
 */
function getAllMarkdownFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach(function (file) {
    // Skip hidden files/dirs (like .DS_Store, .git)
    if (file.startsWith('.')) return

    const fullPath = path.join(dirPath, file)

    if (fs.statSync(fullPath).isDirectory()) {
      getAllMarkdownFiles(fullPath, arrayOfFiles)
    } else {
      if (file.endsWith('.md')) {
        arrayOfFiles.push(fullPath)
      }
    }
  })

  return arrayOfFiles
}

/**
 * Parse a markdown file from AI Writer System format
 */
function parseMarkdownFile(filePath: string): ParsedArticle | null {
  const content = fs.readFileSync(filePath, 'utf-8')
  const filename = path.basename(filePath, '.md')
  const lines = content.split('\n')

  // Extract title (first line starting with #)
  let title = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      title = lines[i].replace(/^#\s*/, '').trim()
      break
    }
  }

  if (!title) {
    console.warn(`⚠️  No title found in ${filename}`)
    return null
  }

  // Extract Subject Line
  let subjectLine = ''
  for (const line of lines) {
    const match = line.match(/^\*\*Subject Line:\*\*\s*(.+)/)
    if (match) {
      subjectLine = match[1].trim()
      break
    }
  }

  // Extract Preview Text
  let previewText = ''
  for (const line of lines) {
    const match = line.match(/^\*\*Preview Text:\*\*\s*(.+)/)
    if (match) {
      previewText = match[1].trim()
      break
    }
  }

  // Extract body (everything after "## Article")
  let body = ''
  let inArticle = false
  for (const line of lines) {
    if (line.trim() === '## Article') {
      inArticle = true
      continue
    }
    if (inArticle) {
      body += line + '\n'
    }
  }
  body = body.trim()

  // Generate slug from filename or title
  let slug = filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '') // Remove date prefix if present
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // If no valid slug from filename, use title
  if (!slug || slug === 'md') {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Generate hash for change detection
  const hash = crypto.createHash('md5').update(content).digest('hex')

  return {
    title,
    slug,
    subjectLine,
    previewText,
    body,
    filename,
    hash,
  }
}

/**
 * Resolve where a synced article should be written.
 *
 * The sync writes DRAFTS ONLY, never published documents. In Sanity the id is
 * the publish state — `drafts.x` is the unpublished draft of `x`, anything else
 * is live. This script used to `client.create()` with no id (which publishes),
 * set `publishedAt`, and `.set()`-patch whatever document shared the slug —
 * so a re-run could overwrite a live article's body, and nothing ever passed
 * the publish preflight or its [AUTHOR: …] placeholder block.
 *
 * Resolution order:
 *  - an existing article with this slug (published or not) → write to ITS draft
 *    twin, so the sync stages an edit to that article rather than creating a
 *    duplicate with the same slug;
 *  - nothing yet → write to the deterministic `drafts.<slug>`.
 *
 * `perspective: 'raw'` is required: on apiVersion >= 2026-01-13 the client
 * defaults to the published perspective and cannot see `drafts.*` at all.
 */
async function resolveDraftTarget(
  slug: string,
): Promise<{ draftId: string; sourceHash?: string; existingPublishedId?: string }> {
  const rows: Array<{ _id: string; sourceHash?: string }> = await client.fetch(
    `*[_type == "article" && slug.current == $slug]{ _id, sourceHash }`,
    { slug },
    { perspective: 'raw' },
  )

  const published = rows.find((r) => !r._id.startsWith('drafts.'))
  const draftId = published ? `drafts.${published._id}` : `drafts.${slug}`
  const draft = rows.find((r) => r._id === draftId)

  return {
    draftId,
    // Prefer the draft's hash — it is what the previous sync wrote.
    sourceHash: draft?.sourceHash ?? published?.sourceHash,
    existingPublishedId: published?._id,
  }
}

/**
 * Create or update article in Sanity
 */
async function syncArticle(article: ParsedArticle): Promise<{ action: string; id: string }> {
  const target = await resolveDraftTarget(article.slug)

  // Check if we need to update
  if (target.sourceHash === article.hash && !forceUpdate) {
    return { action: 'skipped', id: target.draftId }
  }

  const portableText = markdownToPortableText(article.body)

  const doc: Partial<SanityArticle> & { _type: string; _id: string } = {
    _id: target.draftId,
    _type: 'article',
    title: article.title,
    slug: { _type: 'slug', current: article.slug },
    excerpt: article.subjectLine || article.previewText,
    body: portableText,
    // No publishedAt. Setting it here dated every synced article to the moment
    // the script ran, on a document nobody had reviewed. Studio sets it when a
    // human publishes.
    contentType: 'deepdive', // Default to deepdive
    sourceHash: article.hash,
  }

  // createOrReplace, always against the draft id — idempotent, and it cannot
  // reach a published document however many times it runs.
  const written = await client.createOrReplace(doc as SanityArticle & { _id: string })
  return {
    action: target.existingPublishedId ? 'staged-edit' : 'drafted',
    id: written._id,
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('\n🔄 Silicon and Stone Content Sync\n')
  console.log(`   Source: ${AI_WRITER_CONTENT_PATH}`)
  console.log(`   Target: Sanity (${SANITY_PROJECT_ID}/${SANITY_DATASET})`)
  if (isDryRun) console.log('   Mode: DRY RUN (no changes will be made)')
  if (forceUpdate) console.log('   Mode: FORCE UPDATE (overwriting all)')
  console.log('')

  // Check for write token
  if (!SANITY_WRITE_TOKEN && !isDryRun) {
    console.error('❌ Error: SANITY_API_WRITE_TOKEN environment variable is required')
    console.error('   Add it to your .env.local file or export it before running')
    console.error('\n   To get a write token:')
    console.error('   1. Go to https://www.sanity.io/manage')
    console.error('   2. Select your project (3q59mpd7)')
    console.error('   3. Go to API > Tokens')
    console.error('   4. Create a new token with "Editor" permissions')
    process.exit(1)
  }

  // Check if source directory exists
  if (!fs.existsSync(AI_WRITER_CONTENT_PATH)) {
    console.error(`❌ Error: Source directory not found: ${AI_WRITER_CONTENT_PATH}`)
    process.exit(1)
  }

  // Get all markdown files recursively
  const files = getAllMarkdownFiles(AI_WRITER_CONTENT_PATH)

  console.log(`📁 Found ${files.length} markdown files\n`)

  // Parse and sync each file
  const results = { created: 0, updated: 0, skipped: 0, failed: 0 }

  for (const file of files) {
    const filename = path.basename(file)
    const article = parseMarkdownFile(file)

    if (!article) {
      console.log(`   ⚠️  ${filename}: Failed to parse`)
      results.failed++
      continue
    }

    if (isDryRun) {
      console.log(`   📝 ${filename}`)
      console.log(`      Title: ${article.title}`)
      console.log(`      Slug: ${article.slug}`)
      console.log(`      Excerpt: ${article.subjectLine?.slice(0, 50)}...`)
      console.log('')
      continue
    }

    try {
      const result = await syncArticle(article)

      switch (result.action) {
        case 'drafted':
          console.log(`   ✅ ${filename}: New draft (${result.id})`)
          results.created++
          break
        case 'staged-edit':
          console.log(`   🔄 ${filename}: Edit staged as a draft of the published article (${result.id})`)
          results.updated++
          break
        case 'skipped':
          console.log(`   ⏭️  ${filename}: Unchanged, skipped`)
          results.skipped++
          break
      }
    } catch (error) {
      console.error(`   ❌ ${filename}: Error - ${error}`)
      results.failed++
    }
  }

  // Summary
  console.log('\n📊 Summary:')
  if (!isDryRun) {
    console.log(`   Created: ${results.created}`)
    console.log(`   Updated: ${results.updated}`)
    console.log(`   Skipped: ${results.skipped}`)
    console.log(`   Failed:  ${results.failed}`)
  } else {
    console.log(`   Files parsed: ${files.length - results.failed}`)
    console.log(`   Parse errors: ${results.failed}`)
  }
  console.log('')
}

main().catch(console.error)
