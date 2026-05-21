import { defineType, defineField } from 'sanity'
import { ImageIcon } from '@sanity/icons'

export const libraryImage = defineType({
  name: 'libraryImage',
  title: 'Library Image',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      description: 'Which library folder this image belongs to.',
      type: 'reference',
      to: [{ type: 'assetCollection' }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'source',
      title: 'Source',
      description: 'Where this image came from.',
      type: 'string',
      options: {
        list: [
          { title: 'AI-Generated', value: 'ai-generated' },
          { title: 'Stock / Licensed', value: 'stock' },
          { title: 'Screenshot', value: 'screenshot' },
          { title: 'Original / Owned', value: 'original' },
          { title: 'Other', value: 'other' },
        ],
      },
    }),
    defineField({
      name: 'credit',
      title: 'Credit / Attribution',
      type: 'string',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'addedAt',
      title: 'Added At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      collection: 'collection.title',
      source: 'source',
    },
    prepare({ title, media, collection, source }) {
      const bits = [collection, source].filter(Boolean)
      return {
        title,
        subtitle: bits.length ? bits.join(' · ') : undefined,
        media,
      }
    },
  },
})
