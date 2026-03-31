'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Shield, Loader2, CheckCircle, Lock } from 'lucide-react'

interface EmailGateOverlayProps {
  isOpen: boolean
  onUnlock: () => void
  onDismiss: () => void
  toolName: string
  resultLabel?: string
}

export function EmailGateOverlay({ isOpen, onUnlock, onDismiss, toolName, resultLabel = "your results" }: EmailGateOverlayProps) {
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
        body: JSON.stringify({ email, tag: 'Tool_Lead' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      window.plausible?.('Tool+Email+Gate', { props: { tool: toolName } })

      // Brief success animation, then unlock
      setTimeout(() => {
        onUnlock()
      }, 1200)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-deep/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
          >
            <Card className="w-full max-w-md bg-stone-charcoal border-border-subtle shadow-2xl">
              <CardHeader className="text-center pb-2">
                {status === 'success' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="mx-auto"
                  >
                    <CheckCircle className="w-12 h-12 text-stone-teal mx-auto mb-3" />
                  </motion.div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-silicon-amber/10 border border-silicon-amber/30 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-silicon-amber" />
                  </div>
                )}
                <CardTitle className="text-xl text-text-primary">
                  {status === 'success' ? 'Unlocking Results...' : `Unlock ${resultLabel}`}
                </CardTitle>
                <CardDescription className="mt-2">
                  {status === 'success'
                    ? 'Thank you. Your results are ready.'
                    : `Enter your email to view ${resultLabel} from the ${toolName}. You\u2019ll also receive our weekly intelligence briefing.`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status !== 'success' && (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full rounded-md border border-border-subtle bg-slate-deep px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-silicon-amber"
                    />

                    {status === 'error' && (
                      <p className="text-sm text-alert-red">{errorMsg || 'Something went wrong. Please try again.'}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 font-semibold"
                    >
                      {status === 'loading' ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                      ) : (
                        <><Shield className="mr-2 h-4 w-4" /> View Results</>
                      )}
                    </Button>

                    <p className="text-xs text-text-muted text-center">
                      No spam. Unsubscribe anytime. We never store your tool input data.
                    </p>
                  </form>
                )}
                {status !== 'success' && (
                  <button
                    onClick={onDismiss}
                    className="w-full mt-3 text-xs text-text-muted hover:text-text-primary transition-colors text-center"
                  >
                    No thanks, go back
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
