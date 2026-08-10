import { after, NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { checkMonthlyBudget } from '@/lib/model-budget'
import { sanitiseAnswers } from '@/lib/checker-session-schema'
import { evaluateAssessment } from '@/lib/ai-act-assessment'
import { RULE_PACK } from '@/lib/rulepack'
import { checkEmail, EMAIL_REJECTION_MESSAGE } from '@/lib/report/email'
import { buildCaptureRecord, captureEmail } from '@/lib/report/capture'
import { generateReport, reportGenerationConfigured, toFixedFacts } from '@/lib/report/generate'
import { readReport, writeReport } from '@/lib/report/store'
import { reportSigningConfigured, signReportId } from '@/lib/report/token'
import type { ReportRecord } from '@/lib/report/record'

/**
 * Start a report generation.
 *
 * Two things this route does NOT do, both on purpose:
 *
 * It does not accept a classification. The client sends answers; the engine
 * re-runs here and the server's verdict is the one that reaches generation. A
 * report is a document someone may put in a compliance file, and the tier in it
 * must not be something a browser could have chosen.
 *
 * It does not send email. There is no mail sender wired in this build by design,
 * so the report is delivered on screen via a signed link and the address is
 * captured for the delivery basis only. `onEmailCaptured` is where a platform
 * attaches when one exists.
 */

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_BODY_BYTES = 20_000

export async function POST(request: NextRequest) {
  if (!reportGenerationConfigured()) {
    return NextResponse.json(
      { error: 'Report generation is not configured on this deployment.', unavailable: true },
      { status: 503 },
    )
  }
  if (!reportSigningConfigured()) {
    console.error('Report requested but SESSION_SECRET is missing or too short — cannot issue a link.')
    return NextResponse.json(
      { error: 'Report generation is not configured on this deployment.', unavailable: true },
      { status: 503 },
    )
  }

  const rateLimit = await checkDurableRateLimit('checkerReport', getClientIp(request))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'You have requested several reports recently. Try again a little later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const body = (parsed ?? {}) as Record<string, unknown>

  const email = checkEmail(body.email)
  if (!email.ok) {
    return NextResponse.json({ error: EMAIL_REJECTION_MESSAGE[email.reason] }, { status: 400 })
  }

  const answers = sanitiseAnswers(body.answers)
  if (Object.keys(answers).length === 0) {
    return NextResponse.json(
      { error: 'Complete the assessment before requesting a report.' },
      { status: 400 },
    )
  }

  // Pre-dispatch cost control. Both checks are cheap and both are refusals the
  // user can understand, which is the point of doing them before the spend.
  const budget = await checkMonthlyBudget()
  if (!budget.allowed) {
    console.error(`Report blocked by monthly budget ceiling (${budget.reason}).`)
    return NextResponse.json(
      { error: 'Report generation is paused for this month. The on-screen result is unaffected.' },
      { status: 503 },
    )
  }

  const result = evaluateAssessment(answers)
  const toolName =
    typeof answers.tool_name === 'string' && answers.tool_name.trim()
      ? answers.tool_name.trim()
      : 'this AI system'

  const reportId = globalThis.crypto.randomUUID()
  const token = await signReportId(reportId)

  const record: ReportRecord = {
    id: reportId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    packVersion: RULE_PACK.manifest.version,
    corpusCutOff: RULE_PACK.manifest.corpusCutOff,
    model: '',
    toolName,
    classification: result.classification,
    role: result.role,
    confidence: result.confidence,
  }
  await writeReport(record)

  await captureEmail(
    buildCaptureRecord({
      email: email.email,
      reportId,
      ipCountry: request.headers.get('x-vercel-ip-country'),
      marketingOptIn: body.marketingOptIn === true,
    }),
  )

  // Generation continues after the response is sent. This is where the spec
  // calls for Vercel Workflows; `after()` gets the same 202-then-poll shape
  // without adding a workflow runtime to a repo pinned below Next 16, at the
  // cost of durability across an instance dying mid-generation. That case is
  // handled rather than ignored: a pending record that goes stale is reported
  // as failed and can be retried (see PENDING_TIMEOUT_MS).
  after(async () => {
    try {
      const facts = toFixedFacts(result, toolName)
      const outcome = await generateReport(facts)
      const current = (await readReport(reportId)) ?? record

      if (outcome.status === 'failed') {
        await writeReport({ ...current, status: 'failed', reason: outcome.reason, completedAt: new Date().toISOString() })
        return
      }

      await writeReport({
        ...current,
        status: outcome.status,
        model: outcome.model,
        report: outcome.report,
        reason: outcome.status === 'withheld' ? outcome.reason : undefined,
        completedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Report generation task failed:', error)
      await writeReport({
        ...record,
        status: 'failed',
        reason: 'The report could not be generated.',
        completedAt: new Date().toISOString(),
      })
    }
  })

  return NextResponse.json({ reportId, token }, { status: 202 })
}
