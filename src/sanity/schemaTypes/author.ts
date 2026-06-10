import { defineType, defineField, defineArrayMember } from 'sanity'
import { UserIcon } from '@sanity/icons'
import { slugify } from '@/lib/utils'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 64,
        slugify: (input) => slugify(input, 64),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'role',
      title: 'Role',
      description: 'e.g. "Founder & Editor" — shown in the byline and as jobTitle in Person schema.',
      type: 'string',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      description: 'Short biography for the author page and Person structured data (E-E-A-T).',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'sameAs',
      title: 'Profile links (sameAs)',
      description:
        'Public profile URLs that identify this author — LinkedIn, X/Twitter, Substack, personal site, ORCID. Feeds the Person schema "sameAs" for entity disambiguation.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'url',
          validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
      subtitle: 'role',
    },
  },
})
