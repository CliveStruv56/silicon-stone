/**
 * Local drafting pipeline — replicates the website's /create generation flow,
 * but the Claude-model steps (research synthesis, draft, voice edit, metadata)
 * are performed by Claude Code on the user's Max plan instead of the paid API.
 *
 * This script only handles the NON-model I/O, reusing the exact same src/lib
 * functions the site uses so the output matches:
 *   - research        Exa search (same params as performResearch)
 *   - draft-prompt    Pinecone RAG + buildDraftPrompt  → prints the prompt
 *   - voice-prompt    buildVoiceEditPrompt             → prints the prompt
 *   - metadata-prompt buildMetadataPrompt              → prints the prompt
 *   - save            createArticleInSanity (markdown → Portable Text, draft doc)
 *
 * Claude Code does the model thinking between the prompt-printing steps. The
 * `ss-draft-local` skill drives the whole sequence.
 *
 * Run via npm (sets TSX_TSCONFIG_PATH so `server-only` is shimmed):
 *   npm run draft:local -- <subcommand> [flags]
 *
 * Runtime imports are dynamic and happen AFTER dotenv loads .env.local, because
 * the reused libs read process.env (and build clients) at module-eval time.
 */
import * as dotenv from 'dotenv'
import * as path from 'node:path'
import * as fs from 'node:fs'
import type { DraftFormat } from '../../src/lib/prompts'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

type Flags = Record<string, string | boolean>

interface ExaLite {
  title?: string | null
  url: string
  text?: string
}

interface ResearchData {
  summary?: string
  sources?: { title: string; url: string; snippet: string }[]
  painPoints?: string[]
  keywords?: string[]
  deepReport?: string
}

interface DraftPromptPayload {
  topic: string
  format: DraftFormat
  persona: string
  brief?: string
  research?: ResearchData
}

interface VoicePayload {
  title: string
  body: string
  format: DraftFormat
}

interface MetadataPayload {
  title: string
  body: string
  persona: string
  format: DraftFormat
}

interface SavePayload {
  title: string
  slug?: string
  excerpt?: string
  metaDescription?: string
  body: string
  format: DraftFormat
  persona: string
  seoTitle?: string
  stoneTruth?: string
  actionableInsights?: string[]
  categorySlugs?: string[]
  intelligenceTier?: 'pulse' | 'briefing' | 'audit'
  methodologyPillars?: string[]
  voiceEditNotes?: string
}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e))
const warn = (s: string): void => void process.stderr.write(`[warn] ${s}\n`)
function fail(s: string): never {
  process.stderr.write(`[error] ${s}\n`)
  process.exit(1)
}

function parseFlags(argv: string[]): Flags {
  const out: Flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      out[key] = next
      i++
    } else {
      out[key] = true
    }
  }
  return out
}

function readJson<T>(p: string | boolean | undefined): T {
  if (typeof p !== 'string') fail('--in <file.json> is required')
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as T
}

function printPrompt(system: string, user: string): void {
  process.stdout.write(`===SYSTEM===\n${system}\n\n===USER===\n${user}\n`)
}

function contentTypeFor(format: DraftFormat): 'signal' | 'deepdive' | 'guide' | 'youtube' {
  switch (format) {
    case 'youtube':
      return 'youtube'
    case 'deep_dive':
      return 'deepdive'
    case 'guide':
      return 'guide'
    default:
      return 'signal'
  }
}

/** Exa research — mirrors performResearch's source selection exactly. */
async function cmdResearch(flags: Flags): Promise<void> {
  const topic = typeof flags.topic === 'string' ? flags.topic : ''
  if (!topic) fail('--topic "..." is required')
  const deep = flags.deep === true

  const { searchExa, deepResearchExa } = await import('../../src/lib/exa')
  const { buildDeepInstructions } = await import('../../src/lib/research')

  let deepReport: string | null = null
  let raw: ExaLite[] = []

  if (deep) {
    const dr = await deepResearchExa(buildDeepInstructions(topic))
    deepReport = dr?.content ?? null
    raw = ((await searchExa(topic, { recencyDays: 90, numResults: 8 })) ?? []) as unknown as ExaLite[]
  } else {
    raw = ((await searchExa(topic, { recencyDays: 90, numResults: 8, category: 'news' })) ?? []) as unknown as ExaLite[]
    if (raw.length < 3) {
      const broad = ((await searchExa(topic, { recencyDays: null, numResults: 8 })) ?? []) as unknown as ExaLite[]
      const seen = new Set(raw.map((r) => r.url))
      raw = [...raw, ...broad.filter((r) => !seen.has(r.url))]
    }
  }

  const sources = raw.map((r) => ({
    title: r.title ?? '',
    url: r.url,
    snippet: typeof r.text === 'string' ? r.text.slice(0, 300) : '',
  }))

  process.stdout.write(`${JSON.stringify({ topic, deep, sources, deepReport }, null, 2)}\n`)
}

