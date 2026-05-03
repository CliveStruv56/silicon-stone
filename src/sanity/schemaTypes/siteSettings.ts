import { defineField, defineType, defineArrayMember } from 'sanity'
import { Settings } from 'lucide-react'

const richBlock = defineArrayMember({
    type: 'block',
    styles: [{ title: 'Normal', value: 'normal' }],
    lists: [],
    marks: {
        decorators: [
            { title: 'Strong', value: 'strong' },
            { title: 'Emphasis', value: 'em' },
        ],
        annotations: [],
    },
})

export const siteSettings = defineType({
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    icon: Settings,
    fields: [
        defineField({
            name: 'heroImage',
            title: 'Homepage Hero Image',
            type: 'image',
            description: 'The large background image shown on the homepage.',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'heroTitle',
            title: 'Hero Title',
            type: 'string',
            description: 'Optional override for the main headline.',
        }),
        defineField({
            name: 'heroDescription',
            title: 'Hero Description',
            type: 'text',
            rows: 3,
            description: 'Optional override for the subheadline description.',
        }),
        defineField({
            name: 'orchestrationBattleground',
            title: 'Orchestration Battleground (Homepage §2)',
            type: 'object',
            description:
                'Structural-analysis briefing on the homepage. Leave fields blank to fall back to the locked redesign copy in COPY.md.',
            options: { collapsible: true, collapsed: true },
            fields: [
                defineField({
                    name: 'enabled',
                    title: 'Render this section',
                    type: 'boolean',
                    initialValue: true,
                }),
                defineField({ name: 'eyebrow', title: 'Eyebrow badge', type: 'string' }),
                defineField({ name: 'h2', title: 'Section heading', type: 'string' }),
                defineField({
                    name: 'subhead',
                    title: 'Subhead (silicon-amber)',
                    type: 'string',
                }),
                defineField({
                    name: 'intro',
                    title: 'Intro paragraph',
                    type: 'text',
                    rows: 5,
                }),
                defineField({
                    name: 'stance01',
                    title: 'Stance 01 — left column (Model-Dependent)',
                    type: 'object',
                    fields: [
                        defineField({ name: 'tag', title: 'Tag', type: 'string' }),
                        defineField({ name: 'title', title: 'Title', type: 'string' }),
                        defineField({
                            name: 'descriptor',
                            title: 'Descriptor',
                            type: 'string',
                        }),
                        defineField({
                            name: 'voice',
                            title: 'Voice quote (one sentence in smart quotes)',
                            type: 'string',
                        }),
                        defineField({
                            name: 'bullets',
                            title: 'Bullets (5 expected)',
                            description:
                                'Each bullet is a short rich-text paragraph. Use Strong on the consequence clause for Stance 01.',
                            type: 'array',
                            of: [richBlock],
                        }),
                    ],
                }),
                defineField({
                    name: 'stance02',
                    title: 'Stance 02 — right column (Orchestration-Side)',
                    type: 'object',
                    fields: [
                        defineField({ name: 'tag', title: 'Tag', type: 'string' }),
                        defineField({ name: 'title', title: 'Title', type: 'string' }),
                        defineField({
                            name: 'descriptor',
                            title: 'Descriptor',
                            type: 'string',
                        }),
                        defineField({
                            name: 'voice',
                            title: 'Voice quote (one sentence in smart quotes)',
                            type: 'string',
                        }),
                        defineField({
                            name: 'bullets',
                            title: 'Bullets (5 expected)',
                            description:
                                'Each bullet is a short rich-text paragraph. Use Emphasis on the consequence clause for Stance 02.',
                            type: 'array',
                            of: [richBlock],
                        }),
                    ],
                }),
                defineField({
                    name: 'stoneTruth',
                    title: 'Stone Truth callout',
                    type: 'object',
                    fields: [
                        defineField({
                            name: 'label',
                            title: 'Label',
                            type: 'string',
                            initialValue: 'Stone Truth',
                        }),
                        defineField({
                            name: 'body',
                            title: 'Body (rich text)',
                            description:
                                'Use Emphasis on the quotable second sentence.',
                            type: 'array',
                            of: [richBlock],
                        }),
                    ],
                }),
            ],
        }),
    ],
})
