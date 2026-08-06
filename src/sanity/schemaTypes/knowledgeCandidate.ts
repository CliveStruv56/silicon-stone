import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

const brandTags = [
  { title: 'Silicon & Stone', value: 'silicon-and-stone' },
  { title: 'Waymark Path', value: 'waymark-path' },
  { title: 'Shared', value: 'shared' },
]

export const knowledgeCandidate = defineType({
  name: 'knowledgeCandidate',
  title: 'Knowledge Candidate',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'candidateId',
      title: 'Candidate ID',
      description: 'Stable lower-case kebab-case ID for reviewed local filing.',
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
      name: 'answer',
      title: 'Proposed Synthesis',
      description: 'Portal-generated answer awaiting reviewed local filing.',
      type: 'text',
      rows: 16,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sourceIds',
      title: 'Source IDs',
      description: 'Source manifests that must be checked during local filing.',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => rule.required().min(1),
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
      name: 'createdAt',
      title: 'Created At',
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
          { title: 'Filed (reviewed)', value: 'filed' },
          { title: 'Rejected', value: 'rejected' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      candidateId: 'candidateId',
      status: 'status',
    },
    prepare({ title, candidateId, status }) {
      return {
        title,
        subtitle: `${status ?? 'pending'} · ${candidateId ?? 'missing candidate ID'}`,
      }
    },
  },
})
