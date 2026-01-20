/**
 * Content Sync Script
 *
 * Syncs markdown articles from AI Writer System to Sanity CMS
 *
 * Usage: npx tsx scripts/sync-content.ts
 *
 * Options:
 *   --dry-run    Preview what would be synced without making changes
 *   --force      Overwrite existing articles even if unchanged
 */

import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// Configuration
const AI_WRITER_CONTENT_PATH = '/Users/clivestruver/Projects/AI-Writer-System/Content/substack'
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
  apiVersion: '2024-01-01',
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
 * Parse a markdown file from AI Writer System format
 */
function parseMarkdownFile(filePath: string): ParsedArticle | null {
  const content = fs.readFileSync(filePath, 'utf-8')
  const filename = path.basename(filePath, '.md')
  const lines = content.split('\n')

  // Extract title (first line starting with #)
  let title = ''
  let titleLineIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      title = lines[i].replace(/^#\s*/, '').trim()
      titleLineIndex = i
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
 * Convert markdown to Sanity Portable Text blocks
 * This is a simplified converter - handles basic markdown
 */
function markdownToPortableText(markdown: string): unknown[] {
  const blocks: unknown[] = []
  const lines = markdown.split('\n')
  let currentParagraph: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim()
      if (text) {
        blocks.push({
          _type: 'block',
          _key: crypto.randomUUID().slice(0, 8),
          style: 'normal',
          markDefs: [],
          children: parseInlineMarkdown(text),
        })
      }
      currentParagraph = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Horizontal rule
    if (line.trim() === '---') {
      flushParagraph()
      continue // Skip horizontal rules
    }

    // Headings
    if (line.startsWith('### ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: crypto.randomUUID().slice(0, 8),
        style: 'h3',
        markDefs: [],
        children: [{ _type: 'span', _key: crypto.randomUUID().slice(0, 8), text: line.replace(/^###\s*/, ''), marks: [] }],
      })
      continue
    }

    if (line.startsWith('## ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: crypto.randomUUID().slice(0, 8),
        style: 'h2',
        markDefs: [],
        children: [{ _type: 'span', _key: crypto.randomUUID().slice(0, 8), text: line.replace(/^##\s*/, ''), marks: [] }],
      })
      continue
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      flushParagraph()
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        _key: crypto.randomUUID().slice(0, 8),
        style: 'blockquote',
        markDefs: [],
        children: parseInlineMarkdown(line.replace(/^>\s*/, '')),
      })
      continue
    }

    // Regular paragraph content
    currentParagraph.push(line)
  }

  flushParagraph()
  return blocks
}

/**
 * Parse inline markdown (bold, italic, links) into Portable Text spans
 */
function parseInlineMarkdown(text: string): unknown[] {
  const spans: unknown[] = []
  const markDefs: unknown[] = []

  // Simplified: just handle bold (**text**) and create plain spans
  // A full implementation would handle links, italic, etc.
  let remaining = text
  let lastIndex = 0

  // Match bold text
  const boldRegex = /\*\*(.+?)\*\*/g
  let match
  const parts: { text: string; bold: boolean }[] = []
  let currentIndex = 0

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push({ text: text.slice(currentIndex, match.index), bold: false })
    }
    // Add the bold text
    parts.push({ text: match[1], bold: true })
    currentIndex = match.index + match[0].length
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push({ text: text.slice(currentIndex), bold: false })
  }

  // If no bold found, just return the whole text
  if (parts.length === 0) {
    return [{ _type: 'span', _key: crypto.randomUUID().slice(0, 8), text, marks: [] }]
  }

  // Convert parts to spans
  for (const part of parts) {
    spans.push({
      _type: 'span',
      _key: crypto.randomUUID().slice(0, 8),
      text: part.text,
      marks: part.bold ? ['strong'] : [],
    })
  }

  return spans
}

/**
 * Check if article already exists in Sanity
 */
async function getExistingArticle(slug: string): Promise<{ _id: string; sourceHash?: string } | null> {
  const result = await client.fetch(
    `*[_type == "article" && slug.current == $slug][0]{ _id, sourceHash }`,
    { slug }
  )
  return result
}

/**
 * Create or update article in Sanity
 */
async function syncArticle(article: ParsedArticle): Promise<{ action: string; id: string }> {
  const existing = await getExistingArticle(article.slug)

  // Check if we need to update
  if (existing && !forceUpdate && existing.sourceHash === article.hash) {
    return { action: 'skipped', id: existing._id }
  }

  const portableText = markdownToPortableText(article.body)

  const doc: Partial<SanityArticle> & { _type: string } = {
    _type: 'article',
    title: article.title,
    slug: { _type: 'slug', current: article.slug },
    excerpt: article.subjectLine || article.previewText,
    body: portableText,
    publishedAt: new Date().toISOString(),
    contentType: 'deepdive', // Default to deepdive
    sourceHash: article.hash,
  }

  if (existing) {
    // Update existing
    const updated = await client.patch(existing._id).set(doc).commit()
    return { action: 'updated', id: updated._id }
  } else {
    // Create new
    const created = await client.create(doc)
    return { action: 'created', id: created._id }
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

  // Get all markdown files
  const files = fs.readdirSync(AI_WRITER_CONTENT_PATH)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(AI_WRITER_CONTENT_PATH, f))

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
        case 'created':
          console.log(`   ✅ ${filename}: Created (${result.id})`)
          results.created++
          break
        case 'updated':
          console.log(`   🔄 ${filename}: Updated (${result.id})`)
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
