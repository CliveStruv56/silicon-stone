import { defineArrayMember, defineField, defineType } from 'sanity'
import { BulbOutlineIcon } from '@sanity/icons'

import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_INTENDED_USES,
  KNOWLEDGE_ITEM_KINDS,
  KNOWLEDGE_SENSITIVITIES,
  optionList,
} from '@/lib/knowledge/types'
import {
  indexStateField,
  provenanceField,
  reviewStatusField,
  topicsField,
} from './knowledgeFields'

/**
 * Derived thinking — master spec §5.2.
 *
 * The distinction from `knowledgeSource` is the one architectural decision this
 * type exists to hold (master spec §3.7): a source is evidence somebody else
 * authored, an item is what SiliconStone or a model made of it. Collapsing the
 * two would make "what did we actually establish, and what did we infer?"
 * unanswerable, which is precisely the question a fact-check has to answer.
 *
 * Nothing here may be created as `ready`. `reviewStatus` initialises to `inbox`
 * and the domain service refuses any other entry state; an item's provenance
 * being a model is not a reason to trust it less than a human note, it is a
 * reason to require the same review either way.
 */
export const knowledgeItem = defineType({
  name: 'knowledgeItem',
  title: 'Knowledge Item',
  type: 'document',
  icon: BulbOutlineIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'lineage', title: 'Lineage' },
    { name: 'system', title: 'System' },
  ],
  fields: [
    defineField({
      group: 'content',
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      group: 'content',
      name: 'kind',
      title: 'Kind',
      description: 'What sort of thinking this is. Fixed list — a new kind is a schema decision, not an ad-hoc label.',
      type: 'string',
      options: {
        list: optionList(KNOWLEDGE_ITEM_KINDS, {
          idea: 'Idea',
          observation: 'Observation',
          conversation_extract: 'Conversation extract',
          article_foundation: 'Article foundation',
          outline: 'Outline',
          synthesis: 'Synthesis',
          claim: 'Claim',
          question: 'Question',
          note: 'Note',
        }),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'content',
      name: 'summary',
      title: 'Summary',
      description: 'One or two sentences. This is what an inbox list and a retrieval result show.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(2000),
    }),
    defineField({
      group: 'content',
      name: 'body',
      title: 'Body',
      description:
        'The item in full. Plain text rather than Portable Text on purpose: this is captured material to be reviewed and retrieved, not published copy, and a block editor would invite editing it into something its provenance no longer describes.',
      type: 'text',
      rows: 20,
      validation: (rule) => rule.required(),
    }),
    reviewStatusField(
      'Inbox until a human says otherwise. Only `ready` items are eligible for editorial memory; nothing that is captured, generated or migrated may enter as ready.',
      'content',
    ),
    topicsField(
      'Internal grouping. Not the public article category taxonomy.',
      'content',
    ),

    /* ---------------- lineage ---------------- */

    defineField({
      group: 'lineage',
      name: 'sources',
      title: 'Sources',
      description:
        'The evidence this item rests on. References, not string IDs — a reference cannot point at a document that was never created, which string IDs demonstrably could.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'knowledgeSource' }] })],
    }),
    defineField({
      group: 'lineage',
      name: 'researchRun',
      title: 'Research Run',
      description: 'The investigation this item came out of, where there was one.',
      type: 'reference',
      to: [{ type: 'researchRun' }],
    }),
    defineField({
      group: 'lineage',
      name: 'derivedFrom',
      title: 'Derived From',
      description: 'Earlier items this one was built on — an outline from a set of observations, a synthesis from several claims.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'knowledgeItem' }] })],
    }),
    defineField({
      group: 'lineage',
      name: 'supersededBy',
      title: 'Superseded By',
      description: 'The item that replaced this one. Set together with reviewStatus = superseded; a superseded record stays readable so older articles keep their meaning.',
      type: 'reference',
      to: [{ type: 'knowledgeItem' }],
    }),
    defineField({
      group: 'lineage',
      name: 'articles',
      title: 'Resulting Articles',
      description: 'Published or drafted articles this item fed. Written by the pipeline, kept so lineage reads in both directions.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
    }),

    /* ---------------- editorial judgement ---------------- */

    defineField({
      group: 'content',
      name: 'intendedUse',
      title: 'Intended Use',
      description: 'What this is for. Editorial signal, not access control.',
      type: 'string',
      options: { list: optionList(KNOWLEDGE_INTENDED_USES, {
        article_seed: 'Article seed',
        research_input: 'Research input',
        reference_only: 'Reference only',
        internal_only: 'Internal only',
      }) },
    }),
    defineField({
      group: 'content',
      name: 'sensitivity',
      title: 'Sensitivity',
      description:
        'Retrieval policy. Anything other than `normal` is ineligible for editorial memory — the enforcement is in the eligibility calculation, not in this label.',
      type: 'string',
      options: {
        list: optionList(KNOWLEDGE_SENSITIVITIES, {
          normal: 'Normal',
          private: 'Private (never retrieved)',
          confidential: 'Confidential (never retrieved)',
        }),
        layout: 'radio',
      },
      initialValue: 'normal',
    }),
    defineField({
      group: 'content',
      name: 'confidence',
      title: 'Confidence',
      description: 'Categorical, never a percentage — a number would imply a calibration nothing here performs.',
      type: 'string',
      options: { list: optionList(KNOWLEDGE_CONFIDENCE_LEVELS), layout: 'radio' },
    }),
    defineField({
      group: 'content',
      name: 'editorNotes',
      title: 'Editor Notes',
      description: 'Why this was kept, rejected, or is worth returning to. Internal — never published.',
      type: 'text',
      rows: 4,
    }),

    /* ---------------- system ---------------- */

    provenanceField(
      'Which system this arrived through, and under what identity. Recorded so an item can be traced back to the conversation that produced it; it confers no trust.',
      'system',
    ),
    defineField({
      group: 'system',
      name: 'contentHash',
      title: 'Content Hash',
      description: 'SHA-256 of the normalised body. Used for duplicate detection and index-drift comparison.',
      type: 'string',
      readOnly: true,
    }),
    indexStateField(
      'Whether this item is in editorial memory, and whether what is there is current. Set by the indexer; a record is never indexed as a side effect of being saved.',
      'system',
    ),
    defineField({
      group: 'content',
      name: 'brandTags',
      title: 'Brand Tags',
      description:
        'Which brand this belongs to. Optional here, unlike on the legacy types, because most items are captured before anyone has decided.',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Silicon & Stone', value: 'silicon-and-stone' },
          { title: 'Waymark Path', value: 'waymark-path' },
          { title: 'Shared', value: 'shared' },
        ],
      },
    }),
    defineField({
      group: 'system',
      name: 'legacyCandidateId',
      title: 'Legacy Candidate ID',
      description:
        'The `candidateId` of the knowledgeCandidate this item was copied from. Written only by the migration; the copy has to be traceable to what it replaced.',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      group: 'system',
      name: 'legacyCandidate',
      title: 'Legacy Candidate',
      description:
        'The original candidate document, which the migration copies rather than moves — it stays readable until the cutover wave retires it.',
      type: 'reference',
      to: [{ type: 'knowledgeCandidate' }],
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      kind: 'kind',
      reviewStatus: 'reviewStatus',
      system: 'provenance.sourceSystem',
    },
    prepare({ title, kind, reviewStatus, system }) {
      return {
        title,
        subtitle: [kind, reviewStatus ?? 'inbox', system].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    {
      title: 'Newest first',
      name: 'createdAtDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
})
