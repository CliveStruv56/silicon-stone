import { z } from 'zod'

import { ingestCapture, type IngestContext } from '@/lib/knowledge/ingest'
import { linkSourcesToItem } from '@/lib/knowledge/service'
import { SAFE_WRITE_FAILURE_MESSAGE } from '@/lib/knowledge/ingest-status'
import {
  getKnowledgeRecord,
  listKnowledgeInbox,
  searchKnowledge,
  KNOWLEDGE_READ_MAX_LIMIT,
} from '@/lib/knowledge/read'
import type { KnowledgeServiceDeps } from '@/lib/knowledge/service'
import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_INTENDED_USES,
  KNOWLEDGE_ITEM_KINDS,
  KNOWLEDGE_SOURCE_CLASSES,
  KNOWLEDGE_SOURCE_KINDS,
  KNOWLEDGE_TRUST_TIERS,
} from '@/lib/knowledge/types'

/**
 * The tools an external conversation can call.
 *
 * This file is the **only** place zod appears in the knowledge path, and it
 * lives outside `src/lib/knowledge/` deliberately so that "the knowledge domain
 * has no validation library" stays literally true and can be asserted in one
 * line. The reason zod is here at all is a transport requirement, not a
 * validation decision: the MCP SDK reads a Standard Schema to publish each
 * tool's `inputSchema` in `tools/list`, which is how a model learns what it may
 * send.
 *
 * So these schemas are **loose supersets** that describe the interface. Every
 * real rule — length limits, URL normalisation, reference resolution, the
 * refusal to let anything arrive `ready` — stays in
 * `src/lib/knowledge/schema.ts` and runs afterwards. Two validators disagreeing
 * about the same field is the failure mode being avoided; the zod layer's job
 * is to describe, not to decide.
 *
 * Two fields are deliberately absent from every schema:
 *
 * - **`sourceSystem`**, because it is half of the external-reference duplicate
 *   probe. A model that can choose it can split or merge deduplication buckets.
 *   The server sets it from the authenticated transport.
 * - **`extractionExpected`**, because extraction is not built. A field in a
 *   schema is an invitation, and the honest answer to "will you fetch this URL
 *   for me?" is currently no.
 */

/** Tool names are a public contract the moment a connector is registered.
 * Renaming one silently breaks every configured client. */
export const KNOWLEDGE_TOOL_NAMES = [
  'capture_knowledge_item',
  'capture_source',
  'search_knowledge',
  'list_knowledge_inbox',
  'get_knowledge_record',
  'link_sources_to_item',
] as const
export type KnowledgeToolName = (typeof KNOWLEDGE_TOOL_NAMES)[number]

/** The sentence every write tool repeats, in its own words.
 *
 * Not decoration: ChatGPT's client-side safety layer has been observed blocking
 * write tools outright, and stating plainly that the tool only ever creates a
 * draft for review is the documented mitigation. It also happens to be true,
 * which is why it can be said. */
const NON_DESTRUCTIVE_NOTE =
  'This only ever creates a new draft record in a review inbox. It never publishes, sends, edits, overwrites or deletes anything, and a repeated call returns the record already created rather than making a second.'

const provenanceSchema = z
  .object({
    externalId: z
      .string()
      .optional()
      .describe('Your own identifier for this record, used to recognise a repeat.'),
    conversationId: z
      .string()
      .optional()
      .describe('The conversation or thread this came from.'),
    idempotencyKey: z
      .string()
      .optional()
      .describe('Supply the same key to make a repeated call return the first record.'),
  })
  .optional()
  .describe('Where this came from. Recorded as provenance; it grants no trust.')

