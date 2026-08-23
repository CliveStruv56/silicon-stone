/**
 * Asserts that the internal document types are NOT readable by an anonymous
 * caller — against the live dataset, over the public API, with no credentials.
 *
 * WHY THIS EXISTS
 * ---------------
 * The security audit of 2026-08-23 recorded that `sensitivity: confidential`
 * was "an application-level filter over a world-readable store": the dataset's
 * `aclMode` is `public`, `src/lib/knowledge/read.ts` filters private and
 * confidential items in GROQ, and an anonymous query straight at the API would
 * therefore bypass the filter entirely.
 *
 * That turned out to be **false**, and the way it was false is the reason this
 * file exists. Type-level access control is configured on the project, and it
 * already draws the line in the right place — the seven types the public site
 * renders are readable, and the ten internal ones are not. Nobody had written
 * that down. It lives in a console, it is invisible from the repository, and if
 * it were ever changed nothing would say so: knowledge items, personas and
 * conversation extracts would simply start answering to the open internet, and
 * the first anyone would know is when someone went looking.
 *
 * So the point of this check is not to test code. It is to convert a setting
 * nobody can see into an invariant that shouts.
 *
 * THE POSITIVE CONTROL IS THE WHOLE DESIGN
 * ----------------------------------------
 * A check that asserts "the query returned nothing" passes for two completely
 * different reasons: the data is protected, or the query is broken. A typo, a
 * renamed type, a changed API version, a network appliance answering 200 with
 * an empty body — every one of those turns this file into a rubber stamp that
 * reports safety it never verified. That is precisely the failure mode
 * `CLAUDE.md` names for the manual-check extractors.
 *
 * The defence is `article`: a type that MUST be anonymously readable, asserted
 * FIRST. If the public site's own content cannot be seen without a token, this
 * run has proved nothing at all, and it exits non-zero saying so rather than
 * reporting a clean bill of health.
 *
 * "NO DOCUMENTS" IS NOT "PROTECTED"
 * ---------------------------------
 * A type with zero documents returns an empty result whether or not it is
 * protected, so counting that as a pass would be the same lie in a different
 * hat. With SANITY_API_READ_TOKEN the run separates the two: a type is only
 * reported PROTECTED when it demonstrably HAS documents and anonymous access
 * still cannot see them. Without the token that distinction cannot be drawn and
 * the run says so out loud instead of quietly claiming more than it checked.
 *
 * `researchRun` is the live example: the type has no documents yet, so this
 * check cannot tell you whether the first one will be exposed. It is listed
 * anyway, so the day one is written the answer stops being a guess.
 *
 * Deliberately NOT in `prebuild`: it needs the network, and a Sanity blip must
 * not be able to fail a Vercel deploy. Same reasoning as `test:sanity-prices`.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || '3q59mpd7'
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || '2026-01-13'
const READ_TOKEN = process.env.SANITY_API_READ_TOKEN?.trim() || ''

/** Bound the wait, for the reason every other outbound call here is bounded. */
const TIMEOUT_MS = 20_000

/**
 * Types that must never answer an anonymous caller.
 *
 * `persona` and `libraryImage` are here alongside the knowledge lane because
 * they are equally internal: a persona is unpublished editorial strategy, and
 * the image library is working material. Neither is rendered by the public
 * site, and both were already hidden when this was written — this keeps them
 * that way.
 */
const MUST_BE_PRIVATE = [
  'knowledgeItem',
  'knowledgeSource',
  'knowledgeCandidate',
  'knowledgeTopic',
  'researchRun',
  'persona',
  'libraryImage',
] as const

/**
 * The positive control. This type MUST be anonymously readable — it is what the
 * public site is built out of — and it is what proves the query works at all.
 */
const MUST_BE_PUBLIC = 'article'

