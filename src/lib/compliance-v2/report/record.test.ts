import { describe, expect, it } from 'vitest'
import {
  PENDING_V2_TIMEOUT_MS,
  REPORT_V2_TTL_SECONDS,
  isStalePendingV2,
  type ReportRecordV2,
} from './record'
import { emptyProse, proseToolSchema } from './schema'
import { RETENTION_BY_ID } from '../retention'

function record(overrides: Partial<ReportRecordV2> = {}): ReportRecordV2 {
  return {
    id: 'r1',
    status: 'pending',
    createdAt: '2026-08-19T12:00:00.000Z',
    packVersion: '2026-08-19b',
    corpusCutOff: '2026-07-27',
    checkerVersion: '2.0.0-dev',
    model: '',
    toolName: 'Acme Screening',
    classification: 'likely_high_risk',
    assessedAt: '2026-08-19',
    ...overrides,
  }
}

describe('a stored v2 report', () => {
  it('keeps reports for the period §22.1 records', () => {
    expect(REPORT_V2_TTL_SECONDS).toBe(RETENTION_BY_ID.get('generated-report')!.seconds)
  })

  it('treats a pending record as dead only once nothing could still be driving it', () => {
    const started = Date.parse('2026-08-19T12:00:00.000Z')
    const pending = record()

    expect(isStalePendingV2(pending, started + 1_000)).toBe(false)
    // Just inside the platform's own ceiling: the work could still be running.
    expect(isStalePendingV2(pending, started + PENDING_V2_TIMEOUT_MS - 1_000)).toBe(false)
    expect(isStalePendingV2(pending, started + PENDING_V2_TIMEOUT_MS + 1_000)).toBe(true)
  })

  it('never calls a finished record stale, however old', () => {
    const started = Date.parse('2026-08-19T12:00:00.000Z')
    for (const status of ['complete', 'withheld', 'failed'] as const) {
      expect(isStalePendingV2(record({ status }), started + PENDING_V2_TIMEOUT_MS * 100)).toBe(false)
    }
  })

  it('survives an unparseable createdAt rather than declaring death on NaN', () => {
    // `NaN > x` is false, so a malformed timestamp reports "not stale" — which
    // is the safe direction: it leaves the record alone rather than failing a
    // report that might still be coming.
    expect(isStalePendingV2(record({ createdAt: 'not a date' }))).toBe(false)
  })

  it('outlives the generation ceiling it is measured against', () => {
    // The route's maxDuration is 300s. A timeout at or below that would call a
    // report dead while the platform was still running it.
    expect(PENDING_V2_TIMEOUT_MS).toBeGreaterThan(300 * 1000)
  })
})

describe('the prose tool schema', () => {
  /**
   * The schema and `GeneratedProse` are two independent statements of one shape,
   * which is the arrangement that catches a mismatch — but only if something
   * compares them. This is that something.
   */
  it('requires exactly the fields GeneratedProse has', () => {
    const schema = proseToolSchema()
    expect([...schema.required].sort()).toEqual(Object.keys(emptyProse()).sort())
    expect(Object.keys(schema.properties).sort()).toEqual(Object.keys(emptyProse()).sort())
  })

  it('gives the model nowhere to put a legal claim', () => {
    // §14.3 is structural: there is no field for an obligation, a citation, a
    // date or a classification, so the model cannot supply one.
    const keys = Object.keys(proseToolSchema().properties)
    for (const forbidden of ['obligation', 'citation', 'article', 'date', 'classification', 'tier']) {
      expect(keys.some((key) => key.toLowerCase().includes(forbidden))).toBe(false)
    }
  })

  it('describes every field, because the description is the instruction', () => {
    for (const [key, property] of Object.entries(proseToolSchema().properties)) {
      expect((property as { description?: string }).description, key).toBeTruthy()
    }
  })
})
