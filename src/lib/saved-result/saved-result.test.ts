import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextRequest } from 'next/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
// No store in tests: everything runs against the in-process fallback, never Upstash.
vi.mock('@/lib/redis', () => ({ getRedis: () => null, redisConfigured: () => false }))

import { CheckerResultDocument } from '@/components/tools/CheckerResultDocument'
import { MODULES, FREE_OFFERINGS } from '@/lib/offering'
import {
  SAVED_RESULT_RETENTION_DAYS,
  SAVED_RESULT_TTL_SECONDS,
  buildSavedResult,
  isExpired,
  parseSavedResult,
  pdfFileName,
  saveConsentText,
} from './record'
import {
  deleteSavedResult,
  readSavedResult,
  signSavedResultId,
  verifySavedResultToken,
  writeSavedResult,
} from './store'
import { signReportId } from '@/lib/report/token'

const NAME = 'Acme HireRank for the Paris office'

const ANSWERS = {
  assessment_reason: 'existing-tool',
  tool_name: NAME,
  org_size: 'medium',
  origin: 'third-party',
  eu_scope: ['eu-org'],
  primary_use: 'employment',
  affected_people: ['applicants'],
  decision_impact: 'ranking',
  profiling_confirm: 'yes',
  human_oversight: 'rubber-stamp',
  sensitive_domains: ['employment'],
  data_types: ['employee'],
  transparency: ['none'],
  prohibited_screen: ['none'],
  vendor_docs: ['none'],
  change_control: ['annual-review'],
  not_a_question: 'dropped',
}

const ID = '3f1c2b4a-1d2e-4f5a-8b9c-0d1e2f3a4b5c'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-thirty-two-characters'
})

afterEach(() => {
  vi.doUnmock('@/lib/rulepack')
  vi.resetModules()
})

describe('saved result record', () => {
  it('leaves the free-text system name out unless the reader opts in', () => {
    const record = buildSavedResult({ id: ID, answers: ANSWERS, includeFreeText: false })
    expect(record.includesFreeText).toBe(false)
    expect(record.answers.tool_name).toBeUndefined()
    expect(record.result.summary).toContain('this AI system')
    // Nowhere in the stored JSON, not just absent from one field.
    expect(JSON.stringify(record)).not.toContain('HireRank')
  })

  it('keeps it when the reader ticks the box', () => {
    const record = buildSavedResult({ id: ID, answers: ANSWERS, includeFreeText: true })
    expect(record.answers.tool_name).toBe(NAME)
    expect(record.result.summary).toContain(NAME)
    expect(record.answerLines.some((line) => line.answer === NAME)).toBe(true)
  })

  it('recomputes the result from sanitised answers and stamps the pack', () => {
    const record = buildSavedResult({ id: ID, answers: ANSWERS, includeFreeText: false })
    expect(record.answers).not.toHaveProperty('not_a_question')
    expect(record.result.classification).toBe('Likely high-risk')
    expect(record.stamp.rulepackVersion).toMatch(/^\d{4}-\d{2}-\d{2}[a-z]?$/)
    expect(record.timeline.length).toBeGreaterThan(0)
    expect(record.penalties.length).toBeGreaterThan(0)
  })

  it('expires after the retention period, which is one named constant', () => {
    const now = new Date('2026-11-16T10:00:00Z')
    const record = buildSavedResult({ id: ID, answers: ANSWERS, includeFreeText: false, now })
    expect(SAVED_RESULT_TTL_SECONDS).toBe(SAVED_RESULT_RETENTION_DAYS * 86_400)
    expect(Date.parse(record.expiresAt) - now.getTime()).toBe(SAVED_RESULT_TTL_SECONDS * 1000)
    expect(isExpired(record, Date.parse(record.expiresAt) - 1)).toBe(false)
    expect(isExpired(record, Date.parse(record.expiresAt))).toBe(true)
    expect(saveConsentText()).toContain(`${SAVED_RESULT_RETENTION_DAYS} days`)
  })

  it('refuses a record of an unknown shape or version', () => {
    const record = buildSavedResult({ id: ID, answers: ANSWERS, includeFreeText: false })
    expect(parseSavedResult(record)).not.toBeNull()
    expect(parseSavedResult({ ...record, recordVersion: 2 })).toBeNull()
    expect(parseSavedResult({ ...record, checker: 'v2' })).toBeNull()
    expect(parseSavedResult('nope')).toBeNull()
  })

  it('names the PDF after the tool, the tier and the date', () => {
    expect(pdfFileName('Likely high-risk', '2026-11-16T10:00:00.000Z')).toBe('ai-act-checker-likely-high-risk-2026-11-16')
    expect(pdfFileName('Prohibited from 2 December 2026', '2026-11-16T10:00:00.000Z')).toBe(
      'ai-act-checker-prohibited-from-2-december-2026-2026-11-16',
    )
  })
})

