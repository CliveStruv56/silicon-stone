'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, FileText, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DELIVERY_WORDING, MARKETING_WORDING } from '@/lib/compliance-v2/report/consent'
import type { AnswerRecordV2 } from '@/lib/compliance-v2/types'
import type { ReportRecordV2 } from '@/lib/compliance-v2/report/record'

/**
 * Requesting the written report (§13, §14).
 *
 * Three things about where this sits and what it does.
 *
 * **It is below the result, and that is criterion 14.** §20.14 requires the core
 * result to be available before any email gate. The result renders above this
 * card in full — every finding, every extract, every date — and nothing here
 * gates it. A reader who never fills this in has lost nothing except the prose.
 *
 * **The two consents are two checkboxes**, with the wording imported from
 * `consent.ts` rather than retyped, so what the server records as having been
 * shown is what was actually shown. Marketing starts unticked and submitting
 * without touching it sends `false`.
 *
 * **The answers go up, the classification does not.** The route re-runs the
 * engine server-side and its verdict is the one in the report. Sending a
 * classification from here would make the tier something a browser chose, which
 * is the whole thing §14.1 forbids — so it is not in the payload at all.
 */

type Phase = 'idle' | 'submitting' | 'polling' | 'done' | 'error'

const POLL_INTERVAL_MS = 3_000
/** Just past the route's own ceiling; after this the server calls it dead too. */
const POLL_CEILING_MS = 330_000

export function ReportRequestV2({
  answers,
  toolName,
}: {
  answers: AnswerRecordV2
  toolName: string
}) {
  const [email, setEmail] = useState('')
  const [delivery, setDelivery] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportRecordV2 | null>(null)

  // Cleared on unmount so a poll cannot outlive the component and set state on
  // something that is gone.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function poll(id: string, token: string, startedAt: number) {
    try {
      const response = await fetch(
        `/api/tools/compliance-checker/v2/report/${id}?token=${encodeURIComponent(token)}`
      )
      if (!response.ok) throw new Error('lost')

      const body = (await response.json()) as { report: ReportRecordV2 }
      if (body.report.status === 'pending') {
        if (Date.now() - startedAt > POLL_CEILING_MS) {
          setPhase('error')
          setError('The report did not finish in time. Request it again.')
          return
        }
        timer.current = setTimeout(() => void poll(id, token, startedAt), POLL_INTERVAL_MS)
        return
      }

      setReport(body.report)
      setPhase('done')
    } catch {
      setPhase('error')
      setError('We lost track of the report. Request it again.')
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPhase('submitting')

    try {
      const response = await fetch('/api/tools/compliance-checker/v2/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          deliveryConsent: delivery,
          marketingConsent: marketing,
          toolName,
          answers,
        }),
      })

      const body = (await response.json()) as {
        reportId?: string
        token?: string
        error?: string
      }

      if (!response.ok || !body.reportId || !body.token) {
        setPhase('error')
        setError(body.error ?? 'The report could not be requested.')
        return
      }

      setPhase('polling')
      void poll(body.reportId, body.token, Date.now())
    } catch {
      setPhase('error')
      setError('The report could not be requested. Check your connection and try again.')
    }
  }

  if (phase === 'done' && report) {
    return <ReportView report={report} />
  }

  return (
    <Card className="bg-stone-charcoal border-border-subtle">
      <CardHeader>
        <CardTitle className="text-text-primary">Get this as a written report</CardTitle>
        <CardDescription className="text-text-muted">
          A written version of the result above, with the reasoning set out in plain language. The
          result you can already see does not depend on this — it is complete, and it is yours
          whether you ask for the report or not.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="v2-report-email" className="block text-sm text-text-primary">
              Email address
            </label>
            <input
              id="v2-report-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border border-border-subtle bg-stone-black px-3 py-2 text-sm text-text-primary"
              placeholder="you@organisation.eu"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-text-primary">
            <input
              type="checkbox"
              required
              checked={delivery}
              onChange={(event) => setDelivery(event.target.checked)}
              className="mt-1"
            />
            <span>{DELIVERY_WORDING}</span>
          </label>

          <label className="flex items-start gap-3 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(event) => setMarketing(event.target.checked)}
              className="mt-1"
            />
            <span>{MARKETING_WORDING}</span>
          </label>

          {error && (
            <p className="flex items-start gap-2 text-sm text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" disabled={phase === 'submitting' || phase === 'polling'}>
            {phase === 'submitting' || phase === 'polling' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {phase === 'submitting' ? 'Requesting…' : 'Writing the report…'}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Get the report
              </>
            )}
          </Button>

          {/*
            Said plainly rather than buried. There is no mail sender in this
            build, so promising delivery to an inbox would be a promise the code
            cannot keep. The address is kept as the record of consent — see
            §22.1, two years — and the report appears here.
          */}
          <p className="text-xs text-text-muted">
            The report appears on this page when it is ready. We keep your address as the record
            that you asked for it, for two years; the report itself is kept for 30 days.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function ReportView({ report }: { report: ReportRecordV2 }) {
  if (report.status !== 'complete' || !report.document) {
    return (
      <Card className="bg-stone-charcoal border-border-subtle">
        <CardHeader>
          <CardTitle className="text-text-primary">No report is being shown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text-muted">
          <p>{report.reason ?? 'The report could not be produced.'}</p>
          <p>The result above is unaffected by this, and remains what the assessment found.</p>
        </CardContent>
      </Card>
    )
  }

  const { document } = report
  const prose = document.prose

  return (
    <Card className="bg-stone-charcoal border-border-subtle">
      <CardHeader>
        <CardTitle className="text-text-primary">{document.title}</CardTitle>
        <CardDescription className="text-text-muted">
          {document.classification} · assessed {report.assessedAt} · rule pack {report.packVersion}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm text-text-primary">
        {prose ? (
          <>
            <p>{prose.executiveSummary}</p>
            {prose.practicalPlan.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wide text-text-muted">
                  In what order to do it
                </h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  {prose.practicalPlan.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {prose.contextNote && <p className="text-text-muted">{prose.contextNote}</p>}
          </>
        ) : (
          /*
            Not an error, and not silence either. The deterministic report is the
            report; the prose is an addition that either verified or did not. A
            reader who gets the shorter one is told which they have, because the
            alternative is wondering whether something is missing.
          */
          <p className="text-text-muted">
            This report is the assessment itself, without the written summary — either no summary
            was generated, or the one that was did not pass the checks that every generated sentence
            has to pass before it is shown. Nothing has been left out of the findings.
          </p>
        )}

        <div className="border-t border-border-subtle pt-4">
          <h3 className="text-xs uppercase tracking-wide text-text-muted">What it covers</h3>
          <ul className="mt-2 space-y-1 text-text-muted">
            {document.sections.map((section) => (
              <li key={section.key}>
                {section.heading} — {section.findings.length}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-text-muted">{document.disclaimer}</p>
      </CardContent>
    </Card>
  )
}
