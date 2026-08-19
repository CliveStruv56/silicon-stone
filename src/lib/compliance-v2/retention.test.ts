import { describe, expect, it } from 'vitest'
import { MARKETING_USE, RETENTION, RETENTION_BY_ID, retentionSummary } from './retention'
import { REPORT_TTL_SECONDS } from '../report/record'
import { CHECKER_SESSION_TTL_SECONDS } from '../checker-session-schema'

/**
 * The decision record has to agree with the behaviour, or it is not a record of
 * anything.
 *
 * Two of the three constants are asserted here. The third — `CAPTURE_TTL_SECONDS`
 * — lives in `report/capture.ts`, which starts with `import 'server-only'` and
 * therefore throws under vitest. Its agreement is asserted in
 * `scripts/compliance-v2-check.ts`, which runs under the scripts tsconfig that
 * shims that specifier away, and which `prebuild` runs. The check is not
 * skipped; it is somewhere that can run it.
 */
describe('retention policy (§22.1)', () => {
  it('states a period for each thing the tool keeps', () => {
    expect(RETENTION.map((policy) => policy.id).sort()).toEqual([
      'assessment-session',
      'generated-report',
      'report-email',
    ])
  })

  it('agrees with the report TTL the code actually applies', () => {
    expect(RETENTION_BY_ID.get('generated-report')!.seconds).toBe(REPORT_TTL_SECONDS)
  })

  it('agrees with the session TTL the code actually applies', () => {
    expect(RETENTION_BY_ID.get('assessment-session')!.seconds).toBe(CHECKER_SESSION_TTL_SECONDS)
  })

  it('keeps the consent record longer than the report it relates to', () => {
    // Not arithmetic for its own sake: deleting the consent record with the
    // report would destroy the evidence of the lawful basis while the
    // consequences of having relied on it were still live.
    expect(RETENTION_BY_ID.get('report-email')!.seconds).toBeGreaterThan(
      RETENTION_BY_ID.get('generated-report')!.seconds
    )
  })

  it('gives every period a reason and a place the behaviour lives', () => {
    for (const policy of RETENTION) {
      expect(policy.seconds, policy.id).toBeGreaterThan(0)
      expect(Number.isFinite(policy.seconds), policy.id).toBe(true)
      // A period nobody justified is a number, not a policy.
      expect(policy.because.length, policy.id).toBeGreaterThan(80)
      expect(policy.implementedIn, policy.id).toMatch(/src\//)
      expect(policy.period, policy.id).toBeTruthy()
    }
  })

  it('summarises itself for a privacy notice without restating the periods', () => {
    const summary = retentionSummary()
    expect(summary).toHaveLength(RETENTION.length)
    for (const policy of RETENTION) {
      expect(summary.some((line) => line.includes(policy.period))).toBe(true)
    }
  })
})

describe('marketing use (§22.2)', () => {
  it('is decided, and decided against', () => {
    expect(MARKETING_USE.permitted).toBe(false)
    expect(MARKETING_USE.decidedOn).toBeTruthy()
  })

  it('says so in words a reader could be shown', () => {
    expect(MARKETING_USE.statement).toMatch(/separately/i)
    expect(MARKETING_USE.statement.length).toBeGreaterThan(80)
  })
})
