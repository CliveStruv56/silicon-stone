import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

/**
 * Fails the build when docs/operator-manual.md drifts from the code it
 * describes.
 *
 * This guard exists because of what it replaced. Four overlapping guides went
 * stale together and then contradicted each other on eight points of fact —
 * how many formats /create offers, how long a Signal is, which persona slugs
 * Studio accepts, what a review verdict is called. Nothing failed. A reader
 * could not tell which document was true, and the errors were only found by
 * reading all four against the source.
 *
 * So the manual states load-bearing facts, and this asserts that the code
 * still says the same thing. Every check reads the CODE first and then looks
 * for it in the manual — never the reverse. A check written the other way
 * round would pass forever while the code moved underneath it.
 *
 * Two rules for anything added here:
 *
 * 1. **Every extractor must fail loudly when its anchor is missing.** A regex
 *    that silently stops matching turns a guard into a rubber stamp — that is
 *    the failure mode this whole script exists to prevent, and it would be
 *    embarrassing to reproduce it here.
 * 2. **Guard facts, not prose.** Numbers, enum values, field names, route
 *    names. Wording changes constantly and legitimately; a guard that fights
 *    the writer gets deleted.
 *
 * Run with: npm run test:manual
 */

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..')
const MANUAL_PATH = join(ROOT, 'docs/operator-manual.md')

const manual = readFileSync(MANUAL_PATH, 'utf8')

function source(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf8')
}

/**
 * Pulls one capture group out of a source file, and throws when the anchor is
 * gone rather than returning nothing. See rule 1 above.
 */
function extract(relPath: string, pattern: RegExp, what: string): string {
  const match = pattern.exec(source(relPath))
  assert.ok(
    match && match[1] !== undefined,
    `manual-checks cannot find ${what} in ${relPath}. The code moved and this ` +
      `guard went blind — fix the pattern rather than deleting the check.`,
  )
  return match![1]
}

/** Asserts the manual states something the code says. */
function manualStates(needle: string | RegExp, why: string): void {
  const found = typeof needle === 'string' ? manual.includes(needle) : needle.test(manual)
  assert.ok(
    found,
    `docs/operator-manual.md no longer states: ${why}\n` +
      `  expected to find: ${needle}\n` +
      `  The code changed and the manual did not. Update the manual.`,
  )
}

const checks: Array<[string, () => void]> = []
const check = (name: string, fn: () => void) => checks.push([name, fn])

// ---------------------------------------------------------------------------