const captureKnowledgeItemSchema = z.object({
  title: z.string().describe('A short title. Required.'),
  kind: z
    .enum(KNOWLEDGE_ITEM_KINDS)
    .describe('What sort of thinking this is. Required.'),
  body: z.string().describe('The item in full. Required.'),
  summary: z.string().optional().describe('One or two sentences for the inbox list.'),
  topicIds: z.array(z.string()).optional().describe('knowledgeTopic document IDs.'),
  sourceIds: z.array(z.string()).optional().describe('knowledgeSource document IDs this rests on.'),
  derivedFromIds: z.array(z.string()).optional().describe('Earlier knowledgeItem IDs this builds on.'),
  researchRunId: z.string().optional().describe('The researchRun document ID, if any.'),
  intendedUse: z.enum(KNOWLEDGE_INTENDED_USES).optional().describe('What this is for.'),
  confidence: z
    .enum(KNOWLEDGE_CONFIDENCE_LEVELS)
    .optional()
    .describe('Categorical, never a percentage.'),
  editorNotes: z.string().optional().describe('Why this is worth keeping. Never published.'),
  provenance: provenanceSchema,
})

const captureSourceSchema = z.object({
  title: z.string().describe('A short title. Required.'),
  sourceKind: z.enum(KNOWLEDGE_SOURCE_KINDS).describe('What kind of artefact this is. Required.'),
  url: z
    .string()
    .optional()
    .describe('The original URL. Required unless you provide `text` instead.'),
  text: z
    .string()
    .optional()
    .describe(
      'The source text. Required unless you provide `url` instead — the text is not fetched for you.',
    ),
  publisher: z.string().optional(),
  author: z.string().optional(),
  publishedDate: z
    .string()
    .optional()
    .describe('As given by the source — "2024" and "March 2024" are both fine.'),
  language: z.string().optional().describe('BCP-47 tag, e.g. en-GB.'),
  sourceClass: z
    .enum(KNOWLEDGE_SOURCE_CLASSES)
    .optional()
    .describe('What this is editorially. Labels it; does not make it authoritative.'),
  trustTier: z.enum(KNOWLEDGE_TRUST_TIERS).optional().describe('How far it has been verified.'),
  topicIds: z.array(z.string()).optional().describe('knowledgeTopic document IDs.'),
  tags: z.array(z.string()).optional(),
  provenance: provenanceSchema,
})
  // One of `url` or `text` is required. The rule is decided in
  // src/lib/knowledge/schema.ts, which stays the single decider; this only
  // DESCRIBES it, so the model can satisfy it first time instead of learning
  // from an error.
  //
  // It has to be .meta() rather than .refine(). A refinement is silently
  // dropped by both JSON-Schema conversion paths, so the model would never see
  // it — and worse, it would make the MCP SDK reject the call as a JSON-RPC
  // protocol error, which is invisible to the model and cannot be corrected.
  // Tool input schemas here are a loose superset that describes rather than
  // decides; see the note at the top of this file.
  .meta({ anyOf: [{ required: ['url'] }, { required: ['text'] }] })

const searchSchema = z.object({
  query: z.string().describe('Words to look for in titles, summaries and bodies.'),
  limit: z.number().optional().describe(`How many to return. Capped at ${KNOWLEDGE_READ_MAX_LIMIT}.`),
})

const listSchema = z.object({
  limit: z.number().optional().describe(`How many to return. Capped at ${KNOWLEDGE_READ_MAX_LIMIT}.`),
})

const getSchema = z.object({
  documentId: z.string().describe('The canonical document ID, e.g. knowledgeItem.abc123.'),
})

const linkSourcesSchema = z.object({
  itemId: z.string().describe('The knowledgeItem to add sources to. It must still be awaiting review.'),
  sourceIds: z
    .array(z.string())
    .describe('knowledgeSource document IDs to add. Existing sources are kept.'),
})

/** What a tool hands back. Mirrors the SDK's `CallToolResult` without importing
 * it, so this module stays testable on its own. */
