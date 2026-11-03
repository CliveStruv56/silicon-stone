/**
 * Seed Silicon & Stone Learning: 6 levels, 7 tracks, 31 courses, 8 routes.
 *
 *   npm run learn:seed              dry run: prints what would be created
 *   npm run learn:seed -- --json    dry run: prints every document
 *   npm run learn:seed -- --write   creates them
 *
 * Idempotent and non-destructive: every document has a deterministic `_id` and
 * is written with `createIfNotExists`, so a course already edited in Studio is
 * never overwritten. To re-seed one course, delete it in Studio first.
 *
 * Documents are created PUBLISHED, which is what makes the /learn pages render.
 */
import { createClient } from '@sanity/client'
import { loadEnvConfig } from '@next/env'
import { SEED_COURSES, SEED_LEVELS, SEED_ROUTES, SEED_TRACKS } from '../src/lib/learn/catalogue-seed'
import { codeSlug, statusLabel } from '../src/lib/learn/model'

loadEnvConfig(process.cwd())
const write = process.argv.includes('--write')
const json = process.argv.includes('--json')

const levelId = (n: number) => `level-${n}`
const trackId = (slug: string) => `track-${slug}`
const courseId = (code: string) => `course-${codeSlug(code)}`
const routeId = (slug: string) => `learn-route-${slug}`

const ref = (id: string) => ({ _type: 'reference' as const, _ref: id })
const weakRefs = (codes: string[]) =>
  codes.map((code) => ({ ...ref(courseId(code)), _weak: true, _key: codeSlug(code) }))

const levels = SEED_LEVELS.map((l) => ({
  _id: levelId(l.number),
  _type: 'level',
  number: l.number,
  title: l.title,
  slug: { _type: 'slug', current: l.slug },
  summary: l.summary,
}))

const tracks = SEED_TRACKS.map((t) => ({
  _id: trackId(t.slug),
  _type: 'track',
  title: t.title,
  slug: { _type: 'slug', current: t.slug },
  order: t.order,
  intro: t.intro,
  courses: weakRefs(t.courses),
  priceKey: t.priceKey,
  ...(t.opens ? { opens: t.opens } : {}),
}))

const courses = SEED_COURSES.map((c) => ({
  _id: courseId(c.code),
  _type: 'course',
  code: c.code,
  title: c.title,
  slug: { _type: 'slug', current: c.slug },
  level: ref(levelId(Number(c.code.split('.')[0]))),
  track: ref(trackId(c.track)),
  promise: c.promise,
  audience: c.audience,
  ...(c.priorKnowledge ? { priorKnowledge: c.priorKnowledge } : {}),
  outcomes: c.outcomes,
  modules: c.modules.map((m, i) => ({ _type: 'courseModule', _key: `m${i + 1}`, ...m })),
  duration: c.duration,
  ...(c.durationMinutes ? { durationMinutes: c.durationMinutes } : {}),
  ...(c.exerciseTools ? { exerciseTools: c.exerciseTools } : {}),
  ...(c.exercise ? { exercise: c.exercise } : {}),
  status: c.status,
  ...(c.statusMonth ? { statusMonth: c.statusMonth } : {}),
}))

const routes = SEED_ROUTES.map((r) => ({
  _id: routeId(r.slug),
  _type: 'learnRoute',
  title: r.title,
  slug: { _type: 'slug', current: r.slug },
  order: r.order,
  ...(r.personaSlug ? { personaSlug: r.personaSlug } : {}),
  courses: weakRefs(r.courses),
  bestSoldAs: r.bestSoldAs,
}))

async function main() {
  const all: Array<{ _id: string; _type: string; [key: string]: unknown }> = [...levels, ...tracks, ...courses, ...routes]

  if (!write) {
    if (json) {
      console.log(JSON.stringify(all, null, 2))
      return
    }
    console.log(`Dry run. Would create (if absent): ${levels.length} levels, ${tracks.length} tracks, ${courses.length} courses, ${routes.length} routes.\n`)
    for (const t of SEED_TRACKS) {
      console.log(`${t.title}  [${t.slug} · ${t.priceKey}${t.opens ? ` · opens ${t.opens}` : ''}]`)
      for (const code of t.courses) {
        const c = SEED_COURSES.find((x) => x.code === code)!
        console.log(`   ${c.code.padEnd(5)} ${c.title.padEnd(62)} ${c.duration.padEnd(18)} ${statusLabel(c.status, c.statusMonth)}`)
      }
    }
    console.log('\nRoutes:')
    for (const r of SEED_ROUTES) {
      console.log(`   ${r.title.padEnd(30)} ${(r.personaSlug ?? '—').padEnd(11)} ${r.courses.join(', ')}`)
    }
    console.log('\nNothing written. Re-run with --write to create.')
    return
  }

  if (!process.env.SANITY_API_WRITE_TOKEN) throw new Error('SANITY_API_WRITE_TOKEN is required')
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
  })

  const existing = new Set(
    await client.fetch<string[]>('*[_id in $ids]._id', { ids: all.map((d) => d._id) }),
  )
  const tx = client.transaction()
  for (const doc of all) tx.createIfNotExists(doc)
  await tx.commit({ visibility: 'sync' })

  const created = all.filter((d) => !existing.has(d._id)).length
  const present = await client.fetch<number>('count(*[_id in $ids])', { ids: all.map((d) => d._id) })
  console.log(`Created ${created}, left ${existing.size} existing documents untouched. ${present}/${all.length} now present.`)
  if (present !== all.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Seed failed')
  process.exitCode = 1
})
