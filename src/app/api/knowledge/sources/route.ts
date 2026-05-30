import { createHash, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { writeClient } from '@/lib/sanity'
import {
  KNOWLEDGE_BRAND_TAGS,
  KNOWLEDGE_SOURCE_TYPES,
  assertValidSourceId,
  type KnowledgeBrandTag,
  type KnowledgeSourceType,
} from '@/lib/knowledge-inbox'

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

function sha256(content: string | Uint8Array) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

function parseCommaSeparated(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
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

  const sources = await writeClient.fetch(`
    *[_type == "knowledgeSource"] | order(capturedAt desc, _createdAt desc) {
      _id, sourceId, title, sourceType, brandTags, topicTags,
      originalUrl, capturedAt, status, manifestId
    }[0...50]
  `)

  return NextResponse.json(sources)
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireKnowledgeAdmin()
  if (unauthorized) return unauthorized

  const formData = await req.formData()
  const sourceId = String(formData.get('sourceId') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const sourceType = String(formData.get('sourceType') ?? '') as KnowledgeSourceType
  const originalUrl = String(formData.get('originalUrl') ?? '').trim()
  const extractedText = String(formData.get('extractedText') ?? '').trim()
  const brandTags = parseCommaSeparated(formData.get('brandTags')) as KnowledgeBrandTag[]
  const topicTags = parseCommaSeparated(formData.get('topicTags'))
  const upload = formData.get('file')

  try {
    assertValidSourceId(sourceId)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid source ID' },
      { status: 400 },
    )
  }

  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!KNOWLEDGE_SOURCE_TYPES.includes(sourceType)) {
    return NextResponse.json({ error: 'Invalid source type.' }, { status: 400 })
  }
  if (brandTags.length === 0 || brandTags.some((tag) => !KNOWLEDGE_BRAND_TAGS.includes(tag))) {
    return NextResponse.json({ error: 'Select at least one valid brand tag.' }, { status: 400 })
  }
  if (!extractedText) {
    return NextResponse.json({ error: 'Extracted text is required.' }, { status: 400 })
  }
  if (!originalUrl && !(upload instanceof File && upload.size > 0)) {
    return NextResponse.json({ error: 'Provide an original URL or upload a file.' }, { status: 400 })
  }
  if (originalUrl) {
    try {
      new URL(originalUrl)
    } catch {
      return NextResponse.json({ error: 'Original URL is invalid.' }, { status: 400 })
    }
  }

  let asset: { _type: 'file'; asset: { _type: 'reference'; _ref: string } } | undefined
  let contentHash = sha256(extractedText)

  if (upload instanceof File && upload.size > 0) {
    if (upload.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Uploaded file exceeds the 15MB limit.' }, { status: 400 })
    }
    const bytes = Buffer.from(await upload.arrayBuffer())
    const sanityAsset = await writeClient.assets.upload('file', bytes, {
      filename: upload.name,
      contentType: upload.type || undefined,
    })
    asset = {
      _type: 'file',
      asset: { _type: 'reference', _ref: sanityAsset._id },
    }
    contentHash = sha256(bytes)
  }

  const existing = await writeClient.fetch<{ _id: string } | null>(
    `*[_type == "knowledgeSource" && sourceId == $sourceId][0]{ _id }`,
    { sourceId },
  )

  if (existing) {
    return NextResponse.json({ error: `Source ID already exists: ${sourceId}` }, { status: 409 })
  }

  const capturedAt = new Date().toISOString()
  const documentId = `knowledgeSource.${randomUUID()}`

  await writeClient.create({
    _id: documentId,
    _type: 'knowledgeSource',
    sourceId,
    title,
    sourceType,
    brandTags,
    topicTags,
    ...(originalUrl ? { originalUrl } : {}),
    ...(asset ? { asset } : {}),
    extractedText,
    contentHash,
    capturedAt,
    status: 'pending',
  })

  return NextResponse.json({
    _id: documentId,
    sourceId,
    title,
    sourceType,
    brandTags,
    topicTags,
    originalUrl: originalUrl || undefined,
    capturedAt,
    status: 'pending',
  }, { status: 201 })
}
