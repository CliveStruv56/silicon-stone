/**
 * A measurement, not an integration: is TypeSafe's Jev model worth wiring in?
 *
 *   npm run jev:eval -- --set routing
 *   npm run jev:eval -- --set relevance --topic "EU Chips Act second call"
 *   npm run jev:eval -- --set content [--mutate]
 *   npm run jev:eval -- --set all --repeat 2
 *
 * Read-only. It changes nothing in Sanity, Pinecone or the repo, and nothing in
 * `src/` calls it. Three sets, each comparing Jev with what decides today:
 *
 *   routing    Jev's per-instrument judgement vs `looksRegulatory()`'s substring
 *              lists, over a labelled fixture plus every published article.
 *   relevance  Jev's score for each Exa result vs the sources the published
 *              article actually kept.
 *   content    Does each authored `basis` / `why` in the v1 rule library say what
 *              the Article it is anchored to says? Existing tests prove the
 *              anchor exists and resolves; nothing checks the READING.
 *
 * Two rules, both the owner's:
 *
 *   - Only text the publication wrote, public statute and public search results
 *     are sent. Never a reader's, a client's or an enquirer's words.
 *   - A flag from `content` is a prompt to re-read, never a verdict. Jev is not
 *     an authority on the Act. This must never enter `prebuild`: it needs the
 *     network, and a legal gate a vendor outage can turn red is the wrong design.
 *
 * `--mutate` is the content set's own mutation test: every claim is paired with
 * the WRONG Article, and the "supports" rate must collapse. A checker that has
 * only ever been seen agreeing has not been tested.
 */

import * as dotenv from 'dotenv'
import * as fs from 'node:fs'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

import { createClient } from '@sanity/client'
import { askJev, choice, noul, score, JEV_MODEL, type JevQuestion, type JevResult } from './client'

// ───────────────────────────── arguments ─────────────────────────────

const argv = process.argv.slice(2)

function flag(name: string): boolean {
  return argv.includes(`--${name}`)
}

function option(name: string): string[] {
  const values: string[] = []
  argv.forEach((arg, index) => {
    if (arg === `--${name}` && argv[index + 1]) values.push(argv[index + 1])
  })
  return values
}

const SETS = ['routing', 'relevance', 'content'] as const
type SetName = (typeof SETS)[number]

const requested = option('set')[0] ?? 'all'
if (requested !== 'all' && !SETS.includes(requested as SetName)) {
  console.error(`--set must be one of: ${SETS.join(', ')}, all`)
  process.exit(1)
}
const repeat = Math.max(1, Number(option('repeat')[0] ?? 1))

// ───────────────────────────── shared ─────────────────────────────

const totals = { calls: 0, inputTokens: 0, ms: [] as number[] }

/** The number a decision would turn on, per answer type. */
function primary(result: JevResult, id: string): number {
  const answer = result.answers[id]
  if (answer.type === 'noul') return answer.noul
  if (answer.type === 'score') return answer.score
  return answer.probabilities[answer.choice] ?? 0
}

/**
 * Ask, and with `--repeat n` ask again, reporting how far the deciding number
 * moved between identical calls. A threshold is only as stable as this.
 */
async function ask(state: unknown, questions: Record<string, JevQuestion>) {
  const first = await askJev(state, questions)
  totals.calls += 1
  totals.inputTokens += first.inputTokens
  totals.ms.push(first.ms)

  let drift = 0
  for (let run = 1; run < repeat; run += 1) {
    const again = await askJev(state, questions)
    totals.calls += 1
    totals.inputTokens += again.inputTokens
    totals.ms.push(again.ms)
    for (const id of Object.keys(questions)) {
      drift = Math.max(drift, Math.abs(primary(first, id) - primary(again, id)))
    }
  }
  return { result: first, drift }
}

async function pool<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const index = next
        next += 1
        out[index] = await worker(items[index])
      }
    }),
  )
  return out
}

function heading(text: string) {
  console.log(`\n${'═'.repeat(78)}\n${text}\n${'═'.repeat(78)}`)
}