check('the format list is complete and matches /create', () => {
  const raw = extract(
    'src/app/(admin)/create/page.tsx',
    /const VALID_FORMATS: FormatType\[\] = \[([^\]]+)\]/,
    'VALID_FORMATS',
  )
  const formats = raw.split(',').map((s) => s.trim().replace(/["']/g, '')).filter(Boolean)

  // Deliberately exhaustive: a seventh format breaks this check until someone
  // adds it here AND to the manual. Omitting "Guide" is exactly the mistake
  // every previous guide made.
  const labels: Record<string, string> = {
    pulse: 'Pulse',
    signal: 'Signal',
    deep_dive: 'Deep Dive',
    guide: 'Guide',
    youtube: 'YouTube Script',
    research: 'Research Only',
  }

  const unmapped = formats.filter((f) => !(f in labels))
  assert.equal(
    unmapped.length,
    0,
    `/create offers format(s) this guard does not know about: ${unmapped.join(', ')}. ` +
      `Add them to scripts/manual-checks.ts and to the manual's §3 and Appendix A tables.`,
  )
  const stale = Object.keys(labels).filter((f) => !formats.includes(f))
  assert.equal(stale.length, 0, `this guard lists formats /create no longer offers: ${stale.join(', ')}`)

  for (const value of formats) {
    manualStates(labels[value], `the ${labels[value]} format`)
  }
  manualStates(
    `\`/create\` offers **${['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][formats.length]}** formats`,
    `that /create offers ${formats.length} formats`,
  )
})

check('the drafted word counts match the prompt builder', () => {
  const prompts = source('src/lib/prompts.ts')
  // Each is the length the model is actually told to write to. Two previous
  // guides disagreed on Signal, and both were wrong in different directions.
  const lengths: Array<[RegExp, string, string]> = [
    [/"Pulse" intelligence scan \(100–140 words\)/, '100–140 words', 'Pulse'],
    [/"Signal" analysis piece \(800–1,200 words\)/, '800–1,200 words', 'Signal'],
    [/"Deep Dive" forensic report \(3,000\+ words\)/, '3,000+ words', 'Deep Dive'],
    [/"Guide" \(500–2,000 words\)/, '500–2,000 words', 'Guide'],
  ]
  for (const [pattern, manualText, format] of lengths) {
    assert.match(
      prompts,
      pattern,
      `${format}'s word target moved in src/lib/prompts.ts. Update the manual and this guard.`,
    )
    manualStates(manualText, `${format}'s length`)
  }
})

check('Pulse the format and pulse the tier stay distinguished', () => {
  // These share a name and mean different things. Conflating them is what
  // produced the "100–140 vs under ~600" contradiction between two guides.
  assert.match(
    source('src/lib/prompts.ts'),
    /"pulse"\s*= 30-second scan; bite-sized signal under ~600 words/,
    'the pulse TIER description moved; the manual explains it as distinct from the format',
  )
  manualStates('"Pulse" means two different things', 'the format/tier distinction')
  manualStates('under about 600 words', 'the pulse tier length')
})

check('the persona namespaces match the schema and the prompt builders', () => {
  const article = source('src/sanity/schemaTypes/article.ts')
  // Anchor on the options list specifically: the field's `of: [...]` closes a
  // bracket before the values, so a lazy match to the first ] finds nothing.
  const personaBlock = /name: 'personas'[\s\S]{0,900}?list: \[([\s\S]{0,900}?)\]/.exec(article)
  assert.ok(personaBlock, 'cannot find the article personas option list; this guard went blind')
  const accepted = [...personaBlock[1].matchAll(/value: '([a-z-]+)'/g)].map((m) => m[1])
  assert.ok(accepted.length > 0, 'article.personas has no values; this guard went blind')

  for (const slug of accepted) {
    manualStates(`\`${slug}\``, `the article persona slug "${slug}"`)
  }

  // positional is a reader-facing persona the article schema must NOT accept.
  // Its absence from the authoring table is correct, and the manual says why.
  assert.ok(
    /'positional'/.test(source('src/lib/personas.ts')),
    'positional vanished from PersonaSlug; the manual explains it as reader-facing',
  )
  assert.ok(
    !accepted.includes('positional'),
    'article.personas now accepts "positional" — the manual says it does not. Update both.',
  )
  manualStates('positional', 'the reader-facing persona and why it is not an authoring option')
})

check('the contentType mapping is as documented', () => {
  const pipeline = source('src/lib/draft-pipeline.ts')
  assert.match(pipeline, /case 'deep_dive':\s*\n\s*return 'deepdive'/, 'deep_dive → deepdive mapping moved')
  // Pulse falls through to the default, which is why both land on `signal`.
  // Allow comment lines between the label and the return — there is one today.
  assert.match(pipeline, /default:[\s\S]{0,200}?return 'signal'/, 'the signal default moved')
  manualStates(
    '**Pulse and Signal are both stored as `contentType: signal`.**',
    'that Pulse and Signal share a contentType',
  )
})

check('auto fact-check covers exactly the documented formats', () => {
  const raw = extract(
    'src/lib/auto-fact-check.ts',
    /AUTO_FACT_CHECK_FORMATS: ReadonlySet<DraftFormat> = new Set<DraftFormat>\(\[([^\]]+)\]/,
    'AUTO_FACT_CHECK_FORMATS',
  )
  const formats = raw.split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean).sort()
  assert.deepEqual(
    formats,
    ['deep_dive', 'signal'],
    'the auto fact-check format set changed. The manual §7b says "only Signal and Deep Dive".',
  )
  manualStates('only for **Signal** and **Deep Dive**', 'which formats auto fact-check')
})

check('the publish preflight still has exactly one blocker', () => {
  const preflight = source('src/lib/publish-preflight.ts')
  const blockers = [...preflight.matchAll(/severity: 'blocker'/g)]
  assert.equal(
    blockers.length,
    1,
    `publish-preflight declares ${blockers.length} blockers; the manual states there is exactly one ` +
      `(an unresolved [AUTHOR: …] placeholder). If a second is correct, the manual's §7c and §9 must change.`,
  )
  assert.match(preflight, /id: 'author-placeholders'/, 'the placeholder check id moved')
  manualStates(
    '**Exactly one thing blocks publication: an unresolved placeholder.**',
    'that placeholders are the only blocker',
  )
})

check('an untiered article is listed, and the preflight warns about it', () => {
  // Two halves of one fix. The feed used to require defined(intelligenceTier),
  // and nothing on the hand-made path sets one, so an article could publish
  // live-but-unbrowsable. If the filter comes back the manual's §5 becomes a
  // lie in the reader's favour, which is the worst direction for it to be wrong.
  const feed = extract(
    'src/app/(website)/intelligence/page.tsx',
    /BRIEFINGS_QUERY = `\s*(\*\[[^\]]*\])/,
    'the /intelligence feed query',
  )
  assert.ok(
    !feed.includes('defined(intelligenceTier)'),
    'the /intelligence feed filters on intelligenceTier again — an untiered article ' +
      'publishes into invisibility, and the manual §5 says it does not.',
  )
  assert.match(
    source('src/lib/publish-preflight.ts'),
    /id: 'no-intelligence-tier'/,
    'the missing-tier preflight warning is gone; the manual §5 and §7c still promise it',
  )
  manualStates('No intelligence tier set', 'the missing-tier preflight warning')
})

check('the manual lists every MCP tool, and no more', () => {
  const tools = [...source('src/lib/mcp/knowledge-tools.ts').matchAll(/name: '([a-z_]+)'/g)]
    .map((m) => m[1])
    .filter((n) => n.includes('knowledge') || n.includes('source') || n.includes('record'))
  assert.ok(tools.length >= 6, 'fewer MCP tools found than expected; this guard went blind')

  for (const tool of tools) {
    manualStates(`\`${tool}\``, `the MCP tool ${tool}`)
  }
  // The wave brief said five and was already wrong when written. Count matters.
  manualStates(
    /###\s+The six tools/,
    `that there are ${tools.length} tools — if the count changed, §11's heading needs updating`,
  )
  assert.equal(
    tools.length,
    6,
    `there are now ${tools.length} MCP tools. The manual says six, in §11's heading and in the ` +
      `"nothing auto-publishes" argument. Update both.`,
  )
})

