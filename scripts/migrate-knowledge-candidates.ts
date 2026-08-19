/**
 * Copies legacy `knowledgeCandidate` records into `knowledgeItem`.
 *
 *   npm run knowledge:migrate-candidates            # dry run, the default
 *   npm run knowledge:migrate-candidates -- --write # actually writes
 *
 * Five properties this script is built around.
 *
 *  - **Dry run is the default and writing takes an explicit flag.** Master spec
 *    §11. Reversing that default is the difference between a rehearsal and an
 *    accident.
 *  - **Copy, never move.** The candidate is left exactly as it is. A migration
 *    that deletes its source has no rollback, and the cutover wave is where
 *    the legacy records are retired — after the copies have been verified.
 *  - **Deterministic IDs.** The replacement document's ID is derived from the
 *    candidate's own ID, so a rerun proposes the identical plan and a second
 *    write updates rather than duplicating. Random IDs would make every rerun
 *    look like fresh work.
 *  - **The legacy identity and timestamps survive.** `legacyCandidateId` and
 *    the original `createdAt` are carried over; without them the copy could
 *    not be traced back to what it replaced.
 *  - **Unresolvable references are reported, not guessed.** A candidate's
 *    `sourceIds` are strings, and the whole reason `knowledgeItem` uses
 *    references is that strings can point at nothing. Where a string matches
 *    exactly one source it becomes a reference; where it matches none or
 *    several it is reported and left out.
 */

import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

import { normalizedContentHash } from '../src/lib/knowledge/hash'
import { deterministicDocumentId, keyedReferences } from '../src/lib/knowledge/ids'
import { normalizeTitle } from '../src/lib/knowledge/normalize'
import {
  listLegacyCandidates,
  resolveSourceIdsToDocuments,
  type KnowledgeClient,
  type LegacyCandidateRow,
} from '../src/lib/knowledge/repository'

dotenv.config({ path: '.env.local' })

const WRITE = process.argv.includes('--write')
const VERBOSE = process.argv.includes('--verbose')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13'
const token = process.env.SANITY_API_WRITE_TOKEN

/**
 * A rejected candidate is not copied. It was reviewed and declined, and
 * carrying it into the inbox would ask the same question a second time.
 * `pending` and `filed` both convert: `filed` was the old "reviewed" state, but
 * it is not the same judgement as the new `ready`, so both land in `inbox` and
 * get looked at once. Under-claiming review status is the safe direction.
 */
const CONVERTIBLE_STATUSES = new Set(['pending', 'filed'])

interface Plan {
  candidateId: string
  documentId: string
  action: 'create' | 'update' | 'unchanged' | 'skipped'
  reason?: string
  resolvedSourceIds: string[]
  missingSourceIds: string[]
  ambiguousSourceIds: { sourceId: string; matches: string[] }[]
  document: Record<string, unknown>
}

function requireConfig(): void {
  const missing = [
    !projectId && 'NEXT_PUBLIC_SANITY_PROJECT_ID',
    !dataset && 'NEXT_PUBLIC_SANITY_DATASET',
    !token && 'SANITY_API_WRITE_TOKEN',
  ].filter(Boolean)

  if (missing.length) {
    // A check that silently passes when it could not run is worse than no
    // check, so this exits non-zero and says which half failed.
    console.error(`Cannot reach Sanity: missing ${missing.join(', ')}.`)
    process.exit(1)
  }
}

function buildClient(): KnowledgeClient {
  const client = createClient({
    projectId: projectId as string,
    dataset: dataset as string,
    apiVersion,
    token,
    useCdn: false,
  })

  return {
    fetch: <T,>(query: string, params: Record<string, unknown> = {}) =>
      client.fetch<T>(query, params),
    create: async (document) => {
      const result = await client.create(document as Record<string, unknown> & { _type: string })
      return { _id: result._id }
    },
    createOrReplace: async (document) => {
      const result = await client.createOrReplace(
        document as Record<string, unknown> & { _id: string; _type: string },
      )
      return { _id: result._id }
    },
    patch: (id: string) => {
      const patch = client.patch(id)
      const wrap = () => ({
        set(fields: Record<string, unknown>) {
          patch.set(fields)
          return wrap()
        },
        setIfMissing(fields: Record<string, unknown>) {
          patch.setIfMissing(fields)
          return wrap()
        },
        unset(fields: string[]) {
          patch.unset(fields)
          return wrap()
        },
        async commit() {
          const result = await patch.commit()
          return { _id: result._id }
        },
      })
      return wrap()
    },
  }
}