const pct = (value: number) => `${Math.round(value * 100)}%`.padStart(4)
const clip = (text: string, width: number) =>
  text.length > width ? `${text.slice(0, width - 1)}…` : text

function sanity() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set in .env.local')
  // No token: published articles answer anonymous GROQ, and an eval has no
  // business holding a credential it does not need.
  return createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
    useCdn: false,
  })
}

// ───────────────────────────── set A: routing ─────────────────────────────

/**
 * One sentence of subject matter per corpus. Keyed by corpus id, and the run
 * fails if `routableCorpusIds()` has a key with no description here — an
 * instrument Jev is never asked about would read as "never routed".
 */
const INSTRUMENT_SUBJECT: Record<string, string> = {
  'eu-ai-act':
    'the EU Artificial Intelligence Act (Regulation (EU) 2024/1689): prohibited AI practices, high-risk AI systems, transparency duties, general-purpose AI models, and the duties of providers and deployers of AI systems',
  gdpr: 'the EU General Data Protection Regulation (Regulation (EU) 2016/679): the processing of personal data, lawful bases, data subject rights, controllers and processors, international transfers, supervisory authorities',
  'eu-chips-act':
    'the European Chips Act (Regulation (EU) 2023/1781): the Chips for Europe Initiative, public support for first-of-a-kind semiconductor facilities, and monitoring of and crisis response to semiconductor supply shortages',
  'eu-data-act':
    'the EU Data Act (Regulation (EU) 2023/2854): access to and sharing of data from connected products, business-to-government data access, switching between cloud and other data processing services, and interoperability',
  nis2: 'the NIS2 Directive (Directive (EU) 2022/2555): cybersecurity risk-management measures and incident reporting for essential and important entities',
  'eu-cyber-resilience-act':
    'the EU Cyber Resilience Act (Regulation (EU) 2024/2847): cybersecurity requirements for products with digital elements, vulnerability handling, security updates and CE marking',
}

interface RoutingTopic {
  topic: string
  why?: string
  regulatory?: boolean
  expected?: string[]
  alsoAcceptable?: string[]
}

