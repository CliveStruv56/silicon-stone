import { BookIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { GLOSSARY_KIND_LABELS, GLOSSARY_KINDS } from '@/lib/glossary'

export const glossaryTerm = defineType({
  name: 'glossaryTerm',
  title: 'Glossary Term',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Canonical name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'acronym',
      title: 'Acronym or initialism',
      description: 'For example, GPAI. Leave blank for ordinary terms.',
      type: 'string',
    }),
    defineField({
      name: 'fullName',
      title: 'Expanded or official name',
      description: 'Use when it differs from the canonical display name.',
      type: 'string',
    }),
    defineField({
      name: 'aliases',
      title: 'Aliases and alternative spellings',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      options: {
        list: GLOSSARY_KINDS.map((value) => ({
          value,
          title: GLOSSARY_KIND_LABELS[value],
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'definition',
      title: 'Short definition',
      description: 'One plain-language sentence. Maximum 240 characters.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Official or primary source',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'reviewedAt',
      title: 'Last reviewed',
      type: 'date',
    }),
    defineField({
      name: 'relatedTerms',
      title: 'Related terms',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'glossaryTerm' }],
          options: { disableNew: true },
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
  ],
  orderings: [
    {
      title: 'Name, A–Z',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'name', acronym: 'acronym', subtitle: 'kind' },
    prepare({ title, acronym, subtitle }) {
      return {
        title: acronym ? `${acronym} — ${title}` : title,
        subtitle: GLOSSARY_KIND_LABELS[subtitle as keyof typeof GLOSSARY_KIND_LABELS] ?? subtitle,
      }
    },
  },
})
