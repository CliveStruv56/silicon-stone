import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { writeClient } from '@/lib/sanity'
import { KNOWLEDGE_BRAND_TAGS, type KnowledgeBrandTag } from '@/lib/knowledge-inbox'
// This route still creates a legacy `knowledgeCandidate`, on purpose. Moving it
// onto `knowledgeItem` is the migration and cutover wave's job: the API
// response shape, the `/knowledge` page that renders it and the candidate
// migration all read this document type today, and changing the writer before
// the migration exists would split the records across two types with nothing
// reconciling them. Only the ID minting is centralised here.
import { canonicalDocumentId } from '@/lib/knowledge/ids'

/**
 * Transport ceiling. Admin-gated, but the gate is one shared password and this
 * route writes a Sanity document per call with nothing bounding what it writes.
 */
const MAX_BODY_BYTES = 200_000
/** A headline. */
const MAX_TITLE_CHARS = 500
/** A proposed synthesis — a few paragraphs, generously. */
const MAX_ANSWER_CHARS = 20_000
/** Source IDs and brand tags: short identifiers, and few of them. */
const MAX_ARRAY_ENTRIES = 50
const MAX_ENTRY_CHARS = 200

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .slice(0, MAX_ARRAY_ENTRIES)
    .map((item) => String(item).trim().slice(0, MAX_ENTRY_CHARS))
    .filter(Boolean)
}

async function requireKnowledgeAdmin() {
  try {
    await requireAdmin()
    return null
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function GET() {
  const unauthorized = await requireKnowledgeAdmin()
  if (unauthorized) return unauthorized

  const candidates = await writeClient.fetch(`
    *[_type == "knowledgeCandidate"] | order(createdAt desc, _createdAt desc) {
      _id, candidateId, title, answer, sourceIds, brandTags, createdAt, status
    }[0...50]
  `)

  return NextResponse.json(candidates)
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireKnowledgeAdmin()
  if (unauthorized) return unauthorized

  const declared = Number(req.headers.get('content-length') || 0)
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  // Again on what arrived: content-length is a claim, and a chunked request
  // need not send one at all.
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  // Truncated rather than rejected: these are typed into a form by the admin
  // who is already logged in, and the ceilings sit far above any real entry.
  const title = String(payload.title ?? '').trim().slice(0, MAX_TITLE_CHARS)
  const answer = String(payload.answer ?? '').trim().slice(0, MAX_ANSWER_CHARS)
  const sourceIds = parseStringArray(payload.sourceIds)
  const brandTags = parseStringArray(payload.brandTags) as KnowledgeBrandTag[]

  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!answer) return NextResponse.json({ error: 'Proposed synthesis is required.' }, { status: 400 })
  if (sourceIds.length === 0) {
    return NextResponse.json({ error: 'Provide at least one source ID.' }, { status: 400 })
  }
  if (brandTags.length === 0 || brandTags.some((tag) => !KNOWLEDGE_BRAND_TAGS.includes(tag))) {
    return NextResponse.json({ error: 'Select at least one valid brand tag.' }, { status: 400 })
  }

  const candidateId = `candidate-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`
  const createdAt = new Date().toISOString()
  const documentId = canonicalDocumentId('knowledgeCandidate')

  await writeClient.create({
    _id: documentId,
    _type: 'knowledgeCandidate',
    candidateId,
    title,
    answer,
    sourceIds,
    brandTags,
    createdAt,
    status: 'pending',
  })

  return NextResponse.json({
    _id: documentId,
    candidateId,
    title,
    answer,
    sourceIds,
    brandTags,
    createdAt,
    status: 'pending',
  }, { status: 201 })
}