async function runRouting() {
  heading(`SET A — regulatory routing · ${JEV_MODEL} vs looksRegulatory()`)

  const { looksRegulatory, routableCorpusIds } = await import('../../src/lib/regulatory/gate')
  const corpusIds = routableCorpusIds()
  const undescribed = corpusIds.filter((id) => !INSTRUMENT_SUBJECT[id])
  if (undescribed.length > 0) {
    throw new Error(`no INSTRUMENT_SUBJECT for routable corpus: ${undescribed.join(', ')}`)
  }

  const fixture = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'scripts/jev/fixtures/routing.json'), 'utf8'),
  ) as { topics: RoutingTopic[] }

  const articles = await sanity().fetch<Array<{ title: string; excerpt?: string }>>(
    `*[_type == "article" && defined(slug.current)] | order(coalesce(publishedAt, _updatedAt) desc) { title, excerpt }`,
  )
  if (articles.length === 0) throw new Error('Sanity returned no published articles — the probe is blind')

  const topics: RoutingTopic[] = [
    ...fixture.topics,
    ...articles.map((a) => ({ topic: [a.title, a.excerpt].filter(Boolean).join(' — ') })),
  ]
  console.log(`${fixture.topics.length} labelled fixture topics + ${articles.length} published articles\n`)

  const questions: Record<string, JevQuestion> = {
    regulatory: {
      type: 'noul',
      instructions:
        'Is this article topic substantially about law, regulation or regulatory compliance, such that quoting the text of legislation would help the writer?',
      criteria: {
        true: 'The piece concerns what a law or regulation requires, permits, prohibits or changes, or how it is enforced.',
        false:
          'The piece is about technology, markets, companies, labour, engineering or finance and does not turn on what any law says — even if it uses words such as audit, commission, fine, privacy or requirement in their ordinary sense.',
      },
    },
  }
  for (const id of corpusIds) {
    questions[id] = {
      type: 'noul',
      instructions: `Would a writer covering this topic need to quote or cite ${INSTRUMENT_SUBJECT[id]}?`,
      criteria: {
        true: 'The topic is about what this specific instrument requires, or about matters this instrument directly governs.',
        false:
          'The topic is about a different law, or merely shares an industry or vocabulary with this instrument without concerning what it requires.',
      },
    }
  }

  const rows = await pool(topics, 4, async (entry) => {
    const gate = looksRegulatory(entry.topic)
    const { result, drift } = await ask({ topic: entry.topic }, questions)
    const jevRegulatory = noul(result, 'regulatory')
    const jevRouted = corpusIds.filter((id) => noul(result, id) >= 0.5)
    return { entry, gate, result, drift, jevRegulatory, jevRouted }
  })

  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))
  const correct = (routed: string[], entry: RoutingTopic) => {
    const must = entry.expected ?? []
    const may = [...must, ...(entry.alsoAcceptable ?? [])]
    return must.every((id) => routed.includes(id)) && routed.every((id) => may.includes(id))
  }

  let gateRight = 0
  let jevRight = 0
  let labelled = 0
  let disagreements = 0

  for (const row of rows) {
    const { entry, gate, jevRegulatory, jevRouted, result, drift } = row
    const isLabelled = entry.expected !== undefined
    const agree = gate.hit === jevRegulatory >= 0.5 && sameSet(gate.corpusIds, jevRouted)
    if (!agree) disagreements += 1

    let verdict = ''
    if (isLabelled) {
      labelled += 1
      const gateOk = gate.hit === entry.regulatory && correct(gate.corpusIds, entry)
      const jevOk = jevRegulatory >= 0.5 === entry.regulatory && correct(jevRouted, entry)
      if (gateOk) gateRight += 1
      if (jevOk) jevRight += 1
      verdict = `  gate ${gateOk ? '✓' : '✗'}  jev ${jevOk ? '✓' : '✗'}`
    }

    console.log(`${agree ? ' ' : '≠'} ${clip(entry.topic, 100)}${verdict}`)
    if (entry.why) console.log(`    (${entry.why})`)
    if (isLabelled) {
      console.log(
        `    label : regulatory=${entry.regulatory} → [${(entry.expected ?? []).join(', ')}]` +
          (entry.alsoAcceptable?.length ? ` (also ok: ${entry.alsoAcceptable.join(', ')})` : ''),
      )
    }
    console.log(
      `    gate  : hit=${gate.hit} → [${gate.corpusIds.join(', ')}]` +
        (gate.matched.length ? `   matched: ${gate.matched.slice(0, 6).join(' | ')}` : ''),
    )
    console.log(
      `    jev   : regulatory=${pct(jevRegulatory)} → [${jevRouted.join(', ')}]   ` +
        corpusIds.map((id) => `${id.replace(/^eu-/, '')}${pct(noul(result, id))}`).join(' ') +
        `   ${result.ms}ms` +
        (repeat > 1 ? `  drift ${drift.toFixed(3)}` : ''),
    )
  }

  console.log(
    `\nLabelled topics: gate correct ${gateRight}/${labelled} · Jev correct ${jevRight}/${labelled}` +
      `\nGate and Jev disagree on ${disagreements}/${rows.length} topics (marked ≠). Read those; the counts are not the result.`,
  )
}

// ───────────────────────────── set B: relevance ─────────────────────────────

interface ExaLite {
  title?: string | null
  url: string
  text?: string
  highlights?: string[]
  publishedDate?: string
}

const RELEVANCE_LEVELS = [
  'Off-topic: about something else entirely; shares at most a keyword with the topic.',
  'Tangential: same broad industry or theme, but would not inform an article on this specific topic.',
  'Relevant: covers the topic or a directly connected development, and offers usable facts.',
  'Central: a primary or near-primary source on exactly this topic — the kind an article would rest on.',
]

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

