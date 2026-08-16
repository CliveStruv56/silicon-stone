import { defineType, defineField, defineArrayMember } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'
import { slugify } from '@/lib/utils'
import { ClaimCheckInput } from '../components/ClaimCheckInput'
import { ImagePromptsInput } from '../components/ImagePromptsInput'

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'factCheck', title: 'Fact Check' },
  ],
  fields: [
    defineField({
      group: 'content',
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'content',
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
      group: 'content',
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      group: 'content',
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
      group: 'content',
      name: 'imagePrompts',
      title: 'Image generation prompts',
      description:
        'AI-suggested prompts describing what the main image should depict. Click "Suggest two prompts" to generate two options from the current article, then copy one into your image agent (which applies the house style).',
      type: 'object',
      components: { input: ImagePromptsInput },
      fields: [
        defineField({
          name: 'prompts',
          title: 'Prompts',
          type: 'array',
          of: [defineArrayMember({ type: 'text', rows: 3 })],
        }),
        defineField({ name: 'generatedAt', title: 'Generated At', type: 'datetime', readOnly: true }),
        defineField({ name: 'model', title: 'Model', type: 'string', readOnly: true }),
      ],
    }),
    defineField({
      group: 'content',
      name: 'categories',
      title: 'Categories',
      description:
        'At least one is required. Categories are not just navigation — they decide what the end-of-article gate offers: a product upsell when one claims the topic, otherwise whatever the category asks for (see "Default end-of-article gate" on the Category). An untagged article silently falls back to a newsletter ask.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
      // Error level, so Studio disables Publish until the piece is tagged.
      // Four published articles were found untagged on 2026-08-15, each closing
      // on a second email ask instead of the product or advisory gate.
      validation: (rule) =>
        rule.required().min(1).error('Tag the article — this drives the end-of-article gate, not just navigation.'),
    }),
    defineField({
      group: 'content',
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
          { title: 'Global Citizen (General Public)', value: 'citizen' },
          { title: 'Transatlantic Troy (Founder/CEO, US–EU Market Entry)', value: 'troy' },
        ],
      },
    }),
    defineField({
      group: 'content',
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
      group: 'content',
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
      group: 'content',
      name: 'impactScore',
      title: 'Impact Score',
      description: 'Significance rating 1-10 for urgency display',
      type: 'number',
      validation: (rule) => rule.min(1).max(10),
    }),
    defineField({
      group: 'content',
      name: 'stoneTruth',
      title: 'Stone Truth',
      description: 'One-sentence "bottom line" summary (max 160 chars)',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(160).warning('Keep Stone Truth under 160 characters'),
    }),
    defineField({
      group: 'content',
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
      group: 'content',
      name: 'actionableInsights',
      title: 'What to do next',
      description: 'Key takeaways for decision-makers (3-5 bullets)',
      type: 'array',
      of: [defineArrayMember({ type: 'text' })],
    }),
    defineField({
      group: 'content',
      name: 'gate',
      title: 'End-of-article gate',
      description:
        'The conversion surface shown after the article body (P3-1). The body is never blocked — this only appends below it. ' +
        'Auto = commerce upsell if a product maps to this topic, otherwise the newsletter. Choose a specific mode to override.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'mode',
          title: 'Mode',
          type: 'string',
          options: {
            list: [
              { title: 'Auto (product upsell if mapped, else newsletter)', value: 'auto' },
              { title: 'Newsletter / email capture', value: 'email' },
              { title: 'Commerce (product upsell / unlock)', value: 'commerce' },
              { title: 'Lead (book a call)', value: 'lead' },
              { title: 'None', value: 'none' },
            ],
            layout: 'radio',
          },
          initialValue: 'auto',
        }),
        defineField({
          name: 'product',
          title: 'Product (commerce mode)',
          description: 'Overrides the automatic topic → product mapping. Leave blank to auto-resolve from categories.',
          type: 'reference',
          to: [{ type: 'product' }],
          hidden: ({ parent }) => parent?.mode !== 'commerce' && parent?.mode !== 'auto',
        }),
        defineField({
          name: 'href',
          title: 'Link target (lead mode)',
          description: 'Where the "book a call" CTA points. Defaults to /advisory#contact.',
          type: 'string',
          hidden: ({ parent }) => parent?.mode !== 'lead',
        }),
        defineField({
          name: 'headline',
          title: 'Headline override',
          description: 'Optional. Overrides the default headline for the chosen mode.',
          type: 'string',
        }),
        defineField({
          name: 'body',
          title: 'Body override',
          description: 'Optional. Overrides the default supporting copy for the chosen mode.',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'ctaLabel',
          title: 'CTA label override',
          type: 'string',
        }),
      ],
    }),
    defineField({
      group: 'content',
      name: 'inReadCapture',
      title: 'In-read newsletter capture',
      description:
        'Show the Atlantic Drift email capture partway through the article, after the reader has scrolled past the value (P3-2). ' +
        'Never an entry wall; suppressed per-device once dismissed or subscribed. On by default.',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      group: 'content',
      name: 'relatedArticles',
      title: 'Related Articles',
      description:
        'Precomputed semantic neighbours. Updated by the vectorize webhook so public article renders do not call embedding/search providers.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      group: 'content',
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
    defineField({
      group: 'content',
      name: 'updatedAt',
      title: 'Updated At',
      description:
        'Set this only when you materially revise a piece after publishing. Shows a visible "Updated" date and feeds dateModified in structured data. Leave blank for the original publication and for minor/SEO-only tweaks.',
      type: 'datetime',
    }),
    defineField({
      group: 'content',
      name: 'excerpt',
      title: 'Excerpt',
      description: 'Short summary for cards and SEO (max 200 characters)',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(200).warning('Keep excerpts under 200 characters'),
    }),
    defineField({
      group: 'content',
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
                name: 'glossaryTerm',
                type: 'object',
                title: 'Glossary term',
                fields: [
                  defineField({
                    name: 'term',
                    title: 'Term',
                    type: 'reference',
                    to: [{ type: 'glossaryTerm' }],
                    options: { disableNew: true },
                    validation: (rule) => rule.required(),
                  }),
                ],
              },
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
      group: 'content',
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
      group: 'content',
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
      group: 'content',
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
      group: 'content',
      name: 'sourceMaterial',
      title: 'Original Source Material',
      description:
        'Original text an imported article was reworked from. Reference only — never published.',
      type: 'text',
      rows: 12,
    }),
    defineField({
      group: 'content',
      name: 'voiceEditNotes',
      title: 'Voice Edit Notes',
      description:
        'Auto-generated by the Pass-3 voice edit: AI tells removed, house-style corrections, and the list of [AUTHOR: …] specifics still needed. Resolve every [AUTHOR: …] placeholder in the body before publishing. Editorial reference — never published.',
      type: 'text',
      rows: 12,
      readOnly: true,
    }),
    defineField({
      group: 'factCheck',
      name: 'quotationAudit',
      title: 'Quotation Audit',
      description:
        'Every statutory quotation in the body, string-matched against the verbatim ' +
        'legal text the drafting model was given. UNMATCHED means the quotation is not ' +
        'in that text — it was invented, recalled from memory, or taken from a provision ' +
        'the retrieval did not return; check it against the primary source before ' +
        'publishing. UNCOVERED means no statutory text was retrieved for this draft, so ' +
        'the quotation could not be checked at all. Advisory: exact matching cannot ' +
        'always tell an elided or bracketed quotation from a fabricated one.',
      type: 'text',
      rows: 10,
      readOnly: true,
    }),
    defineField({
      group: 'factCheck',
      name: 'factCheck',
      title: 'Fact Check',
      description:
        'Machine-generated verification report from the "Run fact-check" document action. ' +
        'Each claim is checked against fresh web searches of primary sources. Advisory only — ' +
        'never blocks publishing. Edit a Suggested Revision if needed, then use ' +
        '"Insert into article" on the claim to apply it to the body.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'status',
          title: 'Status',
          type: 'string',
          readOnly: true,
          options: {
            list: [
              { title: 'Running', value: 'running' },
              { title: 'Completed', value: 'completed' },
              { title: 'Failed', value: 'failed' },
            ],
          },
        }),
        defineField({ name: 'requestedAt', title: 'Requested At', type: 'datetime', readOnly: true }),
        defineField({ name: 'completedAt', title: 'Completed At', type: 'datetime', readOnly: true }),
        defineField({
          name: 'model',
          title: 'Model',
          description: 'Claude model that produced this report.',
          type: 'string',
          readOnly: true,
        }),
        defineField({ name: 'error', title: 'Error', type: 'text', rows: 2, readOnly: true }),
        defineField({
          name: 'overallVerdict',
          title: 'Overall Verdict',
          type: 'string',
          readOnly: true,
          options: {
            list: [
              { title: 'Clean', value: 'clean' },
              { title: 'Minor issues', value: 'minor-issues' },
              { title: 'Major issues', value: 'major-issues' },
              { title: 'Mostly unverifiable', value: 'unverifiable' },
            ],
          },
        }),
        defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 4, readOnly: true }),
        defineField({
          name: 'counts',
          title: 'Verdict Counts',
          type: 'object',
          readOnly: true,
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
              components: { input: ClaimCheckInput },
              fields: [
                defineField({ name: 'claim', title: 'Claim', type: 'text', rows: 2, readOnly: true }),
                defineField({
                  name: 'locationHint',
                  title: 'Location Hint',
                  description: 'Verbatim fragment from the body — search for it to find the claim.',
                  type: 'string',
                  readOnly: true,
                }),
                defineField({
                  name: 'originalText',
                  title: 'Original Text',
                  description:
                    'The exact passage from the article this claim came from — used by "Insert into article" to find and replace it.',
                  type: 'text',
                  rows: 3,
                  readOnly: true,
                }),
                defineField({
                  name: 'verdict',
                  title: 'Verdict',
                  type: 'string',
                  readOnly: true,
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
                  readOnly: true,
                  options: { list: ['high', 'medium', 'low'] },
                }),
                defineField({ name: 'evidence', title: 'Evidence', type: 'text', rows: 3, readOnly: true }),
                defineField({
                  name: 'sourceUrls',
                  title: 'Source URLs',
                  type: 'array',
                  readOnly: true,
                  of: [defineArrayMember({ type: 'url' })],
                }),
                defineField({
                  name: 'suggestedRevision',
                  title: 'Suggested Revision',
                  description:
                    'Proposed corrected wording. Edit it here if needed, then click "Insert into article" below to replace the original passage in the body.',
                  type: 'text',
                  rows: 3,
                }),
                defineField({
                  name: 'applied',
                  title: 'Applied',
                  description: 'Set automatically when the revision is inserted into the body.',
                  type: 'boolean',
                  readOnly: true,
                }),
              ],
              preview: {
                select: { title: 'claim', verdict: 'verdict', confidence: 'confidence', applied: 'applied' },
                prepare({ title, verdict, confidence, applied }) {
                  const mark =
                    verdict === 'accurate' ? '✓'
                    : verdict === 'inaccurate' ? '✗'
                    : verdict === 'outdated' ? '⏱'
                    : verdict === 'needs-context' ? '◐'
                    : '?'
                  const status = applied
                    ? ' · revision applied'
                    : confidence ? ` · ${confidence} confidence` : ''
                  return {
                    title: `${mark} ${title ?? ''}`,
                    subtitle: `${verdict ?? '—'}${status}`,
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
