import { defineArrayMember, defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'
import { slugify } from '@/lib/utils'

/**
 * The knowledge lane's own taxonomy (master spec §5.4).
 *
 * It is deliberately *not* the public `category` type. Categories are a
 * publishing and navigation taxonomy the reader sees; topics are how sources,
 * items and research runs are grouped internally, at a granularity no
 * navigation menu should carry. `articleCategory` maps one to the other where
 * a correspondence genuinely exists, and stays empty where it does not — a
 * topic with no public counterpart is normal, not an omission.
 */
export const knowledgeTopic = defineType({
  name: 'knowledgeTopic',
  title: 'Knowledge Topic',
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
      description: 'Stable handle. Referenced by capture adapters, so renaming one breaks their mapping.',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input) => slugify(input, 96),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'aliases',
      title: 'Aliases',
      description:
        'Other names the same topic travels under. Capture adapters match on these, which is what lets an external system say "EU AI Act" and land on the same topic as "AI Act".',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'What belongs under this topic, and what does not.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'parent',
      title: 'Parent Topic',
      type: 'reference',
      to: [{ type: 'knowledgeTopic' }],
      // Studio hides the document itself from the picker; the validation below
      // is the backstop, because a reference can also arrive from an import or
      // a script that never opened the picker.
      options: {
        filter: ({ document }) => {
          const id = (document?._id as string | undefined) ?? ''
          const published = id.replace(/^drafts\./, '')
          return {
            filter: '!(_id in [$published, $draft])',
            params: { published, draft: `drafts.${published}` },
          }
        },
      },
      validation: (rule) =>
        rule.custom((value, context) => {
          const ref = (value as { _ref?: string } | undefined)?._ref
          if (!ref) return true
          const self = (context.document?._id ?? '').replace(/^drafts\./, '')
          return ref.replace(/^drafts\./, '') === self
            ? 'A topic cannot be its own parent.'
            : true
        }),
    }),
    defineField({
      name: 'articleCategory',
      title: 'Public Article Category',
      description:
        'Optional mapping to the public publishing taxonomy. Leave empty when this topic has no public counterpart — categories are not being replaced.',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'retired',
      title: 'Retired',
      description:
        'A retired topic stays readable so old records keep their meaning; it is simply no longer offered when classifying something new.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      parent: 'parent.title',
      retired: 'retired',
    },
    prepare({ title, slug, parent, retired }) {
      const parts = [parent ? `under ${parent}` : null, slug, retired ? 'retired' : null]
      return {
        title,
        subtitle: parts.filter(Boolean).join(' · '),
      }
    },
  },
})
