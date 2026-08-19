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

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
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

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const title = String(payload.title ?? '').trim()
  const answer = String(payload.answer ?? '').trim()
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
