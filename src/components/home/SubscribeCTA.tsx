'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitWithOfflineQueue } from '@/lib/offline/submit'

export function SubscribeCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')

  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const result = await submitWithOfflineQueue('/api/subscribe', { email })
      if (result.queued) {
        setStatus('queued')
        setEmail('')
        return
      }
      const res = result.response

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
      window.plausible?.('Newsletter Subscribe')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <Card
      id="subscribe"
      className="bg-gradient-to-br from-stone-charcoal to-slate-deep border-silicon-amber/30"
    >
      <CardHeader className="space-y-3">
        <Badge
          variant="outline"
          className="self-start border-silicon-amber/60 text-silicon-amber-strong font-mono text-[12.5px] tracking-[0.10em] uppercase bg-silicon-amber/5"
        >
          Newsletter
        </Badge>
        <CardTitle
          className="font-bold text-text-primary"
          style={{
            fontSize: 'clamp(24px, 2.6vw, 30px)',
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
          }}
        >
          The Silicon &amp; Stone briefing — two editions a week, free.
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-muted mb-5 leading-relaxed">
          <strong className="text-silicon-amber-strong font-medium">Tuesday:</strong>
          {' '}the Stone Briefing — structural analysis of the AI power shift.
          <br />
          <strong className="text-silicon-amber-strong font-medium">Friday:</strong>
          {' '}the Practical Move — what to do about it.
        </p>

        <div className="my-8 max-w-xl mx-auto text-center">
          <hr className="border-border-subtle mb-6 w-24 mx-auto" />
          <p className="text-base italic text-text-muted">
            The view from the edge is structurally clearer than the view from any centre.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-sm text-stone-teal">
            Subscribed. Check your inbox to confirm.
          </div>
        ) : status === 'queued' ? (
          <div className="text-sm text-stone-teal">
            You&apos;re offline — your signup is queued and will send when the
            connection returns.
          </div>
        ) : (
          <>
            <div className="font-mono text-[12.5px] tracking-[0.10em] uppercase text-silicon-amber-strong mb-2 flex items-center gap-1.5">
              <span aria-hidden="true">○</span>
              Get the briefing
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                required
                className="flex-1 rounded-md border border-border-subtle bg-slate-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-silicon-amber"
              />
              <Button
                type="submit"
                disabled={status === 'loading'}
                className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </>
        )}

        {status === 'error' && (
          <p className="text-sm text-alert-red mt-2">
            {errorMsg || 'Something went wrong. Please try again.'}
          </p>
        )}

        <p className="text-xs text-text-muted mt-3">
          Free. Unsubscribe anytime.
        </p>
      </CardContent>
    </Card>
  )
}
