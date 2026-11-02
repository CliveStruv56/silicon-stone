import { DocumentsIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'
import {
  TERMS_CATEGORIES,
  TERMS_SEVERITIES,
  TERMS_SEVERITY_LABELS,
  TERMS_USE_LABELS,
  TERMS_USE_SCOPES,
  TERMS_WATCH_PROVIDERS,
} from '@/lib/terms-watch'

/**
 * One reviewed change to an AI provider's terms, written by the terms-tracker's
 * publisher after Clive approves it in Notion.
 *
 * It holds only the reviewed summary, short attributed quotes and a link to the
 * source. Never paste full terms text here: it is copyright text, and it stays
 * in the tracker's private database.
 *
 * A `termsChange` is not an `article`, so `/api/on-publish` ignores it and it can
 * never become a broadcast of its own. It reaches email only through the Stone
 * Briefing projection, which reads `briefingMarkdown` and `briefingWeek`.
 */
export const termsChange = defineType({
  name: 'termsChange',
  title: 'AI Terms Watch item',
  type: 'document',
  icon: DocumentsIcon,
  groups: [
    { name: 'summary', title: 'Summary', default: true },
    { name: 'source', title: 'Source' },
    { name: 'briefing', title: 'Stone Briefing' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'summary', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'summary',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'provider',
      title: 'Provider',
      type: 'string',
      group: 'summary',
      options: { list: TERMS_WATCH_PROVIDERS.map(({ id, name }) => ({ value: id, title: name })) },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'severity',
      title: 'Severity',
      type: 'string',
      group: 'summary',
      options: { list: TERMS_SEVERITIES.map((value) => ({ value, title: TERMS_SEVERITY_LABELS[value] })), layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'summary',
      options: { list: [...TERMS_CATEGORIES] },
    }),
    defineField({
      name: 'useScopes',
      title: 'Who it applies to',
      type: 'array',
      group: 'summary',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: TERMS_USE_SCOPES.map((value) => ({ value, title: TERMS_USE_LABELS[value] })) },
    }),
    defineField({ name: 'whatChanged', title: 'What changed', type: 'text', rows: 4, group: 'summary', validation: (rule) => rule.required() }),
    defineField({ name: 'whoIsAffected', title: 'Who is affected', type: 'text', rows: 3, group: 'summary', validation: (rule) => rule.required() }),
    defineField({ name: 'facts', title: 'Facts', type: 'array', group: 'summary', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'inferences', title: 'Inferences', type: 'array', group: 'summary', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'suggestedActions', title: 'Suggested actions', type: 'array', group: 'summary', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'stoneTruth', title: 'Stone Truth', type: 'text', rows: 2, group: 'summary' }),
    defineField({
      name: 'quotes',
      title: 'Quoted sentences',
      description: 'Short, attributed quotes only: at most three, 30 words each.',
      type: 'array',
      group: 'source',
      of: [defineArrayMember({ type: 'string', validation: (rule) => rule.custom((value) => !value || value.split(/\s+/).length <= 30 || 'Keep each quote to 30 words or fewer') })],
      validation: (rule) => rule.max(3),
    }),
    defineField({ name: 'documentTitle', title: 'Provider document', type: 'string', group: 'source', validation: (rule) => rule.required() }),
    defineField({ name: 'documentType', title: 'Document type', type: 'string', group: 'source' }),
    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      group: 'source',
      validation: (rule) => rule.required().uri({ scheme: ['https'] }),
    }),
    defineField({ name: 'region', title: 'Region', type: 'string', group: 'source' }),
    defineField({ name: 'detectedAt', title: 'Detected', type: 'date', group: 'source' }),
    defineField({ name: 'statedEffectiveDate', title: 'Effective date stated by the provider', type: 'date', group: 'source' }),
    defineField({ name: 'changeId', title: 'Tracker change id', type: 'string', group: 'source', readOnly: true }),
    defineField({ name: 'publishedAt', title: 'Published', type: 'datetime', group: 'summary', validation: (rule) => rule.required() }),
    defineField({
      name: 'briefingWeek',
      title: 'Stone Briefing issue',
      description:
        'The Tuesday whose Stone Briefing carries this item. Set to the Tuesday after publication; change it to move the item to another issue.',
      type: 'date',
      group: 'briefing',
      validation: (rule) =>
        rule.custom((value) => !value || new Date(`${value}T12:00:00Z`).getUTCDay() === 2 || 'Choose a Tuesday'),
    }),
    defineField({
      name: 'briefingMarkdown',
      title: 'Briefing text',
      description: 'This item’s part of the Stone Briefing section, in Markdown. The heading and disclaimer are added by the projection.',
      type: 'text',
      rows: 8,
      group: 'briefing',
    }),
  ],
  orderings: [{ title: 'Published, newest first', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', provider: 'provider', severity: 'severity', week: 'briefingWeek' },
    prepare({ title, provider, severity, week }) {
      const name = TERMS_WATCH_PROVIDERS.find((p) => p.id === provider)?.name ?? provider
      return { title, subtitle: [name, severity, week && `briefing ${week}`].filter(Boolean).join(' · ') }
    },
  },
})
