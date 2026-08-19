import { after, NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { checkMonthlyBudget } from '@/lib/model-budget'
import { COMPLIANCE_CHECKER_V2 } from '@/lib/flags'
import { CHECKER_VERSION } from '@/lib/checker-version'
import { RULE_PACK } from '@/lib/rulepack'
import { checkEmail, EMAIL_REJECTION_MESSAGE } from '@/lib/report/email'
import { buildCaptureRecord, captureEmail } from '@/lib/report/capture'
import { reportSigningConfigured, signReportId } from '@/lib/report/token'
import { validateAnswers, minimumFactsSatisfied } from '@/lib/compliance-v2/validation/answers'
import { evaluateAssessmentV2 } from '@/lib/compliance-v2/engine/assemble'
import { generateReport } from '@/lib/compliance-v2/report/generate'
import { buildConsent, DELIVERY_WORDING, MARKETING_WORDING } from '@/lib/compliance-v2/report/consent'
import { proseGenerationConfigured, proseModel, proseModelName } from '@/lib/compliance-v2/report/model'
import { readReportV2, writeReportV2 } from '@/lib/compliance-v2/report/store'
import type { ReportRecordV2 } from '@/lib/compliance-v2/report/record'

/**
 * Start a v2 report generation.
 *
 * Ported from v1's route rather than reimagined, because the shape it settled on
 * — validate, re-evaluate server-side, write a pending record, generate in
 * `after()`, return 202 and a signed link — solved problems that have not gone
 * away. What differs is v2's contracts, and four of those differences matter:
 *
 * **The route does not accept a classification, and now cannot even be handed
 * one.** v1 says the same thing, but v1's engine takes a loose answer bag. Here
 * the body is run through `validateAnswers`, which rejects an unrecognised
 * question id outright, and the classification is `evaluateAssessmentV2`'s
 * alone. A report is a document somebody may put in a compliance file; the tier
 * in it must not be something a browser could have chosen.
 *
 * **The route is dark unless the flag is on.** v2 is unreleased. A live endpoint
 * behind an unreleased feature is a way to reach that feature, so the flag is
 * checked here and not only in the page.
 *
 * **A missing model is not an error.** `generateReport` treats an absent
 * `ProseModel` as "no prose" and returns the deterministic report, which is
 * complete on its own. So an unconfigured deployment still produces a report —
 * it produces the half that was never the model's to write. This is the opposite
 * of v1, which 503s when no key is present, and it is the better behaviour:
 * v1 503s because its report *is* the generation, and v2's is not.
 *
 * **It sends no email.** There is still no mail sender in this codebase. The
 * report is delivered on screen through a signed link and the address is
 * captured as the consent record §22.1 keeps for two years. `captureEmail` is
 * shared with v1 deliberately — one store of who consented to what, not two.
 */

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_BODY_BYTES = 60_000

export async function POST(request: NextRequest) {
  if (!COMPLIANCE_CHECKER_V2) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!reportSigningConfigured()) {
    console.error('v2 report requested but SESSION_SECRET is missing or too short — cannot issue a link.')
    return NextResponse.json(
      { error: 'Report delivery is not configured on this deployment.', unavailable: true },
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

  /**
   * §13.2: delivery consent and marketing consent are separate, and the wording
   * shown is recorded with the record. Built before anything expensive happens,
   * so a consent problem is a 400 rather than a report nobody agreed to receive.
   */
  const consent = buildConsent({
    email: email.email,
    delivery: body.deliveryConsent === true,
    marketing: body.marketingConsent === true,
    capturedAt: new Date().toISOString(),
  })
  if (!('consent' in consent)) {
    return NextResponse.json(
      { error: 'Tick the box agreeing we can send the report to this address.' },
      { status: 400 },
    )
  }

  const validated = validateAnswers(body.answers)
  if (!validated.ok) {
    return NextResponse.json(
      { error: 'Some answers were not recognised.', problems: validated.errors },
      { status: 400 },
    )
  }

  const missing = minimumFactsSatisfied(validated.answers)
  if (missing.length) {
    return NextResponse.json(
      { error: 'Finish the assessment before requesting a report.', problems: missing },
      { status: 400 },
    )
  }

  // Pre-dispatch cost control, and only where there is a spend to control. An
  // unconfigured deployment produces the deterministic report and never calls a
  // model, so refusing it on a model budget would withhold something free.
  if (proseGenerationConfigured()) {
    const budget = await checkMonthlyBudget()
    if (!budget.allowed) {
      console.error(`v2 report blocked by monthly budget ceiling (${budget.reason}).`)
      return NextResponse.json(
        { error: 'Report generation is paused for this month. The on-screen result is unaffected.' },
        { status: 503 },
      )
    }
  }

  const assessedAt = new Date().toISOString().slice(0, 10)
  const result = evaluateAssessmentV2(validated.answers, assessedAt)

  const toolName =
    typeof body.toolName === 'string' && body.toolName.trim()
      ? body.toolName.trim().slice(0, 120)
      : 'this AI system'

  const reportId = globalThis.crypto.randomUUID()
  const token = await signReportId(reportId)

  const record: ReportRecordV2 = {
    id: reportId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    packVersion: RULE_PACK.manifest.version,
    corpusCutOff: RULE_PACK.manifest.corpusCutOff,
    checkerVersion: CHECKER_VERSION,
    model: '',
    toolName,
    classification: result.classification,
    assessedAt: result.assessedAt,
  }
  await writeReportV2(record)

  await captureEmail(
    buildCaptureRecord({
      email: consent.consent.email,
      reportId,
      ipCountry: request.headers.get('x-vercel-ip-country'),
      marketingOptIn: consent.consent.marketing,
    }),
  )

  /**
   * Generation continues after the response is sent.
   *
   * The spec calls for Vercel Workflows; `after()` gets the same 202-then-poll
   * shape without adding a workflow runtime to a repo pinned below Next 16, at
   * the cost of durability across an instance dying mid-generation. That case is
   * handled rather than ignored — `isStalePendingV2` in the status route.
   */
  after(async () => {
    try {
      const model = proseModel()
      const generated = await generateReport(result, validated.answers, { toolName, model })
      const current = (await readReportV2(reportId)) ?? record

      /**
       * The one case that is genuinely a withhold.
       *
       * `verifyReport` does not withhold reports; it removes findings that fail
       * a check and drops prose that fails one, and the deterministic remainder
       * is a complete report. So there is no `verification.withheld` to read —
       * inventing one here would have been a policy nobody wrote down.
       *
       * What *can* happen is that every section is removed and the document has
       * nothing left in it. A report with no findings is not a thin report, it
       * is an empty page under a heading, and showing it would say "nothing
       * applies to you" on the strength of a verification failure. That is
       * withheld, and it says so.
       */
      const empty = generated.document.sections.length === 0

      await writeReportV2({
        ...current,
        status: empty ? 'withheld' : 'complete',
        model: model && generated.proseIncluded ? proseModelName() : '',
        document: empty ? undefined : generated.document,
        verification: generated.verification,
        proseIncluded: generated.proseIncluded,
        reason: empty
          ? 'Every finding in this report failed verification against the pinned legal text, so no report is shown. The on-screen result is unaffected.'
          : undefined,
        completedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('v2 report generation failed:', error)
      await writeReportV2({
        ...record,
        status: 'failed',
        reason: 'The report could not be generated. Request it again.',
        completedAt: new Date().toISOString(),
      })
    }
  })

  return NextResponse.json(
    {
      reportId,
      token,
      consent: {
        wording: { delivery: DELIVERY_WORDING, marketing: MARKETING_WORDING },
        marketing: consent.consent.marketing,
      },
    },
    { status: 202 },
  )
}
