import { defineArrayMember, defineField, defineType } from 'sanity'
import { SearchIcon } from '@sanity/icons'

import {
  RESEARCH_REUSE_STATUSES,
  RESEARCH_RUN_MODES,
  RESEARCH_RUN_PROVIDERS,
  RESEARCH_RUN_STATUSES,
  RETRIEVAL_LANES,
  optionList,
} from '@/lib/knowledge/types'
import { topicsField } from './knowledgeFields'

/**
 * A durable record of one Exa or Inoreader investigation — master spec §5.3.
 *
 * The gap this closes is the first one listed in §4: `ResearchResult` is
 * transient. Research currently lives in a Redis job that expires, so a page
 * reload loses it and a published article cannot say what was actually read to
 * produce it. Copying the completed run here before expiry is the whole point.
 *
 * Two shapes of validation matter.
 *
 *  - **A queued or running job is a legitimate partial document.** Nothing that
 *    only exists once the work finishes — the summary, the deep report, the
 *    selected sources — may be globally required, or the record could not be
 *    written until it was already too late to be useful.
 *  - **A completed run must actually carry its result.** The conditional
 *    validation below fires only on `status == "completed"`, which is where
 *    "the run finished but recorded nothing" stops being possible.
 *
 * A completed run is *not* automatically reusable: `reuseStatus` starts at
 * `pending` and only a human moves it to `approved`.
 */
