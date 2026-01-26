import { defineField, defineType } from 'sanity'

export const persona = defineType({
    name: 'persona',
    title: 'Persona',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Persona Name',
            type: 'string',
            description: 'e.g. Industrial Ian',
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'role',
            title: 'Role',
            type: 'string',
            description: 'e.g. Operations Director',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 96,
            },
            validation: Rule => Rule.required(),
        }),
        defineField({
            name: 'painPoints',
            title: 'Pain Points',
            type: 'text',
            rows: 3,
            description: 'What keeps them up at night?',
        }),
        defineField({
            name: 'contentNeeds',
            title: 'Content Needs',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'What kind of content do they want?',
        }),
        defineField({
            name: 'organizationTypes',
            title: 'Organization Types',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'keyConcerns',
            title: 'Key Concerns',
            type: 'array',
            of: [{ type: 'string' }],
        }),
    ],
})
