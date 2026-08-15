import { defineType, defineField } from 'sanity'
import { TagIcon } from '@sanity/icons'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagIcon,
  fields: [
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
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'defaultGateMode',
      title: 'Default end-of-article gate',
      type: 'string',
      description:
        'What an article in this category should close on when its own gate is "Auto" and no product maps to its topics. Without this the fallback is the newsletter, which is a second email ask on a piece that has nothing to sell. Only consulted for the Auto fallback: an explicit gate on the article always wins, and so does a real product match.',
      options: {
        list: [
          { title: 'Newsletter / email capture (default)', value: 'email' },
          { title: 'Lead — book a call', value: 'lead' },
          { title: 'None — no gate at all', value: 'none' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})
