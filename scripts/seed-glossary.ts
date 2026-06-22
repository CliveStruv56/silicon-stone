import dotenv from 'dotenv'
import { createClient } from '@sanity/client'
import { GLOSSARY_SEED_TERMS } from '../src/lib/glossary-seed'

dotenv.config({ path: '.env.local' })

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) throw new Error('SANITY_API_WRITE_TOKEN is required to seed glossary terms')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  token,
  useCdn: false,
})

async function seedGlossary() {
  const targetIds = GLOSSARY_SEED_TERMS.map((term) => `glossary-${term.slug}`)
  const existingIds = await client.fetch<string[]>('*[_id in $ids]._id', { ids: targetIds })
  let transaction = client.transaction()
  for (const term of GLOSSARY_SEED_TERMS) {
    const document = {
      _id: `glossary-${term.slug}`,
      _type: 'glossaryTerm',
      ...term,
      slug: { _type: 'slug', current: term.slug },
    }
    transaction = transaction.createIfNotExists(document)
  }
  const result = await transaction.commit({ visibility: 'sync' })
  const storedIds = await client.fetch<string[]>('*[_id in $ids]._id', { ids: targetIds })
  if (storedIds.length < GLOSSARY_SEED_TERMS.length) {
    throw new Error(`Glossary seed verification failed: expected ${GLOSSARY_SEED_TERMS.length}, found ${storedIds.length}`)
  }
  console.log(
    `Glossary seed complete: ${storedIds.length - existingIds.length} created, ${existingIds.length} already present (${result.documentIds.length} mutations confirmed).`
  )
}

seedGlossary().catch((error) => {
  console.error(error)
  process.exit(1)
})