check('the knowledge review states are as documented', () => {
  const raw = extract(
    'src/lib/knowledge/types.ts',
    /KNOWLEDGE_REVIEW_STATUSES = \[([^\]]+)\]/,
    'KNOWLEDGE_REVIEW_STATUSES',
  )
  const states = raw.split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean)
  assert.deepEqual(
    states.sort(),
    ['inbox', 'ready', 'rejected', 'superseded'].sort(),
    'the review states changed. editorial-aios-manual.md was retired for describing the OLD ones.',
  )
  manualStates('**Inbox → Ready / Rejected / Superseded**', 'the review states')
})

check('the capture feature flag name is current', () => {
  assert.match(
    source('src/lib/knowledge/features.ts'),
    /KNOWLEDGE_EXTERNAL_WRITES_ENABLED/,
    'the capture flag was renamed; the manual tells the operator to set it by name',
  )
  manualStates('KNOWLEDGE_EXTERNAL_WRITES_ENABLED', 'the flag that turns capture on and off')
})

check('the limits table matches the constants', () => {
  const limits = source('src/lib/durable-rate-limit.ts')
  const rate = (key: string): string => {
    const m = new RegExp(`${key}: \\{ limit: (\\d+), window: '([^']+)'`).exec(limits)
    assert.ok(m, `cannot find the ${key} rate limit; this guard went blind`)
    return `${m![1]}/${m![2]}`
  }
  assert.equal(rate('login'), "5/15 m", 'the login limit changed')
  assert.equal(rate('deepResearch'), "3/1 h", 'the deep-research limit changed')
  assert.equal(rate('factCheck'), "10/1 h", 'the fact-check limit changed')
  assert.equal(rate('knowledgeCapture'), "60/15 m", 'the capture limit changed')
  assert.equal(rate('knowledgeMcp'), "120/15 m", 'the MCP limit changed')

  manualStates('| Login attempts | 5 per 15 minutes |', 'the login limit')
  manualStates('| Deep research starts | 3 per hour |', 'the deep-research limit')
  manualStates('| Fact-checks | 10 per hour |', 'the fact-check limit')
  manualStates('| Knowledge captures | 60 per 15 min (capture) / 120 per 15 min (MCP) |', 'the capture limits')

  // Session lifetime, the input caps, and the two timeouts that differ.
  assert.match(source('src/lib/session.ts'), /SESSION_MAX_AGE_SECONDS = 60 \* 60 \* 24/, 'session lifetime changed')
  manualStates('| Admin session | 24 hours', 'the session lifetime')

  assert.match(source('src/app/(admin)/create/actions.ts'), /MAX_TOPIC_LENGTH = 300/, 'topic cap changed')
  assert.match(source('src/app/(admin)/create/actions.ts'), /MAX_BRIEF_LENGTH = 2000/, 'brief cap changed')
  manualStates('| Topic field | 300 characters |', 'the topic cap')
  manualStates('| Brief field | 2,000 characters |', 'the brief cap')

  assert.match(source('src/app/(admin)/create/create-form.tsx'), /TIMEOUT_MS = 12 \* 60 \* 1000/, 'browser deep-research timeout changed')
  assert.match(source('src/lib/exa.ts'), /deadline = Date\.now\(\) \+ 10 \* 60 \* 1000/, 'agent poll deadline changed')
  manualStates('| Deep research timeout | 10 min (backend) / 12 min (browser) |', 'the two deep-research timeouts')

  assert.match(source('src/app/api/fact-check/route.ts'), /STALE_RUNNING_MS = 10 \* 60 \* 1000/, 'stale-run recovery changed')
  manualStates('| Stuck fact-check recovery | 10 minutes |', 'the stuck fact-check recovery window')

  assert.match(source('src/sanity/schemaTypes/article.ts'), /rule\.max\(3\)/, 'the related-articles cap changed')
  manualStates('| Related articles written back | 3 |', 'the related-articles count')
})

