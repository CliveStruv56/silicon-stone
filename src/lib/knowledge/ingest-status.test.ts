import { describe, expect, it } from 'vitest'

import {
  KNOWLEDGE_ERROR_STATUS,
  SAFE_WRITE_FAILURE_MESSAGE,
  statusForKnowledgeError,
  statusForKnowledgeSuccess,
} from './ingest-status'
import { KNOWLEDGE_ERROR_CODES } from './service'

describe('status mapping', () => {
  it('maps every domain error code', () => {
    // The `satisfies` clause enforces this at compile time; this asserts it at
    // runtime too, so a code added without a status cannot reach production
    // through a stale build.
    for (const code of KNOWLEDGE_ERROR_CODES) {
      expect(KNOWLEDGE_ERROR_STATUS[code]).toBeTypeOf('number')
      expect(statusForKnowledgeError(code)).toBeGreaterThanOrEqual(400)
    }
    expect(Object.keys(KNOWLEDGE_ERROR_STATUS).sort()).toEqual([...KNOWLEDGE_ERROR_CODES].sort())
  })

  it('separates a caller problem from a server problem', () => {
    expect(statusForKnowledgeError('validation_failed')).toBe(400)
    expect(statusForKnowledgeError('unresolved_reference')).toBe(422)
    expect(statusForKnowledgeError('duplicate_conflict')).toBe(409)
    expect(statusForKnowledgeError('not_found')).toBe(404)
    // Upstream, not us.
    expect(statusForKnowledgeError('write_failed')).toBe(502)
  })

  it('answers 201 only when something was created', () => {
    expect(statusForKnowledgeSuccess(true)).toBe(201)
    // A duplicate returned the existing record. Nothing was made.
    expect(statusForKnowledgeSuccess(false)).toBe(200)
  })

  it('keeps the write-failure message free of anything internal', () => {
    for (const leak of ['sanity', 'token', 'dataset', 'project', 'permission']) {
      expect(SAFE_WRITE_FAILURE_MESSAGE.toLowerCase()).not.toContain(leak)
    }
  })
})
