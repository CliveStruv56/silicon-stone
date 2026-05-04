'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SubscribeCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
      window.plausible?.('Newsletter+Subscribe')
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
          className="self-start border-silicon-amber/60 text-silicon-amber font-mono text-[11px] tracking-[0.10em] uppercase bg-silicon-amber/5"
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
          Get the Atlantic Drift Briefing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-muted mb-5 leading-relaxed">
          <strong className="text-silicon-amber font-medium">
            Twice a week from the edge of Europe
          </strong>
          {' '}— Tuesday Stone Briefing on what just shifted in AI policy,
          semiconductors, supply chains, and digital sovereignty. Friday
          Practical Move on what to do about it.{' '}
          <strong className="text-text-primary font-semibold">
            Decision-grade analysis from thirty years inside the industry.
          </strong>
          {' '}A welcome Atlantic Drift Briefing arrives on signup.
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
        ) : (
          <>
            <div className="font-mono text-[11px] tracking-[0.10em] uppercase text-silicon-amber mb-2 flex items-center gap-1.5">
              <span aria-hidden="true">○</span>
              Get the Atlantic Drift Briefing
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
                className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90"
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