async function groqCount(type: string, { authenticated }: { authenticated: boolean }): Promise<number> {
  const query = encodeURIComponent(`count(*[_type=="${type}" && !(_id in path("drafts.**"))])`)
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${query}`

  const res = await fetch(url, {
    // The anonymous request must carry NO credentials of any kind, or the whole
    // check is measuring the wrong thing.
    headers: authenticated ? { Authorization: `Bearer ${READ_TOKEN}` } : {},
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Sanity returned ${res.status} for ${authenticated ? 'authenticated' : 'anonymous'} ${type}`)
  }

  const body = (await res.json()) as { result?: unknown; error?: { description?: string } }
  if (body.error) {
    throw new Error(`Sanity rejected the query for ${type}: ${body.error.description ?? 'unknown error'}`)
  }
  if (typeof body.result !== 'number') {
    throw new Error(`Expected a count for ${type}, got ${JSON.stringify(body.result)}`)
  }
  return body.result
}

async function main() {
  console.log(`Dataset access: ${PROJECT_ID}/${DATASET} @ v${API_VERSION}`)
  console.log(READ_TOKEN ? 'Read token present — exposure and coverage both checked.' : 'No read token — exposure checked, coverage cannot be.')
  console.log()

  // ---- the positive control, first and fatal -------------------------------
  let publicCount: number
  try {
    publicCount = await groqCount(MUST_BE_PUBLIC, { authenticated: false })
  } catch (error) {
    console.error(`BLIND: the anonymous probe itself failed — ${error instanceof Error ? error.message : String(error)}`)
    console.error('This run has verified NOTHING. Do not read it as a pass.')
    process.exit(1)
  }

  if (publicCount <= 0) {
    console.error(`BLIND: "${MUST_BE_PUBLIC}" returned ${publicCount} to an anonymous caller.`)
    console.error('Either the public site is broken or this probe is not reaching the dataset.')
    console.error('Every "not readable" result below would be meaningless, so this run fails rather than passing.')
    process.exit(1)
  }
  console.log(`  control    ${MUST_BE_PUBLIC.padEnd(20)} anonymous count ${publicCount} — the probe works`)
  console.log()

  // ---- the actual assertions ----------------------------------------------
  const exposed: string[] = []
  const unverifiable: string[] = []

  for (const type of MUST_BE_PRIVATE) {
    let anon: number
    try {
      anon = await groqCount(type, { authenticated: false })
    } catch (error) {
      // A failure here is not a pass. Treat it exactly like an exposure.
      console.error(`  ERROR      ${type.padEnd(20)} could not be checked — ${error instanceof Error ? error.message : String(error)}`)
      exposed.push(type)
      continue
    }

    if (anon > 0) {
      console.error(`  EXPOSED    ${type.padEnd(20)} ${anon} document(s) readable with NO credentials`)
      exposed.push(type)
      continue
    }

    if (!READ_TOKEN) {
      console.log(`  hidden     ${type.padEnd(20)} anonymous count 0 (coverage unknown without a token)`)
      continue
    }

    let authed = 0
    try {
      authed = await groqCount(type, { authenticated: true })
    } catch (error) {
      console.error(`  ERROR      ${type.padEnd(20)} authenticated count failed — ${error instanceof Error ? error.message : String(error)}`)
      exposed.push(type)
      continue
    }

    if (authed === 0) {
      // Honest reporting: an empty type proves nothing either way.
      console.log(`  unproven   ${type.padEnd(20)} no documents exist, so being hidden is not evidence of anything`)
      unverifiable.push(type)
    } else {
      console.log(`  PROTECTED  ${type.padEnd(20)} ${authed} document(s) exist, 0 anonymously readable`)
    }
  }

  console.log()

  if (exposed.length > 0) {
    console.error(`FAILED: ${exposed.length} internal type(s) are readable without credentials, or could not be checked:`)
    for (const type of exposed) console.error(`  - ${type}`)
    console.error()
    console.error('The type-level access control on this Sanity project has changed, or the probe broke.')
    console.error('Check manage.sanity.io -> API -> Access before assuming the data is safe.')
    process.exit(1)
  }

  if (unverifiable.length > 0) {
    console.log(`Note: ${unverifiable.length} type(s) hold no documents, so their protection is unproven: ${unverifiable.join(', ')}`)
    console.log('That is not a failure. It is the reason this line exists rather than a silent pass.')
  }

  console.log('Dataset access checks passed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
