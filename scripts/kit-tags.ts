/**
 * Kit tags: check the live account against the registry in src/lib/kit-tags.ts,
 * and optionally create what is missing.
 *
 *   CONVERTKIT_API_KEY=kit_… npx tsx scripts/kit-tags.ts            # report only
 *   CONVERTKIT_API_KEY=kit_… npx tsx scripts/kit-tags.ts --create   # create missing tags + custom fields
 *
 * The key is read from the environment only, never from a file in the repo,
 * and is never printed. Vercel marks the production key sensitive, so the CLI
 * cannot pull it: run this from your own shell with the key exported, or type
 * it inline as above. Nothing here subscribes anyone or sends anything.
 *
 * With --create the script prints one `CONVERTKIT_*_TAG_ID=<id>` line per
 * tag, ready to paste into Vercel (production) and, for the three the Railway
 * backend also reads, into Railway. IDs are not secrets.
 *
 * It also reads every CONVERTKIT_*_TAG_ID currently in its environment and
 * says whether each points at a live tag of the expected name — so run it
 * with `vercel env pull` output loaded to audit what production holds.
 */
import { ALL_TAGS, CONTACT_CUSTOM_FIELDS } from '../src/lib/kit-tags'

const API = 'https://api.kit.com/v4'
const KEY = process.env.CONVERTKIT_API_KEY?.trim() ?? ''
const CREATE = process.argv.includes('--create')

type Tag = { id: number; name: string }
type Field = { id: number; key: string; label: string }

async function kit<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': KEY, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Kit ${init?.method ?? 'GET'} ${path} → ${res.status} ${body.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

async function listAll<T>(path: string, key: string): Promise<T[]> {
  const out: T[] = []
  let cursor: string | undefined
  for (let page = 0; page < 20; page++) {
    const q = new URLSearchParams({ per_page: '500', ...(cursor ? { after: cursor } : {}) })
    const data = await kit<Record<string, unknown>>(`${path}?${q}`)
    out.push(...((data[key] as T[]) ?? []))
    const pagination = data.pagination as { has_next_page?: boolean; end_cursor?: string } | undefined
    if (!pagination?.has_next_page || !pagination.end_cursor) break
    cursor = pagination.end_cursor
  }
  return out
}

async function main() {
  if (!KEY) {
    console.error('CONVERTKIT_API_KEY is not set in the environment. Export it in your shell first; it is never read from a file.')
    process.exit(2)
  }

  const account = await kit<{ account?: { name?: string; plan_type?: string } }>('/account')
  console.log(`Kit account: ${account.account?.name ?? '(unnamed)'} · plan ${account.account?.plan_type ?? '?'}\n`)

  const tags = await listAll<Tag>('/tags', 'tags')
  const byName = new Map(tags.map(t => [t.name, t]))
  const byId = new Map(tags.map(t => [String(t.id), t]))
  console.log(`Live tags: ${tags.length}`)

  const missing = ALL_TAGS.filter(t => !byName.has(t.tag))
  const present = ALL_TAGS.filter(t => byName.has(t.tag))
  console.log(`Registry: ${ALL_TAGS.length} · present ${present.length} · missing ${missing.length}\n`)

  if (missing.length && CREATE) {
    for (const t of missing) {
      const created = await kit<{ tag: Tag }>('/tags', { method: 'POST', body: JSON.stringify({ name: t.tag }) })
      byName.set(t.tag, created.tag)
      byId.set(String(created.tag.id), created.tag)
      console.log(`  created tag ${created.tag.id}  ${t.tag}`)
    }
    console.log('')
  } else if (missing.length) {
    console.log('Missing (run with --create to add them):')
    for (const t of missing) console.log(`  ${t.tag}  →  ${t.env}`)
    console.log('')
  }

  // Audit whatever IDs this environment holds against the live names.
  console.log('Environment IDs (from CONVERTKIT_*_TAG_ID in this shell):')
  let bad = 0
  for (const t of ALL_TAGS) {
    const configured = process.env[t.env]?.trim()
    const live = byName.get(t.tag)
    if (!configured) { console.log(`  unset   ${t.env}`); continue }
    if (/^your_/.test(configured)) { console.log(`  PLACEHOLDER ${t.env}=${configured}`); bad++; continue }
    const target = byId.get(configured)
    if (!target) { console.log(`  DANGLING ${t.env}=${configured} (no live tag has this ID)`); bad++; continue }
    if (target.name !== t.tag) { console.log(`  WRONG   ${t.env}=${configured} points at "${target.name}", expected "${t.tag}"`); bad++; continue }
    console.log(`  ok      ${t.env}=${configured}`)
    void live
  }
  console.log('')

  const fields = await listAll<Field>('/custom_fields', 'custom_fields')
  const fieldKeys = new Set(fields.map(f => f.key))
  const missingFields = CONTACT_CUSTOM_FIELDS.filter(k => !fieldKeys.has(k))
  console.log(`Custom fields the contact form writes: ${CONTACT_CUSTOM_FIELDS.join(', ')}`)
  if (missingFields.length && CREATE) {
    for (const label of missingFields) {
      const created = await kit<{ custom_field: Field }>('/custom_fields', { method: 'POST', body: JSON.stringify({ label }) })
      console.log(`  created field ${created.custom_field.key}`)
    }
  } else if (missingFields.length) {
    console.log(`  MISSING: ${missingFields.join(', ')} (Kit silently drops writes to fields that do not exist)`)
    bad++
  } else {
    console.log('  all present')
  }
  console.log('')

  // Paste-ready env lines for every tag that now exists.
  const lines = ALL_TAGS.filter(t => byName.has(t.tag)).map(t => `${t.env}=${byName.get(t.tag)!.id}`)
  if (lines.length) {
    console.log('Env lines for Vercel production (IDs are not secrets):')
    for (const line of lines) console.log(`  ${line}`)
    console.log('')
  }

  const stillMissing = ALL_TAGS.filter(t => !byName.has(t.tag)).length
  if (stillMissing || bad) {
    console.log(`Result: ${stillMissing} tag(s) missing, ${bad} environment problem(s).`)
    process.exit(1)
  }
  console.log('Result: every registry tag exists and every configured ID is correct.')
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
