import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

const brandTags = [
  { title: 'Silicon & Stone', value: 'silicon-and-stone' },
  { title: 'Waymark Path', value: 'waymark-path' },
  { title: 'Shared', value: 'shared' },
]

export const knowledgeSource = defineType({
  name: 'knowledgeSource',
  title: 'Knowledge Source',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'sourceId',
      title: 'Source ID',
      description: 'Stable lower-case kebab-case ID used by the reviewed vault manifest.',
      type: 'string',
      validation: (rule) =>
        rule.required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
          name: 'lower-case kebab-case',
        }),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
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
      name: 'brandTags',
      title: 'Brand Tags',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: brandTags },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'topicTags',
      title: 'Topic Tags',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'originalUrl',
      title: 'Original URL',
      type: 'url',
    }),
    defineField({
      name: 'asset',
      title: 'Uploaded Original',
      description: 'Durable Sanity copy for PDF, image, or note uploads.',
      type: 'file',
    }),
    defineField({
      name: 'extractedText',
      title: 'Extracted Text',
      description: 'Raw extracted text for local processing and later evidence indexing.',
      type: 'text',
      rows: 16,
      validation: (rule) => rule.required(),
    }),
    defineField({
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
      name: 'capturedAt',
      title: 'Captured At',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending local review', value: 'pending' },
          { title: 'Processed into reviewed vault', value: 'processed' },
          { title: 'Error', value: 'error' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'manifestId',
      title: 'Vault Manifest ID',
      description: 'Set only after the reviewed local filing pass is confirmed.',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      sourceId: 'sourceId',
      status: 'status',
    },
    prepare({ title, sourceId, status }) {
      return {
        title,
        subtitle: `${status ?? 'pending'} · ${sourceId ?? 'missing source ID'}`,
      }
    },
  },
})
