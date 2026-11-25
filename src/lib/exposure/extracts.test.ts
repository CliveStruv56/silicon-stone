import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { verifyCitation } from '@/lib/rulepack/corpus'
import { EXTRACTS } from './extracts'

describe('Exposure Check extracts', () => {
  it('every extract is verbatim in the pinned corpus', () => {
    for (const [id, extract] of Object.entries(EXTRACTS)) {
      expect({ id, verdict: verifyCitation(extract.article, extract.text) }).toEqual({
        id,
        verdict: { status: 'verified' },
      })
    }
  })
})