/** The legacy identity, preferring the authored handle over the document ID.
 * It is what the deterministic replacement ID is derived from, so it has to be
 * the most stable thing the candidate carries. */
function legacyIdentity(candidate: LegacyCandidateRow): string {
  return candidate.candidateId?.trim() || candidate._id
}

function planFor(
  candidate: LegacyCandidateRow,
  sourceMatches: Map<string, string[]>,
  existing: Map<string, Record<string, unknown>>,
): Plan {
  const identity = legacyIdentity(candidate)
  const documentId = deterministicDocumentId('knowledgeItem', `knowledgeCandidate:${identity}`)

  const base: Omit<Plan, 'action' | 'document'> = {
    candidateId: identity,
    documentId,
    resolvedSourceIds: [],
    missingSourceIds: [],
    ambiguousSourceIds: [],
  }

  if (!CONVERTIBLE_STATUSES.has(String(candidate.status ?? 'pending'))) {
    return {
      ...base,
      action: 'skipped',
      reason: `status is ${candidate.status}`,
      document: {},
    }
  }
  if (!candidate.title?.trim() || !candidate.answer?.trim()) {
    return {
      ...base,
      action: 'skipped',
      reason: 'missing a title or a body',
      document: {},
    }
  }

  for (const sourceId of candidate.sourceIds ?? []) {
    const matches = sourceMatches.get(sourceId) ?? []
    if (matches.length === 1) base.resolvedSourceIds.push(matches[0])
    else if (matches.length === 0) base.missingSourceIds.push(sourceId)
    else base.ambiguousSourceIds.push({ sourceId, matches })
  }

  const createdAt = candidate.createdAt ?? candidate._createdAt
  const document: Record<string, unknown> = {
    _id: documentId,
    _type: 'knowledgeItem',
    title: normalizeTitle(candidate.title),
    // A candidate was a portal-generated answer over a set of sources — which
    // is exactly what `synthesis` means in the new vocabulary.
    kind: 'synthesis',
    body: candidate.answer,
    // Not `ready`, whatever the candidate's legacy status said. AI-derived
    // content may not enter ready, and a migration is not a review.
    reviewStatus: 'inbox',
    sensitivity: 'normal',
    contentHash: normalizedContentHash(candidate.answer),
    indexState: { status: 'not_eligible' },
    provenance: {
      sourceSystem: 'migration',
      externalId: identity,
      ...(createdAt ? { capturedAt: createdAt } : {}),
      idempotencyKey: `knowledgeCandidate:${identity}`,
    },
    legacyCandidateId: identity,
    legacyCandidate: { _type: 'reference', _ref: candidate._id },
    ...(base.resolvedSourceIds.length
      ? { sources: keyedReferences(base.resolvedSourceIds) }
      : {}),
    ...(candidate.brandTags?.length ? { brandTags: candidate.brandTags } : {}),
    editorNotes: [
      `Migrated from knowledgeCandidate ${identity}.`,
      createdAt ? `Originally created ${createdAt}.` : null,
      base.missingSourceIds.length
        ? `Unresolved legacy source IDs: ${base.missingSourceIds.join(', ')}.`
        : null,
      base.ambiguousSourceIds.length
        ? `Ambiguous legacy source IDs: ${base.ambiguousSourceIds
            .map((entry) => entry.sourceId)
            .join(', ')}.`
        : null,
    ]
      .filter(Boolean)
      .join(' '),
  }

  const current = existing.get(documentId)
  if (!current) return { ...base, action: 'create', document }

  // "Unchanged" compares the fields this script owns. Anything an editor added
  // to the copy afterwards is not this script's business and must not count as
  // drift, or every rerun would propose rewriting an edited record.
  const owned = ['title', 'kind', 'body', 'contentHash', 'legacyCandidateId'] as const
  const same = owned.every(
    (field) => JSON.stringify(current[field]) === JSON.stringify(document[field]),
  )
  return { ...base, action: same ? 'unchanged' : 'update', document }
}