describe('saved result link signature', () => {
  it('verifies its own token and nothing else', async () => {
    const token = await signSavedResultId(ID)
    expect(await verifySavedResultToken(ID, token)).toBe(true)
    expect(await verifySavedResultToken(ID, `${token.slice(0, -1)}A`)).toBe(false)
    expect(await verifySavedResultToken('00000000-0000-4000-8000-000000000000', token)).toBe(false)
    expect(await verifySavedResultToken(ID, null)).toBe(false)
  })

  it('does not accept an AI report link token for the same id', async () => {
    expect(await verifySavedResultToken(ID, await signReportId(ID))).toBe(false)
  })

  it('fails closed with no signing secret', async () => {
    const token = await signSavedResultId(ID)
    const secret = process.env.SESSION_SECRET
    delete process.env.SESSION_SECRET
    try {
      expect(await verifySavedResultToken(ID, token)).toBe(false)
    } finally {
      process.env.SESSION_SECRET = secret
    }
  })
})

describe('saved result store (fallback map)', () => {
  it('writes, reads, expires and deletes', async () => {
    const now = new Date('2026-11-16T10:00:00Z')
    const record = buildSavedResult({ id: ID, answers: ANSWERS, includeFreeText: false, now })
    await writeSavedResult(record)
    expect((await readSavedResult(ID, now.getTime()))?.id).toBe(ID)

    // Past expiry it reads as gone, and is removed rather than left behind.
    expect(await readSavedResult(ID, Date.parse(record.expiresAt) + 1)).toBeNull()
    expect(await readSavedResult(ID, now.getTime())).toBeNull()

    await writeSavedResult(record)
    await deleteSavedResult(ID)
    expect(await readSavedResult(ID, now.getTime())).toBeNull()
  })
})

describe('saved result API', () => {
  async function save(body: unknown) {
    const { POST } = await import('@/app/api/tools/compliance-checker/saved/route')
    return POST(
      new NextRequest('http://localhost/api/tools/compliance-checker/saved', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'x-forwarded-for': '203.0.113.9' },
      }),
    )
  }

  it('saves without an email and returns a signed link', async () => {
    const response = await save({ answers: ANSWERS, email: 'someone@example.com' })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.path).toMatch(/^\/tools\/compliance-checker\/result\/[0-9a-f-]{36}\?token=/)
    expect(await verifySavedResultToken(data.id, data.token)).toBe(true)
    const stored = await readSavedResult(data.id)
    // Only an explicit true opts in, and an email in the body is never stored.
    expect(stored?.includesFreeText).toBe(false)
    expect(JSON.stringify(stored)).not.toContain('example.com')
    expect(JSON.stringify(stored)).not.toContain('HireRank')
  })

  it('treats anything but true as no to the free text', async () => {
    const data = await (await save({ answers: ANSWERS, includeFreeText: 'yes' })).json()
    expect((await readSavedResult(data.id))?.includesFreeText).toBe(false)
    const opted = await (await save({ answers: ANSWERS, includeFreeText: true })).json()
    expect((await readSavedResult(opted.id))?.answers.tool_name).toBe(NAME)
  })

  it('refuses an empty assessment', async () => {
    expect((await save({ answers: {} })).status).toBe(400)
  })

  it('deletes only with the right token', async () => {
    const data = await (await save({ answers: ANSWERS })).json()
    const { DELETE } = await import('@/app/api/tools/compliance-checker/saved/[id]/route')
    const call = (token: string) =>
      DELETE(
        new NextRequest(`http://localhost/api/tools/compliance-checker/saved/${data.id}?token=${encodeURIComponent(token)}`, {
          method: 'DELETE',
        }),
        { params: Promise.resolve({ id: data.id }) },
      )
    expect((await call('wrong')).status).toBe(404)
    expect(await readSavedResult(data.id)).not.toBeNull()
    expect((await call(data.token)).status).toBe(200)
    expect(await readSavedResult(data.id)).toBeNull()
  })
})

