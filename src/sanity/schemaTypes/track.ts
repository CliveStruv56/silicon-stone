import { defineType, defineField } from 'sanity'
import { StackIcon } from '@sanity/icons'
import { LEARN_PRICE_KEYS } from '@/lib/offering'
import { TRACK_SLUGS } from '@/lib/learn/model'
import { MONTH_PATTERN, noDuplicateRefs, weakCourseRef } from './learnShared'

/**
 * A track: the unit Silicon to Sovereignty is sold and released in. One track
 * opens at a time, first as a live founding cohort, then self-serve.
 *
 * **No price is typed here.** `priceKey` picks a band from `LEARN_PRICES` in
 * `src/lib/offering.ts`, which is where every figure the site shows is typed.
 * The slug list is code-owned (`TRACK_SLUGS`) because the waitlist's
 * `learn-track-*` tags are built from it.
 */
export const track = defineType({
  name: 'track',
  title: 'Track',
  type: 'document',
  icon: StackIcon,
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
      description: 'Fixed list: the waitlist tags are built from these.',
      type: 'slug',
      options: { source: 'title', maxLength: 64 },
      validation: (rule) =>
        rule.required().custom((slug?: { current?: string }) =>
          !slug?.current || (TRACK_SLUGS as readonly string[]).includes(slug.current)
            ? true
            : `Must be one of: ${TRACK_SLUGS.join(', ')}`,
        ),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      description: 'Lower sorts first on the hub and in the menu.',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: 'intro',
      title: 'Why this track matters',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'courses',
      title: 'Courses, in order',
      description: 'Drag to reorder. Draft courses may be added: they keep their place.',
      type: 'array',
      of: [weakCourseRef],
      validation: (rule) =>
        rule.required().min(1).custom(noDuplicateRefs('A course can appear only once in a track.')),
    }),
    defineField({
      name: 'priceKey',
      title: 'Price band',
      description: 'The figures live in the code catalogue (src/lib/offering.ts), not here.',
      type: 'string',
      options: { list: LEARN_PRICE_KEYS.map((key) => ({ title: key, value: key })) },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'opens',
      title: 'Opens (month)',
      description: 'YYYY-MM. The month the founding cohort starts. Leave blank if not yet scheduled.',
      type: 'string',
      validation: (rule) =>
        rule.custom((value?: string) => !value || MONTH_PATTERN.test(value) || 'Use YYYY-MM, e.g. 2027-01'),
    }),
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', opens: 'opens', courses: 'courses' },
    prepare: ({ title, opens, courses }) => {
      const count = Array.isArray(courses) ? courses.length : 0
      return { title, subtitle: `${count} ${count === 1 ? 'course' : 'courses'}${opens ? ` · opens ${opens}` : ''}` }
    },
  },
})
