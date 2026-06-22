import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

dotenv.config({ path: '.env.local' })

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) throw new Error('SANITY_API_WRITE_TOKEN is required to annotate articles')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  token,
  useCdn: false,
  perspective: 'raw',
})

// Inline glossary annotations, applied to the FIRST meaningful mention of each
// term in each article's body. Non-destructive and idempotent: a term that
// already carries a glossaryTerm mark in the article is skipped, so this can be
// re-run and extended to more articles without disturbing editorial changes.
// `term` is a glossary slug (resolved to the `glossary-<slug>` document id);
// `match` is the exact body text to wrap on its first whole-word occurrence in
// a normal paragraph (headings are never annotated).
type Annotation = { term: string; match: string }

const PLAN: Record<string, Annotation[]> = {
  'eu-ai-act-compliance-chasm-august-2026': [
    { term: 'european-commission', match: 'European Commission' },
    { term: 'eu-ai-act', match: 'AI Act' },
    { term: 'small-and-medium-sized-enterprise', match: 'SMEs' },
    { term: 'ai-provider', match: 'AI provider' },
    { term: 'notified-body', match: 'Notified Body' },
    { term: 'ai-deployer', match: 'deployers' },
  ],
  'korean-memory-fab-capacity-squeeze-2027': [
    { term: 'dram', match: 'DRAM' },
    { term: 'nand-flash-memory', match: 'NAND flash' },
    { term: 'high-bandwidth-memory', match: 'High Bandwidth Memory' },
    { term: 'nvidia', match: 'NVIDIA' },
    { term: 'graphics-processing-unit', match: 'GPUs' },
    { term: 'amd', match: 'AMD' },
    { term: 'tensor-processing-unit', match: 'TPU' },
    { term: 'chips-and-science-act', match: 'CHIPS Act' },
    { term: 'european-chips-act', match: 'European Chips Act' },
    { term: 'original-equipment-manufacturer', match: 'OEMs' },
    { term: 'export-controls', match: 'export controls' },
    { term: 'through-silicon-via', match: 'Through-Silicon Via' },
    { term: 'extreme-ultraviolet-lithography', match: 'EUV' },
    { term: 'asml', match: 'ASML' },
    { term: 'tsmc', match: 'TSMC' },
    { term: 'bureau-of-industry-and-security', match: 'Bureau of Industry and Security' },
    { term: 'eu-ai-act', match: 'EU AI Act' },
    { term: 'ai-inference', match: 'AI inference' },
  ],
  'iran-conflict-european-technology-supply-crisis': [
    { term: 'tsmc', match: 'TSMC' },
    { term: 'multi-layer-ceramic-capacitor', match: 'MLCC' },
    { term: 'internet-of-things', match: 'IoT' },
    { term: 'liquefied-natural-gas', match: 'LNG' },
    { term: 'ai-inference', match: 'AI inference' },
    { term: 'hyperscaler', match: 'hyperscalers' },
    { term: 'european-chips-act', match: 'EU Chips Act' },
    { term: 'digital-sovereignty', match: 'digital sovereignty' },
    { term: 'eu-ai-act', match: 'AI Act' },
    { term: 'eu-data-act', match: 'Data Act' },
  ],
  'helium-scarcity-semiconductor-production': [
    { term: 'tsmc', match: 'TSMC' },
    { term: 'foundry', match: 'foundry' },
    { term: 'fab', match: 'fab' },
    { term: 'liquefied-natural-gas', match: 'LNG' },
    { term: 'digital-sovereignty', match: 'Digital sovereignty' },
    { term: 'eu-ai-act', match: 'EU AI Act' },
    { term: 'chips-and-science-act', match: 'CHIPS Act' },
    { term: 'export-controls', match: 'export controls' },
  ],
  'semiconductor-testing-bottleneck-ai-accelerators': [
    { term: 'nvidia', match: 'NVIDIA' },
    { term: 'amd', match: 'AMD' },
    { term: 'high-bandwidth-memory', match: 'High Bandwidth Memory' },
    { term: 'cowos', match: 'CoWoS' },
    { term: 'tsmc', match: 'TSMC' },
    { term: 'automated-test-equipment', match: 'automated test equipment' },
    { term: 'chips-and-science-act', match: 'CHIPS Act' },
    { term: 'european-chips-act', match: 'European Chips Act' },
    { term: 'digital-sovereignty', match: 'digital sovereignty' },
  ],
  'atlantic-fault-lines-us-tech-policy-eu-autonomy': [
    { term: 'gdpr', match: 'GDPR' },
    { term: 'digital-markets-act', match: 'Digital Markets Act' },
    { term: 'digital-sovereignty', match: 'digital sovereignty' },
    { term: 'asml', match: 'ASML' },
    { term: 'export-controls', match: 'export control' },
    { term: 'eu-ai-act', match: 'AI Act' },
  ],
  'us-national-ai-policy-acceleration': [
    { term: 'food-and-drug-administration', match: 'FDA' },
    { term: 'agentic-ai', match: 'Agentic AI' },
    { term: 'export-controls', match: 'export control' },
  ],
  'caidas-sovereignty-tiers-legal-architecture-or-hyperscaler': [
    { term: 'european-commission', match: 'European Commission' },
    { term: 'hyperscaler', match: 'hyperscalers' },
    { term: 'amazon-web-services', match: 'AWS' },
    { term: 'digital-sovereignty', match: 'digital sovereignty' },
    { term: 'eucs', match: 'EUCS' },
    { term: 'bsi', match: 'BSI' },
    { term: 'anssi', match: 'ANSSI' },
  ],
  'open-source-sovereignty': [
    { term: 'european-chips-act', match: 'Chips Act' },
    { term: 'digital-sovereignty', match: 'digital sovereignty' },
    { term: 'hyperscaler', match: 'hyperscalers' },
    { term: 'amazon-web-services', match: 'AWS' },
    { term: 'tsmc', match: 'TSMC' },
    { term: 'open-weight-model', match: 'open-weight models' },
    { term: 'openstack', match: 'OpenStack' },
    { term: 'kubernetes', match: 'Kubernetes' },
    { term: 'gaia-x', match: 'Gaia-X' },
    { term: 'eu-ai-act', match: 'AI Act' },
  ],
  'tariff-enforcement-collision': [
    { term: 'eu-ai-act', match: 'AI Act' },
    { term: 'european-commission', match: 'EU Commission' },
    { term: 'foundation-model', match: 'foundation models' },
  ],
  // Greenland (critical minerals/Arctic extraction) uses no glossary vocabulary
  // in its prose — its only two defined terms sat in the source-citation list,
  // so it is intentionally left unannotated (shows zero highlights).
  'welcome-to-silicon-and-stone': [
    { term: 'agentic-ai', match: 'Agentic AI' },
    { term: 'eu-ai-act', match: 'AI Act' },
    { term: 'digital-sovereignty', match: 'digital sovereignty' },
    { term: 'foundry', match: 'foundry' },
    { term: 'export-controls', match: 'export controls' },
    { term: 'original-equipment-manufacturer', match: 'OEM' },
  ],
}

