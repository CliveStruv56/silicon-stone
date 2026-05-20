import { defineType, defineField, defineArrayMember } from 'sanity'
import { PlayIcon } from '@sanity/icons'

export const youtubeScript = defineType({
  name: 'youtubeScript',
  title: 'YouTube Script',
  type: 'document',
  icon: PlayIcon,
  groups: [
    { name: 'core', title: 'Script', default: true },
    { name: 'structure', title: 'Structure' },
    { name: 'production', title: 'Production' },
    { name: 'schedule', title: 'Schedule' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'core',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'core',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'titleOptions',
      title: 'Title Candidates',
      description: '3–5 alternate titles following title-formulas.json patterns',
      type: 'array',
      group: 'core',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'pillar',
      title: 'Content Pillar',
      type: 'string',
      group: 'core',
      options: {
        list: [
          { title: 'The Stone Briefing (Tuesday, analysis)', value: 'stone-briefing' },
          { title: 'The Silicon Move (Friday, applied)', value: 'silicon-move' },
          { title: 'Stone Truth Short (60s)', value: 'shorts' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pairedScript',
      title: 'Paired Script',
      description: 'Links a Friday Silicon Move to its Tuesday Stone Briefing and vice versa',
      type: 'reference',
      group: 'core',
      to: [{ type: 'youtubeScript' }],
    }),
    defineField({
      name: 'sourceArticles',
      title: 'Source Articles',
      description: 'Articles this script draws its analysis from',
      type: 'array',
      group: 'core',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
    }),
    defineField({
      name: 'personas',
      title: 'Target Personas',
      type: 'array',
      group: 'core',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Compliance Clara (Legal/Compliance)', value: 'clara' },
          { title: 'Industrial Ian (Operations/Supply Chain)', value: 'ian' },
          { title: 'Sovereign Sofia (Policy/Analysis)', value: 'sofia' },
          { title: 'Remote Robert (Regional Development)', value: 'robert' },
          { title: 'Global Citizen (General Public)', value: 'citizen' },
        ],
      },
    }),
    // === STRUCTURE ===
    defineField({
      name: 'hook',
      title: 'Hook (0–5s)',
      description: 'Provocative opening line. No intro, no logo, no fluff.',
      type: 'text',
      rows: 2,
      group: 'structure',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'stakes',
      title: 'Stakes (5–15s)',
      description: 'Why this matters to the viewer\'s career or organisation',
      type: 'text',
      rows: 3,
      group: 'structure',
    }),
    defineField({
      name: 'methodologyChecklist',
      title: 'Methodology Checklist (15–30s)',
      description: 'Which cells of the Forensic Technopolitics 3 × 2 matrix are applied (3 forensic domains × 2 analytical methods). Match the article-level methodologyPillars vocabulary.',
      type: 'array',
      group: 'structure',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Supply Chain × Scenario Modelling', value: 'supply-chain-scenario-modelling' },
          { title: 'Supply Chain × Long-Memory Filter', value: 'supply-chain-long-memory-filter' },
          { title: 'Policy × Scenario Modelling',       value: 'policy-scenario-modelling'       },
          { title: 'Policy × Long-Memory Filter',       value: 'policy-long-memory-filter'       },
          { title: 'Talent × Scenario Modelling',       value: 'talent-scenario-modelling'       },
          { title: 'Talent × Long-Memory Filter',       value: 'talent-long-memory-filter'       },
        ],
      },
    }),
    defineField({
      name: 'scriptBody',
      title: 'Core Analysis Script',
      description: 'The substantive body of the video',
      type: 'array',
      group: 'structure',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (rule) =>
                      rule.uri({ scheme: ['http', 'https', 'mailto'] }),
                  }),
                ],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'stoneTruth',
      title: 'Stone Truth (final ~60s)',
      description: 'The bottom-line verdict. Clear, quotable, one sentence max.',
      type: 'text',
      rows: 3,
      group: 'structure',
      validation: (rule) => rule.max(280).warning('Keep Stone Truth under 280 characters'),
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action',
      description: 'One CTA per video. Never more.',
      type: 'object',
      group: 'structure',
      fields: [
        defineField({
          name: 'kind',
          title: 'Kind',
          type: 'string',
          options: {
            list: [
              { title: 'Free Lead Magnet', value: 'lead-magnet' },
              { title: 'Paid PDF (Intelligence Series)', value: 'paid-pdf' },
              { title: 'Career Product', value: 'career-product' },
              { title: 'Membership', value: 'membership' },
              { title: 'Related Video', value: 'related-video' },
            ],
          },
        }),
        defineField({
          name: 'target',
          title: 'Target',
          description: 'Product funnel id, video id, or URL',
          type: 'string',
        }),
        defineField({
          name: 'copy',
          title: 'On-Camera Copy',
          type: 'text',
          rows: 2,
        }),
      ],
    }),
    defineField({
      name: 'productFunnel',
      title: 'Product Funnel',
      description: 'Which digital product this video drives toward (id from product-funnels.json)',
      type: 'string',
      group: 'structure',
    }),
    // === PRODUCTION ===
    defineField({
      name: 'targetDurationMinutes',
      title: 'Target Duration (minutes)',
      type: 'number',
      group: 'production',
      validation: (rule) => rule.min(1).max(60),
    }),
    defineField({
      name: 'thumbnailBrief',
      title: 'Thumbnail Brief',
      description: 'Max 3 words of on-thumbnail text. Stone palette + Silicon cyan.',
      type: 'text',
      rows: 2,
      group: 'production',
    }),
    defineField({
      name: 'bRollNotes',
      title: 'B-Roll Notes',
      type: 'array',
      group: 'production',
      of: [defineArrayMember({ type: 'text' })],
    }),
    defineField({
      name: 'productionStatus',
      title: 'Production Status',
      type: 'string',
      group: 'production',
      options: {
        list: [
          { title: 'Idea', value: 'idea' },
          { title: 'Scripted', value: 'scripted' },
          { title: 'Filmed', value: 'filmed' },
          { title: 'Edited', value: 'edited' },
          { title: 'Published', value: 'published' },
        ],
        layout: 'radio',
      },
      initialValue: 'idea',
    }),
    // === SCHEDULE ===
    defineField({
      name: 'scheduledFor',
      title: 'Scheduled For',
      description: 'Target publish date (Tuesday or Friday per cadence)',
      type: 'datetime',
      group: 'schedule',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'schedule',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      group: 'schedule',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'schedule',
      of: [defineArrayMember({ type: 'string' })],
    }),
    // === SEO ===
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          validation: (rule) => rule.max(160).warning('Keep meta descriptions under 160 characters'),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      pillar: 'pillar',
      status: 'productionStatus',
      scheduledFor: 'scheduledFor',
    },
    prepare({ title, pillar, status, scheduledFor }) {
      const pillarLabel =
        pillar === 'stone-briefing' ? 'Stone Briefing'
        : pillar === 'silicon-move' ? 'Silicon Move'
        : pillar === 'shorts' ? 'Short'
        : 'Unassigned'
      const statusLabel = status ? ` · ${status}` : ''
      const dateLabel = scheduledFor
        ? ` · ${new Date(scheduledFor).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
        : ''
      return {
        title: title || 'Untitled script',
        subtitle: `${pillarLabel}${statusLabel}${dateLabel}`,
      }
    },
  },
  orderings: [
    {
      title: 'Scheduled For, Soonest',
      name: 'scheduledForAsc',
      by: [{ field: 'scheduledFor', direction: 'asc' }],
    },
    {
      title: 'Scheduled For, Latest',
      name: 'scheduledForDesc',
      by: [{ field: 'scheduledFor', direction: 'desc' }],
    },
    {
      title: 'Production Status',
      name: 'productionStatus',
      by: [{ field: 'productionStatus', direction: 'asc' }, { field: 'scheduledFor', direction: 'asc' }],
    },
  ],
})
