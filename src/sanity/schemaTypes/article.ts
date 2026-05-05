import { defineType, defineField, defineArrayMember } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: DocumentTextIcon,
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
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
    }),
    defineField({
      name: 'personas',
      title: 'Target Personas',
      description: 'Which decision-makers is this most relevant for?',
      type: 'array',
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
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          { title: 'Signal (Breaking Analysis)', value: 'signal' },
          { title: 'Deep Dive (Long-form)', value: 'deepdive' },
          { title: 'Tool Guide', value: 'guide' },
          { title: 'YouTube Script', value: 'youtube' },
        ],
        layout: 'radio',
      },
      initialValue: 'signal',
    }),
    // === INTELLIGENCE PORTAL FIELDS ===
    defineField({
      name: 'intelligenceTier',
      title: 'Intelligence Tier',
      description: 'Reading speed tier for tiered content experience',
      type: 'string',
      options: {
        list: [
          { title: 'Pulse (30s scan)', value: 'pulse' },
          { title: 'Briefing (5min read)', value: 'briefing' },
          { title: 'Audit (deep analysis)', value: 'audit' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'impactScore',
      title: 'Impact Score',
      description: 'Significance rating 1-10 for urgency display',
      type: 'number',
      validation: (rule) => rule.min(1).max(10),
    }),
    defineField({
      name: 'stoneTruth',
      title: 'Stone Truth',
      description: 'One-sentence "bottom line" summary (max 160 chars)',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(160).warning('Keep Stone Truth under 160 characters'),
    }),
    defineField({
      name: 'methodologyPillars',
      title: 'Methodology Audit (3×2 matrix cells)',
      description:
        'Cells of the 3×2 Forensic Technopolitics matrix that this piece ' +
        'applies. Pulses use 1 cell; Briefings 2–4 cells; Audits all 6.',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Supply Chain × Scenario Modelling', value: 'supply-chain-scenario-modelling' },
          { title: 'Supply Chain × Long-Memory Filter', value: 'supply-chain-long-memory-filter' },
          { title: 'Policy × Scenario Modelling',       value: 'policy-scenario-modelling'       },
          { title: 'Policy × Long-Memory Filter',       value: 'policy-long-memory-filter'       },
          { title: 'Talent × Scenario Modelling',       value: 'talent-scenario-modelling'       },
          { title: 'Talent × Long-Memory Filter',       value: 'talent-long-memory-filter'       },
        ],
        layout: 'tags',
      },
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: 'actionableInsights',
      title: 'Actionable Insights',
      description: 'Key takeaways for decision-makers (3-5 bullets)',
      type: 'array',
      of: [defineArrayMember({ type: 'text' })],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      description: 'Short summary for cards and SEO (max 200 characters)',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(200).warning('Keep excerpts under 200 characters'),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
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
                      rule.uri({
                        scheme: ['http', 'https', 'mailto'],
                      }),
                  }),
                  defineField({
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: false,
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Override the default title for search engines',
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
      author: 'author.name',
      media: 'mainImage',
      contentType: 'contentType',
      intelligenceTier: 'intelligenceTier',
      impactScore: 'impactScore',
    },
    prepare(selection) {
      const { title, author, media, contentType, intelligenceTier, impactScore } = selection
      const typeLabel = contentType === 'deepdive' ? 'Deep Dive' : contentType === 'signal' ? 'Signal' : contentType === 'youtube' ? 'YouTube' : 'Guide'
      const tierLabel = intelligenceTier ? ` [${intelligenceTier.toUpperCase()}]` : ''
      const scoreLabel = impactScore ? ` Impact: ${impactScore}/10` : ''
      return {
        title,
        subtitle: `${typeLabel}${tierLabel}${scoreLabel} ${author ? `by ${author}` : ''}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