async function runRelevance() {
  heading(`SET B — research-result relevance · ${JEV_MODEL} vs the sources the article kept`)

  const { searchExa } = await import('../../src/lib/exa')

  let cases: Array<{ topic: string; kept: string[] }> = option('topic').map((topic) => ({ topic, kept: [] }))
  if (cases.length === 0) {
    const recent = await sanity().fetch<Array<{ title: string; urls?: string[] }>>(
      `*[_type == "article" && defined(slug.current) && count(citations) > 0]
        | order(coalesce(publishedAt, _updatedAt) desc)[0...2] { title, "urls": citations[].url }`,
    )
    if (recent.length === 0) throw new Error('no published article carries citations — pass --topic instead')
    cases = recent.map((a) => ({ topic: a.title, kept: a.urls ?? [] }))
  }

  for (const { topic, kept } of cases) {
    console.log(`\n▶ ${topic}`)
    // As /create's standard path runs it (src/lib/research.ts).
    const results = ((await searchExa(topic, { recencyDays: 90, numResults: 8, category: 'news' })) ??
      []) as unknown as ExaLite[]
    if (results.length === 0) {
      console.log('  Exa returned nothing (key missing, or no results) — skipped')
      continue
    }

    const state = {
      topic,
      results: results.map((r) => ({
        title: r.title ?? '',
        site: host(r.url),
        published: r.publishedDate ?? '',
        extract: (r.highlights?.[0] ?? r.text ?? '').slice(0, 1200),
      })),
    }
    const questions: Record<string, JevQuestion> = {}
    results.forEach((_, index) => {
      questions[`r${index}`] = {
        type: 'score',
        instructions: `How useful is the search result at \`results[${index}]\` as a source for an article on \`topic\`?`,
        criteria: RELEVANCE_LEVELS,
      }
    })

    const { result, drift } = await ask(state, questions)
    const keptHosts = new Set(kept.map(host))

    results
      .map((r, index) => ({ r, s: score(result, `r${index}`) }))
      .sort((a, b) => b.s.score - a.s.score)
      .forEach(({ r, s }) => {
        const wasKept = kept.includes(r.url) ? '● kept' : keptHosts.has(host(r.url)) ? '○ site' : '      '
        console.log(
          `  ${s.score.toFixed(2)}/3  conf ${pct(s.confidence)}  ${wasKept}  ${clip(r.title ?? r.url, 70)}  [${host(r.url)}]`,
        )
      })
    console.log(
      `  one call, ${results.length} questions, ${result.ms}ms, ${result.inputTokens} tokens` +
        (repeat > 1 ? `, drift ${drift.toFixed(3)}` : '') +
        (kept.length ? `\n  ● = URL is in the article's citations · ○ = same site is` : ''),
    )
  }
  console.log(
    '\nExa is re-run today, so results differ from what the writer saw; "kept" is a hint, not ground truth.',
  )
}

// ───────────────────────────── set C: content ─────────────────────────────

/**
 * Answer profiles used only to make every rule's `build()` emit its items. The
 * rules are built directly, ignoring `when`, so this does not need to mirror the
 * test matrix in `ai-act-rules.test.ts` — and the run reports how many anchored
 * items it found against how many the source declares, so lost coverage shows.
 */
const BUILD_PROFILES: Array<Record<string, string | string[]>> = [
  { eu_scope: ['eu-org'], origin: 'third-party' },
  { eu_scope: ['eu-org'], origin: 'own-product', org_size: 'small', sensitive_domains: ['employment'] },
  { eu_scope: ['eu-org'], origin: 'own-product', org_size: 'small-mid-cap', sensitive_domains: ['employment'] },
  { eu_scope: ['eu-org'], origin: 'third-party', sensitive_domains: ['employment'], profiling_confirm: 'no' },
  { eu_scope: ['eu-org'], origin: 'third-party', primary_use: 'employment', sensitive_domains: ['employment'], profiling_confirm: 'yes' },
  { eu_scope: ['eu-org'], origin: 'third-party', primary_use: 'gpai-product' },
  { eu_scope: ['eu-org'], origin: 'modified-or-resold' },
  { eu_scope: ['eu-org'], origin: 'third-party', transparency: ['chatbot'] },
  { eu_scope: ['eu-org'], origin: 'third-party', prohibited_screen: ['art5-f'] },
  { eu_scope: ['eu-org'], origin: 'third-party', human_oversight: 'none' },
]

