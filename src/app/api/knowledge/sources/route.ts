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
// Hashing, ID minting and URL normalisation now come from the knowledge domain
// (`src/lib/knowledge/`) rather than being re-implemented here. The contract
// this route serves is unchanged: same form fields, same status codes, same
// response body, and still a legacy-compatible `knowledgeSource` document.
// Rewriting it onto the domain service proper waits for the capture wave,
// because the service does not mint the `sourceId` this type still requires.
import { contentHash as sha256 } from '@/lib/knowledge/hash'
import { canonicalDocumentId } from '@/lib/knowledge/ids'
import { normalizeCanonicalUrl } from '@/lib/knowledge/normalize'

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

/**
 * Ceiling on the whole multipart body, checked before it is read.
 *
 * `MAX_UPLOAD_BYTES` below is a check on the *file part*, and it happens after
 * `req.formData()` has already buffered the entire request into memory — so a
 * 500 MB body was fully materialised before anything measured it. This bound
 * comes first. It is the file limit plus room for the text fields around it.
 */
const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 2 * 1024 * 1024

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

  // content-length is a claim rather than a measurement, but it is the only
  // measurement available *before* formData() buffers the body — and buffering
  // is the thing being defended against, so a claim checked early is worth more
  // here than a fact checked late. The per-file check below still runs.
  const declared = Number(req.headers.get('content-length') || 0)
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  // A malformed multipart body throws here. It used to throw straight out of
  // the route as an unhandled 500 with a stack behind it.
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

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
  // Left exactly as it was, deliberately. `normalizeCanonicalUrl` is stricter
  // — it rejects mailto:, data: and file: URLs, which this accepts — and
  // tightening what an existing endpoint accepts is a change for the capture
  // wave to make openly, not a side effect of a refactor. The normalised form
  // is stored alongside as an additive field, so nothing that was accepted
  // before is rejected now.
  if (originalUrl) {
    try {
      new URL(originalUrl)
    } catch {
      return NextResponse.json({ error: 'Original URL is invalid.' }, { status: 400 })
    }
  }
  const canonicalUrl = originalUrl ? normalizeCanonicalUrl(originalUrl) : null

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
  const documentId = canonicalDocumentId('knowledgeSource')

  await writeClient.create({
    _id: documentId,
    _type: 'knowledgeSource',
    sourceId,
    title,
    sourceType,
    brandTags,
    topicTags,
    ...(originalUrl ? { originalUrl } : {}),
    ...(canonicalUrl ? { canonicalUrl } : {}),
    ...(asset ? { asset } : {}),
    extractedText,
    contentHash,
    capturedAt,
    // Legacy `status` is still written, unchanged, because everything that
    // reads these documents still reads it. `reviewStatus` is written beside
    // it so records captured from here forward carry the canonical field too
    // and the backfill has that much less to do. The two agree: legacy
    // `pending` means `inbox`.
    status: 'pending',
    reviewStatus: 'inbox',
    extractionState: { status: 'not_required' },
    indexState: { status: 'not_eligible' },
    provenance: { sourceSystem: 'admin_ui', capturedBy: 'admin' },
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
