import { defineType, defineField, defineArrayMember } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'
import { slugify } from '@/lib/utils'

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
        maxLength: 64,
        // Word-boundary truncation so manual Studio slugs match the pipeline's.
        slugify: (input) => slugify(input, 64),
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
        'visibly applies. Pulses usually use 1 cell; Briefings 2–4 cells; ' +
        'Audits are eligible for all 6 but should only claim cells the body actually uses.',
      type: 'array',
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
      name: 'relatedArticles',
      title: 'Related Articles',
      description:
        'Precomputed semantic neighbours. Updated by the vectorize webhook so public article renders do not call embedding/search providers.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      description:
        'Set this only when you materially revise a piece after publishing. Shows a visible "Updated" date and feeds dateModified in structured data. Leave blank for the original publication and for minor/SEO-only tweaks.',
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
      name: 'citations',
      title: 'Sources / Citations',
      description:
        'Primary sources cited in this piece. Renders as the "Sources" list and ' +
        'feeds Article structured data (schema.org citation). Prefer primary ' +
        'sources — official filings, regulators, named reporting.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'citation',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) =>
                rule.required().uri({ scheme: ['http', 'https'] }),
            }),
            defineField({
              name: 'publisher',
              title: 'Publisher',
              description: 'e.g. European Commission, Reuters, FT',
              type: 'string',
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'url' } },
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
    defineField({
      name: 'source',
      title: 'Source',
      description: 'How this article entered the system.',
      type: 'string',
      options: {
        list: [
          { title: 'AI-Generated', value: 'generated' },
          { title: 'Imported & Reworked', value: 'imported' },
          { title: 'Manual', value: 'manual' },
        ],
      },
    }),
    defineField({
      name: 'sourceMaterial',
      title: 'Original Source Material',
      description:
        'Original text an imported article was reworked from. Reference only — never published.',
      type: 'text',
      rows: 12,
    }),
    defineField({
      name: 'voiceEditNotes',
      title: 'Voice Edit Notes',
      description:
        'Auto-generated by the Pass-3 voice edit: AI tells removed, house-style corrections, and the list of [AUTHOR: …] specifics still needed. Resolve every [AUTHOR: …] placeholder in the body before publishing. Editorial reference — never published.',
      type: 'text',
      rows: 12,
      readOnly: true,
    }),
    defineField({
      name: 'factCheck',
      title: 'Fact Check',
      description:
        'Machine-generated verification report from the "Run fact-check" document action. ' +
        'Each claim is checked against fresh web searches of primary sources. Advisory only — ' +
        'never blocks publishing, never edits the body. Apply suggested revisions manually.',
      type: 'object',
      readOnly: true,
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'status',
          title: 'Status',
          type: 'string',
          options: {
            list: [
              { title: 'Running', value: 'running' },
              { title: 'Completed', value: 'completed' },
              { title: 'Failed', value: 'failed' },
            ],
          },
        }),
        defineField({ name: 'requestedAt', title: 'Requested At', type: 'datetime' }),
        defineField({ name: 'completedAt', title: 'Completed At', type: 'datetime' }),
        defineField({
          name: 'model',
          title: 'Model',
          description: 'Claude model that produced this report.',
          type: 'string',
        }),
        defineField({ name: 'error', title: 'Error', type: 'text', rows: 2 }),
        defineField({
          name: 'overallVerdict',
          title: 'Overall Verdict',
          type: 'string',
          options: {
            list: [
              { title: 'Clean', value: 'clean' },
              { title: 'Minor issues', value: 'minor-issues' },
              { title: 'Major issues', value: 'major-issues' },
              { title: 'Mostly unverifiable', value: 'unverifiable' },
            ],
          },
        }),
        defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 4 }),
        defineField({
          name: 'counts',
          title: 'Verdict Counts',
          type: 'object',
          fields: [
            defineField({ name: 'total', title: 'Total', type: 'number' }),
            defineField({ name: 'accurate', title: 'Accurate', type: 'number' }),
            defineField({ name: 'inaccurate', title: 'Inaccurate', type: 'number' }),
            defineField({ name: 'outdated', title: 'Outdated', type: 'number' }),
            defineField({ name: 'needsContext', title: 'Needs Context', type: 'number' }),
            defineField({ name: 'unverifiable', title: 'Unverifiable', type: 'number' }),
          ],
        }),
        defineField({
          name: 'claims',
          title: 'Claims',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'claimCheck',
              fields: [
                defineField({ name: 'claim', title: 'Claim', type: 'text', rows: 2 }),
                defineField({
                  name: 'locationHint',
                  title: 'Location Hint',
                  description: 'Verbatim fragment from the body — search for it to find the claim.',
                  type: 'string',
                }),
                defineField({
                  name: 'verdict',
                  title: 'Verdict',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Accurate', value: 'accurate' },
                      { title: 'Inaccurate', value: 'inaccurate' },
                      { title: 'Outdated', value: 'outdated' },
                      { title: 'Needs context', value: 'needs-context' },
                      { title: 'Unverifiable', value: 'unverifiable' },
                    ],
                  },
                }),
                defineField({
                  name: 'confidence',
                  title: 'Confidence',
                  type: 'string',
                  options: { list: ['high', 'medium', 'low'] },
                }),
                defineField({ name: 'evidence', title: 'Evidence', type: 'text', rows: 3 }),
                defineField({
                  name: 'sourceUrls',
                  title: 'Source URLs',
                  type: 'array',
                  of: [defineArrayMember({ type: 'url' })],
                }),
                defineField({
                  name: 'suggestedRevision',
                  title: 'Suggested Revision',
                  description: 'Proposed corrected wording — apply manually, never auto-applied.',
                  type: 'text',
                  rows: 3,
                }),
              ],
              preview: {
                select: { title: 'claim', verdict: 'verdict', confidence: 'confidence' },
                prepare({ title, verdict, confidence }) {
                  const mark =
                    verdict === 'accurate' ? '✓'
                    : verdict === 'inaccurate' ? '✗'
                    : verdict === 'outdated' ? '⏱'
                    : verdict === 'needs-context' ? '◐'
                    : '?'
                  return {
                    title: `${mark} ${title ?? ''}`,
                    subtitle: `${verdict ?? '—'}${confidence ? ` · ${confidence} confidence` : ''}`,
                  }
                },
              },
            }),
          ],
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
