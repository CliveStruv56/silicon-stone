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
        //
        // The _type branch matters: this used to treat ANY slug in the body as
        // an article slug, which was harmless while only articles fired the
        // webhook but would have revalidated /analysis/<series-slug> — a path
        // that does not exist — the moment one did not.
        //
        // NOTE: **nothing calls this route today.** The Sanity plan includes two
        // webhooks and both are spoken for (vectorize, on-publish); creating a
        // third returns 400. Established 2026-09-04 — before that, LAUNCH.md
        // said the filter was the obstacle, which was wrong: there is no
        // webhook to filter.
        //
        // Cache invalidation happens instead through the Live Content API —
        // <SanityLive /> in the website layout, revalidating the sync tags that
        // every `sanityFetch` result carries. This route stays because it is
        // correct and costs nothing, and because widening `on-publish`'s filter
        // to fire it is the cheap path if publish-time invalidation is ever
        // wanted. See LAUNCH.md.
        revalidateTag('sanity')
        revalidatePath('/')
        revalidatePath('/intelligence')
        if (body._type === 'series') {
            revalidatePath('/intelligence/series')
            if (body.slug?.current) {
                revalidatePath(`/intelligence/series/${body.slug.current}`)
            }
        } else if (body.slug?.current) {
            revalidatePath(`/analysis/${body.slug.current}`)
        }

        return NextResponse.json({
            status: 200,
            revalidated: true,
            now: Date.now(),
        })
    } catch (err) {
        // Logged in full, returned as nothing. The caller here is unauthenticated
        // until parseBody() has verified the signature, and this catch covers
        // that verification too — so err.message could describe internals to
        // someone who has not proved they may ask.
        console.error('Revalidate webhook failed:', err)
        return new Response('Revalidation failed', { status: 500 })
    }
}
