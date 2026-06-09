import { type NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'

const MAX_REVALIDATE_BODY_BYTES = 50_000

export async function POST(req: NextRequest) {
    try {
        const contentLength = Number(req.headers.get('content-length') || 0)
        if (!contentLength || contentLength > MAX_REVALIDATE_BODY_BYTES) {
            return new Response('Request too large', { status: 413 })
        }

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

        // Invalidate cached content surfaces. revalidateTag covers any
        // sanityFetch results tagged 'sanity'; revalidatePath covers the
        // statically-cached list/detail routes regardless of tagging.
        revalidateTag('sanity')
        revalidatePath('/')
        revalidatePath('/analysis')
        revalidatePath('/briefings')
        if (body.slug?.current) {
            revalidatePath(`/analysis/${body.slug.current}`)
        }

        return NextResponse.json({
            status: 200,
            revalidated: true,
            now: Date.now(),
        })
    } catch (err) {
        console.error(err)
        return new Response(err instanceof Error ? err.message : 'Unknown error', { status: 500 })
    }
}