describe('saved result rendering', () => {
  it('renders identically after a rule-pack version bump', async () => {
    const record = buildSavedResult({ id: ID, answers: ANSWERS, includeFreeText: false })
    const before = renderToStaticMarkup(createElement(CheckerResultDocument, { snapshot: record }))
    expect(before).toContain(record.stamp.rulepackVersion)
    expect(before).toContain('Likely high-risk')

    // Bump the live pack: new version, a moved date, a changed ceiling.
    vi.resetModules()
    const real = await vi.importActual<typeof import('@/lib/rulepack')>('@/lib/rulepack')
    const bumped = {
      ...real.RULE_PACK,
      manifest: { ...real.RULE_PACK.manifest, version: '2099-01-01' },
      timeline: real.RULE_PACK.timeline.map((entry, index) => (index === 0 ? { ...entry, date: '1 January 2099' } : entry)),
      penalties: real.RULE_PACK.penalties.map((tier) => ({ ...tier, ceiling: 'changed' })),
    }
    vi.doMock('@/lib/rulepack', () => ({ ...real, RULE_PACK: bumped }))

    const freshRecord = await import('./record')
    const freshDocument = await import('@/components/tools/CheckerResultDocument')
    // The bump took: a record made now carries the new pack...
    const made = freshRecord.buildSavedResult({ id: ID, answers: ANSWERS, includeFreeText: false })
    expect(made.stamp.rulepackVersion).toBe('2099-01-01')
    expect(made.penalties[0].ceiling).toBe('changed')
    // ...and the saved one still renders exactly as it did.
    const after = renderToStaticMarkup(createElement(freshDocument.CheckerResultDocument, { snapshot: record }))
    expect(after).toBe(before)
  })

  it('shows the assessment date, pack version, expiry and the Checker disclaimer', () => {
    const record = buildSavedResult({
      id: ID,
      answers: ANSWERS,
      includeFreeText: false,
      now: new Date('2026-11-16T10:00:00Z'),
    })
    const html = renderToStaticMarkup(createElement(CheckerResultDocument, { snapshot: record }))
    expect(html).toContain('16 November 2026')
    expect(html).toContain('16 December 2026')
    expect(html).toContain('reflects the rules as of that date')
    expect(html).toContain('not legal advice')
    expect(html).not.toContain('HireRank')
  })
})

describe('tools offering wording', () => {
  const tools = FREE_OFFERINGS.find((offering) => offering.id === 'tools')

  it('no longer claims an email is required for results', () => {
    expect(tools?.priceNote).not.toMatch(/email required/i)
    expect(tools?.terms?.join(' ')).not.toMatch(/No tool input leaves your browser/)
  })

  it('states the saved-link retention the code actually uses', () => {
    expect(tools?.terms?.join(' ')).toContain(`${SAVED_RESULT_RETENTION_DAYS} days`)
    expect(MODULES.length).toBeGreaterThan(0)
  })
})