check('the Studio knowledge section is still called "Knowledge"', () => {
  // editorial-aios-manual.md was retired partly for calling this "Knowledge
  // Inbox". If it is renamed again, the manual must move with it.
  assert.match(
    source('src/sanity/structure.ts'),
    /listItem\(\)\s*\.title\('Knowledge'\)/,
    'the Studio Knowledge pane was renamed; §8 and §11 name it',
  )
  manualStates('Studio → Knowledge → Inbox', 'where captured records are reviewed')
})

check('the session bridge invariants are still in place', () => {
  const identity = source('src/lib/sanity-identity.ts')
  assert.match(
    identity,
    /https:\/\/\$\{projectId\}\.api\.sanity\.io/,
    'the Sanity identity lookup is no longer project-scoped. On the global host any valid ' +
      'Sanity token would authenticate here. See CLAUDE.md.',
  )
  assert.match(identity, /REQUIRED_SANITY_ROLE = 'administrator'/, 'the required Sanity role changed')
  manualStates('is not an **administrator** of the project', 'that site tools are administrator-only')
})

check('the manual quotes no prices', () => {
  // Every figure comes from src/lib/offering.ts. A price written into a doc is
  // a price that goes stale and contradicts the site. offering.test.ts enforces
  // this for src/ only, so docs need their own check.
  const hits = [...manual.matchAll(/£\s?\d/g)]
  assert.equal(
    hits.length,
    0,
    `the manual quotes ${hits.length} price(s). Point at the products, not the numbers — ` +
      `prices live in src/lib/offering.ts.`,
  )
})

check('every document the manual links to exists', () => {
  const links = [...manual.matchAll(/\]\((\.\.?\/[^)#]+|[a-z0-9-]+\.md)\)/gi)].map((m) => m[1])
  assert.ok(links.length > 0, 'no relative links found; this guard went blind')
  const missing = links.filter((href) => !existsSync(resolve(dirname(MANUAL_PATH), href)))
  assert.deepEqual(missing, [], `the manual links to missing file(s): ${missing.join(', ')}`)
})

check('the manual carries a verification stamp', () => {
  assert.match(
    manual,
    /\*\*Verified against commit `[0-9a-f]{7,40}`, \d{1,2} \w+ \d{4}\.\*\*/,
    'the manual must say which commit it was checked against — staleness has to be visible.',
  )
})

// ---------------------------------------------------------------------------

function main(): void {
  const failures: string[] = []
  for (const [name, fn] of checks) {
    try {
      fn()
    } catch (error) {
      failures.push(`  ✗ ${name}\n    ${(error as Error).message.split('\n').join('\n    ')}`)
    }
  }

  if (failures.length > 0) {
    // Report every failure, not just the first. A doc that drifted usually
    // drifted in several places at once, and one-at-a-time is a slow loop.
    console.error(`\noperator-manual checks FAILED (${failures.length} of ${checks.length}):\n`)
    console.error(failures.join('\n\n'))
    console.error(
      '\nThe manual is docs/operator-manual.md. Either the code changed and the manual ' +
        'needs updating, or a check went blind and needs its anchor fixed.\n',
    )
    process.exit(1)
  }

  console.log(`operator-manual checks passed: ${checks.length} facts still agree with the code.`)
}

main()
