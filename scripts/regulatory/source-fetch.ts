/**
 * Fetch statutory text and act metadata from the EU Publications Office
 * ("Cellar"), the machine-access endpoint for EU law.
 *
 * WHY NOT eur-lex.europa.eu. The corpus was originally fetched from
 * `eur-lex.europa.eu/legal-content/…`, the human web rendering. On 2026-08-16
 * that host answers non-browser clients with `HTTP 202 Accepted`, an empty
 * body and the header `x-amzn-waf-action: challenge` — an AWS WAF bot
 * challenge, independent of user agent. The old call sites guarded with
 * `if (!response.ok)`, and **202 is ok**, so both scripts accepted the empty
 * body as content. `reg:drift` then hashed the empty string and reported all
 * six instruments as CHANGED, while its version discovery found zero
 * consolidation dates on an empty page and so could never raise `newer` — the
 * check that matters failed open. See docs/editorial-assurance-findings.md §1.
 *
 * Cellar is not behind that challenge, and — verified across all six
 * instruments on 2026-08-16 — serves the *same* XHTML dialect, so
 * `extract.ts` needs no changes: every corpus re-fetched through here
 * reproduces the committed `source.txt` byte for byte and hashes identically
 * to the manifest.
 *
 * The URL is derived from `meta.celex` rather than read from `meta.sourceUrl`,
 * so the text fetched and the CELEX claimed for it can never disagree.
 * Fetching one instrument's text under another's identifier would be
 * catastrophic and silent, and this removes the possibility rather than
 * documenting it.
 */

import type { InstrumentMeta } from '../../src/lib/regulatory/types'

/** Content negotiation: the rendered act body, in the EUR-Lex XHTML dialect. */
export const XHTML_ACCEPT = 'application/xhtml+xml'

/**
 * Content negotiation: the act's structured metadata notice, which carries its
 * consolidation relations. Used for version discovery.
 */
export const NOTICE_ACCEPT = 'application/xml;notice=branch'

const CELLAR_RESOURCE = 'https://publications.europa.eu/resource/celex/'

const USER_AGENT = 'silicon-and-stone-regulatory-corpus/1.0'

/**
 * Below this, a 200 is not a document. The smallest instrument in the corpus
 * renders to ~350KB and the smallest notice to ~1.4MB, so this is three orders
 * of magnitude clear of anything legitimate; it exists to catch a challenge
 * page, a stub error body, or a truncated response — not to police length.
 */
const MIN_USABLE_BYTES = 2_000

/** `32023R1781` (original act) or `02016R0679-20160504` (consolidated). */
const CELEX_SHAPE = /^\d{5}[A-Z]\d{4}(-\d{8})?$/

/** A consolidated CELEX is the `0`-prefixed, date-suffixed form. */
export function isConsolidatedCelex(celex: string): boolean {
  return /^0\d{4}[A-Z]\d{4}-\d{8}$/.test(celex)
}

export class SourceFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SourceFetchError'
  }
}

export function cellarUrl(celex: string): string {
  if (!CELEX_SHAPE.test(celex)) {
    throw new SourceFetchError(
      `"${celex}" is not a CELEX identifier. Expected 32023R1781 or 02016R0679-20160504.`,
    )
  }
  return `${CELLAR_RESOURCE}${celex}`
}

/**
 * Fetch from Cellar, refusing anything that is not unambiguously a document.
 *
 * The status check is `!== 200` rather than `!response.ok` deliberately: the
 * whole failure this module exists to prevent was a 2xx that carried no
 * document. Cellar answers a real request with 303 → 200 (followed here), an
 * unknown identifier with 404, and a bad content negotiation with 400.
 */
export async function fetchFromCellar(celex: string, accept: string): Promise<string> {
  const url = cellarUrl(celex)

  let response: Response
  try {
    response = await fetch(url, {
      headers: { accept, 'accept-language': 'eng', 'user-agent': USER_AGENT },
      redirect: 'follow',
    })
  } catch (cause) {
    throw new SourceFetchError(
      `${url} → network error: ${cause instanceof Error ? cause.message : String(cause)}`,
    )
  }

  // A bot challenge is the one failure that looks like success. Name it
  // explicitly so the message never sends the reader to hunt the extractor.
  const wafAction = response.headers.get('x-amzn-waf-action')
  if (wafAction) {
    throw new SourceFetchError(
      `${url} → blocked by a bot challenge (x-amzn-waf-action: ${wafAction}). ` +
        `This is not an amendment and not an extractor fault — the request never ` +
        `reached the document. Fetch the page in a browser, save it, and pass it ` +
        `with --html.`,
    )
  }

  if (response.status !== 200) {
    throw new SourceFetchError(
      `${url} → HTTP ${response.status} ${response.statusText}. Only 200 carries a ` +
        `document; 202 in particular means a challenge or a queued request.`,
    )
  }

  const body = await response.text()
  if (body.trim().length < MIN_USABLE_BYTES) {
    throw new SourceFetchError(
      `${url} → HTTP 200 but only ${body.length} bytes. That is a challenge page or ` +
        `a stub, not an instrument. Refusing to treat it as content.`,
    )
  }

  return body
}

/** The instrument's consolidated (or original) text, as XHTML. */
export function fetchInstrumentHtml(meta: InstrumentMeta): Promise<string> {
  return fetchFromCellar(meta.celex, XHTML_ACCEPT)
}

/** The base act's metadata notice, which lists its consolidations. */
export function fetchBaseActNotice(baseCelex: string): Promise<string> {
  return fetchFromCellar(baseCelex, NOTICE_ACCEPT)
}
