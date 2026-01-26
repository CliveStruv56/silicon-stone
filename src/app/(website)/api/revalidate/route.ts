import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

export async function POST(req: NextRequest) {
    try {
        const { isValidSignature, body } = await parseBody<{ _type: string; slug?: { current: string } }>(
            req,
            process.env.SANITY_REVALIDATE_SECRET,
        )

        if (!isValidSignature) {
            return new Response('Invalid Signature', { status: 401 })
        }

        if (!body?._type) {
            return new Response('Bad Request', { status: 400 })
        }

        // Revalidate the main list and specific paths
        // revalidateTag('sanity')

        return NextResponse.json({
            status: 200,
            revalidated: true,
            now: Date.now(),
            body,
        })
    } catch (err) {
        console.error(err)
        return new Response(err instanceof Error ? err.message : 'Unknown error', { status: 500 })
    }
}
