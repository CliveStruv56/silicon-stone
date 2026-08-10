'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Lock, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CONSENT_TEXT } from '@/lib/report/email'
import type { AssessmentAnswers } from '@/lib/ai-act-assessment'
import type { ReportRecord } from '@/lib/report/record'
import { ReportView } from './ReportView'
import { EvidencePackTeaser } from './EvidencePackTeaser'

/**
 * The email gate.
 *
 * It sits in front of something new. Everything the checker produced before this
 * feature existed — the tier, the rationale, the vendor questions, the markdown
 * export — is still free and still ungated above this card. That was the promise
 * the tool made and it is not being quietly withdrawn to make room for a gate.
 */

const ENDPOINT = '/api/tools/compliance-checker/report'
const POLL_INTERVAL_MS = 3_000
/**
 * Slightly beyond the server's own PENDING_TIMEOUT_MS, so the client never
 * gives up on a report the server still considers live. A frontier model
 * writing three cited sections took 137 seconds when measured.
 */
const POLL_TIMEOUT_MS = 330 * 1000

type Stage = 'closed' | 'form' | 'generating' | 'done'

export function ReportGate({ answers }: { answers: AssessmentAnswers }) {
  const [stage, setStage] = useState<Stage>('closed')
  const [email, setEmail] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<ReportRecord | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending) clearTimeout(timer)
    }
  }, [])

  const poll = (reportId: string, token: string, startedAt: number) => {
    const tick = async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setError('The report is taking longer than expected. Your assessment above is unaffected.')
        setStage('form')
        return
      }
      try {
        const response = await fetch(
          `${ENDPOINT}/${reportId}?token=${encodeURIComponent(token)}`,
          { cache: 'no-store' },
        )
        const data = await response.json()
        const next = data?.report as ReportRecord | undefined
        if (!response.ok || !next) {
          setError('The report could not be retrieved.')
          setStage('form')
          return
        }
        if (next.status === 'pending') {
          timers.current.push(setTimeout(tick, POLL_INTERVAL_MS))
          return
        }
        setRecord(next)
        setStage('done')
      } catch {
        timers.current.push(setTimeout(tick, POLL_INTERVAL_MS))
      }
    }
    timers.current.push(setTimeout(tick, POLL_INTERVAL_MS))
  }

  const submit = async () => {
    setError(null)
    setStage('generating')
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers, marketingOptIn }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || 'That did not work.')
        setStage('form')
        return
      }
      setLink(`/tools/compliance-checker/report/${data.reportId}?token=${encodeURIComponent(data.token)}`)
      poll(data.reportId, data.token, Date.now())
    } catch {
      setError('The report service is unreachable.')
      setStage('form')
    }
  }

  if (stage === 'done' && record) {
    return (
      <div className="space-y-4">
        <ReportView record={record} />
        <EvidencePackTeaser />
        {link && (
          <p className="text-center text-xs text-text-muted">
            Keep this report:{' '}
            <a href={link} className="text-silicon-amber hover:underline">
              permanent link
            </a>
            . It stays available for 30 days.
          </p>
        )}
      </div>
    )
  }

  if (stage === 'generating') {
    return (
      <Card className="bg-stone-charcoal border-stone-teal/40">
        <CardContent className="flex items-center gap-4 py-8">
          <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-stone-teal" />
          <div>
            <div className="font-medium text-text-primary">Writing your report</div>
            <p className="mt-1 text-sm text-text-muted">
              Every legal claim is being checked against the consolidated text before you see it, so
              this takes two or three minutes. You can keep reading the result above.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stage === 'closed') {
    return (
      <Card className="bg-surface-elevated border-stone-teal/30">
        <CardHeader>
          <div className="flex items-center gap-2 text-stone-teal">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-lg">Go deeper on this result</CardTitle>
          </div>
          <CardDescription>
            A written report that works through the reasoning: your position in the value chain, why
            this classification follows from your answers — including what this questionnaire never
            asked you — and a review schedule dated against what you told us. Every legal claim is
            quoted from the consolidated text and checked against it before you see it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-muted">
            Free, in exchange for an email address. Nothing above this card changes: the
            classification, the vendor questions and the download are all still yours without one.
          </p>
          <Button
            type="button"
            onClick={() => setStage('form')}
            className="bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90"
          >
            <Mail className="h-4 w-4" />
            Get the written report
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-surface-elevated border-stone-teal/30">
      <CardHeader>
        <div className="flex items-center gap-2 text-stone-teal">
          <Lock className="h-5 w-5" />
          <CardTitle className="text-lg">Where should we send it?</CardTitle>
        </div>
        <CardDescription>{CONSENT_TEXT}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@organisation.eu"
          autoComplete="email"
          className="h-12 border-border-subtle bg-slate-deep text-text-primary"
        />

        {/*
          Marketing consent is a separate decision, defaulted off and stored
          separately. A tick for the report is not a tick for the newsletter.
        */}
        <label className="flex items-start gap-3 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
            className="mt-1 h-4 w-4 flex-shrink-0 accent-stone-teal"
          />
          <span>
            Also send me the Silicon &amp; Stone briefing. Optional, and unrelated to the report —
            leave it unticked and you will only hear from us about this.
          </span>
        </label>

        {error && (
          <p className="rounded-lg border border-alert-red/40 bg-alert-red/10 p-3 text-sm text-text-primary">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStage('closed')}
            className="text-text-muted hover:text-text-primary"
          >
            Not now
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={email.trim().length < 5}
            className="bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90"
          >
            Generate my report
          </Button>
        </div>

        <p className="text-xs text-text-muted">
          We hold this address to deliver the report and to answer you about it. See the{' '}
          <a href="/privacy" className="text-silicon-amber hover:underline">
            privacy notice
          </a>
          .
        </p>
      </CardContent>
    </Card>
  )
}
