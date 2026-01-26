import { defineField, defineType } from 'sanity'
import { Settings } from 'lucide-react'

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
    ],
})