export const researchRun = defineType({
  name: 'researchRun',
  title: 'Research Run',
  type: 'document',
  icon: SearchIcon,
  groups: [
    { name: 'run', title: 'Run', default: true },
    { name: 'result', title: 'Result' },
    { name: 'lineage', title: 'Lineage' },
    { name: 'system', title: 'System' },
  ],
  fields: [
    /* ---------------- identity ---------------- */

    defineField({
      group: 'run',
      name: 'query',
      title: 'Query',
      type: 'string',
      validation: (rule) => rule.required().max(2000),
    }),
    defineField({
      group: 'run',
      name: 'brief',
      title: 'Brief',
      description: 'The fuller instruction a deep run was given, where there was one.',
      type: 'text',
      rows: 6,
    }),
    defineField({
      group: 'run',
      name: 'mode',
      title: 'Mode',
      type: 'string',
      options: {
        list: optionList(RESEARCH_RUN_MODES, {
          fast: 'Fast (standard search)',
          deep: 'Deep research',
          inoreader: 'Inoreader ingestion',
        }),
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'run',
      name: 'provider',
      title: 'Provider',
      type: 'string',
      options: { list: optionList(RESEARCH_RUN_PROVIDERS, { exa: 'Exa', inoreader: 'Inoreader', manual: 'Manual', other: 'Other' }) },
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'run',
      name: 'jobId',
      title: 'Provider Job ID',
      description:
        "The provider's own identifier for the job. The link back to transient Redis state while it still exists, and the key that stops one job being recorded twice.",
      type: 'string',
    }),
    defineField({
      group: 'run',
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: optionList(RESEARCH_RUN_STATUSES),
        layout: 'radio',
      },
      initialValue: 'queued',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'run',
      name: 'error',
      title: 'Error',
      description: 'Why a failed run failed. Kept — a failed investigation is evidence too.',
      type: 'text',
      rows: 3,
    }),

    /* ---------------- timestamps and retries ---------------- */

    defineField({ group: 'run', name: 'requestedAt', title: 'Requested At', type: 'datetime' }),
    defineField({ group: 'run', name: 'startedAt', title: 'Started At', type: 'datetime' }),
    defineField({ group: 'run', name: 'completedAt', title: 'Completed At', type: 'datetime' }),
    defineField({
      group: 'run',
      name: 'retryOf',
      title: 'Retry Of',
      description:
        'The run this one re-attempts. A completed run is final, so a rerun is a new document pointing back here rather than an overwrite.',
      type: 'reference',
      to: [{ type: 'researchRun' }],
    }),

    /* ---------------- result ---------------- */

    defineField({
      group: 'result',
      name: 'summary',
      title: 'Result Summary',
      type: 'text',
      rows: 10,
      validation: (rule) =>
        rule.custom((value, context) => {
          const status = (context.document as { status?: string } | undefined)?.status
          if (status !== 'completed') return true
          return typeof value === 'string' && value.trim().length > 0
            ? true
            : 'A completed run must record what it found.'
        }),
    }),
    defineField({
      group: 'result',
      name: 'keywords',
      title: 'Keywords',
      description: "The research pass's own vocabulary, kept because the drafting prompts consume it.",
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      group: 'result',
      name: 'deepReport',
      title: 'Deep Report',
      description: 'The full deep-research report, where the mode produced one.',
      type: 'text',
      rows: 24,
    }),
    defineField({
      group: 'result',
      name: 'selectedSources',
      title: 'Selected Sources (as returned)',
      description:
        'What the provider returned, exactly as it returned it. This is a snapshot, not lineage: it stays truthful even if the canonical source below is later edited, superseded or rejected.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'selectedSource',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
            defineField({ name: 'publisher', title: 'Publisher', type: 'string' }),
            defineField({ name: 'publishedDate', title: 'Published Date', type: 'string' }),
            defineField({ name: 'snippet', title: 'Snippet', type: 'text', rows: 3 }),
            defineField({ name: 'score', title: 'Score', type: 'number' }),
          ],
          preview: { select: { title: 'title', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({
      group: 'result',
      name: 'sources',
      title: 'Canonical Sources',
      description:
        'The `knowledgeSource` documents created from this run. The durable half of the pair above.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'knowledgeSource' }] })],
    }),
    defineField({
      group: 'result',
      name: 'reuseStatus',
      title: 'Reuse Status',
      description:
        'Whether curated output from this run may be indexed into editorial memory. Starts pending: a raw research run is never automatically reusable, however good it looks.',
      type: 'string',
      options: {
        list: optionList(RESEARCH_REUSE_STATUSES, {
          pending: 'Pending review',
          approved: 'Approved for reuse',
          excluded: 'Excluded',
        }),
        layout: 'radio',
      },
      initialValue: 'pending',
    }),

    /* ---------------- retrieval and model snapshots ---------------- */

    defineField({
      group: 'system',
      name: 'retrievalSnapshots',
      title: 'Retrieval Snapshots',
      description:
        'What each retrieval lane actually returned, with IDs and scores. The three lanes fail independently, so a snapshot records which lane it came from — an empty regulatory lane and a missing regulatory lane are different facts.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'retrievalSnapshot',
          fields: [
            defineField({
              name: 'lane',
              title: 'Lane',
              type: 'string',
              options: {
                list: optionList(RETRIEVAL_LANES, {
                  prior_articles: 'Prior articles',
                  editorial_memory: 'Editorial memory',
                  regulatory: 'Regulatory',
                }),
              },
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'indexName', title: 'Index', type: 'string' }),
            defineField({ name: 'namespace', title: 'Namespace', type: 'string' }),
            defineField({ name: 'corpusVersion', title: 'Corpus / Pack Version', type: 'string' }),
            defineField({ name: 'scoreFloor', title: 'Score Floor', type: 'number' }),
            defineField({
              name: 'laneStatus',
              title: 'Lane Status',
              description: 'Whether this lane returned, returned nothing, or failed. A weak lane must degrade visibly rather than silently.',
              type: 'string',
              options: {
                list: [
                  { title: 'Returned results', value: 'ok' },
                  { title: 'Returned nothing', value: 'empty' },
                  { title: 'Failed', value: 'failed' },
                  { title: 'Skipped / disabled', value: 'skipped' },
                ],
              },
            }),
            defineField({
              name: 'entries',
              title: 'Entries',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'retrievalEntry',
                  fields: [
                    defineField({ name: 'recordId', title: 'Record ID', type: 'string', validation: (rule) => rule.required() }),
                    defineField({ name: 'score', title: 'Score', type: 'number' }),
                    defineField({ name: 'title', title: 'Title', type: 'string' }),
                    defineField({ name: 'locator', title: 'Locator', type: 'string' }),
                  ],
                  preview: { select: { title: 'recordId', subtitle: 'title' } },
                }),
              ],
            }),
          ],
          preview: { select: { title: 'lane', subtitle: 'laneStatus' } },
        }),
      ],
    }),
    defineField({
      group: 'system',
      name: 'modelSnapshot',
      title: 'Model / Rule Versions',
      description: 'What was in force when this run happened, so its output can be explained later rather than re-guessed.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'model', title: 'Model', type: 'string' }),
        defineField({ name: 'embeddingModel', title: 'Embedding Model', type: 'string' }),
        defineField({ name: 'providerVersion', title: 'Provider Version', type: 'string' }),
        defineField({ name: 'rulesVersion', title: 'Rules / Prompt Version', type: 'string' }),
        defineField({ name: 'promptTokens', title: 'Prompt Tokens', type: 'number' }),
        defineField({ name: 'completionTokens', title: 'Completion Tokens', type: 'number' }),
        defineField({ name: 'costUsd', title: 'Cost (USD)', type: 'number' }),
      ],
    }),

    /* ---------------- lineage ---------------- */

    topicsField('Internal grouping for this investigation.', 'lineage'),
    defineField({
      group: 'lineage',
      name: 'knowledgeItems',
      title: 'Resulting Knowledge Items',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'knowledgeItem' }] })],
    }),
    defineField({
      group: 'lineage',
      name: 'articles',
      title: 'Resulting Articles',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
    }),
  ],
  preview: {
    select: {
      query: 'query',
      mode: 'mode',
      status: 'status',
      reuseStatus: 'reuseStatus',
    },
    prepare({ query, mode, status, reuseStatus }) {
      return {
        title: query || 'Untitled run',
        subtitle: [mode, status, reuseStatus ? `reuse: ${reuseStatus}` : null]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
  orderings: [
    {
      title: 'Newest first',
      name: 'requestedAtDesc',
      by: [
        { field: 'requestedAt', direction: 'desc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
  ],
})