type Span = { _key: string; _type: string; text?: string; marks?: string[] }
type Block = { _key: string; _type: string; style?: string; children?: Span[]; markDefs?: Array<{ _key: string; _type: string; term?: { _ref?: string } }> }

let keyCounter = 0
function genKey(): string {
  keyCounter += 1
  return `g${keyCounter.toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Some drafts carry newsletter/production scaffolding as ordinary paragraphs
// (subject lines, word counts, persona notes, source lists). Never annotate
// inside those — first mentions must land in genuine body prose.
const META_PREFIXES = [
  'Subject Line:',
  'Preview Text:',
  'Word count:',
  'Reading time:',
  'Persona relevance:',
  'Personas Target:',
  'Persona Target:',
  'Voice adjustment',
  'Sources referenced:',
  'Sources:',
  'Cross-reference:',
  'Tags:',
  'Category:',
]

function blockText(block: Block): string {
  return (block.children ?? []).map((span) => span.text ?? '').join('')
}

function isMetaBlock(block: Block): boolean {
  const text = blockText(block).trimStart()
  return META_PREFIXES.some((prefix) => text.startsWith(prefix))
}

function splitSpan(span: Span, start: number, length: number, markKey: string): Span[] {
  const text = span.text ?? ''
  const marks = span.marks ?? []
  const before = text.slice(0, start)
  const mid = text.slice(start, start + length)
  const after = text.slice(start + length)
  const out: Span[] = []
  let usedOriginalKey = false
  const nextKey = () => {
    if (!usedOriginalKey) {
      usedOriginalKey = true
      return span._key
    }
    return genKey()
  }
  if (before) out.push({ ...span, _key: nextKey(), text: before, marks: [...marks] })
  out.push({ ...span, _key: nextKey(), text: mid, marks: [...marks, markKey] })
  if (after) out.push({ ...span, _key: nextKey(), text: after, marks: [...marks] })
  return out
}

async function annotateArticle(slug: string, annotations: Annotation[], validRefs: Set<string>) {
  const id = await client.fetch<string | null>(
    '*[_type == "article" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id',
    { slug }
  )
  if (!id) {
    console.log(`✗ ${slug}: no published article found — skipped`)
    return
  }

  const doc = await client.getDocument<{ body?: Block[] }>(id)
  const body = (doc?.body ?? []) as Block[]
  if (!body.length) {
    console.log(`✗ ${slug}: empty body — skipped`)
    return
  }

  let added = 0
  let skipped = 0
  const notFound: string[] = []

  for (const ann of annotations) {
    const ref = `glossary-${ann.term}`
    if (!validRefs.has(ref)) {
      console.log(`  ! ${slug}: glossary term "${ann.term}" does not exist — skipped`)
      continue
    }

    // Idempotency: if this term is already annotated anywhere in the body, skip.
    const already = body.some((block) =>
      block.markDefs?.some((def) => def._type === 'glossaryTerm' && def.term?._ref === ref)
    )
    if (already) {
      skipped += 1
      continue
    }

    const regex = new RegExp(`\\b${escapeRegExp(ann.match)}\\b`)
    let placed = false

    for (const block of body) {
      if (block._type !== 'block' || block.style !== 'normal' || isMetaBlock(block)) continue
      const children = block.children ?? []
      for (let si = 0; si < children.length; si += 1) {
        const span = children[si]
        if (span._type !== 'span') continue
        const match = regex.exec(span.text ?? '')
        if (!match) continue

        const markKey = genKey()
        block.markDefs = [
          ...(block.markDefs ?? []),
          { _key: markKey, _type: 'glossaryTerm', term: { _ref: ref, _type: 'reference' } as { _ref: string } },
        ]
        const replacement = splitSpan(span, match.index, match[0].length, markKey)
        block.children = [...children.slice(0, si), ...replacement, ...children.slice(si + 1)]
        placed = true
        added += 1
        break
      }
      if (placed) break
    }

    if (!placed) notFound.push(`${ann.term} ("${ann.match}")`)
  }

  if (added > 0) {
    await client.patch(id).set({ body }).commit({ visibility: 'sync' })
  }

  console.log(
    `✓ ${slug}: ${added} added, ${skipped} already present` +
      (notFound.length ? `, ${notFound.length} not found → ${notFound.join(', ')}` : '')
  )
}

async function run() {
  const ids = await client.fetch<string[]>('*[_type == "glossaryTerm"]._id')
  const validRefs = new Set(ids)

  for (const [slug, annotations] of Object.entries(PLAN)) {
    await annotateArticle(slug, annotations, validRefs)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
