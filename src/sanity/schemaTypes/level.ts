import { defineType, defineField } from 'sanity'
import { TiersIcon } from '@sanity/icons'

/**
 * One rung of the Silicon to Sovereignty ladder, 0 (Orientation) to 5
 * (Sovereignty capstone). The number is the first digit of every course code
 * on the rung.
 */
export const level = defineType({
  name: 'level',
  title: 'Level',
  type: 'document',
  icon: TiersIcon,
  fields: [
    defineField({
      name: 'number',
      title: 'Number',
      description: '0 to 5. The first digit of every course code on this level.',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0).max(5),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 64 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'One or two sentences: what this level is for.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(280).warning('Keep the summary under 280 characters'),
    }),
  ],
  orderings: [{ title: 'Level', name: 'numberAsc', by: [{ field: 'number', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', number: 'number' },
    prepare: ({ title, number }) => ({ title: `${number ?? '?'} · ${title ?? 'Untitled level'}` }),
  },
})
