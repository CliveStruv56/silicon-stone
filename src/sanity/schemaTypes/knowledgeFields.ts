import { defineArrayMember, defineField } from 'sanity'

import {
  KNOWLEDGE_EXTRACTION_STATUSES,
  KNOWLEDGE_INDEX_STATUSES,
  KNOWLEDGE_REVIEW_STATUSES,
  KNOWLEDGE_SOURCE_SYSTEMS,
  optionList,
} from '@/lib/knowledge/types'

/**
 * Field factories shared by the knowledge document types.
 *
 * These are functions returning field definitions, not registered object types.
 * The difference matters: a registered type would add four names to the Studio
 * schema registry that no document is ever created *as*, and would make every
 * future change to one of them a schema-wide event. A factory keeps the shape
 * consistent while leaving each document free to describe the field in its own
 * terms.
 *
 * Every option list is derived from the `as const` arrays in
 * `src/lib/knowledge/types.ts`, so a Studio dropdown cannot offer a value the
 * TypeScript union does not have.
 */

/** Master spec §5.6. Written by the indexer, never by hand — hence readOnly.
 * `canonicalHash` versus `indexedHash` is how drift becomes observable: if they
 * differ, what is in Pinecone is not what the document now says. */
export function indexStateField(description: string, group?: string) {
  return defineField({
    ...(group ? { group } : {}),
    name: 'indexState',
    title: 'Index State',
    description,
    type: 'object',
    options: { collapsible: true, collapsed: true },
    fields: [
      defineField({
        name: 'status',
        title: 'Status',
        type: 'string',
        options: {
          list: optionList(KNOWLEDGE_INDEX_STATUSES, {
            not_eligible: 'Not eligible',
            pending: 'Pending (queued or stale)',
            indexed: 'Indexed',
            error: 'Error',
          }),
          layout: 'radio',
        },
        initialValue: 'not_eligible',
      }),
      defineField({
        name: 'canonicalHash',
        title: 'Canonical Content Hash',
        description: 'Hash of what this document currently says.',
        type: 'string',
        readOnly: true,
      }),
      defineField({
        name: 'indexedHash',
        title: 'Indexed Content Hash',
        description: 'Hash of what is actually in the index. A difference means the index is stale.',
        type: 'string',
        readOnly: true,
      }),
      defineField({ name: 'indexedAt', title: 'Indexed At', type: 'datetime', readOnly: true }),
      defineField({ name: 'embeddingModel', title: 'Embedding Model', type: 'string', readOnly: true }),
      defineField({ name: 'indexVersion', title: 'Index / Schema Version', type: 'string', readOnly: true }),
      defineField({ name: 'lastError', title: 'Last Error', type: 'text', rows: 2, readOnly: true }),
      defineField({ name: 'lastAttemptAt', title: 'Last Attempt At', type: 'datetime', readOnly: true }),
      defineField({ name: 'attempts', title: 'Attempts', type: 'number', readOnly: true }),
    ],
  })
}

/** Master spec §5.1. Kept separate from both the review verdict and the index
 * state, so a failed fetch cannot read as an editorial rejection and a stale
 * vector cannot read as a broken extraction. */
export function extractionStateField(description: string, group?: string) {
  return defineField({
    ...(group ? { group } : {}),
    name: 'extractionState',
    title: 'Extraction State',
    description,
    type: 'object',
    options: { collapsible: true, collapsed: true },
    fields: [
      defineField({
        name: 'status',
        title: 'Status',
        type: 'string',
        options: {
          list: optionList(KNOWLEDGE_EXTRACTION_STATUSES, {
            not_required: 'Not required (text arrived with the source)',
            queued: 'Queued',
            processing: 'Processing',
            succeeded: 'Succeeded',
            failed: 'Failed',
          }),
          layout: 'radio',
        },
        initialValue: 'not_required',
      }),
      defineField({
        name: 'method',
        title: 'Method',
        description: 'How the text was obtained — e.g. html-readability, pdf-text, manual-paste.',
        type: 'string',
      }),
      defineField({ name: 'methodVersion', title: 'Method Version', type: 'string' }),
      defineField({ name: 'startedAt', title: 'Started At', type: 'datetime', readOnly: true }),
      defineField({ name: 'completedAt', title: 'Completed At', type: 'datetime', readOnly: true }),
      defineField({ name: 'lastError', title: 'Last Error', type: 'text', rows: 2, readOnly: true }),
      defineField({ name: 'attempts', title: 'Attempts', type: 'number', readOnly: true }),
    ],
  })
}

/** Where the record came from. Provenance, never authorization: an adapter
 * does not become trusted by naming itself here. */
export function provenanceField(
  description: string,
  group?: string,
  options: { omitCapturedAt?: boolean } = {},
) {
  return defineField({
    ...(group ? { group } : {}),
    name: 'provenance',
    title: 'Provenance',
    description,
    type: 'object',
    options: { collapsible: true, collapsed: true },
    fields: [
      defineField({
        name: 'sourceSystem',
        title: 'Source System',
        type: 'string',
        options: {
          list: optionList(KNOWLEDGE_SOURCE_SYSTEMS, {
            admin_ui: 'Admin UI',
            chatgpt: 'ChatGPT',
            claude: 'Claude',
            codex: 'Codex',
            exa: 'Exa',
            inoreader: 'Inoreader',
            api: 'API',
            migration: 'Migration',
            unknown: 'Unknown',
          }),
        },
        initialValue: 'unknown',
      }),
      defineField({
        name: 'externalId',
        title: 'External ID',
        description: "The originating system's own identifier, used for deduplication.",
        type: 'string',
      }),
      defineField({
        name: 'conversationId',
        title: 'Conversation ID',
        description: 'Thread identifier for chat-originated capture.',
        type: 'string',
      }),
      defineField({ name: 'capturedBy', title: 'Captured By', type: 'string' }),
      // knowledgeSource already carries a required top-level `capturedAt` from
      // before this wave, and two fields of the same name on one document is a
      // question nobody should have to answer. It opts out here.
      ...(options.omitCapturedAt
        ? []
        : [defineField({ name: 'capturedAt', title: 'Captured At', type: 'datetime' })]),
      defineField({
        name: 'idempotencyKey',
        title: 'Idempotency Key',
        description: 'Caller-supplied key that makes a repeated capture return the first record rather than creating a second.',
        type: 'string',
      }),
    ],
  })
}

/** The editorial verdict. `inbox` is the only state capture may write —
 * master spec §3.10, and the reason AI-derived content cannot arrive ready. */
export function reviewStatusField(description: string, group?: string) {
  return defineField({
    ...(group ? { group } : {}),
    name: 'reviewStatus',
    title: 'Review Status',
    description,
    type: 'string',
    options: {
      list: optionList(KNOWLEDGE_REVIEW_STATUSES, {
        inbox: 'Inbox (unreviewed)',
        ready: 'Ready (reviewed and approved)',
        rejected: 'Rejected',
        superseded: 'Superseded',
      }),
      layout: 'radio',
    },
    initialValue: 'inbox',
  })
}

/** Topic references. Plural everywhere: a source about the AI Act's
 * transparency duties belongs under both, and forcing a single choice would
 * lose one of them. */
export function topicsField(description: string, group?: string) {
  return defineField({
    ...(group ? { group } : {}),
    name: 'topics',
    title: 'Topics',
    description,
    type: 'array',
    of: [defineArrayMember({ type: 'reference', to: [{ type: 'knowledgeTopic' }] })],
  })
}