/** Pinecone RAG + buildDraftPrompt → prints the exact draft prompt. */
async function cmdDraftPrompt(flags: Flags): Promise<void> {
  const p = readJson<DraftPromptPayload>(flags.in)
  if (!p.topic || !p.format || !p.persona) fail('payload needs topic, format, persona')

  const { buildDraftPrompt } = await import('../../src/lib/prompts')

  let priorCoverage: string | undefined
  try {
    const { generateEmbedding } = await import('../../src/lib/embeddings')
    const { searchSimilar } = await import('../../src/lib/pinecone')
    const vector = await generateEmbedding(p.topic)
    const similar = await searchSimilar(vector, 5)
    if (similar.length > 0) {
      const lines = similar.map(
        (r) => `- "${r.metadata.title}": ${r.metadata.excerpt} (/analysis/${r.metadata.slug})`,
      )
      priorCoverage = `=== PRIOR COVERAGE IN YOUR KNOWLEDGE BASE ===\nYou have already written on related topics. Reference, extend, or differentiate from this prior work rather than repeating it:\n${lines.join('\n')}`
    }
  } catch (e) {
    warn(`Pinecone RAG skipped: ${errMsg(e)}`)
  }

  const research = p.research
  const { systemPrompt, userPrompt } = await buildDraftPrompt({
    topic: p.topic,
    personaKey: p.persona,
    format: p.format,
    research: research
      ? {
          summary: research.summary ?? '',
          sources: research.sources ?? [],
          painPoints: research.painPoints ?? [],
          keywords: research.keywords ?? [],
        }
      : undefined,
    priorCoverage,
    deepReport: research?.deepReport,
    brief: p.brief || undefined,
  })

  printPrompt(systemPrompt, userPrompt)
}

/** buildVoiceEditPrompt → prints the voice-edit prompt (and the mode). */
async function cmdVoicePrompt(flags: Flags): Promise<void> {
  const p = readJson<VoicePayload>(flags.in)
  if (!p.title || !p.body || !p.format) fail('payload needs title, body, format')

  const { buildVoiceEditPrompt, voiceEditModeForFormat } = await import('../../src/lib/prompts')
  const mode = voiceEditModeForFormat(p.format)
  process.stderr.write(`# voice-edit mode: ${mode}\n`)
  const { systemPrompt, userPrompt } = await buildVoiceEditPrompt(p.title, p.body, mode)
  printPrompt(systemPrompt, userPrompt)
}

/** buildMetadataPrompt (with live Sanity categories) → prints the metadata prompt. */
async function cmdMetadataPrompt(flags: Flags): Promise<void> {
  const p = readJson<MetadataPayload>(flags.in)
  if (!p.title || !p.body || !p.persona || !p.format) fail('payload needs title, body, persona, format')

  const { buildMetadataPrompt } = await import('../../src/lib/prompts')
  const { listSanityCategories } = await import('../../src/lib/sanity')

  const cats = await listSanityCategories()
  const categories = cats.map((c) => ({ slug: c.slug, title: c.title, description: c.description }))
  const requiredTier = p.format === 'pulse' ? ('pulse' as const) : undefined

  const { systemPrompt, userPrompt } = await buildMetadataPrompt(
    p.title,
    p.body,
    p.persona,
    categories,
    undefined,
    requiredTier,
  )
  printPrompt(systemPrompt, userPrompt)
}

/** createArticleInSanity — writes the assembled draft (markdown → Portable Text). */
async function cmdSave(flags: Flags): Promise<void> {
  const d = readJson<SavePayload>(flags.in)
  if (!d.title || !d.body || !d.format || !d.persona) fail('payload needs title, body, format, persona')

  const { createArticleInSanity } = await import('../../src/lib/sanity')
  const { slugify } = await import('../../src/lib/utils')

  const result = (await createArticleInSanity({
    title: d.title,
    slug: d.slug || slugify(d.title),
    excerpt: d.metaDescription || d.excerpt || '',
    body: d.body,
    contentType: contentTypeFor(d.format),
    persona: d.persona,
    seoTitle: d.seoTitle,
    metaDescription: d.metaDescription,
    stoneTruth: d.stoneTruth,
    actionableInsights: d.actionableInsights,
    categorySlugs: d.categorySlugs,
    intelligenceTier: d.format === 'pulse' ? 'pulse' : d.intelligenceTier,
    methodologyPillars: d.methodologyPillars,
    voiceEditNotes: d.voiceEditNotes,
    source: 'generated',
  })) as unknown as { _id?: string }

  process.stdout.write(`Saved draft: ${result?._id ?? '(unknown id)'}\n`)
  process.stdout.write('Open in Studio: https://siliconandstone.com/studio/structure/article\n')
}

/** Verify the server-only shim + lib graph load under tsx (no network calls). */
async function cmdSelftest(): Promise<void> {
  await import('../../src/lib/prompts')
  await import('../../src/lib/sanity')
  await import('../../src/lib/exa')
  await import('../../src/lib/pinecone')
  await import('../../src/lib/embeddings')
  await import('../../src/lib/research')
  process.stdout.write('imports ok\n')
}

const USAGE = `local-draft pipeline — reuse the site's /create flow on your Max plan

  npm run draft:local -- research        --topic "..." [--deep]
  npm run draft:local -- draft-prompt    --in <payload.json>
  npm run draft:local -- voice-prompt    --in <payload.json>
  npm run draft:local -- metadata-prompt --in <payload.json>
  npm run draft:local -- save            --in <payload.json>
  npm run draft:local -- selftest
`

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2)
  const flags = parseFlags(rest)
  switch (cmd) {
    case 'research':
      return cmdResearch(flags)
    case 'draft-prompt':
      return cmdDraftPrompt(flags)
    case 'voice-prompt':
      return cmdVoicePrompt(flags)
    case 'metadata-prompt':
      return cmdMetadataPrompt(flags)
    case 'save':
      return cmdSave(flags)
    case 'selftest':
      return cmdSelftest()
    default:
      process.stdout.write(USAGE)
      if (cmd) fail(`unknown subcommand: ${cmd}`)
  }
}

main().catch((e) => fail(errMsg(e)))
