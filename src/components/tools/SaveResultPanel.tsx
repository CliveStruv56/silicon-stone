'use client'

import { useState } from 'react'
import { Check, Copy, Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssessmentAnswers } from '@/lib/ai-act-assessment'
import { longDate, SAVED_RESULT_RETENTION_DAYS, saveConsentText } from '@/lib/saved-result/record'
import { TOOL_EVENTS, trackToolAction } from '@/lib/tool-analytics'

/**
 * "Save this result and get a link."
 *
 * Nothing is kept beyond the 24-hour autosave unless the reader presses the
 * button, and no email address is asked for: the result is free and ungated,
 * and so is keeping it. The one thing the reader typed — the system name — is
 * left off the saved copy unless they tick to include it. The box starts
 * unticked: a pre-ticked box is not a choice.
 *
 * All wording here is DRAFT for the owner's review (2026-11-16).
 */

const ENDPOINT = '/api/tools/compliance-checker/saved'

type Stage = 'idle' | 'saving' | 'saved' | 'error'

export function SaveResultPanel({ answers }: { answers: AssessmentAnswers }) {
  const [includeFreeText, setIncludeFreeText] = useState(false)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const systemName = typeof answers.tool_name === 'string' ? answers.tool_name.trim() : ''

  const save = async () => {
    setStage('saving')
    setError(null)
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, includeFreeText: includeFreeText && Boolean(systemName) }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.path) {
        setError(data?.error || 'The result could not be saved. Your result on this page is unaffected.')
        setStage('error')
        return
      }
      trackToolAction(TOOL_EVENTS.resultSaved, 'compliance-checker')
      setLink({ url: new URL(data.path, window.location.origin).toString(), expiresAt: data.expiresAt })
      setStage('saved')
    } catch {
      setError('The save service is unreachable. Your result on this page is unaffected.')
      setStage('error')
    }
  }

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the link is selectable in the field.
    }
  }

  return (
    <Card className="bg-surface-elevated border-stone-teal/30">
      <CardHeader>
        <div className="flex items-center gap-2 text-stone-teal">
          <Link2 className="h-5 w-5" />
          <CardTitle className="text-lg">Save this result and get a link</CardTitle>
        </div>
        <CardDescription>
          A private page with this result on it, to come back to or forward to a colleague, your lawyer or your
          vendor. Free, and no email address needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stage === 'saved' && link ? (
          <div className="space-y-3">
            <p className="text-sm text-text-primary">
              Saved. The link works until <strong>{longDate(link.expiresAt)}</strong>.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={link.url}
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Link to your saved result"
                className="h-10 flex-1 rounded-md border border-border-subtle bg-slate-deep px-3 font-mono text-xs text-text-primary"
              />
              <Button type="button" variant="outline" onClick={copy} className="border-stone-teal text-stone-teal dark:border-stone-teal">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </Button>
              <Button asChild className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                <a href={link.url}>Open it</a>
              </Button>
            </div>
            <p className="text-xs text-text-muted">
              Keep the link somewhere safe: we do not have a copy we can send you. You can delete the saved result
              from its page at any time.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted">{saveConsentText()}</p>
            {systemName && (
              <label className="flex items-start gap-3 text-sm text-text-muted">
                <input
                  type="checkbox"
                  checked={includeFreeText}
                  onChange={(event) => setIncludeFreeText(event.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 accent-stone-teal"
                />
                <span>
                  Include the system name you typed (&ldquo;{systemName}&rdquo;) on the saved page. Leave this unticked
                  and the saved page calls it &ldquo;this AI system&rdquo; and we do not store the name.
                </span>
              </label>
            )}
            {error && (
              <p className="rounded-lg border border-alert-red/40 bg-alert-red/10 p-3 text-sm text-text-primary">{error}</p>
            )}
            <Button
              type="button"
              onClick={save}
              disabled={stage === 'saving'}
              className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
            >
              {stage === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Save and get a link
            </Button>
            <p className="text-xs text-text-muted">
              Kept for {SAVED_RESULT_RETENTION_DAYS} days. See the{' '}
              <a href="/privacy" className="text-silicon-amber-strong hover:underline">
                privacy notice
              </a>
              .
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
