import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { CATEGORIES_QUERY } from '@/sanity/lib/queries'

export async function GET() {
    try {
        const categories = await client.fetch(CATEGORIES_QUERY)
        return NextResponse.json(categories)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json([], { status: 500 })
    }
}
