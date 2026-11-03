import { defineType, defineField } from 'sanity'
import { SplitHorizontalIcon } from '@sanity/icons'
import { PERSONAS, PERSONA_ORDER } from '@/lib/personas'
import { ROUTE_SLUGS } from '@/lib/learn/model'
import { noDuplicateRefs, weakCourseRef } from './learnShared'

/**
 * A recommended route through the catalogue for one kind of reader — the
 * "Find your route" tabs on `/learn`, and the route shown beside a persona.
 * The position in `courses` is the step number, as in a series.
 */
export const learnRoute = defineType({
  name: 'learnRoute',
  title: 'Learn route',
  type: 'document',
  icon: SplitHorizontalIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      description: 'As the tab reads: "Board and executive".',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'Fixed list: the waitlist role tags are built from these.',
      type: 'slug',
      options: { source: 'title', maxLength: 64 },
      validation: (rule) =>
        rule.required().custom((slug?: { current?: string }) =>
          !slug?.current || (ROUTE_SLUGS as readonly string[]).includes(slug.current)
            ? true
            : `Must be one of: ${ROUTE_SLUGS.join(', ')}`,
        ),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: 'personaSlug',
      title: 'Persona',
      description: 'Optional. The site persona this route is recommended to.',
      type: 'string',
      options: {
        list: PERSONA_ORDER.map((slug) => ({ title: PERSONAS[slug].name, value: slug })),
      },
    }),
    defineField({
      name: 'courses',
      title: 'Courses, in order',
      type: 'array',
      of: [weakCourseRef],
      validation: (rule) =>
        rule.required().min(2).custom(noDuplicateRefs('A course can appear only once in a route.')),
    }),
    defineField({
      name: 'bestSoldAs',
      title: 'Best taken as',
      description: 'One line: "A 60-minute or half-day briefing".',
      type: 'string',
    }),
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', persona: 'personaSlug', courses: 'courses' },
    prepare: ({ title, persona, courses }) => {
      const count = Array.isArray(courses) ? courses.length : 0
      return { title, subtitle: `${count} courses${persona ? ` · ${persona}` : ''}` }
    },
  },
})
