import { defineType, defineField, defineArrayMember } from 'sanity'
import { BookIcon } from '@sanity/icons'
import {
  COURSE_CODE,
  COURSE_STATUSES,
  COURSE_STATUS_TITLES,
  EXERCISE_TOOLS,
} from '@/lib/learn/model'
import { apiVersion } from '../env'
import { MONTH_PATTERN } from './learnShared'

/**
 * One course in Silicon to Sovereignty. Its fields follow the course-page
 * template in `docs/learn/plan.md`, section by section.
 *
 * Two deliberate absences:
 *
 *  - **No price.** A course is priced by its track's band, which lives in
 *    `src/lib/offering.ts`. See `track.priceKey`.
 *  - **No reference to a tool document.** The tools are code, not documents, so
 *    `exerciseTools` is a list of keys into `EXERCISE_TOOLS`, which resolves the
 *    name and URL. A renamed tool cannot leave a course pointing at a dead link.
 */
export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  icon: BookIcon,
  groups: [
    { name: 'page', title: 'Course page', default: true },
    { name: 'delivery', title: 'Status and dates' },
    { name: 'related', title: 'Related' },
  ],
  fields: [
    defineField({
      group: 'page',
      name: 'code',
      title: 'Code',
      description: 'Level, a dot, then the number: 2.2, 4.10.',
      type: 'string',
      validation: (rule) =>
        rule
          .required()
          .custom((code?: string) => !code || COURSE_CODE.test(code) || 'Use the form 2.2 or 4.10')
          .custom(async (code, context) => {
            if (!code) return true
            const client = context.getClient({ apiVersion })
            const id = (context.document?._id ?? '').replace(/^drafts\./, '')
            const clash = await client.fetch<number>(
              'count(*[_type == "course" && code == $code && !(_id in [$id, "drafts." + $id])])',
              { code, id },
            )
            return clash === 0 || `Another course already has code ${code}`
          }),
    }),
    defineField({
      group: 'page',
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'page',
      name: 'slug',
      title: 'Slug',
      description: 'The course page is /learn/courses/<slug>.',
      type: 'slug',
      options: { source: 'title', maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'page',
      name: 'level',
      title: 'Level',
      type: 'reference',
      to: [{ type: 'level' }],
      options: { disableNew: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'page',
      name: 'track',
      title: 'Track',
      description: 'The track this course is sold and released in. Add it to the track’s course list too.',
      type: 'reference',
      to: [{ type: 'track' }],
      options: { disableNew: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'page',
      name: 'promise',
      title: 'Promise',
      description: 'One line under the title. Benefit before topic.',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required().max(220).warning('Keep the promise to one line (220 characters)'),
    }),
    defineField({
      group: 'page',
      name: 'audience',
      title: 'Who it’s for',
      description: 'Role chips: "Leaders", "Estates", "Finance".',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      group: 'page',
      name: 'priorKnowledge',
      title: 'Prior knowledge',
      description: 'One sentence.',
      type: 'string',
    }),
    defineField({
      group: 'page',
      name: 'outcomes',
      title: 'What you’ll be able to do',
      description: 'Three to five, each starting with a verb: "Explain to your board why…"',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => [
        rule.required().min(1).max(5),
        rule.min(3).warning('The template asks for three to five outcomes.'),
      ],
    }),
    defineField({
      group: 'page',
      name: 'modules',
      title: 'Shape of the course',
      description: 'In order. The position is the module number.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'courseModule',
          title: 'Module',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'core', title: 'Core', description: 'For leaders and semi-technical readers.', type: 'text', rows: 2 }),
            defineField({ name: 'goDeeper', title: 'Go deeper', description: 'For engineers and specialists. Optional.', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'title', subtitle: 'core' } },
        }),
      ],
    }),
    defineField({
      group: 'page',
      name: 'duration',
      title: 'Duration (as shown)',
      description: '"2 h", "Half day", "4 × 1 h". Indicative, for the self-serve version.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'page',
      name: 'durationMinutes',
      title: 'Duration in minutes',
      description: 'Used only to total a route’s time. Use the midpoint of a range.',
      type: 'number',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      group: 'page',
      name: 'exerciseTools',
      title: 'Exercise tools',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: Object.entries(EXERCISE_TOOLS).map(([value, tool]) => ({ title: tool.name, value })),
      },
      validation: (rule) => rule.unique(),
    }),
    defineField({
      group: 'page',
      name: 'exercise',
      title: 'The exercise',
      description: 'What the learner does, and what they leave with: a register, a dependency map, a board note.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      group: 'delivery',
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: COURSE_STATUSES.map((value) => ({ title: COURSE_STATUS_TITLES[value], value })),
        layout: 'radio',
      },
      initialValue: 'in-development',
      validation: (rule) => rule.required(),
    }),
    defineField({
      group: 'delivery',
      name: 'statusMonth',
      title: 'Coming in (month)',
      description: 'YYYY-MM. Required when the status is Coming; the badge reads "Coming January 2027".',
      type: 'string',
      validation: (rule) =>
        rule.custom((value: string | undefined, context) => {
          const status = (context.document as { status?: string } | undefined)?.status
          if (value && !MONTH_PATTERN.test(value)) return 'Use YYYY-MM, e.g. 2027-01'
          if (status === 'coming' && !value) return 'A course that is Coming needs a month.'
          return true
        }),
    }),
    defineField({
      group: 'delivery',
      name: 'cohortDates',
      title: 'Founding cohort sessions',
      description: 'Each live session. Times are UK time.',
      type: 'array',
      of: [defineArrayMember({ type: 'datetime' })],
    }),
    defineField({
      group: 'delivery',
      name: 'selfServeFrom',
      title: 'Self-serve from (month)',
      type: 'string',
      validation: (rule) =>
        rule.custom((value?: string) => !value || MONTH_PATTERN.test(value) || 'Use YYYY-MM, e.g. 2027-05'),
    }),
    defineField({
      group: 'delivery',
      name: 'contentCheckedDate',
      title: 'Content checked against',
      description: 'The date the regulatory content was last checked. Shown on the course page.',
      type: 'date',
    }),
    defineField({
      group: 'related',
      name: 'relatedArticles',
      title: 'Related articles',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', weak: true, to: [{ type: 'article' }] })],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      group: 'related',
      name: 'nextCourse',
      title: 'Next course on the route',
      type: 'reference',
      weak: true,
      to: [{ type: 'course' }],
      options: { disableNew: true },
    }),
  ],
  orderings: [
    {
      title: 'Code',
      name: 'codeAsc',
      // Sanity sorts strings lexically, so 4.10 lands before 4.2 here. The site
      // sorts with compareCodes() in src/lib/learn/model.ts; this ordering is
      // only a Studio convenience.
      by: [{ field: 'code', direction: 'asc' }],
    },
  ],
  preview: {
    select: { code: 'code', title: 'title', status: 'status', month: 'statusMonth' },
    prepare: ({ code, title, status, month }) => ({
      title: `${code ?? '?'} · ${title ?? 'Untitled course'}`,
      subtitle: [COURSE_STATUS_TITLES[status as keyof typeof COURSE_STATUS_TITLES], month].filter(Boolean).join(' · '),
    }),
  },
})
