import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

const CATEGORIES_QUERY = `*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current
}`

export async function GET() {
    try {
        const categories = await client.fetch(CATEGORIES_QUERY)
        return NextResponse.json(categories)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json([], { status: 500 })
    }
}