interface Claim {
  id: string
  ruleId: string
  kind: string
  article: string
  corpusArticle: string
  claim: string
}

async function collectClaims(): Promise<Claim[]> {
  const { AI_ACT_RULE_LIBRARY } = await import('../../src/lib/ai-act-rules')
  const claims = new Map<string, Claim>()

  for (const rule of AI_ACT_RULE_LIBRARY) {
    for (const answers of BUILD_PROFILES) {
      let built: ReturnType<typeof rule.build>
      try {
        built = rule.build(answers)
      } catch (error) {
        // A build that needs an answer this profile lacks. Another profile may
        // supply it; the coverage line below is what says whether one did.
        console.warn(`  (rule ${rule.id} did not build on one profile: ${(error as Error).message})`)
        continue
      }
      for (const item of built.actions) {
        if (!item.corpusArticle) continue
        claims.set(`action:${item.id}`, {
          id: item.id,
          ruleId: rule.id,
          kind: item.kind,
          article: item.article ?? `Article ${item.corpusArticle}`,
          corpusArticle: item.corpusArticle,
          claim: [item.text, item.basis, item.condition].filter(Boolean).join('\n\n'),
        })
      }
      for (const question of built.vendorQuestions) {
        if (!question.corpusArticle) continue
        claims.set(`vendor:${question.id}`, {
          id: question.id,
          ruleId: rule.id,
          kind: 'vendor-question',
          article: question.article ?? `Article ${question.corpusArticle}`,
          corpusArticle: question.corpusArticle,
          claim: question.why,
        })
      }
    }
  }

  const declared = (
    fs.readFileSync(path.join(process.cwd(), 'src/lib/ai-act-rules.ts'), 'utf8').match(/corpusArticle:\s*['"`]/g) ?? []
  ).length
  if (declared === 0) throw new Error('found no `corpusArticle:` in ai-act-rules.ts — the anchor moved; this check is blind')
  if (claims.size === 0) throw new Error('collected no anchored claims — the rule library shape changed')
  // One declaration site can emit several ids (the SME and SMC reliefs share
  // code), so the two numbers are not expected to match — only `fewer` is a
  // signal. The per-rule list is the sharper check: a rule that used to
  // contribute and no longer appears has dropped out of BUILD_PROFILES' reach.
  const contributing = [...new Set([...claims.values()].map((c) => c.ruleId))].sort()
  console.log(
    `${claims.size} anchored claims from ${contributing.length} rules; the source declares ${declared} \`corpusArticle:\` sites` +
      (claims.size < declared ? '  ← FEWER than declared: some items were not reached by BUILD_PROFILES' : '') +
      `\nrules covered: ${contributing.join(', ')}`,
  )
  return [...claims.values()]
}

async function runContent() {
  const mutate = flag('mutate')
  heading(
    `SET C — does the authored explanation say what its Article says? · ${JEV_MODEL}` +
      (mutate ? '\nMUTATION RUN: every claim is paired with the WRONG Article. "supports" must collapse.' : ''),
  )

  const { readArticle } = await import('../../src/lib/rulepack/corpus')
  const claims = await collectClaims()
  const articles = [...new Set(claims.map((c) => c.corpusArticle))]
  if (mutate && articles.length < 2) throw new Error('cannot mutate with fewer than two distinct Articles')

  const questions: Record<string, JevQuestion> = {
    relation: {
      type: 'choice',
      instructions:
        'How does the legal text in `provision` relate to the explanation in `claim`? Judge what the claim says the law requires, permits or provides — not its practical advice.',
      criteria: {
        supports: 'The provision states or directly implies what the claim says about the law.',
        contradicts:
          'The provision says something incompatible with the claim — a different addressee, a different condition, the opposite rule, or a duty where the claim describes an option (or the reverse).',
        says_nothing: 'The provision does not address what the claim asserts, either way.',
      },
    },
    // The failure CLAUDE.md says the citation verifier CANNOT catch: a concession
    // or support measure restated as something the reader must do.
    optional_as_mandatory: {
      type: 'noul',
      instructions:
        'Does `claim` present as a mandatory duty something that `provision` makes optional, conditional, or a benefit available to the reader?',
      criteria: {
        true: 'The claim tells the reader they must do something the provision only allows, offers, or requires under a condition the claim omits.',
        false: 'The claim presents duties as duties and options, conditions and concessions as what they are.',
      },
    },
  }

  const rows = await pool(claims, 4, async (entry) => {
    const source = mutate
      ? articles[(articles.indexOf(entry.corpusArticle) + 1) % articles.length]
      : entry.corpusArticle
    const provision = readArticle(source)
    if (!provision) throw new Error(`pinned pack has no corpus for "${source}" (claim ${entry.id})`)
    const { result, drift } = await ask({ claim: entry.claim, provision }, questions)
    return { entry, source, relation: choice(result, 'relation'), promoted: noul(result, 'optional_as_mandatory'), drift, ms: result.ms }
  })

  const AUTO_ACCEPT = 0.8 // the citation cookbook's threshold — an example to evaluate, not a rule
  const supported = rows.filter((r) => r.relation.choice === 'supports' && r.relation.confidence >= AUTO_ACCEPT)
  const flagged = rows.filter((r) => !supported.includes(r) || r.promoted >= 0.5)

  console.log(`\n${supported.length}/${rows.length} confidently "supports".  ${flagged.length} to re-read:\n`)
  for (const row of flagged.sort((a, b) => a.relation.confidence - b.relation.confidence)) {
    const p = row.relation.probabilities
    console.log(
      `⚑ ${row.entry.id}  [${row.entry.kind}]  ${row.entry.article}` +
        (mutate ? `  (shown ${row.source} instead)` : ''),
    )
    console.log(
      `    ${row.relation.choice} · conf ${pct(row.relation.confidence)} · supports${pct(p.supports ?? 0)} contradicts${pct(p.contradicts ?? 0)} says_nothing${pct(p.says_nothing ?? 0)}` +
        ` · optional-as-mandatory${pct(row.promoted)}` +
        (repeat > 1 ? ` · drift ${row.drift.toFixed(3)}` : ''),
    )
    console.log(`    ${clip(row.entry.claim.replace(/\s+/g, ' '), 260)}`)
  }

  if (mutate) {
    console.log(
      `\nMutation result: ${supported.length}/${rows.length} still "supports" against the wrong Article.` +
        `\nNear zero means the check can see. A high number means it rubber-stamps — do not trust the real run.` +
        `\n(Some survivors are legitimate: neighbouring Articles overlap, and a claim may genuinely be supported by both.)`,
    )
  } else {
    console.log('\nA flag is a prompt to re-read the item against the Article. It is not a finding about the law.')
  }
}

// ───────────────────────────── main ─────────────────────────────

async function main() {
  if (!process.env.TYPESAFE_API_KEY) {
    throw new Error('TYPESAFE_API_KEY is not set — add it to .env.local (never commit it)')
  }

  const run: SetName[] = requested === 'all' ? [...SETS] : [requested as SetName]
  if (run.includes('routing')) await runRouting()
  if (run.includes('relevance')) await runRelevance()
  if (run.includes('content')) await runContent()

  const sorted = [...totals.ms].sort((a, b) => a - b)
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0
  heading('TOTALS')
  console.log(
    `${totals.calls} calls · ${totals.inputTokens.toLocaleString('en-GB')} input tokens` +
      ` · latency p50 ${at(0.5)}ms  p90 ${at(0.9)}ms  max ${at(1)}ms` +
      `\nAt the published rate of 0.042 USD per million input tokens this run cost about ` +
      `${((totals.inputTokens / 1_000_000) * 0.042).toFixed(4)} USD.`,
  )
}

main().catch((error) => {
  console.error(`\njev:eval failed: ${(error as Error).message}`)
  process.exit(1)
})
