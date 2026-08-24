/**
 * How long this application waits on anything it does not control.
 *
 * Before these existed, exactly one outbound call in the whole server codebase
 * was bounded — `sanity-identity.ts` — and the reason the rest were not is that
 * nothing had failed *slowly* yet. `/api/on-publish` is where the lesson was
 * learned and written down:
 *
 * > "A webhook that hangs is worse than one that fails: Sanity retries a
 * > failure, but a hung invocation burns the whole function duration first.
 * > Seen in testing — an unbounded Sanity read blocked for 15 minutes."
 *
 * That reasoning generalises to every upstream. A hung call does not merely
 * fail; it consumes the function's entire budget first, so the caller loses the
 * work it had already done and gets a platform timeout instead of an error it
 * could have reported.
 *
 * The numbers are chosen against the **function's own budget**, not against a
 * guess at upstream latency. A bound longer than `maxDuration` can never fire,
 * which is the trap the SDK defaults fall into: the Anthropic SDK waits ten
 * minutes by default, and no route here is allowed to live past five.
 */

/** Sanity reads and writes. The value on-publish already proved in production. */
export const SANITY_TIMEOUT_MS = 15_000

/**
 * The Railway backend's JSON endpoints — briefings, contact, subscribe, the
 * usage ledger, deep-research status. All are small reads or writes, and two of
 * them sit on public routes where a hang stalls a page for every visitor.
 */
export const BACKEND_TIMEOUT_MS = 15_000

/**
 * Starting a deep-research job, which does real work before it answers. Kept
 * separate from BACKEND_TIMEOUT_MS so that raising one does not quietly raise
 * the ceiling on the public forms.
 */
export const BACKEND_START_TIMEOUT_MS = 30_000

/**
 * Exa. The agent endpoint is polled, so this bounds a single poll rather than
 * the run: the loop's own ten-minute deadline is the outer limit, and it can
 * only be honoured if each iteration is guaranteed to return.
 */
export const EXA_TIMEOUT_MS = 60_000

/** Inoreader's OAuth exchange and feed reads. */
export const INOREADER_TIMEOUT_MS = 15_000

/**
 * Anthropic. Deliberately half of the 300-second budget the drafting, fact-check
 * and report routes run under: a single model call that has consumed half the
 * function has already made the four calls after it impossible, so failing then
 * with a message the operator can read beats dying silently at the platform
 * ceiling with nothing saved. The SDK's own default is 600_000 — twice a budget
 * it can never fit inside, which is the same as no timeout at all.
 */
export const ANTHROPIC_TIMEOUT_MS = 150_000

/** One embedding of one string. Nothing legitimate here is slow. */
export const OPENAI_TIMEOUT_MS = 30_000

/** A single vector query or upsert. */
export const PINECONE_TIMEOUT_MS = 15_000

/**
 * Upstash, on the hot path of nearly every route.
 *
 * Much tighter than the rest on purpose. The rate limiter already degrades to
 * an in-memory fallback when the shared store is unreachable, so a slow answer
 * is strictly worse than a fast failure — waiting fifteen seconds to learn what
 * a local map could have said immediately would add that delay to every request
 * on the site.
 */
export const UPSTASH_TIMEOUT_MS = 3_000

/** Kit (ConvertKit): newsletter subscribe, contact tagging, buyer tagging. */
export const KIT_TIMEOUT_MS = 15_000

/** Lemon Squeezy licence validation and activation. */
export const LEMONSQUEEZY_TIMEOUT_MS = 15_000

/**
 * Resend, sending the enquiry notification.
 *
 * Tighter than the other JSON upstreams because of where it sits: on the public
 * contact form, *after* the enquiry has already been saved. The visitor is
 * waiting on a send whose failure changes nothing they can see — so the cost of
 * waiting is real and the value of waiting longer is nil.
 */
export const RESEND_TIMEOUT_MS = 10_000

/**
 * Bound a promise that has no cancellation of its own.
 *
 * Most upstreams here are reached through `fetch`, where `AbortSignal.timeout`
 * cancels the request outright — that is always the better tool. This exists for
 * the SDKs that expose no timeout option at all (`exa-js` is pinned at 2.2.0 for
 * an API shape a newer release moved).
 *
 * Be honest about what it does: it bounds **the caller's wait**, not the
 * request. The underlying call keeps running and its result is discarded. That
 * is still worth having where the alternative is a fan-out of eighteen searches
 * any one of which can hang a 300-second function — but it is a weaker
 * guarantee, so prefer a real signal wherever the client accepts one.
 */
export async function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