async function main(): Promise<void> {
  requireConfig()
  const client = buildClient()

  const candidates = await listLegacyCandidates(client)
  const everySourceId = [...new Set(candidates.flatMap((c) => c.sourceIds ?? []))]
  const sourceMatches = await resolveSourceIdsToDocuments(client, everySourceId)

  const plannedIds = candidates.map((candidate) =>
    deterministicDocumentId('knowledgeItem', `knowledgeCandidate:${legacyIdentity(candidate)}`),
  )
  const existingRows = plannedIds.length
    ? await client.fetch<Record<string, unknown>[]>(`*[_id in $ids]`, { ids: plannedIds })
    : []
  const existing = new Map(
    (existingRows ?? []).map((row) => [String(row._id), row] as const),
  )

  const plans = candidates.map((candidate) => planFor(candidate, sourceMatches, existing))

  const counts = {
    total: plans.length,
    convertible: plans.filter((p) => p.action !== 'skipped').length,
    wouldCreate: plans.filter((p) => p.action === 'create').length,
    wouldUpdate: plans.filter((p) => p.action === 'update').length,
    unchanged: plans.filter((p) => p.action === 'unchanged').length,
    skipped: plans.filter((p) => p.action === 'skipped').length,
  }

  const missing = plans.flatMap((p) => p.missingSourceIds.map((id) => ({ candidate: p.candidateId, sourceId: id })))
  const ambiguous = plans.flatMap((p) =>
    p.ambiguousSourceIds.map((entry) => ({
      candidate: p.candidateId,
      sourceId: entry.sourceId,
      matches: entry.matches,
    })),
  )

  console.log(`\nKnowledge candidate migration — ${WRITE ? 'WRITE' : 'DRY RUN'}`)
  console.log(`  dataset:                ${dataset}`)
  console.log(`  candidates found:       ${counts.total}`)
  console.log(`  convertible:            ${counts.convertible}`)
  console.log(`  would create:           ${counts.wouldCreate}`)
  console.log(`  would update:           ${counts.wouldUpdate}`)
  console.log(`  unchanged:              ${counts.unchanged}`)
  console.log(`  skipped:                ${counts.skipped}`)
  console.log(`  unresolved source IDs:  ${missing.length}`)
  console.log(`  ambiguous source IDs:   ${ambiguous.length}`)

  for (const plan of plans.filter((p) => p.action === 'skipped')) {
    console.log(`  - skipped ${plan.candidateId}: ${plan.reason}`)
  }
  for (const entry of missing) {
    console.log(`  - unresolved: ${entry.candidate} -> ${entry.sourceId}`)
  }
  for (const entry of ambiguous) {
    console.log(
      `  - ambiguous:  ${entry.candidate} -> ${entry.sourceId} (${entry.matches.join(', ')})`,
    )
  }
  if (VERBOSE) {
    for (const plan of plans.filter((p) => p.action !== 'skipped')) {
      console.log(`\n  ${plan.action} ${plan.documentId}`)
      console.log(JSON.stringify(plan.document, null, 2))
    }
  }

  if (!WRITE) {
    console.log('\nDry run: nothing was written. Re-run with --write to apply.\n')
    return
  }

  let written = 0
  for (const plan of plans) {
    if (plan.action === 'create' || plan.action === 'update') {
      await client.createOrReplace(plan.document as Record<string, unknown> & { _id: string })
      written += 1
    }
  }
  console.log(`\nWrote ${written} knowledgeItem documents. Legacy candidates were not modified.\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
