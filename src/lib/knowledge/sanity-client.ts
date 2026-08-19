import 'server-only'

import { writeClient } from '@/lib/sanity'

import type { KnowledgeClient, KnowledgePatch } from './repository'

/**
 * Wires the real Sanity client into the knowledge repository.
 *
 * This is the only file in `src/lib/knowledge/` that imports `server-only` or
 * touches a credential, and it is deliberately the only one that cannot be
 * unit-tested — `server-only` throws under vitest. Everything worth testing
 * lives on the other side of the `KnowledgeClient` interface.
 *
 * The methods are wrapped rather than passed through structurally. The real
 * client's signatures are wider than what the repository needs, and an
 * explicit adapter means a future change to either side shows up here as a
 * type error rather than somewhere further away.
 *
 * Deliberately not exported from `index.ts`: importing the barrel must not
 * drag `server-only` into a module that has no business holding a write token.
 */
export function knowledgeClient(): KnowledgeClient {
  return {
    fetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
      return writeClient.fetch<T>(query, params)
    },
    async create(document: Record<string, unknown>) {
      const result = await writeClient.create(
        document as Record<string, unknown> & { _type: string },
      )
      return { _id: result._id }
    },
    async createOrReplace(document: Record<string, unknown>) {
      const result = await writeClient.createOrReplace(
        document as Record<string, unknown> & { _id: string; _type: string },
      )
      return { _id: result._id }
    },
    patch(id: string): KnowledgePatch {
      const patch = writeClient.patch(id)
      const wrap = (): KnowledgePatch => ({
        set(fields) {
          patch.set(fields)
          return wrap()
        },
        setIfMissing(fields) {
          patch.setIfMissing(fields)
          return wrap()
        },
        unset(fields) {
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
