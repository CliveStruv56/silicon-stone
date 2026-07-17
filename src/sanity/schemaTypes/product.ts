import { defineType, defineField, defineArrayMember } from 'sanity'
import { TagIcon } from '@sanity/icons'

/**
 * A purchasable product, used to drive the contextual upsell (P3-3) and the
 * commerce mode of the article Gate (P3-1). The three live products
 * (checklist, toolkit, sector reports) each have a self-service page under
 * /products/<slug> with the real buy button; this document is the *mapping*
 * layer — which product an article's topic should surface, plus the copy the
 * end-of-article gate renders. Editors add/retopic products here without a
 * code deploy.
 *
 * `checkoutUrl` is optional: when a Lemon Squeezy overlay/hosted URL is set,
 * the gate CTA opens checkout directly; when blank, it links to `productPath`
 * (the product page, which carries the env-driven buy button). Either way the
 * upsell degrades gracefully.
 */
export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: TagIcon,
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
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          { title: 'Toolkit', value: 'toolkit' },
          { title: 'Checklist', value: 'checklist' },
          { title: 'Sector Report', value: 'report' },
          { title: 'Intelligence Series', value: 'series' },
          { title: 'Advisory', value: 'advisory' },
        ],
        layout: 'radio',
      },
      initialValue: 'toolkit',
    }),
    defineField({
      name: 'priceLabel',
      title: 'Price label',
      description: 'Display string, e.g. "£24", "From £79".',
      type: 'string',
    }),
    defineField({
      name: 'blurb',
      title: 'Blurb',
      description: 'One or two lines pitched at a reader who just finished an article. Used in the upsell / commerce gate.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(240).warning('Keep the blurb tight — under 240 characters.'),
    }),
    defineField({
      name: 'productPath',
      title: 'Product page path',
      description: 'Internal link to the product page, e.g. /products/ai-act-toolkit. Used as the "learn more" / fallback CTA target.',
      type: 'string',
      validation: (rule) =>
        rule
          .required()
          .regex(/^\/[\w\-/]*$/, { name: 'path' })
          .error('Must be a root-relative path like /products/ai-act-toolkit'),
    }),
    defineField({
      name: 'checkoutUrl',
      title: 'Lemon Squeezy checkout URL',
      description: 'Optional. When set, the gate CTA opens this checkout directly. Leave blank to link to the product page instead.',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'deliveryModel',
      title: 'Delivery model',
      description: 'Download = buy → emailed/downloadable artefact (Model A). Unlock = on-site preview then licence-key unlock (Model B).',
      type: 'string',
      options: {
        list: [
          { title: 'Download delivery (Model A)', value: 'download' },
          { title: 'On-site unlock (Model B)', value: 'unlock' },
        ],
        layout: 'radio',
      },
      initialValue: 'download',
    }),
    defineField({
      name: 'lemonVariantId',
      title: 'Lemon Squeezy variant ID',
      description: 'Numeric LS variant ID. Required for on-site unlock (Model B) licence-key validation; optional otherwise.',
      type: 'string',
    }),
    defineField({
      name: 'topics',
      title: 'Topics',
      description: 'Categories this product is relevant to. Drives the automatic article → product upsell mapping.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
    }),
    defineField({
      name: 'badge',
      title: 'Badge',
      description: 'Optional short label, e.g. "Quick Start", "Flagship".',
      type: 'string',
    }),
    defineField({
      name: 'isDefault',
      title: 'Default upsell',
      description: 'Use this product as the fallback upsell when an article has no topic match. Set on exactly one product.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'priceLabel', isDefault: 'isDefault' },
    prepare({ title, subtitle, isDefault }) {
      return {
        title,
        subtitle: `${subtitle || ''}${isDefault ? ' · default upsell' : ''}`.trim(),
      }
    },
  },
})
