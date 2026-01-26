/**
 * Seed Categories Script
 * Creates initial content categories in Sanity
 * 
 * Run with: npx tsx scripts/seed-categories.ts
 */

import { createClient } from '@sanity/client'

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
})

const categories = [
    {
        title: 'Atlantic Drift',
        slug: 'atlantic-drift',
        description: 'Analysis of the growing divergence between US and EU technology policies, trade relations, and regulatory approaches.',
    },
    {
        title: 'US Technopolitics',
        slug: 'us-technopolitics',
        description: 'Coverage of US technology policy, executive orders, congressional actions, and their impact on global tech.',
    },
    {
        title: 'European Sovereignty',
        slug: 'european-sovereignty',
        description: 'The EU\'s push for digital sovereignty, technology independence, and strategic autonomy.',
    },
    {
        title: 'Asian Innovation',
        slug: 'asian-innovation',
        description: 'Technology developments in China, Taiwan, Japan, Korea and the broader Asia-Pacific region.',
    },
    {
        title: 'AI Act & Compliance',
        slug: 'ai-act',
        description: 'Analysis of the EU AI Act, compliance requirements, risk classifications, and implementation timelines.',
    },
    {
        title: 'Semiconductor Supply Chains',
        slug: 'semiconductors',
        description: 'Chip manufacturing, supply chain geopolitics, and the global semiconductor industry.',
    },
    {
        title: 'Digital Sovereignty',
        slug: 'digital-sovereignty',
        description: 'Data localization, cloud sovereignty, and nations\' control over their digital infrastructure.',
    },
    {
        title: 'Edge Economy',
        slug: 'edge-economy',
        description: 'Economic strategies for companies operating at the intersection of technology and regulation.',
    },
]

async function seedCategories() {
    console.log('🌱 Seeding categories...\n')

    for (const cat of categories) {
        try {
            // Check if category already exists
            const existing = await client.fetch(
                `*[_type == "category" && slug.current == $slug][0]`,
                { slug: cat.slug }
            )

            if (existing) {
                console.log(`⏭️  Skipping "${cat.title}" (already exists)`)
                continue
            }

            // Create new category
            const result = await client.create({
                _type: 'category',
                title: cat.title,
                slug: {
                    _type: 'slug',
                    current: cat.slug,
                },
                description: cat.description,
            })

            console.log(`✅ Created "${cat.title}" (${result._id})`)
        } catch (error) {
            console.error(`❌ Failed to create "${cat.title}":`, error)
        }
    }

    console.log('\n🎉 Done!')
}

seedCategories()