export interface ToolResult {
  content: { type: 'text'; text: string }[]
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

function text(body: string, extra: Partial<ToolResult> = {}): ToolResult {
  return { content: [{ type: 'text', text: body }], ...extra }
}

/**
 * A failed tool call is an `isError` **result**, not a JSON-RPC protocol error.
 *
 * Protocol errors are for a malformed call or an unknown tool, and the model
 * never sees them. A validation failure returned that way is invisible to the
 * model, which then cannot correct its own input — which is the single most
 * valuable property of the whole integration.
 */
function toolError(body: string): ToolResult {
  return text(body, { isError: true })
}

export interface KnowledgeToolDeps {
  service: KnowledgeServiceDeps
  context: IngestContext
}

async function runCapture(
  deps: KnowledgeToolDeps,
  kind: 'knowledge_item' | 'source',
  payload: unknown,
): Promise<ToolResult> {
  const result = await ingestCapture(deps.service, { kind, payload }, deps.context)

  if (!result.ok) {
    const { code, message, errors, duplicate } = result.failure
    if (code === 'write_failed') {
      // The underlying message is the Sanity client's and can name the project,
      // the dataset and the missing permission.
      console.error('MCP capture write failed:', message)
      return toolError(SAFE_WRITE_FAILURE_MESSAGE)
    }
    if (code === 'duplicate_conflict') {
      const ids = duplicate?.matches.flatMap((m) => m.documentIds) ?? []
      // No retry advice on purpose: retrying cannot help, and a human has to
      // decide which record is the real one.
      return toolError(
        `This matches more than one existing record (${ids.join(', ')}). Someone needs to reconcile them before it can be saved.`,
      )
    }
    const detail = errors?.length
      ? ` Problems: ${errors.map((e) => `${e.field} (${e.code})`).join(', ')}.`
      : ''
    return toolError(`${message}${detail}`)
  }

  const { record } = result
  const opening = record.created
    ? 'Saved to the knowledge inbox for review.'
    : 'This was already captured; returning the existing record rather than creating a second.'

  return text(`${opening}\n\nID: ${record.documentId}\nStatus: ${record.status}\nReview it here: ${record.reviewUrl}`, {
    structuredContent: {
      documentId: record.documentId,
      documentType: record.documentType,
      status: record.status,
      created: record.created,
      reviewUrl: record.reviewUrl,
    },
  })
}

export interface KnowledgeToolDefinition {
  name: KnowledgeToolName
  config: {
    title: string
    description: string
    inputSchema: z.ZodTypeAny
    annotations: {
      title: string
      readOnlyHint: boolean
      destructiveHint?: boolean
      idempotentHint?: boolean
      openWorldHint: boolean
    }
  }
  run: (args: Record<string, unknown>, deps: KnowledgeToolDeps) => Promise<ToolResult>
}

/**
 * Every tool, as data.
 *
 * Returned as definitions rather than registered directly so that the route
 * wires them to a server and the tests can assert on their annotations and
 * schemas without standing one up.
 */
export const KNOWLEDGE_TOOLS: KnowledgeToolDefinition[] = [
  {
    name: 'capture_knowledge_item',
    config: {
      title: 'Save a thought to the knowledge inbox',
      description: `Save an idea, observation, conversation extract, outline or synthesis into the Silicon & Stone knowledge inbox, where a human reviews it. ${NON_DESTRUCTIVE_NOTE}`,
      inputSchema: captureKnowledgeItemSchema,
      annotations: {
        title: 'Save a thought to the knowledge inbox',
        readOnlyHint: false,
        // Explicitly false. It defaults to TRUE whenever readOnlyHint is false,
        // which would put a destructive-action warning in front of the one
        // thing the owner does constantly. A duplicate returns the existing
        // record and never overwrites it, so this is accurate.
        destructiveHint: false,
        // A repeated identical call returns the same document.
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    run: (args, deps) => runCapture(deps, 'knowledge_item', args),
  },
  {
    name: 'capture_source',
    config: {
      title: 'Save a source to the knowledge inbox',
      description: `Save an external source — an article, report, page or document — into the Silicon & Stone knowledge inbox. Provide the text yourself: this does not fetch URLs. ${NON_DESTRUCTIVE_NOTE}`,
      inputSchema: captureSourceSchema,
      annotations: {
        title: 'Save a source to the knowledge inbox',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    run: (args, deps) => runCapture(deps, 'source', args),
  },
  {
    name: 'search_knowledge',
    config: {
      title: 'Search the knowledge base',
      description:
        'Search saved knowledge items and sources by words in their titles, summaries and bodies. Read-only. Private and confidential records are never returned.',
      inputSchema: searchSchema,
      annotations: {
        title: 'Search the knowledge base',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    run: async (args, deps) => {
      const rows = await searchKnowledge(deps.service.client, {
        query: String(args.query ?? ''),
        limit: typeof args.limit === 'number' ? args.limit : undefined,
      })
      return summaryResult(rows, `No saved knowledge matched "${String(args.query ?? '')}".`)
    },
  },
  {
    name: 'list_knowledge_inbox',
    config: {
      title: 'List what is awaiting review',
      description:
        'List the knowledge items and sources currently awaiting review in the inbox, newest first. Read-only.',
      inputSchema: listSchema,
      annotations: {
        title: 'List what is awaiting review',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    run: async (args, deps) => {
      const rows = await listKnowledgeInbox(deps.service.client, {
        limit: typeof args.limit === 'number' ? args.limit : undefined,
      })
      return summaryResult(rows, 'The knowledge inbox is empty.')
    },
  },
  {
    name: 'link_sources_to_item',
    config: {
      title: 'Attach sources to an item awaiting review',
      description:
        'Attach existing sources to a knowledge item that is still awaiting review, so a claim can say what it rests on. Adds only — sources already attached are kept, and nothing else about the item changes. It cannot approve, publish, edit or delete anything, and it will not touch an item that has already been reviewed.',
      inputSchema: linkSourcesSchema,
      annotations: {
        title: 'Attach sources to an item awaiting review',
        readOnlyHint: false,
        // Honest: it adds references and never removes one, and the patch
        // touches `sources` and nothing else — not the review status, not the
        // body, not the content hash.
        destructiveHint: false,
        // Linking the same source twice writes nothing at all.
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    run: async (args, deps) => {
      const sourceIds = Array.isArray(args.sourceIds) ? args.sourceIds.map(String) : []
      const result = await linkSourcesToItem(deps.service, {
        itemId: String(args.itemId ?? ''),
        sourceIds,
      })
      if (!result.ok) {
        if (result.code === 'write_failed') {
          console.error('MCP link write failed:', result.message)
          return toolError(SAFE_WRITE_FAILURE_MESSAGE)
        }
        return toolError(result.message)
      }
      return text(
        `Sources attached. The item is still awaiting review.\n\nID: ${result.documentId}\nReview it here: ${result.reviewUrl}`,
        {
          structuredContent: {
            documentId: result.documentId,
            status: result.status,
            reviewUrl: result.reviewUrl,
          },
        },
      )
    },
  },
  {
    name: 'get_knowledge_record',
    config: {
      title: 'Read one knowledge record',
      description:
        'Read a single knowledge item or source in full, by its document ID. Read-only. Private and confidential records are never returned.',
      inputSchema: getSchema,
      annotations: {
        title: 'Read one knowledge record',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    run: async (args, deps) => {
      const record = await getKnowledgeRecord(deps.service.client, String(args.documentId ?? ''))
      if (!record) return toolError('No record with that ID, or it is not readable.')
      return text(JSON.stringify(record, null, 2), { structuredContent: { record } })
    },
  },
]

function summaryResult(
  rows: { _id: string; title?: string; kind?: string; reviewStatus?: string }[],
  emptyMessage: string,
): ToolResult {
  if (rows.length === 0) return text(emptyMessage, { structuredContent: { records: [] } })
  const lines = rows.map(
    (row) => `- ${row.title ?? '(untitled)'} — ${row.kind ?? 'unknown'} · ${row.reviewStatus ?? 'inbox'} · ${row._id}`,
  )
  return text(`${rows.length} record(s):\n${lines.join('\n')}`, {
    structuredContent: { records: rows },
  })
}
