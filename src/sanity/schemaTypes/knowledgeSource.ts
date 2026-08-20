import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

import {
  KNOWLEDGE_SOURCE_CLASSES,
  KNOWLEDGE_TRUST_TIERS,
  isPostFoundationSource,
  optionList,
} from '@/lib/knowledge/types'
import {
  extractionStateField,
  indexStateField,
  provenanceField,
  reviewStatusField,
  topicsField,
} from './knowledgeFields'

const brandTags = [
  { title: 'Silicon & Stone', value: 'silicon-and-stone' },
  { title: 'Waymark Path', value: 'waymark-path' },
  { title: 'Shared', value: 'shared' },
]

/**
 * Externally authored evidence — master spec §5.1.
 *
 * This type predates the knowledge system and is extended here, never rewritten.
 * Everything above the "added in the canonical foundation wave" divider is
 * exactly as it was: `sourceId`, `status`, `extractedText`, the URL/asset pair,
 * the tag arrays, `contentHash`, `capturedAt` and the legacy `manifestId` all
 * keep their names, types and validation, because documents in the dataset
 * depend on them and nothing has been backfilled yet.
 *
 * The new fields are all optional. Two pairs deserve explaining:
 *
 *  - **`status` and `reviewStatus` coexist.** The legacy field mixed an
 *    editorial verdict with a processing outcome — `error` was never a review
 *    decision. Read the two through `effectiveSourceReviewStatus()` in
 *    `src/lib/knowledge/types.ts` rather than picking one; master spec §11
 *    keeps the legacy field readable until the cutover wave has moved every
 *    consumer.
 *  - **`topicTags` and `topics` coexist.** Strings and references answer
 *    different questions, and the strings are what existing documents carry.
 */
