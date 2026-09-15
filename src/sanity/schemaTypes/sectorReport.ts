import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

/** Public sales/preview metadata only. Paid files belong in protected delivery storage. */
export const sectorReport = defineType({
  name: 'sectorReport',
  title: 'Sector report', type: 'document', icon: DocumentTextIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: rule => rule.required() }),
    defineField({ name: 'previewPublished', title: 'Show public preview', type: 'boolean', initialValue: false,
      description: 'Publishes the preview only. This does not enable checkout.' }),
    defineField({ name: 'description', type: 'text', rows: 4, validation: rule => rule.required() }),
    defineField({ name: 'highlights', type: 'array', of: [defineArrayMember({ type: 'string' })], validation: rule => rule.required().min(1) }),
    defineField({ name: 'audiences', type: 'array', of: [defineArrayMember({ type: 'object', fields: [
      defineField({ name: 'title', type: 'string', validation: rule => rule.required() }),
      defineField({ name: 'description', type: 'text', rows: 2, validation: rule => rule.required() }),
    ] })] }),
    defineField({ name: 'currentEdition', type: 'reference', to: [{ type: 'sectorReportEdition' }],
      description: 'Publish the new edition, then change this reference. The report URL stays the same.',
      validation: rule => rule.required() }),
    defineField({ name: 'relatedArticles', title: 'Promote this preview on these articles', type: 'array',
      description: 'Explicit placements only. Adds a preview invitation without replacing the article’s existing gate.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })] }),
  ],
  preview: { select: { title: 'title', subtitle: 'currentEdition.label' } },
})
