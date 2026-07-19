'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { track } from '@/lib/track'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { PRE_LAUNCH } from '@/lib/flags'
import type { ResolvedGate } from '@/lib/gate'

interface GateProps {
  gate: ResolvedGate
  /** Accent by intelligence tier, matching the article's other surfaces. */
  intelligenceTier?: string | null
  className?: string
}

/**
 * The reusable end-of-article gate (P3-1). Renders one of three modes from
 * resolved Sanity metadata, fires an impression when it scrolls into view, and
 * a mode-specific interaction event on engagement. It is appended below the
 * body, so free reading is never blocked.
 */
export function Gate({ gate, intelligenceTier, className }: GateProps) {
  const ref = useRef<HTMLDivElement>(null)
  const impressed = useRef(false)

  useEffect(() => {
    if (gate.mode === 'none') return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressed.current) {
            impressed.current = true
            track('Gate Impression', { mode: gate.mode })
            observer.disconnect()
          }
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [gate.mode])

  if (gate.mode === 'none') return null

  const accent =
    intelligenceTier === 'pulse'
      ? 'border-tier-pulse'
      : intelligenceTier === 'briefing'
        ? 'border-tier-briefing'
        : intelligenceTier === 'audit'
          ? 'border-tier-audit'
          : 'border-silicon-amber'

  return (
    <div
      ref={ref}
      className={cn(
        'glass-plate tech-corners rounded-lg p-6 border-l-4',
        accent,
        className,
      )}
    >
      {gate.mode === 'email' && <EmailGate gate={gate} />}
      {gate.mode === 'commerce' && <CommerceGate gate={gate} />}
      {gate.mode === 'lead' && <LeadGate gate={gate} />}
    </div>
  )
}

function EmailGate({ gate }: { gate: Extract<ResolvedGate, { mode: 'email' }> }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
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
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to subscribe')
      }
      setStatus('success')
      setEmail('')
      track('Email Capture', { surface: 'gate' })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{gate.headline}</h3>
      <p className="text-text-muted text-sm mb-4">{gate.body}</p>

      {status === 'success' ? (
        <div className="text-stone-teal text-sm">
          <span className="font-medium">Confirmed.</span> You&apos;ll receive your first briefing shortly.
        </div>
      ) : status === 'queued' ? (
        <div className="text-stone-teal text-sm">
          <span className="font-medium">Queued.</span> You&apos;re offline — your signup will send when the connection returns.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className={cn(
              'flex-1 min-w-0 w-full px-3 py-2 bg-slate-deep border border-border-subtle rounded-md',
              'text-text-primary placeholder:text-text-muted/50',
              'focus:outline-none focus:ring-1 focus:ring-silicon-cyan focus:border-silicon-cyan',
              'transition-colors',
            )}
          />
          <Button
            type="submit"
            disabled={status === 'loading'}
            className="w-full sm:w-auto bg-silicon-amber hover:bg-silicon-amber/90 text-ink-on-accent font-medium"
          >
            {status === 'loading' ? 'Subscribing...' : gate.ctaLabel}
          </Button>
        </form>
      )}

      {status === 'error' && (
        <p className="text-sm text-alert-red mt-2">
          {errorMsg || 'Something went wrong. Please try again.'}
        </p>
      )}

      <p className="text-xs text-text-muted/60 mt-3">No spam. Unsubscribe anytime.</p>
    </>
  )
}

function CommerceGate({ gate }: { gate: Extract<ResolvedGate, { mode: 'commerce' }> }) {
  const { product } = gate
  // While PRE_LAUNCH is on, no Lemon Squeezy checkout may be invoked anywhere
  // (spec §0.3) — fall back to the product page even if a Sanity product doc
  // carries a checkoutUrl.
  const usesCheckout = Boolean(product.checkoutUrl) && !PRE_LAUNCH
  const href = usesCheckout ? product.checkoutUrl! : product.productPath

  const handleClick = () => {
    track('Product View', { product: product.slug, surface: 'gate' })
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        {product.badge && (
          <span className="font-ui-mono text-xs uppercase tracking-wider text-silicon-amber">
            {product.badge}
          </span>
        )}
        {product.priceLabel && (
          <span className="font-mono text-sm text-text-muted">{product.priceLabel}</span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{gate.headline}</h3>
      <p className="text-text-muted text-sm mb-4">{gate.body}</p>

      {usesCheckout ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="lemonsqueezy-button inline-flex items-center justify-center gap-2 rounded-md bg-silicon-amber px-4 py-2 font-medium text-ink-on-accent transition-colors hover:bg-silicon-amber/90"
        >
          {gate.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </a>
      ) : (
        <Link
          href={href}
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-silicon-amber px-4 py-2 font-medium text-ink-on-accent transition-colors hover:bg-silicon-amber/90"
        >
          {gate.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </>
  )
}

function LeadGate({ gate }: { gate: Extract<ResolvedGate, { mode: 'lead' }> }) {
  const handleClick = () => {
    track('Advisory Lead', { surface: 'gate' })
  }

  const isInternal = gate.href.startsWith('/')

  return (
    <>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{gate.headline}</h3>
      <p className="text-text-muted text-sm mb-4">{gate.body}</p>
      {isInternal ? (
        <Link
          href={gate.href}
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-teal px-4 py-2 font-medium text-ink-on-accent transition-colors hover:bg-stone-teal/90"
        >
          {gate.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <a
          href={gate.href}
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-teal px-4 py-2 font-medium text-ink-on-accent transition-colors hover:bg-stone-teal/90"
        >
          {gate.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </a>
      )}
    </>
  )
}