export const knowledgeSource = defineType({
  name: 'knowledgeSource',
  title: 'Knowledge Source',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'provenance', title: 'Provenance' },
    { name: 'system', title: 'System' },
  ],
  fields: [
    /* ================= existing fields — unchanged ================= */

    defineField({
      group: 'content',
      name: 'sourceId',
      title: 'Source ID',
      description:
        'Stable lower-case kebab-case ID. Required on records that predate the ' +
        'knowledge foundation, because a legacy knowledgeCandidate refers to those ' +
        'by this string. Anything captured or created since is referred to by ' +
        'reference instead, and may leave this empty.',
      type: 'string',
      // Was `rule.required()`. Loosened, never tightened, and only for records
      // that did not exist before the foundation wave — the same shape as the
      // `extractedText` rule below. The field's purpose is string-based
      // reference resolution (`resolveSourceIdsToDocuments`), and nothing looks
      // a post-foundation source up that way. Requiring it there made every
      // record written by `captureSource` land in Studio failing validation,
      // asking a reviewer to hand-author an identifier for a namespace with no
      // remaining readers. Every document written before this wave has one and
      // still validates.
      validation: (rule) =>
        rule
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: 'lower-case kebab-case' })
          .custom((value, context) => {
            if (typeof value === 'string' && value.trim().length > 0) return true
            return isPostFoundationSource(
              context.document as Parameters<typeof isPostFoundationSource>[0],
            )
              ? true
              : 'Source ID is required on records that predate the knowledge foundation; they are referred to by this string.'
          }),
    }),
    defineField({
      group: 'content',
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'content',
      name: 'sourceType',
      title: 'Source Type',
      type: 'string',
      options: {
        list: [
          { title: 'URL', value: 'url' },
          { title: 'PDF', value: 'pdf' },
          { title: 'Image', value: 'image' },
          { title: 'Note', value: 'note' },
          { title: 'Published Article', value: 'published_article' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'content',
      name: 'brandTags',
      title: 'Brand Tags',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: brandTags },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      group: 'content',
      name: 'topicTags',
      title: 'Topic Tags (free text)',
      description:
        'Legacy free-text tags. Kept because existing documents carry them; prefer the Topics references below for anything new.',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      group: 'content',
      name: 'originalUrl',
      title: 'Original URL',
      type: 'url',
    }),
    defineField({
      group: 'content',
      name: 'asset',
      title: 'Uploaded Original',
      description: 'Durable Sanity copy for PDF, image, or note uploads.',
      type: 'file',
    }),
    defineField({
      group: 'content',
      name: 'extractedText',
      title: 'Extracted Text',
      description: 'Raw extracted text for local processing and later evidence indexing.',
      type: 'text',
      rows: 16,
      // Was `rule.required()`. This only ever *loosens* it, and only for the
      // states that did not exist before this wave: a source whose extraction
      // is queued, processing or failed has no text yet by definition, and a
      // hard requirement would make the extraction states unrepresentable —
      // the very independence FND-007 asks for. Every document written before
      // this wave has text and still validates.
      validation: (rule) =>
        rule.custom((value, context) => {
          const status = (
            context.document as { extractionState?: { status?: string } } | undefined
          )?.extractionState?.status
          const extractionPending =
            status === 'queued' || status === 'processing' || status === 'failed'
          if (extractionPending) return true
          return typeof value === 'string' && value.trim().length > 0
            ? true
            : 'Extracted text is required unless extraction is queued, processing, or failed.'
        }),
    }),
    defineField({
      group: 'system',
      name: 'contentHash',
      title: 'Content Hash',
      description: 'SHA-256 hash of the captured source content.',
      type: 'string',
      validation: (rule) =>
        rule.required().regex(/^sha256:[a-f0-9]{64}$/, {
          name: 'sha256:<64 lower-case hex characters>',
        }),
    }),
    defineField({
      group: 'provenance',
      name: 'capturedAt',
      title: 'Captured At',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'system',
      name: 'status',
      title: 'Status (legacy)',
      description:
        'The pre-foundation status field. Kept readable and unrewritten until the cutover wave: read it together with Review Status, not instead of it. Legacy "processed" means reviewed, "pending" means inbox, and "error" means a capture or extraction problem — never an editorial rejection.',
      type: 'string',
      options: {
        list: [
          { title: 'Pending local review', value: 'pending' },
          { title: 'Processed (reviewed)', value: 'processed' },
          { title: 'Error', value: 'error' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'system',
      name: 'manifestId',
      title: 'Manifest ID (legacy)',
      description: 'Legacy field from the retired local-vault filing pass. No longer written.',
      type: 'string',
    }),

    /* ========== added in the canonical foundation wave ==========
     * All optional. Nothing here may be required, because no existing
     * document has been backfilled. */

    reviewStatusField(
      'The editorial verdict, separate from the legacy status field and from extraction. Only `ready` sources are eligible for editorial memory.',
      'content',
    ),
    topicsField(
      'Internal grouping by topic reference. Coexists with the legacy free-text tags above.',
      'content',
    ),
    defineField({
      group: 'content',
      name: 'sourceClass',
      title: 'Source Class',
      description:
        'What this is, editorially. `primary_statute` labels a captured statute honestly — it does NOT make the record authoritative for the compliance checker, which reads only the pinned Git rule pack.',
      type: 'string',
      options: {
        list: optionList(KNOWLEDGE_SOURCE_CLASSES, {
          primary_statute: 'Primary statute (labelled, not authoritative here)',
          regulator_guidance: 'Regulator guidance',
          official_publication: 'Official publication',
          standards_body: 'Standards body',
          academic: 'Academic',
          industry_report: 'Industry report',
          news: 'News',
          vendor_material: 'Vendor material',
          commentary: 'Commentary',
          internal_note: 'Internal note',
          other: 'Other',
        }),
      },
    }),
    defineField({
      group: 'content',
      name: 'trustTier',
      title: 'Trust Tier',
      description: 'How far this has been verified — a separate question from what kind of thing it is.',
      type: 'string',
      options: { list: optionList(KNOWLEDGE_TRUST_TIERS), layout: 'radio' },
    }),
    defineField({
      group: 'provenance',
      name: 'publisher',
      title: 'Publisher',
      type: 'string',
    }),
    defineField({
      group: 'provenance',
      name: 'author',
      title: 'Author',
      type: 'string',
    }),
    defineField({
      group: 'provenance',
      name: 'publishedDate',
      title: 'Publication Date',
      description:
        'A string, not a date: upstream frequently gives "2024", "March 2024" or nothing at all, and coercing that into a datetime invents a precision the source never had.',
      type: 'string',
    }),
    defineField({
      group: 'provenance',
      name: 'language',
      title: 'Language',
      description: 'BCP-47 tag, e.g. en, en-GB, de.',
      type: 'string',
    }),
    defineField({
      group: 'provenance',
      name: 'canonicalUrl',
      title: 'Canonical URL',
      description:
        'The normalised form of the original URL — tracking parameters and fragment removed. Duplicate detection matches on this, so two captures of the same page from different links resolve to one source.',
      type: 'url',
      readOnly: true,
    }),
    provenanceField(
      'Which system this arrived through, under what identity, and with what external reference. Provenance, never authorization.',
      'provenance',
      { omitCapturedAt: true },
    ),
    defineField({
      group: 'content',
      name: 'supersededBy',
      title: 'Superseded By',
      description:
        'The source that replaced this one — a later consolidation, a corrected report. Set with Review Status = superseded; the old record stays readable so articles that cited it keep their meaning.',
      type: 'reference',
      to: [{ type: 'knowledgeSource' }],
    }),
    extractionStateField(
      'Whether text had to be fetched, and how it went. Independent of both the review verdict and the index state — a failed fetch is not a rejection.',
      'system',
    ),
    indexStateField(
      'Whether this source is in editorial memory, and whether what is there is current.',
      'system',
    ),
  ],
  preview: {
    select: {
      title: 'title',
      sourceId: 'sourceId',
      status: 'status',
      reviewStatus: 'reviewStatus',
    },
    prepare({ title, sourceId, status, reviewStatus }) {
      return {
        title,
        subtitle: `${reviewStatus ?? status ?? 'pending'} · ${sourceId ?? 'missing source ID'}`,
      }
    },
  },
})
