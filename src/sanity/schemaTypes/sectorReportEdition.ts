import { defineArrayMember, defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

export const sectorReportEdition = defineType({
  name: 'sectorReportEdition',
  title: 'Sector report edition', type: 'document', icon: DocumentTextIcon,
  description: 'Public preview of one dated edition. Do not paste the full paid report or upload its PDF here.',
  fields: [
    defineField({ name: 'label', title: 'Edition month', type: 'string', description: 'For example: October 2026', validation: rule => rule.required() }),
    defineField({ name: 'number', type: 'number', validation: rule => rule.required().integer().positive() }),
    defineField({ name: 'evidenceCutoff', title: 'Evidence cut-off', type: 'date', validation: rule => rule.required() }),
    defineField({ name: 'pageCount', type: 'number', description: 'Actual page count checked against the final PDF.', validation: rule => rule.integer().positive() }),
    defineField({ name: 'thesis', title: 'Executive Summary opening thesis', type: 'text', rows: 3, validation: rule => rule.required() }),
    defineField({ name: 'summaryOpening', title: 'First Executive Summary paragraph', type: 'text', rows: 6,
      description: 'Public excerpt only; do not paste the remaining findings or full report.', validation: rule => rule.required() }),
    defineField({ name: 'evidenceNote', type: 'text', rows: 2, validation: rule => rule.required() }),
    defineField({ name: 'nextEditionNote', type: 'text', rows: 2 }),
    defineField({ name: 'changes', title: 'What changed', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'contents', title: 'Full public contents', type: 'array', validation: rule => rule.required().min(1),
      of: [defineArrayMember({ type: 'object', fields: [
        defineField({ name: 'title', title: 'Part or group title', type: 'string', validation: rule => rule.required() }),
        defineField({ name: 'entries', type: 'array', of: [defineArrayMember({ type: 'object', fields: [
          defineField({ name: 'title', title: 'Section heading', type: 'string', validation: rule => rule.required() }),
          defineField({ name: 'depth', type: 'number', initialValue: 0,
            options: { list: [{ title: 'Chapter', value: 0 }, { title: 'Subsection', value: 1 }] },
            validation: rule => rule.required().integer().min(0).max(1) }),
        ] })] }),
      ] })] }),
  ],
  preview: { select: { title: 'label', subtitle: 'evidenceCutoff' } },
})
